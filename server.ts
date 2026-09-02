import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Logs / Webhook Dispatch Records for Production Audit
interface WebhookDispatchLog {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  timestamp: string;
  targetUrl: string;
  status: 'delivered' | 'failed';
  responseStatus?: number;
  payload: Record<string, unknown>;
}

const dispatchLogs: WebhookDispatchLog[] = [];

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Function Declarations for AI Voice Agent
const checkAvailableSlotsTool: FunctionDeclaration = {
  name: 'check_available_slots',
  description: 'Query available meeting times from Google Calendar to offer to the client.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      preferredDayOrTime: {
        type: Type.STRING,
        description: 'Optional preferred day or time requested by client, e.g. "Tuesday afternoon" or "morning"',
      },
    },
  },
};

const bookCalendarMeetingTool: FunctionDeclaration = {
  name: 'book_calendar_meeting',
  description: 'Book and confirm a Google Calendar event for the client after they agree to a specific time slot.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: 'Selected meeting date in YYYY-MM-DD format (e.g. 2026-09-04)',
      },
      time: {
        type: Type.STRING,
        description: 'Selected meeting time (e.g. 11:00 AM or 15:00)',
      },
      clientName: {
        type: Type.STRING,
        description: 'Client full name',
      },
      clientEmail: {
        type: Type.STRING,
        description: 'Client email address',
      },
      meetingNotes: {
        type: Type.STRING,
        description: 'Summary of what client wants to discuss in the meeting',
      },
    },
    required: ['date', 'time', 'clientName'],
  },
};

const updateCallStatusTool: FunctionDeclaration = {
  name: 'update_call_status',
  description: 'Update the client status and call result for the Google Sheet.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        description: 'Status: "Contacted" | "Interested" | "Not Interested" | "No Answer" | "Meeting Scheduled" | "Do Not Contact"',
      },
      callResult: {
        type: Type.STRING,
        description: 'Short result summary: "Interested", "Not Interested", "Requested Callback", "Do Not Contact", "Busy"',
      },
      notes: {
        type: Type.STRING,
        description: 'Detailed call notes for Google Sheet',
      },
    },
    required: ['status', 'callResult', 'notes'],
  },
};

const endCallTool: FunctionDeclaration = {
  name: 'end_call',
  description: 'Politely conclude and hang up the phone call after the conversation is finished.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Reason for ending call, e.g. "meeting_booked", "not_interested", "do_not_contact", "client_busy"',
      },
      farewellMessage: {
        type: Type.STRING,
        description: 'Spoken parting sentence to the client before hangup',
      },
    },
    required: ['reason', 'farewellMessage'],
  },
};

// API Route: AI Call Conversation Turn
app.post('/api/ai/call-turn', async (req, res) => {
  try {
    const {
      messages,
      lead,
      agentSettings,
      availableSlots,
    } = req.body;

    const ai = getGenAI();

    const clientName = lead?.name || 'Client';
    const company = lead?.company || 'Company';
    const callerCompany = agentSettings?.companyName || 'Apex AI Solutions';
    const offering = agentSettings?.serviceDescription || 'AI-powered workflow automation and customer intelligence solutions';
    const customPrompt = agentSettings?.customSystemPrompt ? `\nSPECIAL USER INSTRUCTIONS:\n${agentSettings.customSystemPrompt}\n` : '';

    const slotsText = (availableSlots || [])
      .filter((s: { available: boolean }) => s.available)
      .slice(0, 3)
      .map((s: { date: string; time: string }) => `${s.date} at ${s.time}`)
      .join(', ') || 'Thursday at 10:00 AM or Friday at 3:00 PM';

    const systemInstruction = `You are ${agentSettings?.agentName || 'Alex'}, an AI voice calling assistant calling on behalf of ${callerCompany}.
You are on a live phone call with ${clientName} from ${company}.

CALL OBJECTIVE & BEHAVIOR:
1. Tone: Friendly, concise, professional, human-like, conversational.
2. Brevity: Keep every turn strictly to 1-2 short sentences. Never read paragraphs or long sales pitches.
3. Flow:
   - If starting: Confirm identity ("Hi, may I speak with ${clientName}?")
   - After confirmation: Introduce yourself briefly, mention you're calling on behalf of ${callerCompany} regarding ${offering}, and ask if they have a quick minute.
   - If they say yes: Explain the benefit in one simple sentence and ask if they'd be open to learning more.
   - If they are busy: Ask if they prefer scheduling a quick 10-minute chat at a more convenient time.
   - If they are interested: Call 'check_available_slots' or offer available slots (${slotsText}) and schedule a Google Meet.
   - If they agree to a slot: Call 'book_calendar_meeting' with their chosen date and time, confirm their email (${lead?.email || 'their email'}), and call 'update_call_status'.
   - If they say "Not interested": Warmly say "Understood, thank you so much for your time. Have a great day!" and call 'end_call'.
   - If they say "Don't call me again" / "Remove my number": Respectfully say "I understand completely, I will update our records immediately so you won't be contacted again. Have a good day.", call 'update_call_status' with status 'Do Not Contact', and call 'end_call'.
   - Answer simple questions about ${callerCompany}. If unsure, say our specialist can cover that during the quick demo call.
${customPrompt}
Available open Google Calendar slots right now: ${slotsText}.
`;

    if (!ai) {
      // Fallback intelligent responder if API key is not yet set
      const lastUserMsg = (messages?.[messages.length - 1]?.content || '').toLowerCase();
      let reply = '';
      let functionCall: { name: string; args: Record<string, unknown> } | null = null;

      if (!messages || messages.length === 0) {
        reply = `Hi, may I speak with ${clientName}?`;
      } else if (lastUserMsg.includes('speaking') || lastUserMsg.includes('yes') || lastUserMsg.includes('this is')) {
        reply = `Hi ${clientName}, I'm ${agentSettings?.agentName || 'Alex'} calling on behalf of ${callerCompany}. I'll keep this very brief. We're reaching out to see if you'd be interested in learning about our automated AI workflows. Do you have a quick minute?`;
      } else if (lastUserMsg.includes('busy') || lastUserMsg.includes('can\'t talk') || lastUserMsg.includes('later')) {
        reply = `No problem at all! Would you prefer that we schedule a quick 10-minute meeting at a more convenient time?`;
      } else if (lastUserMsg.includes('not interested') || lastUserMsg.includes('no thanks') || lastUserMsg.includes('stop')) {
        reply = `Understood, thank you for your time. Have a wonderful day!`;
        functionCall = {
          name: 'end_call',
          args: { reason: 'not_interested', farewellMessage: 'Understood, thank you for your time. Have a wonderful day!' },
        };
      } else if (lastUserMsg.includes('remove') || lastUserMsg.includes('do not contact')) {
        reply = `I completely understand. I'm removing your number from our contact list right now. Have a good day.`;
        functionCall = {
          name: 'update_call_status',
          args: { status: 'Do Not Contact', callResult: 'Do Not Contact', notes: 'Client requested removal from call list.' },
        };
      } else if (lastUserMsg.includes('sure') || lastUserMsg.includes('interested') || lastUserMsg.includes('tell me more') || lastUserMsg.includes('yes')) {
        reply = `Great! We have Tuesday at 11 AM or Wednesday at 3 PM available for a quick 15-minute demo. Which works better for you?`;
      } else if (lastUserMsg.includes('tuesday') || lastUserMsg.includes('wednesday') || lastUserMsg.includes('11') || lastUserMsg.includes('3') || lastUserMsg.includes('thursday') || lastUserMsg.includes('friday')) {
        reply = `Perfect, I've booked that slot on our calendar and sent the Google Meet link to ${lead?.email || 'your email'}. We look forward to speaking with you!`;
        functionCall = {
          name: 'book_calendar_meeting',
          args: {
            date: '2026-09-04',
            time: '11:00 AM',
            clientName: clientName,
            clientEmail: lead?.email,
            meetingNotes: 'Demo call scheduled via AI voice agent',
          },
        };
      } else {
        reply = `I understand. We help teams automate repetitive workflows with AI. Would you be open to a quick 10-minute overview this week?`;
      }

      return res.json({
        reply,
        functionCall,
        simulated: true,
      });
    }

    // Call Gemini 3.7 Flash
    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'agent' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: `[System]: The phone just connected. Give the exact opening greeting to ask for ${clientName}.` }],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents,
      config: {
        systemInstruction,
        temperature: agentSettings?.temperature || 0.2,
        tools: [
          {
            functionDeclarations: [
              checkAvailableSlotsTool,
              bookCalendarMeetingTool,
              updateCallStatusTool,
              endCallTool,
            ],
          },
        ],
      },
    });

    const reply = response.text || '';
    const functionCalls = response.functionCalls;
    const firstCall = functionCalls && functionCalls.length > 0 ? functionCalls[0] : null;

    res.json({
      reply,
      functionCall: firstCall ? { name: firstCall.name, args: firstCall.args } : null,
      simulated: false,
    });
  } catch (error: unknown) {
    console.error('Call turn error:', error);
    const err = error as { message?: string };
    res.status(500).json({ error: err.message || 'Internal server error processing call turn' });
  }
});

// API Route: Post-Call Analysis & Google Sheet Summarizer
app.post('/api/ai/analyze-call', async (req, res) => {
  try {
    const { transcript, lead } = req.body;
    const ai = getGenAI();

    if (!ai || !transcript || transcript.length === 0) {
      return res.json({
        status: 'Contacted',
        callResult: 'Completed conversation',
        notes: 'Call simulation finished. Client engaged with AI assistant.',
        meetingScheduled: false,
        doNotContact: false,
      });
    }

    const prompt = `Analyze this voice call transcript between an AI sales agent and a lead (${lead?.name}, ${lead?.company}):
${JSON.stringify(transcript, null, 2)}

Return a strict JSON object with:
- "status": One of ["Meeting Scheduled", "Interested", "Not Interested", "No Answer", "Do Not Contact", "Contacted"]
- "callResult": A 2-4 word summary (e.g. "Meeting Booked", "Declined - Not Interested", "Follow-up Requested", "Do Not Contact")
- "notes": 1-2 clear summary sentences of the outcome and next steps
- "meetingScheduled": boolean
- "meetingDate": string (YYYY-MM-DD if scheduled, else null)
- "meetingTime": string (e.g. "11:00 AM" if scheduled, else null)
- "doNotContact": boolean
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let result = {};
    try {
      result = JSON.parse(response.text || '{}');
    } catch {
      result = {
        status: 'Contacted',
        callResult: 'Call Completed',
        notes: 'AI voice agent completed conversation.',
        meetingScheduled: false,
      };
    }

    res.json(result);
  } catch (err: unknown) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze call' });
  }
});

// API Route: Calendar Booking & Google Meet Link Generator
app.post('/api/calendar/book', async (req, res) => {
  try {
    const { slotId, date, time, lead, meetingNotes } = req.body;
    const meetCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const meetLink = `https://meet.google.com/${meetCode}`;

    res.json({
      success: true,
      bookingId: `gcal-${Date.now()}`,
      meetLink,
      date,
      time,
      clientName: lead?.name,
      clientEmail: lead?.email,
      confirmedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ error: err.message || 'Failed to book calendar slot' });
  }
});

// API Route: Webhook Dispatcher (n8n / CRM / Custom HTTP)
app.post('/api/telephony/dispatch-webhook', async (req, res) => {
  try {
    const { webhookUrl, lead, event, details } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    const payload = {
      event: event || 'lead_call_trigger',
      timestamp: new Date().toISOString(),
      lead,
      details: details || {},
    };

    let delivered = false;
    let responseStatus = 200;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      responseStatus = response.status;
      delivered = response.ok;
    } catch (e) {
      delivered = false;
      responseStatus = 500;
    }

    const logEntry: WebhookDispatchLog = {
      id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: lead?.id || 'unknown',
      leadName: lead?.name || 'Lead',
      phone: lead?.phone || '',
      timestamp: new Date().toISOString(),
      targetUrl: webhookUrl,
      status: delivered ? 'delivered' : 'failed',
      responseStatus,
      payload,
    };

    dispatchLogs.unshift(logEntry);
    if (dispatchLogs.length > 50) dispatchLogs.pop();

    res.json({
      success: delivered,
      status: responseStatus,
      logEntry,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ error: err.message || 'Failed to dispatch webhook' });
  }
});

// API Route: Get Webhook Dispatch Logs
app.get('/api/telephony/dispatch-logs', (req, res) => {
  res.json({ logs: dispatchLogs });
});

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

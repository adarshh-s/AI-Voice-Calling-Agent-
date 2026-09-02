import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

interface ApiRequest {
  method?: string;
  body?: Record<string, unknown>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

const checkAvailableSlotsTool: FunctionDeclaration = {
  name: 'check_available_slots',
  description: 'Query available meeting times from Google Calendar to offer to the client.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      preferredDayOrTime: {
        type: Type.STRING,
        description: 'Optional preferred day or time requested by client',
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, lead, agentSettings, availableSlots } = (req.body || {}) as {
      messages?: Array<{ role: string; content: string }>;
      lead?: { name?: string; company?: string; email?: string };
      agentSettings?: { agentName?: string; companyName?: string; serviceDescription?: string; customSystemPrompt?: string; temperature?: number };
      availableSlots?: Array<{ date: string; time: string; available: boolean }>;
    };
    const apiKey = process.env.GEMINI_API_KEY;

    const clientName = lead?.name || 'Client';
    const company = lead?.company || 'Company';
    const callerCompany = agentSettings?.companyName || 'Apex AI Solutions';
    const offering = agentSettings?.serviceDescription || 'AI-powered workflow automation and customer intelligence solutions';
    const customPrompt = agentSettings?.customSystemPrompt ? `\nSPECIAL USER INSTRUCTIONS:\n${agentSettings.customSystemPrompt}\n` : '';

    const slotsText = (availableSlots || [])
      .filter((s) => s.available)
      .slice(0, 3)
      .map((s) => `${s.date} at ${s.time}`)
      .join(', ') || 'Thursday at 10:00 AM or Friday at 3:00 PM';

    if (!apiKey) {
      // Intelligent fallback
      const lastUserMsg = (messages?.[messages.length - 1]?.content || '').toLowerCase();
      let reply = '';
      let functionCall: { name: string; args: Record<string, unknown> } | null = null;

      if (!messages || messages.length === 0) {
        reply = `Hi, may I speak with ${clientName}?`;
      } else if (lastUserMsg.includes('speaking') || lastUserMsg.includes('yes') || lastUserMsg.includes('this is')) {
        reply = `Hi ${clientName}, I'm ${agentSettings?.agentName || 'Alex'} calling on behalf of ${callerCompany}. I'll keep this very brief. We're reaching out to see if you'd be interested in learning about our automated AI workflows. Do you have a quick minute?`;
      } else if (lastUserMsg.includes('busy') || lastUserMsg.includes("can't talk") || lastUserMsg.includes('later')) {
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

      return res.status(200).json({ reply, functionCall, simulated: true });
    }

    const ai = new GoogleGenAI({ apiKey });
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
${customPrompt}
Available open Google Calendar slots right now: ${slotsText}.
`;

    const contents = (messages || []).map((m) => ({
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

    return res.status(200).json({
      reply,
      functionCall: firstCall ? { name: firstCall.name, args: firstCall.args } : null,
      simulated: false,
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

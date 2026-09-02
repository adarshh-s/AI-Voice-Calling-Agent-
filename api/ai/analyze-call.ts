import { GoogleGenAI } from '@google/genai';

interface ApiRequest {
  method?: string;
  body?: Record<string, unknown>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, lead } = (req.body || {}) as {
      transcript?: Array<{ role: string; content: string }>;
      lead?: { name?: string; company?: string };
    };
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || !transcript || transcript.length === 0) {
      return res.status(200).json({
        status: 'Contacted',
        callResult: 'Completed conversation',
        notes: 'Call simulation finished. Client engaged with AI assistant.',
        meetingScheduled: false,
        doNotContact: false,
      });
    }

    const ai = new GoogleGenAI({ apiKey });
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

    return res.status(200).json(result);
  } catch {
    return res.status(200).json({
      status: 'Contacted',
      callResult: 'Call Completed',
      notes: 'Call simulation finished.',
      meetingScheduled: false,
    });
  }
}

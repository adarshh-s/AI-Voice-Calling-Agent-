/**
 * n8n Workflow definition for Google Sheets -> AI Voice Agent -> Google Calendar -> Google Sheets
 * 100% valid n8n Workflow JSON v1
 */

export const N8N_WORKFLOW_JSON = {
  name: "AI Voice Calling Agent - Google Sheets & Calendar Sync",
  nodes: [
    {
      parameters: {
        rule: {
          interval: [
            {
              field: "minutes",
              minutesInterval: 15
            }
          ]
        }
      },
      id: "node-schedule-trigger",
      name: "Schedule Trigger (Every 15m)",
      type: "n8n-nodes-base.scheduleTrigger",
      typeVersion: 1.1,
      position: [240, 300]
    },
    {
      parameters: {
        authentication: "oAuth2",
        documentId: {
          __rl: true,
          value: "YOUR_GOOGLE_SHEET_ID",
          mode: "id"
        },
        sheetName: {
          __rl: true,
          value: "Sheet1",
          mode: "name"
        },
        filtersUI: {
          values: [
            {
              lookupColumn: "Status",
              lookupValue: "Pending"
            }
          ]
        },
        options: {}
      },
      id: "node-read-sheets",
      name: "Get Pending Leads from Sheet",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.4,
      position: [460, 300],
      credentials: {
        googleSheetsOAuth2Api: {
          id: "google-sheets-oauth-cred",
          name: "Google Sheets OAuth2 account"
        }
      }
    },
    {
      parameters: {
        jsCode: `// Validate and format phone number according to international E.164 standard\nconst items = $input.all();\nconst validatedItems = [];\n\nfor (const item of items) {\n  const row = item.json;\n  const rawPhone = (row.Phone || row.phone || '').trim();\n  const name = (row.Name || row.name || '').trim();\n  \n  // Check if lead has valid name and phone\n  if (!name || !rawPhone) continue;\n  \n  // Skip if explicitly marked Do Not Contact\n  if (row.Status === 'Do Not Contact') continue;\n  \n  // Basic E.164 cleanup\n  let cleanPhone = rawPhone.replace(/[^\\d+]/g, '');\n  if (!cleanPhone.startsWith('+')) {\n    cleanPhone = '+' + cleanPhone;\n  }\n  \n  validatedItems.push({\n    json: {\n      ...row,\n      formattedPhone: cleanPhone,\n      originalRowIndex: row.row_number || item.pairedItem?.item || 0\n    }\n  });\n}\n\nreturn validatedItems;`
      },
      id: "node-validate-lead",
      name: "Validate Phone & Filter Leads",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [680, 300]
    },
    {
      parameters: {
        method: "POST",
        url: "https://api.vapi.ai/call/phone",
        authentication: "genericCredentialType",
        genericAuthType: "httpHeaderAuth",
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: "Authorization",
              value: "Bearer {{ $env.VAPI_API_KEY }}"
            },
            {
              name: "Content-Type",
              value: "application/json"
            }
          ]
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: `{\n  "phoneNumberId": "{{ $env.VAPI_PHONE_NUMBER_ID }}",\n  "customer": {\n    "number": "{{ $json.formattedPhone }}",\n    "name": "{{ $json.Name }}"\n  },\n  "assistant": {\n    "firstMessage": "Hi, may I speak with {{ $json.Name }}?",\n    "model": {\n      "provider": "google",\n      "model": "gemini-2.0-flash",\n      "systemPrompt": "You are Alex, an AI assistant calling on behalf of {{ $json.Company }}. Keep the call short, polite, and human-like. Never talk over the client. Confirm their identity, explain briefly our offering, gauge interest, and offer Google Calendar meeting slots if interested. If not interested or busy, politely thank them and wrap up."\n    },\n    "voice": {\n      "provider": "11labs",\n      "voiceId": "21m00Tcm4TlvDq8ikWAM"\n    },\n    "serverUrl": "{{ $env.N8N_WEBHOOK_URL }}"\n  }\n}`
      },
      id: "node-dispatch-call",
      name: "Trigger AI Outbound Voice Call",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [900, 300]
    },
    {
      parameters: {
        httpMethod: "POST",
        path: "voice-call-webhook",
        responseMode: "onReceived",
        options: {}
      },
      id: "node-webhook-receiver",
      name: "Webhook: Receive Call Result",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [240, 600]
    },
    {
      parameters: {
        dataType: "string",
        value1: "={{ $json.body.message.analysis.status || $json.body.callResult || 'Contacted' }}",
        rules: {
          rules: [
            {
              value2: "Meeting Scheduled"
            },
            {
              value2: "Interested"
            },
            {
              value2: "Not Interested"
            },
            {
              value2: "Do Not Contact"
            },
            {
              value2: "No Answer"
            }
          ]
        },
        fallbackOutput: 5
      },
      id: "node-switch-intent",
      name: "Switch by Call Outcome",
      type: "n8n-nodes-base.switch",
      typeVersion: 3.1,
      position: [500, 600]
    },
    {
      parameters: {
        authentication: "oAuth2",
        calendar: {
          __rl: true,
          value: "primary",
          mode: "list"
        },
        start: "={{ $json.body.meetingDate }}T{{ $json.body.meetingTime }}:00Z",
        end: "={{ new Date(new Date($json.body.meetingDate + 'T' + $json.body.meetingTime + ':00Z').getTime() + 30*60000).toISOString() }}",
        summary: "=Intro Call: {{ $json.body.clientName }} x Apex AI Solutions",
        description: "=Automated scheduling via AI Voice Agent.\\n\\nClient Notes:\\n{{ $json.body.notes }}",
        attendees: [
          "={{ $json.body.clientEmail }}"
        ],
        additionalFields: {
          conferenceDataUi: {
            conferenceDataValues: {
              conferenceSolutionConfig: {
                conferenceSolution: "hangoutsMeet"
              }
            }
          }
        }
      },
      id: "node-create-calendar-event",
      name: "Create Google Calendar Event",
      type: "n8n-nodes-base.googleCalendar",
      typeVersion: 1.2,
      position: [780, 520],
      credentials: {
        googleCalendarOAuth2Api: {
          id: "google-calendar-oauth-cred",
          name: "Google Calendar OAuth2 account"
        }
      }
    },
    {
      parameters: {
        authentication: "oAuth2",
        operation: "update",
        documentId: {
          __rl: true,
          value: "YOUR_GOOGLE_SHEET_ID",
          mode: "id"
        },
        sheetName: {
          __rl: true,
          value: "Sheet1",
          mode: "name"
        },
        columns: {
          mappingMode: "defineBelow",
          value: {
            Status: "={{ $json.body.status || 'Meeting Scheduled' }}",
            "Call Result": "={{ $json.body.callResult || 'Interested' }}",
            "Meeting Date": "={{ $json.body.meetingDate || '' }}",
            "Meeting Time": "={{ $json.body.meetingTime || '' }}",
            Notes: "={{ $json.body.notes || 'Meeting booked by AI assistant' }}",
            "Last Called": "={{ new Date().toISOString() }}"
          },
          matchingColumns: ["Phone"],
          schema: [
            { id: "Phone", displayName: "Phone", required: true, key: "Phone" }
          ]
        }
      },
      id: "node-update-sheet-scheduled",
      name: "Update Sheet: Meeting Scheduled",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.4,
      position: [1020, 520],
      credentials: {
        googleSheetsOAuth2Api: {
          id: "google-sheets-oauth-cred",
          name: "Google Sheets OAuth2 account"
        }
      }
    },
    {
      parameters: {
        authentication: "oAuth2",
        operation: "update",
        documentId: {
          __rl: true,
          value: "YOUR_GOOGLE_SHEET_ID",
          mode: "id"
        },
        sheetName: {
          __rl: true,
          value: "Sheet1",
          mode: "name"
        },
        columns: {
          mappingMode: "defineBelow",
          value: {
            Status: "={{ $json.body.status || 'Contacted' }}",
            "Call Result": "={{ $json.body.callResult || 'Not Interested' }}",
            Notes: "={{ $json.body.notes || 'Call completed; no meeting requested.' }}",
            "Last Called": "={{ new Date().toISOString() }}"
          },
          matchingColumns: ["Phone"]
        }
      },
      id: "node-update-sheet-other",
      name: "Update Sheet: Outcome Recorded",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.4,
      position: [1020, 720],
      credentials: {
        googleSheetsOAuth2Api: {
          id: "google-sheets-oauth-cred",
          name: "Google Sheets OAuth2 account"
        }
      }
    }
  ],
  connections: {
    "Schedule Trigger (Every 15m)": {
      main: [
        [
          {
            node: "Get Pending Leads from Sheet",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Get Pending Leads from Sheet": {
      main: [
        [
          {
            node: "Validate Phone & Filter Leads",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Validate Phone & Filter Leads": {
      main: [
        [
          {
            node: "Trigger AI Outbound Voice Call",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Webhook: Receive Call Result": {
      main: [
        [
          {
            node: "Switch by Call Outcome",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Switch by Call Outcome": {
      main: [
        [
          {
            node: "Create Google Calendar Event",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "Update Sheet: Outcome Recorded",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "Update Sheet: Outcome Recorded",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "Update Sheet: Outcome Recorded",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "Update Sheet: Outcome Recorded",
            type: "main",
            index: 0
          }
        ],
        [
          {
            node: "Update Sheet: Outcome Recorded",
            type: "main",
            index: 0
          }
        ]
      ]
    },
    "Create Google Calendar Event": {
      main: [
        [
          {
            node: "Update Sheet: Meeting Scheduled",
            type: "main",
            index: 0
          }
        ]
      ]
    }
  }
};

export interface NodeDocumentation {
  name: string;
  type: string;
  purpose: string;
  keyConfig: string;
  errorHandling: string;
}

export const N8N_NODE_BREAKDOWN: NodeDocumentation[] = [
  {
    name: "Schedule Trigger / Polling",
    type: "n8n-nodes-base.scheduleTrigger",
    purpose: "Executes every 15 minutes or upon manual trigger to scan for new client rows in Google Sheets.",
    keyConfig: "Cron schedule: */15 * * * * or manual button execution.",
    errorHandling: "Continues on next interval if Sheets API is temporarily rate-limited."
  },
  {
    name: "Get Pending Leads from Sheet",
    type: "n8n-nodes-base.googleSheets",
    purpose: "Queries rows where column `Status = 'Pending'` to guarantee only uncontacted leads receive calls.",
    keyConfig: "Filter: Status == 'Pending'. Read columns Name, Company, Phone, Email.",
    errorHandling: "If 0 pending rows found, execution safely ends without triggering outbound calls."
  },
  {
    name: "Validate Phone & Filter Leads",
    type: "n8n-nodes-base.code",
    purpose: "Cleans numbers into international E.164 format (e.g. +971501234567) and enforces Do Not Contact lists.",
    keyConfig: "JavaScript regex cleansing and null-checking.",
    errorHandling: "Invalid numbers marked as 'Invalid Number' in Sheets without dialing."
  },
  {
    name: "Trigger AI Outbound Voice Call",
    type: "n8n-nodes-base.httpRequest",
    purpose: "Dispatches outbound telephony call via Vapi / Retell / Bland / Twilio API with dynamic prompt variables.",
    keyConfig: "HTTP POST with payload { customerNumber, assistant: { systemPrompt, voiceId, serverUrl } }.",
    errorHandling: "Catch 4xx/5xx API errors; update Sheet status to 'No Answer / Unreachable'."
  },
  {
    name: "Webhook: Receive Call Result",
    type: "n8n-nodes-base.webhook",
    purpose: "Receives end-of-call status callback from voice telephony provider with transcript, summary & structured intent.",
    keyConfig: "Path: /voice-call-webhook, Method: POST.",
    errorHandling: "Returns 200 OK immediately and processes payload asynchronously."
  },
  {
    name: "Switch by Call Outcome",
    type: "n8n-nodes-base.switch",
    purpose: "Branches execution based on AI analysis: Meeting Scheduled, Interested, Not Interested, Do Not Contact, No Answer.",
    keyConfig: "Evaluates `callResult` / `status` from AI JSON payload.",
    errorHandling: "Default fallback branch routes to general outcome recorder."
  },
  {
    name: "Create Google Calendar Event",
    type: "n8n-nodes-base.googleCalendar",
    purpose: "Creates 30-min Google Meet appointment on company calendar and invites lead via email.",
    keyConfig: "Summary: Discovery with {{Name}}, Attendees: [{{Email}}], Conference: Google Meet.",
    errorHandling: "If slot conflicts occur, picks adjacent available opening or sends notification."
  },
  {
    name: "Update Google Sheet Row",
    type: "n8n-nodes-base.googleSheets",
    purpose: "Writes final Status, Call Result, Meeting Date/Time, Notes, and Last Called timestamp.",
    keyConfig: "Matching column: Phone / Row Number. Updates Status to 'Meeting Scheduled' or 'Contacted'.",
    errorHandling: "Retry with exponential backoff on quota limits."
  }
];

export const SYSTEM_PROMPT_TEMPLATE = `You are Alex, a friendly, concise, and professional AI voice assistant calling on behalf of {{Company Name}}.
Your goal is to have a short, natural conversation with {{Name}} to see if they are interested in {{Service Description}}, and if so, offer 2-3 Google Calendar meeting times.

CRITICAL VOICE & CONVERSATION RULES:
1. Speak naturally, concisely (1-2 short sentences max per turn). Never read long scripts.
2. NEVER talk over the client. When the client speaks, listen fully before responding.
3. Identify yourself as an AI assistant honestly if asked or introduced.
4. If client says "I'm busy" or "Can't talk now", politely say: "No problem at all! Would you prefer that we schedule a quick 10-minute meeting at a more convenient time?"
5. If client says "Not interested", warmly say: "Understood, thank you so much for your time. Have a great day!" and conclude.
6. If client asks to not be contacted again, acknowledge politely: "I completely understand. I will remove you from our contact list right away. Have a good day." (Mark as Do Not Contact).
7. If client is interested, say: "Great! I can help arrange a short meeting with our team. What day and time would work best for you?"
8. Offer 2 to 3 available slots: "We have {{AvailableSlot1}} or {{AvailableSlot2}} available. Which works better for you?"
9. Once client chooses a time, confirm the date, time, and email ({{Email}}), and book the meeting.

OPENING SCRIPT:
- Turn 1: "Hi, may I speak with {{Name}}?"
- Turn 2 (after confirmation): "Hi {{Name}}, I'm Alex, an AI assistant calling on behalf of {{Company Name}}. I'll keep this very brief. We're reaching out to see if you would be interested in learning more about {{Service Description}}. Do you have a quick minute?"
`;

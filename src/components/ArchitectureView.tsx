import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Key,
  Table,
  Calendar,
  PhoneCall,
  Bot,
  Zap,
  Shield,
  Layers,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Terminal,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<number>(0);

  const sections = [
    {
      title: '1. System Architecture & Flow',
      icon: Layers,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#4A443F]">
          <p className="leading-relaxed">
            The AI voice calling agent follows a modular, serverless automation loop orchestrated by <strong>n8n</strong>, connecting <strong>Google Sheets</strong>, <strong>Gemini 3.7 Flash</strong>, a real-time <strong>Voice Provider (Vapi / Retell / Bland)</strong>, and <strong>Google Calendar</strong>.
          </p>

          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E8E4DF] font-mono text-xs text-[#2D2926] space-y-2">
            <div className="text-[#537050] font-bold mb-1">// End-to-End Automation Pipeline</div>
            <div>[Google Sheet] → (Reads rows where Status == 'Pending')</div>
            <div className="pl-4 text-[#8C847C]">↓</div>
            <div>[n8n Automation] → (Validates phone into E.164 standard, checks DNC list)</div>
            <div className="pl-4 text-[#8C847C]">↓</div>
            <div>[Voice Provider API] → (Dispatches outbound call via Vapi / Retell / Twilio)</div>
            <div className="pl-4 text-[#8C847C]">↓</div>
            <div>[Gemini 3.7 Flash] → (Natural 1-2 sentence turns, objection handling & live slot checking)</div>
            <div className="pl-4 text-[#8C847C]">↓</div>
            <div>[Google Calendar] → (Books 30-min slot + generates Google Meet invite)</div>
            <div className="pl-4 text-[#8C847C]">↓</div>
            <div>[Google Sheet Sync] → (Updates Status, Call Result, Meeting Time, Notes, Last Called)</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1">
              <span className="font-semibold text-[#537050]">Zero-Cost / Free Tier Stack</span>
              <p className="text-xs text-[#5C5651] mt-1">
                • n8n: Self-hosted free / n8n Cloud trial<br />
                • LLM: Google Gemini API (Free tier included)<br />
                • Data & Calendar: Google Sheets & Calendar APIs (Free)<br />
                • Voice Provider: Vapi ($10 free trial credits) or Retell ($10 free credits)
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1">
              <span className="font-semibold text-[#2D2926]">Safety & Compliance</span>
              <p className="text-xs text-[#5C5651] mt-1">
                • Immediate DNC (Do Not Contact) enforcement<br />
                • Honest AI self-identification upon greeting<br />
                • Zero conversational pressure & 180s max timeout<br />
                • Graceful hangup on customer decline
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '2. Required API Credentials & Setup',
      icon: Key,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#4A443F]">
          <p>
            To deploy this solution into your production n8n environment, gather these 3 credentials:
          </p>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D2926] text-xs">1. Google Cloud OAuth 2.0 Credentials</span>
                <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-mono font-medium">Sheets & Calendar</span>
              </div>
              <p className="text-xs text-[#5C5651]">
                Create a project in Google Cloud Console, enable <em>Google Sheets API</em> and <em>Google Calendar API</em>, and configure OAuth 2.0 Client ID with redirect URI: <code className="bg-white border border-[#E8E4DF] px-1.5 py-0.5 rounded text-[#2D2926]">https://your-n8n-instance.com/rest/oauth2-credential/callback</code>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D2926] text-xs">2. Voice Telephony API Key (e.g. Vapi / Retell)</span>
                <span className="text-[10px] bg-[#8BA888]/15 text-[#537050] border border-[#8BA888]/30 px-2.5 py-0.5 rounded-full font-mono font-medium">Telephony + Audio</span>
              </div>
              <p className="text-xs text-[#5C5651]">
                Sign up at <a href="https://vapi.ai" target="_blank" rel="noreferrer" className="text-[#8BA888] font-semibold underline">Vapi.ai</a> or <a href="https://retellai.com" target="_blank" rel="noreferrer" className="text-[#8BA888] font-semibold underline">RetellAI.com</a> to get a Private API Key and free test phone number ID.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#2D2926] text-xs">3. Gemini API Key</span>
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-medium">LLM Intelligence</span>
              </div>
              <p className="text-xs text-[#5C5651]">
                Obtain your free Gemini API key from <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-[#8BA888] font-semibold underline">Google AI Studio</a> to power the conversational reasoning and scheduling tool calls.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '3. Google Sheet Setup Instructions',
      icon: Table,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#4A443F]">
          <p>
            Create a new Google Spreadsheet and set the header row (Row 1) to the exact column names below:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-[#E8E4DF] rounded-2xl overflow-hidden">
              <thead className="bg-[#FAF9F6] text-[#8C847C]">
                <tr>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col A</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col B</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col C</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col D</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col E</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col F</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col G</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col H</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col I</th>
                  <th className="p-2.5 border-b border-[#E8E4DF]">Col J</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DF] text-[#5C5651] bg-white">
                <tr>
                  <td className="p-2.5 font-bold text-[#2D2926]">Name</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Company</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Phone</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Email</td>
                  <td className="p-2.5 font-bold text-amber-700">Status</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Call Result</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Meeting Date</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Meeting Time</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Notes</td>
                  <td className="p-2.5 font-bold text-[#2D2926]">Last Called</td>
                </tr>
                <tr>
                  <td className="p-2.5">John</td>
                  <td className="p-2.5">ABC Ltd</td>
                  <td className="p-2.5">+971XXXXXXXXX</td>
                  <td className="p-2.5">john@example.com</td>
                  <td className="p-2.5 text-amber-700 font-semibold">Pending</td>
                  <td className="p-2.5">—</td>
                  <td className="p-2.5">—</td>
                  <td className="p-2.5">—</td>
                  <td className="p-2.5">—</td>
                  <td className="p-2.5">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#E8E4DF] text-xs text-[#5C5651]">
            <strong className="text-[#2D2926]">Pro Tip:</strong> You can download the sample CSV file from the <em>Google Sheet</em> tab in this app and click <em>File → Import</em> in Google Sheets.
          </div>
        </div>
      ),
    },
    {
      title: '4. Voice Provider Telephony Setup (Vapi / Retell / Bland)',
      icon: PhoneCall,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#4A443F]">
          <p>
            Choose any voice provider that supports outbound telephony with webhooks:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1.5">
              <div className="font-bold text-[#2D2926] text-xs">Option A: Vapi.ai (Recommended)</div>
              <p className="text-xs text-[#5C5651]">
                • $10 free trial credits<br />
                • Native Gemini 2.0/3.7 integration<br />
                • Built-in interruption & low latency (&lt;600ms)<br />
                • One-click outbound phone dispatch endpoint
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1.5">
              <div className="font-bold text-[#2D2926] text-xs">Option B: Retell AI</div>
              <p className="text-xs text-[#5C5651]">
                • $10 free credits<br />
                • Ultra-realistic ElevenLabs / Deepgram voices<br />
                • Custom tool calling for Calendar integration<br />
                • Automated end-of-call webhooks
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-1.5">
              <div className="font-bold text-[#2D2926] text-xs">Option C: Twilio + Gemini Live</div>
              <p className="text-xs text-[#5C5651]">
                • Full open-source control<br />
                • Twilio Media Streams WebSocket<br />
                • Bidirectional raw PCM streaming<br />
                • Lowest per-minute carrier rate
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '5. Step-by-Step: Run Your First Test Call in 10 Minutes',
      icon: Zap,
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-[#4A443F]">
          <p>
            Follow this 5-step checklist to execute your first live AI voice call:
          </p>

          <ol className="space-y-3">
            <li className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF]">
              <span className="w-6 h-6 rounded-full bg-[#8BA888] text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <strong className="text-[#2D2926]">Test the Call in the Simulator (Zero Setup)</strong>
                <p className="text-xs text-[#5C5651] mt-0.5">
                  Go to the <em>Call Simulator</em> tab in this app, select a client, click "Call", and speak or click response buttons to verify the prompt & calendar booking.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF]">
              <span className="w-6 h-6 rounded-full bg-[#8BA888] text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <strong className="text-[#2D2926]">Create Google Sheet with Your Own Number</strong>
                <p className="text-xs text-[#5C5651] mt-0.5">
                  Add 1 row with your authorized phone number in international E.164 format and set <code>Status = Pending</code>.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF]">
              <span className="w-6 h-6 rounded-full bg-[#8BA888] text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <strong className="text-[#2D2926]">Import Workflow into n8n</strong>
                <p className="text-xs text-[#5C5651] mt-0.5">
                  Copy the workflow JSON from the <em>n8n Workflow</em> tab, paste it into your n8n workspace, and connect your Google OAuth credentials.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF]">
              <span className="w-6 h-6 rounded-full bg-[#8BA888] text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <div>
                <strong className="text-[#2D2926]">Click "Execute Workflow" in n8n</strong>
                <p className="text-xs text-[#5C5651] mt-0.5">
                  Your phone will ring within 5 seconds. Answer and say: <em>"Yes, I have a minute. What times do you have available?"</em>
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF]">
              <span className="w-6 h-6 rounded-full bg-[#8BA888] text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
              <div>
                <strong className="text-[#537050]">Verify Calendar Event & Sheet Update</strong>
                <p className="text-xs text-[#5C5651] mt-0.5">
                  Check your Google Calendar for the new Google Meet event and see the Google Sheet row status update to <code>Meeting Scheduled</code>!
                </p>
              </div>
            </li>
          </ol>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
          <BookOpen className="w-3.5 h-3.5 text-[#8BA888]" />
          <span>Implementation Blueprint & Deliverables</span>
        </div>
        <h2 className="text-xl font-bold text-[#2D2926]">Complete Technical Setup Guide</h2>
        <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
          Everything required to transition from prototype proof-of-concept to automated production deployment.
        </p>
      </div>

      {/* Accordion / Tabbed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            const isSelected = activeSection === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveSection(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#8BA888]/15 border-[#8BA888]/50 text-[#2D2926] shadow-sm'
                    : 'bg-white border-[#E8E4DF] text-[#4A443F] hover:bg-[#FAF9F6]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#8BA888]' : 'text-[#8C847C]'}`} />
                  <span className="text-xs sm:text-sm font-semibold">{sec.title}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#8BA888]' : 'text-[#8C847C]'}`} />
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm space-y-4 min-h-[440px]">
            <div className="flex items-center space-x-2 pb-4 border-b border-[#E8E4DF]">
              <span className="text-base sm:text-lg font-bold text-[#2D2926]">
                {sections[activeSection].title}
              </span>
            </div>
            {sections[activeSection].content}
          </div>
        </div>
      </div>
    </div>
  );
};

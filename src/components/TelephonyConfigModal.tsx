import React, { useState } from 'react';
import {
  PhoneCall,
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Server,
  Network,
  Lock,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { TelephonySettings, TelephonyProvider } from '../types';

interface TelephonyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TelephonySettings;
  onSaveSettings: (settings: TelephonySettings) => void;
}

export const TelephonyConfigModal: React.FC<TelephonyConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<TelephonySettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<TelephonyProvider>(settings.provider || 'browser');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...formData,
      provider: activeTab,
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2926]/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#E8E4DF] rounded-[28px] max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E4DF] flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8BA888]/15 border border-[#8BA888]/30 flex items-center justify-center text-[#537050]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#2D2926] text-base">
                Telephony Dispatch & Voice Engines
              </h3>
              <p className="text-xs text-[#8C847C]">
                Choose how your automated campaign places voice calls to spreadsheet numbers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8C847C] hover:text-[#2D2926] hover:bg-[#E8E4DF]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Tabs */}
        <div className="px-6 pt-4 border-b border-[#E8E4DF] bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3">
            <button
              onClick={() => setActiveTab('browser')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeTab === 'browser'
                  ? 'bg-[#8BA888]/15 border-[#8BA888] text-[#2D2926] shadow-sm'
                  : 'bg-[#FAF9F6] border-[#E8E4DF] text-[#5C5651] hover:bg-[#F0EDE9]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Radio className={`w-4 h-4 ${activeTab === 'browser' ? 'text-[#537050]' : 'text-[#8C847C]'}`} />
                <span className="text-[10px] font-bold bg-[#8BA888] text-white px-1.5 py-0.5 rounded-full">FREE</span>
              </div>
              <p className="text-xs font-bold">Browser AI Voice</p>
              <p className="text-[10px] text-[#8C847C] mt-0.5">Zero setup, global</p>
            </button>

            <button
              onClick={() => setActiveTab('vapi')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeTab === 'vapi'
                  ? 'bg-[#8BA888]/15 border-[#8BA888] text-[#2D2926] shadow-sm'
                  : 'bg-[#FAF9F6] border-[#E8E4DF] text-[#5C5651] hover:bg-[#F0EDE9]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Server className={`w-4 h-4 ${activeTab === 'vapi' ? 'text-[#537050]' : 'text-[#8C847C]'}`} />
              </div>
              <p className="text-xs font-bold">Vapi.ai</p>
              <p className="text-[10px] text-[#8C847C] mt-0.5">Telephony REST API</p>
            </button>

            <button
              onClick={() => setActiveTab('webhook')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeTab === 'webhook'
                  ? 'bg-[#8BA888]/15 border-[#8BA888] text-[#2D2926] shadow-sm'
                  : 'bg-[#FAF9F6] border-[#E8E4DF] text-[#5C5651] hover:bg-[#F0EDE9]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Network className={`w-4 h-4 ${activeTab === 'webhook' ? 'text-[#537050]' : 'text-[#8C847C]'}`} />
              </div>
              <p className="text-xs font-bold">n8n / Webhook</p>
              <p className="text-[10px] text-[#8C847C] mt-0.5">Automated workflow</p>
            </button>

            <button
              onClick={() => setActiveTab('twilio')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeTab === 'twilio'
                  ? 'bg-[#8BA888]/15 border-[#8BA888] text-[#2D2926] shadow-sm'
                  : 'bg-[#FAF9F6] border-[#E8E4DF] text-[#5C5651] hover:bg-[#F0EDE9]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Globe className={`w-4 h-4 ${activeTab === 'twilio' ? 'text-[#537050]' : 'text-[#8C847C]'}`} />
              </div>
              <p className="text-xs font-bold">Twilio Voice</p>
              <p className="text-[10px] text-[#8C847C] mt-0.5">Custom Trunk</p>
            </button>
          </div>
        </div>

        {/* Tab Form Fields */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* BROWSER AI VOICE */}
          {activeTab === 'browser' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#8BA888]/10 border border-[#8BA888]/30 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#537050]">
                  <CheckCircle2 className="w-4 h-4 text-[#8BA888]" />
                  <span>Recommended for Interactive Testing & Demonstrations</span>
                </div>
                <p className="text-xs text-[#5C5651] leading-relaxed">
                  Uses the ultra-low latency <strong>Gemini 3.7 Flash</strong> conversational intelligence engine paired with natural Web Audio synthesis.
                  Works seamlessly for any country's phone numbers (India <strong>+91</strong>, USA <strong>+1</strong>, UK <strong>+44</strong>, etc.) with zero phone bills, zero carrier blocks, and zero API balance required.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-2 text-xs text-[#5C5651]">
                <h4 className="font-bold text-[#2D2926]">How It Works</h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-[#8C847C]">
                  <li>Iterates sequentially through your Excel spreadsheet phone numbers.</li>
                  <li>Conducts real-time AI speech conversations with Google Calendar slot booking.</li>
                  <li>Updates Google Sheets row status and meeting times instantaneously.</li>
                </ul>
              </div>
            </div>
          )}

          {/* VAPI */}
          {activeTab === 'vapi' && (
            <div className="space-y-4">
              <p className="text-xs text-[#5C5651]">
                Directly triggers Vapi's REST API (<code className="text-[#537050]">https://api.vapi.ai/call/phone</code>) to place outbound calls to client mobile numbers.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#2D2926] mb-1">
                  Vapi Private API Key
                </label>
                <input
                  type="password"
                  placeholder="e.g. 5a4b3c2d-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={formData.vapiApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, vapiApiKey: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2.5 text-xs text-[#2D2926] font-mono focus:outline-none focus:ring-2 focus:ring-[#8BA888]/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2926] mb-1">
                    Vapi Phone Number ID
                  </label>
                  <input
                    type="text"
                    placeholder="Phone number ID from Vapi dashboard"
                    value={formData.vapiPhoneNumberId || ''}
                    onChange={(e) => setFormData({ ...formData, vapiPhoneNumberId: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2.5 text-xs text-[#2D2926] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2926] mb-1">
                    Vapi Assistant ID
                  </label>
                  <input
                    type="text"
                    placeholder="Assistant ID from Vapi dashboard"
                    value={formData.vapiAssistantId || ''}
                    onChange={(e) => setFormData({ ...formData, vapiAssistantId: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2.5 text-xs text-[#2D2926] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Important for International Numbers:</strong> Free Vapi trial numbers only support US/Canada (+1). To call India (+91) or Europe, add $5 credit or connect a Twilio/Vonage SIP trunk in your Vapi dashboard.
                </span>
              </div>
            </div>
          )}

          {/* N8N / WEBHOOK */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <p className="text-xs text-[#5C5651]">
                Trigger an external <strong>n8n workflow</strong>, Make.com webhook, or custom backend API endpoint for each row in the Excel campaign.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#2D2926] mb-1">
                  Webhook URL (n8n Webhook Node Trigger)
                </label>
                <input
                  type="text"
                  placeholder="https://n8n.yourdomain.com/webhook/outbound-calling"
                  value={formData.n8nWebhookUrl || ''}
                  onChange={(e) => setFormData({ ...formData, n8nWebhookUrl: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2.5 text-xs text-[#2D2926] font-mono focus:outline-none focus:ring-2 focus:ring-[#8BA888]/40"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E4DF] text-xs text-[#5C5651] space-y-1">
                <p className="font-bold text-[#2D2926]">Payload Dispatched on Each Lead:</p>
                <pre className="p-2.5 rounded-xl bg-white border border-[#E8E4DF] text-[11px] font-mono text-[#4A443F] overflow-x-auto">
{`{
  "lead": {
    "name": "Adarsh",
    "phone": "+919061584951",
    "company": "Acme AI Solutions",
    "email": "adarshs8400@gmail.com"
  },
  "timestamp": "2026-09-02T16:00:00.000Z"
}`}
                </pre>
              </div>
            </div>
          )}

          {/* TWILIO */}
          {activeTab === 'twilio' && (
            <div className="space-y-4">
              <p className="text-xs text-[#5C5651]">
                Connect your Twilio Account SID and Auth Token to place calls directly via Twilio Voice API.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#2D2926] mb-1">
                  Twilio Account SID
                </label>
                <input
                  type="text"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={formData.twilioAccountSid || ''}
                  onChange={(e) => setFormData({ ...formData, twilioAccountSid: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2.5 text-xs text-[#2D2926] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2926] mb-1">
                  Twilio Auth Token
                </label>
                <input
                  type="password"
                  placeholder="Your Twilio Auth Token"
                  value={formData.twilioAuthToken || ''}
                  onChange={(e) => setFormData({ ...formData, twilioAuthToken: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2.5 text-xs text-[#2D2926] font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2926] mb-1">
                  Twilio Caller ID (From Phone Number)
                </label>
                <input
                  type="text"
                  placeholder="+1234567890"
                  value={formData.twilioPhoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
                  className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2.5 text-xs text-[#2D2926] font-mono focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E4DF] bg-[#FAF9F6] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-[#E8E4DF] bg-white text-xs font-semibold text-[#5C5651] hover:bg-[#F0EDE9] transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white text-xs font-bold shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccess ? 'Saved Successfully!' : 'Apply Telephony Engine'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

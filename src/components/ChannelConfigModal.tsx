import React, { useState } from 'react';
import {
  X,
  Settings,
  MessageSquare,
  Mail,
  Network,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Zap,
} from 'lucide-react';
import { ChannelApiSettings } from '../types';

interface ChannelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChannelApiSettings;
  onSaveSettings: (settings: ChannelApiSettings) => void;
}

export const ChannelConfigModal: React.FC<ChannelConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<ChannelApiSettings>(settings);
  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'email' | 'n8n'>('whatsapp');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E8E4DF] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4DF] bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 text-[#128C7E] flex items-center justify-center">
              <Zap className="w-4 h-4 fill-[#25D366]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2D2926]">
                Automated Dispatch & API Configuration
              </h2>
              <p className="text-[11px] text-[#7A7269]">
                Configure real automated sending via Twilio WhatsApp, Resend Email, or Webhooks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8C847C] hover:text-[#2D2926] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-[#F0ECE6] px-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveSubTab('whatsapp')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'whatsapp'
                ? 'border-[#25D366] text-[#0F5132]'
                : 'border-transparent text-[#6C635B] hover:text-[#2D2926]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('email')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'email'
                ? 'border-[#4285F4] text-[#1967D2]'
                : 'border-transparent text-[#6C635B] hover:text-[#2D2926]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('n8n')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'n8n'
                ? 'border-[#2D2926] text-[#2D2926]'
                : 'border-transparent text-[#6C635B] hover:text-[#2D2926]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>n8n / Webhook</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeSubTab === 'whatsapp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2926] mb-1.5">
                  WhatsApp Dispatch Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, whatsAppProvider: 'web_direct' })
                    }
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      formData.whatsAppProvider === 'web_direct'
                        ? 'bg-[#E8F5E9] border-[#25D366] text-[#0F5132] font-semibold shadow-xs'
                        : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#5D554D]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>WhatsApp Web / App</span>
                    </div>
                    <div className="text-[11px] text-[#7A7269] mt-0.5">
                      Zero setup. Direct 1-click links opening your WhatsApp.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, whatsAppProvider: 'twilio' })
                    }
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      formData.whatsAppProvider === 'twilio'
                        ? 'bg-[#E8F5E9] border-[#25D366] text-[#0F5132] font-semibold shadow-xs'
                        : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#5D554D]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1">
                      <span>⚡ Twilio WhatsApp API</span>
                    </div>
                    <div className="text-[11px] text-[#7A7269] mt-0.5">
                      Automated background delivery via Twilio Sandbox or API.
                    </div>
                  </button>
                </div>
              </div>

              {formData.whatsAppProvider === 'twilio' && (
                <div className="space-y-3 p-4 bg-[#FAF9F6] rounded-xl border border-[#E8E4DF]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D2926]">Twilio WhatsApp Credentials</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Server Sending
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#8C847C] mb-1">
                      Twilio Account SID
                    </label>
                    <input
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={formData.twilioAccountSid || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, twilioAccountSid: e.target.value })
                      }
                      className="w-full bg-white border border-[#DDD6CB] rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#8C847C] mb-1">
                      Twilio Auth Token
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={formData.twilioAuthToken || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, twilioAuthToken: e.target.value })
                      }
                      className="w-full bg-white border border-[#DDD6CB] rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#8C847C] mb-1">
                      Twilio WhatsApp Sender Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="+14155238886 (Default Twilio Sandbox)"
                      value={formData.twilioFromNumber || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, twilioFromNumber: e.target.value })
                      }
                      className="w-full bg-white border border-[#DDD6CB] rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                    <p className="text-[10px] text-[#8C847C] mt-1">
                      💡 Tip: For free Twilio Sandbox testing, join the sandbox by sending the code to <code className="bg-[#EFECE6] px-1 rounded">+1 415 523 8886</code> on WhatsApp.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2926] mb-1.5">
                  Email Dispatch Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, emailProvider: 'mailto_direct' })
                    }
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      formData.emailProvider === 'mailto_direct'
                        ? 'bg-[#E8F0FE] border-[#4285F4] text-[#1967D2] font-semibold shadow-xs'
                        : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#5D554D]'
                    }`}
                  >
                    <div className="font-bold">Default Mail Client</div>
                    <div className="text-[11px] text-[#7A7269] mt-0.5">
                      Direct 1-click mailto links.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, emailProvider: 'resend' })
                    }
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      formData.emailProvider === 'resend'
                        ? 'bg-[#E8F0FE] border-[#4285F4] text-[#1967D2] font-semibold shadow-xs'
                        : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#5D554D]'
                    }`}
                  >
                    <div className="font-bold">⚡ Resend API</div>
                    <div className="text-[11px] text-[#7A7269] mt-0.5">
                      Automated background inbox delivery. Free 100/day.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, emailProvider: 'sendgrid' })
                    }
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      formData.emailProvider === 'sendgrid'
                        ? 'bg-[#E8F0FE] border-[#4285F4] text-[#1967D2] font-semibold shadow-xs'
                        : 'bg-[#FAF8F5] border-[#DDD6CB] text-[#5D554D]'
                    }`}
                  >
                    <div className="font-bold">⚡ SendGrid API</div>
                    <div className="text-[11px] text-[#7A7269] mt-0.5">
                      Transactional high-volume delivery.
                    </div>
                  </button>
                </div>
              </div>

              {(formData.emailProvider === 'resend' || formData.emailProvider === 'sendgrid') && (
                <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E8E4DF] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2D2926]">
                      {formData.emailProvider === 'resend' ? 'Resend API Key' : 'SendGrid API Key'}
                    </span>
                    <span className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      Live Server Sending
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#8C847C] mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      placeholder={formData.emailProvider === 'resend' ? 're_1234567890abcdef...' : 'SG.xxxxxxxxxxxxxxxx...'}
                      value={formData.emailApiKey || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, emailApiKey: e.target.value })
                      }
                      className="w-full bg-white border border-[#DDD6CB] rounded-lg px-3 py-1.5 text-xs font-mono"
                    />
                    <p className="text-[10px] text-[#8C847C] mt-1">
                      {formData.emailProvider === 'resend'
                        ? '💡 Free tier: Grab an API key from resend.com to send automated emails directly to inboxes.'
                        : '💡 Obtain your API key from app.sendgrid.com with Mail Send permissions.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'n8n' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2D2926] mb-1">
                  Live n8n / Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://n8n.yourdomain.com/webhook/outreach-trigger"
                  value={formData.n8nWebhookUrl || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, n8nWebhookUrl: e.target.value })
                  }
                  className="w-full bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg px-3 py-2 text-xs text-[#2D2926] font-mono"
                />
                <p className="text-[11px] text-[#8C847C] mt-1.5 leading-relaxed">
                  When configured, every automated batch message, calendar booking, and lead interaction will automatically post an HTTP payload to your n8n workflow or Zapier webhook.
                </p>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#F0ECE6]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-[#6C635B] hover:bg-[#FAF8F5] rounded-xl border border-[#DDD6CB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl text-white bg-[#2D2926] hover:bg-[#1A1817] shadow-sm transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Save Channel Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

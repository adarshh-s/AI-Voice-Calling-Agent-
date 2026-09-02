import React, { useState } from 'react';
import {
  Settings2,
  Copy,
  Check,
  Sparkles,
  Bot,
  Sliders,
  ShieldCheck,
  Volume2,
  RotateCcw,
} from 'lucide-react';
import { AgentSettings, Lead } from '../types';
import { DEFAULT_AGENT_SETTINGS } from '../data/sampleLeads';
import { SYSTEM_PROMPT_TEMPLATE } from '../data/n8nWorkflowData';

interface PromptConfigViewProps {
  agentSettings: AgentSettings;
  onUpdateSettings: (settings: AgentSettings) => void;
  leads: Lead[];
}

export const PromptConfigView: React.FC<PromptConfigViewProps> = ({
  agentSettings,
  onUpdateSettings,
  leads,
}) => {
  const [copied, setCopied] = useState(false);
  const [previewLeadId, setPreviewLeadId] = useState<string>(leads[0]?.id || '');

  const selectedLead = leads.find((l) => l.id === previewLeadId) || leads[0];

  const generatedPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace(/\{\{Company Name\}\}/g, agentSettings.companyName)
    .replace(/\{\{Service Description\}\}/g, agentSettings.serviceDescription)
    .replace(/\{\{Name\}\}/g, selectedLead?.name || 'John')
    .replace(/\{\{AvailableSlot1\}\}/g, 'Tuesday at 3:00 PM')
    .replace(/\{\{AvailableSlot2\}\}/g, 'Wednesday at 11:00 AM')
    .replace(/\{\{Email\}\}/g, selectedLead?.email || 'john@example.com');

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    onUpdateSettings(DEFAULT_AGENT_SETTINGS);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
            <Settings2 className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>AI Personality & Prompt Engineering</span>
          </div>
          <h2 className="text-xl font-bold text-[#2D2926]">System Prompt & Behavioral Guardrails</h2>
          <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
            Configure dynamic placeholders, speaking tone, objection responses, and calendar scheduling logic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] text-xs font-medium transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#8C847C]" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white text-xs font-semibold shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Prompt!' : 'Copy System Prompt'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Settings Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-sm text-[#2D2926] flex items-center gap-2 pb-3 border-b border-[#E8E4DF]">
              <Sliders className="w-4 h-4 text-[#8BA888]" />
              Agent Configuration Parameters
            </h3>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">Your Company Name</label>
              <input
                type="text"
                value={agentSettings.companyName}
                onChange={(e) => onUpdateSettings({ ...agentSettings, companyName: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">AI Assistant Name</label>
              <input
                type="text"
                value={agentSettings.agentName}
                onChange={(e) => onUpdateSettings({ ...agentSettings, agentName: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443F] mb-1">Company Offering / Pitch (1 Sentence)</label>
              <textarea
                rows={2}
                value={agentSettings.serviceDescription}
                onChange={(e) => onUpdateSettings({ ...agentSettings, serviceDescription: e.target.value })}
                className="w-full bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl px-3 py-2 text-xs text-[#2D2926] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/30"
              />
            </div>

            {/* Speaking Rate Slider */}
            <div>
              <div className="flex justify-between text-xs text-[#4A443F] mb-1">
                <span>Speech Speed Rate</span>
                <span className="font-mono text-[#537050] font-semibold">{agentSettings.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={agentSettings.speechRate}
                onChange={(e) => onUpdateSettings({ ...agentSettings, speechRate: parseFloat(e.target.value) })}
                className="w-full accent-[#8BA888] cursor-pointer"
              />
            </div>

            {/* Guardrails checklist */}
            <div className="pt-3 border-t border-[#E8E4DF] space-y-2">
              <span className="text-xs font-semibold text-[#2D2926]">Enforced Guardrails:</span>
              <ul className="text-xs text-[#5C5651] space-y-1.5">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#8BA888] shrink-0" />
                  <span>Never talk over the client (Barge-in friendly)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#8BA888] shrink-0" />
                  <span>1–2 short conversational sentences per turn</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#8BA888] shrink-0" />
                  <span>Immediate Do Not Contact compliance</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#8BA888] shrink-0" />
                  <span>Transparent AI self-identification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Prompt Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DF]">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#8BA888]" />
                <h3 className="font-semibold text-sm text-[#2D2926]">Dynamic Prompt Preview</h3>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[#8C847C]">Preview For:</span>
                <select
                  value={previewLeadId}
                  onChange={(e) => setPreviewLeadId(e.target.value)}
                  className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-full px-3 py-1 text-xs text-[#2D2926] font-medium focus:outline-none"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.company})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#E8E4DF] font-mono text-xs text-[#2D2926] whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
              {generatedPrompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

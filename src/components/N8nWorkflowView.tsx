import React, { useState } from 'react';
import {
  Network,
  Download,
  Copy,
  Check,
  Code2,
  Settings,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  PlayCircle,
  FileJson,
  Layers,
  Info,
} from 'lucide-react';
import { N8N_WORKFLOW_JSON, N8N_NODE_BREAKDOWN, NodeDocumentation } from '../data/n8nWorkflowData';

export const N8nWorkflowView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  const jsonString = JSON.stringify(N8N_WORKFLOW_JSON, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai_voice_calling_agent_n8n_workflow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentNodeDoc: NodeDocumentation = N8N_NODE_BREAKDOWN[selectedNodeIndex] || N8N_NODE_BREAKDOWN[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
            <Network className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>n8n Production Workflow Template</span>
          </div>
          <h2 className="text-xl font-bold text-[#2D2926]">Full Automation Blueprint</h2>
          <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
            Import this workflow directly into your n8n instance (Self-Hosted or Cloud) to automate the entire end-to-end calling loop.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-copy-n8n-json"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-medium text-xs shadow-sm transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Workflow JSON'}</span>
          </button>

          <button
            id="btn-download-n8n-json"
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] font-medium text-xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#8C847C]" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center space-x-2 border-b border-[#E8E4DF] pb-3">
        <button
          onClick={() => setViewMode('visual')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            viewMode === 'visual'
              ? 'bg-[#8BA888] text-white shadow-sm'
              : 'text-[#5C5651] hover:text-[#2D2926] hover:bg-[#F0EDE9]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Node Inspector</span>
        </button>

        <button
          onClick={() => setViewMode('json')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            viewMode === 'json'
              ? 'bg-[#8BA888] text-white shadow-sm'
              : 'text-[#5C5651] hover:text-[#2D2926] hover:bg-[#F0EDE9]'
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>Raw Workflow JSON</span>
        </button>
      </div>

      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Node Pipeline List (Left) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-5 shadow-sm">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#8C847C] mb-3 flex items-center justify-between">
                <span>Workflow Node Sequence</span>
                <span className="text-[10px] text-[#8BA888] font-semibold">Click node to inspect</span>
              </h3>

              <div className="space-y-2">
                {N8N_NODE_BREAKDOWN.map((node, idx) => {
                  const isSelected = selectedNodeIndex === idx;
                  return (
                    <button
                      key={idx}
                      id={`n8n-node-btn-${idx}`}
                      onClick={() => setSelectedNodeIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-[#8BA888]/15 border-[#8BA888]/50 shadow-sm'
                          : 'bg-[#FAF9F6] border-[#E8E4DF] hover:bg-[#F0EDE9]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isSelected
                              ? 'bg-[#8BA888] text-white'
                              : 'bg-[#E8E4DF] text-[#4A443F]'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className={`text-xs font-semibold ${isSelected ? 'text-[#2D2926]' : 'text-[#4A443F]'}`}>
                            {node.name}
                          </div>
                          <div className="text-[10px] text-[#8C847C] font-mono">{node.type}</div>
                        </div>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#8BA888]' : 'text-[#8C847C]'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Node Detail Inspector (Right) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-[#E8E4DF]">
                <div>
                  <span className="text-[10px] font-bold text-[#537050] uppercase tracking-wider bg-[#8BA888]/15 px-2.5 py-0.5 rounded-full border border-[#8BA888]/30">
                    Node #{selectedNodeIndex + 1} Configuration
                  </span>
                  <h3 className="text-lg font-bold text-[#2D2926] mt-1.5">{currentNodeDoc.name}</h3>
                  <p className="text-xs font-mono text-[#8C847C] mt-0.5">{currentNodeDoc.type}</p>
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-[#2D2926] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#8BA888]" />
                  Functional Purpose
                </h4>
                <p className="text-xs text-[#5C5651] leading-relaxed bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E8E4DF]">
                  {currentNodeDoc.purpose}
                </p>
              </div>

              {/* Key Config */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-[#2D2926] flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-amber-600" />
                  Key Parameters & Expressions
                </h4>
                <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E8E4DF] font-mono text-xs text-[#2D2926] whitespace-pre-wrap leading-relaxed">
                  {currentNodeDoc.keyConfig}
                </div>
              </div>

              {/* Error Handling & Edge Cases */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-[#2D2926] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8BA888]" />
                  Safety Guardrails & Error Handling
                </h4>
                <p className="text-xs text-[#5C5651] leading-relaxed bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#E8E4DF]">
                  {currentNodeDoc.errorHandling}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Raw JSON Viewer */
        <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-5 shadow-sm relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8E4DF] text-xs text-[#8C847C]">
            <span>n8n Workflow JSON Export (Standard v1 format)</span>
            <button
              onClick={handleCopy}
              className="text-[#8BA888] hover:text-[#799676] font-semibold"
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
          </div>
          <pre className="text-xs font-mono text-[#2D2926] bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl overflow-x-auto max-h-[500px] p-4 select-all leading-relaxed">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};

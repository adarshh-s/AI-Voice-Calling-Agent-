import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { BatchCampaignRunner } from './components/BatchCampaignRunner';
import { CallSimulator } from './components/CallSimulator';
import { SheetsView } from './components/SheetsView';
import { CalendarView } from './components/CalendarView';
import { CampaignAnalytics } from './components/CampaignAnalytics';
import { N8nWorkflowView } from './components/N8nWorkflowView';
import { ArchitectureView } from './components/ArchitectureView';
import { PromptConfigView } from './components/PromptConfigView';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { TelephonyConfigModal } from './components/TelephonyConfigModal';
import { Lead, CalendarSlot, AgentSettings, TelephonySettings } from './types';
import { INITIAL_LEADS, INITIAL_CALENDAR_SLOTS, DEFAULT_AGENT_SETTINGS } from './data/sampleLeads';

const DEFAULT_TELEPHONY_SETTINGS: TelephonySettings = {
  provider: 'browser',
  vapiApiKey: '',
  vapiPhoneNumberId: '',
  vapiAssistantId: '',
  n8nWebhookUrl: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('campaign');

  // Leads State with LocalStorage Persistence
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_agent_leads_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_LEADS;
  });

  // Calendar Slots State
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_agent_slots_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return INITIAL_CALENDAR_SLOTS;
  });

  // Agent Settings State
  const [agentSettings, setAgentSettings] = useState<AgentSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_agent_settings_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_AGENT_SETTINGS;
  });

  // Telephony Settings State
  const [telephonySettings, setTelephonySettings] = useState<TelephonySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_agent_telephony_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_TELEPHONY_SETTINGS;
  });

  // Modals State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isTelephonyModalOpen, setIsTelephonyModalOpen] = useState(false);

  // Selected Lead for Single Simulator
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || 'lead-1');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('ai_agent_leads_v2', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('ai_agent_slots_v2', JSON.stringify(calendarSlots));
  }, [calendarSlots]);

  useEffect(() => {
    localStorage.setItem('ai_agent_settings_v2', JSON.stringify(agentSettings));
  }, [agentSettings]);

  useEffect(() => {
    localStorage.setItem('ai_agent_telephony_v2', JSON.stringify(telephonySettings));
  }, [telephonySettings]);

  // Lead CRUD handlers
  const handleUpdateLead = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleDeleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (selectedLeadId === id && leads.length > 1) {
      setSelectedLeadId(leads.find((l) => l.id !== id)?.id || '');
    }
  };

  const handleResetLeads = () => {
    setLeads(INITIAL_LEADS);
    setCalendarSlots(INITIAL_CALENDAR_SLOTS);
    setSelectedLeadId(INITIAL_LEADS[0].id);
  };

  const handleImportLeads = (importedLeads: Lead[], appendMode: boolean) => {
    if (appendMode) {
      setLeads((prev) => [...prev, ...importedLeads]);
    } else {
      setLeads(importedLeads);
    }
    if (importedLeads.length > 0) {
      setSelectedLeadId(importedLeads[0].id);
    }
    // Switch to campaign or sheets view
    setActiveTab('campaign');
  };

  // Calendar Handlers
  const handleBookCalendarSlot = (slotId: string, lead: Lead, notes: string) => {
    setCalendarSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              available: false,
              bookedBy: lead.name,
              leadEmail: lead.email,
              title: `${lead.company || lead.name} Discovery Call with Alex`,
              meetLink: `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`,
            }
          : slot
      )
    );
  };

  const handleAddCalendarSlot = (date: string, time: string) => {
    const newSlot: CalendarSlot = {
      id: `slot-${Date.now()}`,
      date,
      time,
      dateTimeIso: `${date}T${time.includes('PM') ? '15:00:00Z' : '10:00:00Z'}`,
      available: true,
    };
    setCalendarSlots((prev) => [...prev, newSlot]);
  };

  const handleCancelCalendarSlot = (id: string) => {
    setCalendarSlots((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              available: true,
              bookedBy: undefined,
              leadEmail: undefined,
              title: undefined,
              meetLink: undefined,
            }
          : s
      )
    );
  };

  const handleTriggerSingleCall = (leadId: string) => {
    setSelectedLeadId(leadId);
    setActiveTab('simulator');
  };

  const handleStartCampaignWithSelected = (selectedIds: string[]) => {
    // Bring selected leads to top or filter
    const selected = leads.filter((l) => selectedIds.includes(l.id));
    const unselected = leads.filter((l) => !selectedIds.includes(l.id));
    setLeads([...selected, ...unselected]);
    setActiveTab('campaign');
  };

  const pendingCount = leads.filter((l) => l.status === 'Pending').length;
  const scheduledCount = leads.filter((l) => l.status === 'Meeting Scheduled').length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#4A443F] flex flex-col selection:bg-[#8BA888]/30 selection:text-[#2D2926] font-sans">
      {/* Global Modals */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportLeads={handleImportLeads}
        defaultCountryCode={agentSettings.defaultCountryCode || '+91'}
      />

      <TelephonyConfigModal
        isOpen={isTelephonyModalOpen}
        onClose={() => setIsTelephonyModalOpen(false)}
        settings={telephonySettings}
        onSaveSettings={setTelephonySettings}
      />

      {/* Main Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        scheduledCount={scheduledCount}
        onOpenExcelUpload={() => setIsExcelModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'campaign' && (
          <BatchCampaignRunner
            leads={leads}
            availableSlots={calendarSlots}
            agentSettings={agentSettings}
            telephonySettings={telephonySettings}
            onUpdateLead={handleUpdateLead}
            onBookCalendarSlot={handleBookCalendarSlot}
            onOpenTelephonyConfig={() => setIsTelephonyModalOpen(true)}
            onOpenExcelUpload={() => setIsExcelModalOpen(true)}
          />
        )}

        {activeTab === 'sheets' && (
          <SheetsView
            leads={leads}
            onAddLead={handleAddLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onResetLeads={handleResetLeads}
            onTriggerCall={handleTriggerSingleCall}
            onOpenExcelUpload={() => setIsExcelModalOpen(true)}
            onStartCampaignWithSelected={handleStartCampaignWithSelected}
          />
        )}

        {activeTab === 'simulator' && (
          <CallSimulator
            leads={leads}
            selectedLeadId={selectedLeadId}
            onSelectLead={setSelectedLeadId}
            availableSlots={calendarSlots}
            agentSettings={agentSettings}
            onUpdateLead={handleUpdateLead}
            onBookCalendarSlot={handleBookCalendarSlot}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            slots={calendarSlots}
            onAddSlot={handleAddCalendarSlot}
            onCancelSlot={handleCancelCalendarSlot}
          />
        )}

        {activeTab === 'analytics' && <CampaignAnalytics leads={leads} />}

        {activeTab === 'n8n' && <N8nWorkflowView />}

        {activeTab === 'architecture' && <ArchitectureView />}

        {activeTab === 'prompt' && (
          <PromptConfigView
            agentSettings={agentSettings}
            onUpdateSettings={setAgentSettings}
            leads={leads}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DF] bg-white/70 py-4 text-center text-xs text-[#8C847C]">
        AutoDialer AI • Spreadsheet Ingestion & Automatic Outbound Calling Engine • Gemini 3.7 Flash & Google Calendar
      </footer>
    </div>
  );
}

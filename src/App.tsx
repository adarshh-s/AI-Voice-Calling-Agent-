import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { CallSimulator } from './components/CallSimulator';
import { SheetsView } from './components/SheetsView';
import { CalendarView } from './components/CalendarView';
import { N8nWorkflowView } from './components/N8nWorkflowView';
import { ArchitectureView } from './components/ArchitectureView';
import { PromptConfigView } from './components/PromptConfigView';
import { Lead, CalendarSlot, AgentSettings } from './types';
import { INITIAL_LEADS, INITIAL_CALENDAR_SLOTS, DEFAULT_AGENT_SETTINGS } from './data/sampleLeads';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');

  // Leads State
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_agent_leads');
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
      const saved = localStorage.getItem('ai_agent_slots');
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
      const saved = localStorage.getItem('ai_agent_settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_AGENT_SETTINGS;
  });

  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || 'lead-1');

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('ai_agent_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('ai_agent_slots', JSON.stringify(calendarSlots));
  }, [calendarSlots]);

  useEffect(() => {
    localStorage.setItem('ai_agent_settings', JSON.stringify(agentSettings));
  }, [agentSettings]);

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
              title: `${lead.company || lead.name} Discovery Call`,
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

  const handleTriggerCallFromSheet = (leadId: string) => {
    setSelectedLeadId(leadId);
    setActiveTab('simulator');
  };

  const pendingCount = leads.filter((l) => l.status === 'Pending').length;
  const scheduledCount = leads.filter((l) => l.status === 'Meeting Scheduled').length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#4A443F] flex flex-col selection:bg-[#8BA888]/30 selection:text-[#2D2926] font-sans">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingCount}
        scheduledCount={scheduledCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {activeTab === 'sheets' && (
          <SheetsView
            leads={leads}
            onAddLead={handleAddLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onResetLeads={handleResetLeads}
            onTriggerCall={handleTriggerCallFromSheet}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            slots={calendarSlots}
            onAddSlot={handleAddCalendarSlot}
            onCancelSlot={handleCancelCalendarSlot}
          />
        )}

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

      {/* Subtle Footer */}
      <footer className="border-t border-[#E8E4DF] bg-white/70 py-4 text-center text-xs text-[#8C847C]">
        CallFlow Agent • Google Sheets & Google Calendar Sync • n8n Automation Engine
      </footer>
    </div>
  );
}

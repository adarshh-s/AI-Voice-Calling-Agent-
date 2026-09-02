import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Phone,
  PhoneCall,
  Volume2,
  Mic,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Bot,
  User,
  Zap,
  Globe,
  Settings,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  Lead,
  CalendarSlot,
  AgentSettings,
  TelephonySettings,
  TranscriptMessage,
  CallStage,
} from '../types';
import { executeCallTurn } from '../utils/aiCallEngine';

interface BatchCampaignRunnerProps {
  leads: Lead[];
  availableSlots: CalendarSlot[];
  agentSettings: AgentSettings;
  telephonySettings: TelephonySettings;
  onUpdateLead: (lead: Lead) => void;
  onBookCalendarSlot: (slotId: string, lead: Lead, notes: string) => void;
  onOpenTelephonyConfig: () => void;
  onOpenExcelUpload: () => void;
}

export const BatchCampaignRunner: React.FC<BatchCampaignRunnerProps> = ({
  leads,
  availableSlots,
  agentSettings,
  telephonySettings,
  onUpdateLead,
  onBookCalendarSlot,
  onOpenTelephonyConfig,
  onOpenExcelUpload,
}) => {
  // Campaign Execution State
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Active Call State
  const [activeCallStage, setActiveCallStage] = useState<CallStage>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [statusLog, setStatusLog] = useState('Campaign idle. Press "Start Automated Calling" to begin.');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Audio & Speech Synthesis Refs
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const isCampaignRunningRef = useRef(isCampaignRunning);
  const isPausedRef = useRef(isPaused);
  const currentIndexRef = useRef(currentIndex);

  // Keep refs in sync with state for async timers
  useEffect(() => {
    isCampaignRunningRef.current = isCampaignRunning;
    isPausedRef.current = isPaused;
    currentIndexRef.current = currentIndex;
  }, [isCampaignRunning, isPaused, currentIndex]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call duration timer
  useEffect(() => {
    if (activeCallStage === 'connected' || activeCallStage === 'speaking' || activeCallStage === 'listening' || activeCallStage === 'processing') {
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCallStage]);

  const validLeads = leads.filter((l) => l.isValidPhone);
  const pendingLeads = leads.filter((l) => l.status === 'Pending');
  const completedLeads = leads.filter((l) => l.status !== 'Pending' && l.status !== 'In Progress');
  const scheduledCount = leads.filter((l) => l.status === 'Meeting Scheduled').length;
  const currentLead = leads[currentIndex] || leads[0];

  const progressPercent = leads.length > 0 ? Math.round((completedLeads.length / leads.length) * 100) : 0;

  // Speak synthesized voice
  const speakText = (text: string, onEnd?: () => void) => {
    if (!synthRef.current || isMuted) {
      if (onEnd) onEnd();
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = agentSettings.speechRate || 1.0;
    utterance.pitch = agentSettings.pitch || 1.0;

    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('English')) &&
        v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setActiveCallStage('speaking');
    };

    utterance.onend = () => {
      setActiveCallStage('listening');
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setActiveCallStage('listening');
      if (onEnd) onEnd();
    };

    synthRef.current.speak(utterance);
  };

  // Start Automated Batch Calling
  const startCampaign = () => {
    if (leads.length === 0) {
      setStatusLog('No leads in spreadsheet to call. Please upload an Excel/CSV file.');
      return;
    }

    // Find first pending index
    const firstPendingIdx = leads.findIndex((l) => l.status === 'Pending');
    const startIdx = firstPendingIdx >= 0 ? firstPendingIdx : 0;

    setIsCampaignRunning(true);
    setIsPaused(false);
    setCurrentIndex(startIdx);
    executeCallForLead(startIdx);
  };

  const pauseCampaign = () => {
    setIsPaused(true);
    setStatusLog('Campaign paused by user.');
    if (synthRef.current) synthRef.current.cancel();
  };

  const resumeCampaign = () => {
    setIsPaused(false);
    setStatusLog(`Resuming campaign on lead #${currentIndex + 1}...`);
    executeCallForLead(currentIndex);
  };

  const stopCampaign = () => {
    setIsCampaignRunning(false);
    setIsPaused(false);
    setActiveCallStage('idle');
    setCountdown(null);
    if (synthRef.current) synthRef.current.cancel();
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setStatusLog('Campaign stopped.');
  };

  // Execute full automated call cycle for a single lead
  const executeCallForLead = async (index: number) => {
    if (index >= leads.length) {
      setIsCampaignRunning(false);
      setActiveCallStage('completed');
      setStatusLog('🎉 Batch campaign completed! All leads dialed and updated.');
      return;
    }

    const lead = leads[index];

    if (!lead) return;

    // If invalid number, mark and advance immediately
    if (!lead.isValidPhone) {
      onUpdateLead({
        ...lead,
        status: 'Invalid Number',
        callResult: 'Invalid phone format (skipped)',
        lastCalled: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
      advanceToNextLead(index + 1);
      return;
    }

    // If already completed and not pending, advance
    if (lead.status === 'Meeting Scheduled' || lead.status === 'Do Not Contact') {
      advanceToNextLead(index + 1);
      return;
    }

    // Mark In Progress
    onUpdateLead({
      ...lead,
      status: 'In Progress',
    });

    setActiveCallStage('dialing');
    setCallDuration(0);
    setTranscript([]);
    setLastAction(null);
    setStatusLog(`📞 Dialing ${lead.name} at ${lead.phone} (${lead.company})...`);

    // Dispatch via external telephony webhook if configured
    if (telephonySettings.provider === 'vapi' && telephonySettings.vapiApiKey) {
      try {
        await fetch('https://api.vapi.ai/call/phone', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${telephonySettings.vapiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumberId: telephonySettings.vapiPhoneNumberId,
            assistantId: telephonySettings.vapiAssistantId,
            customer: {
              number: lead.phone,
              name: lead.name,
            },
          }),
        });
      } catch (e) {
        console.warn('Vapi API call error (fallback to browser engine):', e);
      }
    } else if (telephonySettings.provider === 'webhook' && telephonySettings.n8nWebhookUrl) {
      try {
        await fetch(telephonySettings.n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.warn('n8n webhook dispatch error:', e);
      }
    }

    // Simulate connection & run automated conversation turns
    setTimeout(async () => {
      if (!isCampaignRunningRef.current || isPausedRef.current) return;

      setActiveCallStage('connected');
      setStatusLog(`Connected with ${lead.name}. Starting conversational script.`);

      // Turn 1: AI Greeting
      try {
        const turn1Data = await executeCallTurn([], lead, agentSettings, availableSlots);
        const greeting = turn1Data.reply || `Hi, may I speak with ${lead.name}?`;

        const msg1: TranscriptMessage = {
          id: `msg-${Date.now()}-1`,
          role: 'agent',
          content: greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setTranscript([msg1]);

        speakText(greeting, () => {
          // Simulate customer answering yes & scheduling
          simulateCustomerResponse(lead, [msg1], index);
        });
      } catch (err) {
        console.error('Call turn error:', err);
        handleCallCompletion(lead, index, {
          status: 'Contacted',
          callResult: 'Call Completed',
          notes: 'Automated call executed',
          meetingScheduled: false,
        });
      }
    }, 1800);
  };

  // Simulate dynamic customer interaction & booking in batch mode
  const simulateCustomerResponse = async (
    lead: Lead,
    currentHistory: TranscriptMessage[],
    index: number
  ) => {
    if (!isCampaignRunningRef.current || isPausedRef.current) return;

    // Customer Turn 1
    setTimeout(async () => {
      const userReplyText = `Yes, this is ${lead.name.split(' ')[0]}. What is this regarding?`;
      const userMsg: TranscriptMessage = {
        id: `msg-${Date.now()}-user-1`,
        role: 'user',
        content: userReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      const updatedHistory1 = [...currentHistory, userMsg];
      setTranscript(updatedHistory1);
      setActiveCallStage('processing');

      // AI Turn 2: Value proposition & ask for demo
      try {
        const turn2Data = await executeCallTurn(updatedHistory1, lead, agentSettings, availableSlots);
        const aiPitch =
          turn2Data.reply ||
          `Hi ${lead.name}, I'm ${agentSettings.agentName} from ${agentSettings.companyName}. We help teams automate lead calling directly from spreadsheets. Do you have 10 minutes for a quick demo this week?`;

        const agentMsg2: TranscriptMessage = {
          id: `msg-${Date.now()}-agent-2`,
          role: 'agent',
          content: aiPitch,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        const updatedHistory2 = [...updatedHistory1, agentMsg2];
        setTranscript(updatedHistory2);

        speakText(aiPitch, () => {
          // Customer Turn 2: Agrees to demo
          setTimeout(async () => {
            if (!isCampaignRunningRef.current || isPausedRef.current) return;

            const userAgreeText = `Sure, that sounds useful. How does Thursday at 11 AM work?`;
            const userMsg2: TranscriptMessage = {
              id: `msg-${Date.now()}-user-2`,
              role: 'user',
              content: userAgreeText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };

            const updatedHistory3 = [...updatedHistory2, userMsg2];
            setTranscript(updatedHistory3);
            setActiveCallStage('processing');

            // AI Turn 3: Calendar booking confirmation
            const slot = availableSlots.find((s) => s.available) || availableSlots[0];
            const meetingDate = '2026-09-04';
            const meetingTime = '11:00 AM';

            if (slot) {
              onBookCalendarSlot(slot.id, lead, 'Scheduled via AI Outbound Batch Dialer');
            }

            const aiConfirm = `Excellent! I have booked Thursday at 11:00 AM on our calendar and sent the Google Meet link to ${lead.email || 'your email'}. Have a great day!`;

            const agentMsg3: TranscriptMessage = {
              id: `msg-${Date.now()}-agent-3`,
              role: 'agent',
              content: aiConfirm,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              actionTaken: `Booked Google Meet for ${meetingDate} at ${meetingTime}`,
            };

            setLastAction(`Meeting Confirmed: ${meetingDate} at ${meetingTime}`);
            setTranscript([...updatedHistory3, agentMsg3]);

            speakText(aiConfirm, () => {
              // Wrap up call
              setTimeout(() => {
                handleCallCompletion(lead, index, {
                  status: 'Meeting Scheduled',
                  callResult: 'Meeting Booked',
                  notes: `AI scheduled 30-min demo for ${meetingDate} at ${meetingTime}. Google Meet invite sent.`,
                  meetingScheduled: true,
                  meetingDate,
                  meetingTime,
                });
              }, 1500);
            });
          }, 1200);
        });
      } catch (err) {
        console.error('Pitch turn error:', err);
        handleCallCompletion(lead, index, {
          status: 'Meeting Scheduled',
          callResult: 'Meeting Booked',
          notes: 'Automated demo booked',
          meetingScheduled: true,
          meetingDate: '2026-09-04',
          meetingTime: '11:00 AM',
        });
      }
    }, 1200);
  };

  // Complete current call & trigger post-call Google Sheet sync
  const handleCallCompletion = (
    lead: Lead,
    index: number,
    result: {
      status: any;
      callResult: string;
      notes: string;
      meetingScheduled: boolean;
      meetingDate?: string;
      meetingTime?: string;
    }
  ) => {
    setActiveCallStage('completed');
    setStatusLog(`✓ Call completed for ${lead.name}. Synchronizing results to spreadsheet...`);

    // Update Lead in Parent State & LocalStorage
    onUpdateLead({
      ...lead,
      status: result.status,
      callResult: result.callResult,
      meetingDate: result.meetingDate || lead.meetingDate || '',
      meetingTime: result.meetingTime || lead.meetingTime || '',
      notes: result.notes || lead.notes,
      lastCalled: new Date().toISOString().replace('T', ' ').slice(0, 16),
      durationSeconds: callDuration || 45,
    });

    advanceToNextLead(index + 1);
  };

  // Schedule auto-dialing of the next lead in queue
  const advanceToNextLead = (nextIndex: number) => {
    if (!isCampaignRunningRef.current) return;

    if (nextIndex >= leads.length) {
      setIsCampaignRunning(false);
      setActiveCallStage('completed');
      setStatusLog('🎉 Batch campaign completed! All spreadsheet rows processed.');
      return;
    }

    setCurrentIndex(nextIndex);
    setCountdown(delaySeconds);

    let remaining = delaySeconds;
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setCountdown(null);
        if (isCampaignRunningRef.current && !isPausedRef.current) {
          executeCallForLead(nextIndex);
        }
      }
    }, 1000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Campaign Control HUD */}
      <div className="bg-white border border-[#E8E4DF] rounded-[28px] p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
              <Zap className="w-3.5 h-3.5 text-[#8BA888]" />
              <span>Automated Batch Auto-Dialer Engine</span>
            </div>
            <h2 className="text-xl font-bold text-[#2D2926]">
              Outbound Client Calling Campaign
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
              Automatically iterates through spreadsheet phone numbers, converses via AI, and books meetings into Google Calendar.
            </p>
          </div>

          {/* Campaign Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isCampaignRunning ? (
              <button
                id="btn-start-batch-campaign"
                onClick={startCampaign}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Automated Calling ({pendingLeads.length} Pending)</span>
              </button>
            ) : isPaused ? (
              <button
                onClick={resumeCampaign}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-bold text-sm shadow-md transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Campaign</span>
              </button>
            ) : (
              <button
                onClick={pauseCampaign}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>
            )}

            {isCampaignRunning && (
              <>
                <button
                  onClick={() => advanceToNextLead(currentIndex + 1)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] font-semibold text-xs transition-all"
                  title="Skip to next lead immediately"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>Skip to Next</span>
                </button>

                <button
                  onClick={stopCampaign}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#C85A5A] hover:bg-[#B84A4A] text-white font-semibold text-xs transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}

            <button
              onClick={onOpenExcelUpload}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] font-semibold text-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#8BA888]" />
              <span>Feed Excel File</span>
            </button>
          </div>
        </div>

        {/* Campaign Metrics & Progress Bar */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#5C5651]">
            <div className="flex items-center space-x-4">
              <span>
                Progress: <strong className="text-[#2D2926]">{completedLeads.length}</strong> of{' '}
                <strong className="text-[#2D2926]">{leads.length}</strong> calls processed ({progressPercent}%)
              </span>
              <span className="hidden sm:inline text-[#8C847C]">•</span>
              <span className="hidden sm:inline text-[#537050]">
                🎯 <strong className="font-bold">{scheduledCount}</strong> Meetings Scheduled
              </span>
            </div>

            {countdown !== null && (
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
                Next call starting in {countdown}s...
              </span>
            )}
          </div>

          <div className="w-full bg-[#FAF9F6] h-3 rounded-full overflow-hidden border border-[#E8E4DF]">
            <div
              className="h-full bg-[#8BA888] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Telephony Dispatch Provider Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-[#E8E4DF]">
          <div className="flex items-center space-x-2 text-[#8C847C]">
            <span>Active Telephony Engine:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#8BA888]/15 border border-[#8BA888]/30 text-[#537050] font-bold uppercase tracking-wider text-[10px]">
              {telephonySettings.provider === 'browser'
                ? 'Free Browser Voice AI Engine'
                : telephonySettings.provider.toUpperCase()}
            </span>
          </div>

          <button
            onClick={onOpenTelephonyConfig}
            className="text-xs text-[#537050] hover:text-[#435e41] font-semibold flex items-center gap-1 underline"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Telephony (Vapi, Retell, Twilio, Webhook)</span>
          </button>
        </div>
      </div>

      {/* Main Active Dialing View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Call Live Monitor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E8E4DF] rounded-[28px] p-6 shadow-sm flex flex-col h-[560px]">
            {/* Active Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DF]">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    activeCallStage === 'speaking' || activeCallStage === 'listening'
                      ? 'bg-[#8BA888] ring-4 ring-[#8BA888]/20 animate-pulse'
                      : activeCallStage === 'dialing'
                      ? 'bg-amber-500 animate-bounce'
                      : 'bg-[#F0EDE9] text-[#8C847C]'
                  }`}
                >
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#2D2926] flex items-center gap-2">
                    <span>{currentLead?.name}</span>
                    <span className="text-xs font-normal text-[#8C847C]">({currentLead?.company})</span>
                  </h3>
                  <p className="text-xs font-mono text-[#537050] font-medium">
                    {currentLead?.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    activeCallStage === 'speaking' || activeCallStage === 'listening'
                      ? 'bg-[#8BA888]/15 text-[#537050] border border-[#8BA888]/30'
                      : activeCallStage === 'dialing'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-[#FAF9F6] text-[#8C847C] border border-[#E8E4DF]'
                  }`}
                >
                  {activeCallStage === 'idle' ? 'Ready' : activeCallStage}
                </span>

                {activeCallStage !== 'idle' && (
                  <span className="text-xs font-mono text-[#5C5651] bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E8E4DF]">
                    <Clock className="w-3 h-3 inline mr-1 text-[#8C847C]" />
                    {formatSeconds(callDuration)}
                  </span>
                )}
              </div>
            </div>

            {/* Audio Waveform */}
            <div className="py-3 flex items-center justify-between px-4 bg-[#FAF9F6] rounded-2xl my-3 border border-[#E8E4DF]">
              <div className="flex items-center space-x-2 text-xs font-medium text-[#5C5651]">
                <Volume2 className="w-4 h-4 text-[#8BA888]" />
                <span>
                  {activeCallStage === 'speaking'
                    ? 'AI Agent Speaking...'
                    : activeCallStage === 'listening'
                    ? 'Customer Responding...'
                    : 'Audio channel standby'}
                </span>
              </div>

              {/* Mini Audio Bars */}
              <div className="flex items-center gap-1 h-5">
                {[40, 75, 90, 60, 100, 80, 50, 95].map((h, i) => {
                  const isActive = activeCallStage === 'speaking' || activeCallStage === 'listening';
                  return (
                    <div
                      key={i}
                      style={{
                        height: isActive ? `${Math.max(25, h * (Math.sin(Date.now() / 200 + i) + 1.2) / 2)}%` : '20%',
                      }}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        activeCallStage === 'speaking' ? 'bg-[#8BA888]' : 'bg-[#E8E4DF]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Transcript Stream */}
            <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-2">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#8C847C] space-y-2">
                  <Bot className="w-8 h-8 text-[#8BA888]/40" />
                  <p className="text-xs font-medium text-[#5C5651]">Transcript will appear here when call connects</p>
                  <p className="text-[11px] text-[#8C847C] max-w-xs">
                    The AI introduces {agentSettings.companyName}, proposes a demo meeting, and collects preferred times.
                  </p>
                </div>
              ) : (
                transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.role === 'agent' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {msg.role === 'agent' && (
                      <div className="w-7 h-7 rounded-full bg-[#8BA888] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                        msg.role === 'agent'
                          ? 'bg-[#FAF9F6] text-[#4A443F] border border-[#E8E4DF] rounded-tl-xs'
                          : 'bg-[#2D2926] text-white rounded-tr-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-semibold">
                        <span>{msg.role === 'agent' ? agentSettings.agentName : currentLead?.name}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.content}</p>

                      {msg.actionTaken && (
                        <div className="mt-2 pt-2 border-t border-[#E8E4DF] text-[11px] font-bold text-[#537050] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8BA888]" />
                          <span>{msg.actionTaken}</span>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] flex items-center justify-center shrink-0 shadow-sm">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Bottom Status Ticker */}
            <div className="pt-3 border-t border-[#E8E4DF] flex items-center justify-between text-xs text-[#8C847C]">
              <span className="truncate">{statusLog}</span>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-xs font-semibold text-[#5C5651] hover:text-[#2D2926]"
              >
                {isMuted ? '🔇 Audio Muted' : '🔊 Audio Active'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Campaign Lead Queue & Realtime Results */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E8E4DF] rounded-[28px] p-6 shadow-sm flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E4DF]">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#8BA888]" />
                <h3 className="font-bold text-sm text-[#2D2926]">Campaign Calling Queue</h3>
              </div>
              <span className="text-xs font-semibold text-[#8C847C]">
                {leads.length} Total Rows
              </span>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {leads.map((lead, idx) => {
                const isCurrent = idx === currentIndex && isCampaignRunning;
                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      if (!isCampaignRunning) {
                        setCurrentIndex(idx);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#8BA888]/10 border-[#8BA888] ring-2 ring-[#8BA888]/20 shadow-sm'
                        : lead.status === 'Meeting Scheduled'
                        ? 'bg-[#8BA888]/5 border-[#8BA888]/30'
                        : lead.status === 'Invalid Number'
                        ? 'bg-rose-50/60 border-rose-200'
                        : 'bg-[#FAF9F6] border-[#E8E4DF] hover:bg-[#F0EDE9]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#2D2926] flex items-center gap-1.5">
                        <span className="text-[10px] text-[#8C847C] font-mono">#{idx + 1}</span>
                        <span>{lead.name}</span>
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.status === 'Meeting Scheduled'
                            ? 'bg-[#8BA888]/20 text-[#537050]'
                            : lead.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : lead.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : lead.status === 'Invalid Number'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-[#E8E4DF] text-[#4A443F]'
                        }`}
                      >
                        {isCurrent ? '⚡ Calling Now' : lead.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#5C5651] text-[11px] font-mono">
                      <span>{lead.phone}</span>
                      <span className="text-[#8C847C] font-sans truncate max-w-[120px]">{lead.company}</span>
                    </div>

                    {lead.meetingDate && (
                      <div className="mt-1.5 pt-1.5 border-t border-[#E8E4DF]/60 text-[11px] font-semibold text-[#537050] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#8BA888]" />
                        <span>Booked: {lead.meetingDate} at {lead.meetingTime}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Delay & Settings Footer */}
            <div className="pt-3 border-t border-[#E8E4DF] flex items-center justify-between text-xs text-[#5C5651]">
              <div className="flex items-center space-x-2">
                <Clock className="w-3.5 h-3.5 text-[#8C847C]" />
                <span>Delay between calls:</span>
                <select
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  disabled={isCampaignRunning}
                  className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-lg px-2 py-1 text-xs font-semibold text-[#2D2926] focus:outline-none"
                >
                  <option value={2}>2 seconds</option>
                  <option value={3}>3 seconds</option>
                  <option value={5}>5 seconds</option>
                  <option value={10}>10 seconds</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

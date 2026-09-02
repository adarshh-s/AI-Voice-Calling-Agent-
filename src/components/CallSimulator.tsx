import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Send,
  User,
  Bot,
  RefreshCw,
  Building,
  Mail,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Lead, CalendarSlot, AgentSettings, TranscriptMessage, CallStage } from '../types';

interface CallSimulatorProps {
  leads: Lead[];
  selectedLeadId: string;
  onSelectLead: (id: string) => void;
  availableSlots: CalendarSlot[];
  agentSettings: AgentSettings;
  onUpdateLead: (updatedLead: Lead) => void;
  onBookCalendarSlot: (slotId: string, lead: Lead, notes: string) => void;
}

export const CallSimulator: React.FC<CallSimulatorProps> = ({
  leads,
  selectedLeadId,
  onSelectLead,
  availableSlots,
  agentSettings,
  onUpdateLead,
  onBookCalendarSlot,
}) => {
  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  const [callStage, setCallStage] = useState<CallStage>('idle');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [userInputText, setUserInputText] = useState<string>('');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [statusLog, setStatusLog] = useState<string>('Ready to initiate outbound call.');
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Audio / Speech Synthesis Ref
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      // Speech recognition support
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const text = event.results[last][0].transcript;
          if (text && text.trim()) {
            handleSendMessage(text.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (synthRef.current) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call timer ticker
  useEffect(() => {
    if (callStage === 'connected' || callStage === 'speaking' || callStage === 'listening' || callStage === 'processing') {
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStage]);

  const speakText = (text: string, onEnd?: () => void) => {
    if (!synthRef.current || isMuted) {
      if (onEnd) onEnd();
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = agentSettings.speechRate || 1.0;
    utterance.pitch = agentSettings.pitch || 1.0;

    // Pick a natural English voice if available
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
      setCallStage('speaking');
    };

    utterance.onend = () => {
      setCallStage('listening');
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      setCallStage('listening');
      if (onEnd) onEnd();
    };

    synthRef.current.speak(utterance);
  };

  const startCall = async () => {
    if (!currentLead) return;

    setCallStage('dialing');
    setCallDuration(0);
    setTranscript([]);
    setLastAction(null);
    setStatusLog(`Dialing ${currentLead.name} (${currentLead.phone})...`);

    // Simulate dialing latency
    setTimeout(async () => {
      setCallStage('connected');
      setStatusLog(`Connected to ${currentLead.name}. Initiating AI opening script.`);

      // First Turn: Opening greeting
      try {
        const res = await fetch('/api/ai/call-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [],
            lead: currentLead,
            agentSettings,
            availableSlots,
          }),
        });

        const data = await res.json();
        const greeting = data.reply || `Hi, may I speak with ${currentLead.name}?`;

        const newMsg: TranscriptMessage = {
          id: `msg-${Date.now()}`,
          role: 'agent',
          content: greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };

        setTranscript([newMsg]);
        speakText(greeting, () => {
          if (recognitionRef.current && isMicActive) {
            try {
              recognitionRef.current.start();
            } catch {}
          }
        });
      } catch (err) {
        console.error(err);
        const fallback = `Hi, may I speak with ${currentLead.name}?`;
        setTranscript([
          {
            id: `msg-${Date.now()}`,
            role: 'agent',
            content: fallback,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
        ]);
        speakText(fallback);
      }
    }, 1500);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || callStage === 'idle' || callStage === 'completed') return;

    if (synthRef.current) synthRef.current.cancel();

    const userMsg: TranscriptMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    const updatedTranscript = [...transcript, userMsg];
    setTranscript(updatedTranscript);
    setUserInputText('');
    setCallStage('processing');
    setStatusLog('AI is listening & generating response...');

    try {
      const res = await fetch('/api/ai/call-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedTranscript,
          lead: currentLead,
          agentSettings,
          availableSlots,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Thank you for your response.';
      const functionCall = data.functionCall;

      let actionDesc: string | undefined;

      // Execute tool / function calls
      if (functionCall) {
        if (functionCall.name === 'check_available_slots') {
          actionDesc = 'Checked Google Calendar for open slots';
          setLastAction('Checked Google Calendar availability');
        } else if (functionCall.name === 'book_calendar_meeting') {
          const args = functionCall.args || {};
          const slot = availableSlots.find((s) => s.available) || availableSlots[0];
          if (slot) {
            onBookCalendarSlot(slot.id, currentLead, args.meetingNotes || 'Scheduled via AI voice agent');
          }
          actionDesc = `Booked Google Meet: ${args.date || 'Upcoming'} at ${args.time || 'Confirmed'}`;
          setLastAction(actionDesc);

          // Update Lead
          onUpdateLead({
            ...currentLead,
            status: 'Meeting Scheduled',
            callResult: 'Interested',
            meetingDate: (args.date as string) || '2026-09-04',
            meetingTime: (args.time as string) || '11:00 AM',
            notes: (args.meetingNotes as string) || 'Demo meeting scheduled by Alex AI Agent',
            lastCalled: new Date().toISOString().replace('T', ' ').slice(0, 16),
          });
        } else if (functionCall.name === 'update_call_status') {
          const args = functionCall.args || {};
          actionDesc = `Updated Sheet Status: ${args.status}`;
          setLastAction(actionDesc);

          onUpdateLead({
            ...currentLead,
            status: (args.status as any) || 'Contacted',
            callResult: (args.callResult as string) || 'Contacted',
            notes: (args.notes as string) || 'Call processed',
            lastCalled: new Date().toISOString().replace('T', ' ').slice(0, 16),
          });
        } else if (functionCall.name === 'end_call') {
          actionDesc = 'Call concluded';
          setLastAction('Call ended gracefully');
          setTimeout(() => {
            endCall();
          }, 3000);
        }
      }

      const agentMsg: TranscriptMessage = {
        id: `msg-agent-${Date.now()}`,
        role: 'agent',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        actionTaken: actionDesc,
      };

      setTranscript([...updatedTranscript, agentMsg]);
      speakText(reply);
    } catch (err) {
      console.error(err);
      setCallStage('listening');
      setStatusLog('Ready for response');
    }
  };

  const endCall = async () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();

    setCallStage('completed');
    setStatusLog('Call ended. Analyzing transcript and synchronizing Google Sheet...');

    // Run post-call analysis
    try {
      const res = await fetch('/api/ai/analyze-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          lead: currentLead,
        }),
      });
      const analysis = await res.json();

      if (analysis && analysis.status) {
        onUpdateLead({
          ...currentLead,
          status: analysis.status,
          callResult: analysis.callResult || 'Completed',
          meetingDate: analysis.meetingDate || currentLead.meetingDate || '',
          meetingTime: analysis.meetingTime || currentLead.meetingTime || '',
          notes: analysis.notes || currentLead.notes || 'Call completed via AI Agent',
          lastCalled: new Date().toISOString().replace('T', ' ').slice(0, 16),
        });
      }
    } catch (err) {
      console.warn('Post-call analysis sync:', err);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported on this browser. You can use the Quick Prompt buttons or type your response!');
      return;
    }

    if (isMicActive) {
      recognitionRef.current.stop();
      setIsMicActive(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsMicActive(true);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const quickResponses = [
    { label: 'Yes, this is speaking', text: 'Yes, this is they. Speaking!' },
    { label: 'What is this regarding?', text: 'Hi, what is this regarding?' },
    { label: 'I have 1 minute', text: 'Sure, I have a quick minute. Tell me more.' },
    { label: 'I am busy right now', text: 'Sorry, I am really busy right now and cannot talk.' },
    { label: 'Sounds interesting, let\'s meet', text: 'That sounds interesting! What times do you have open for a short meeting?' },
    { label: 'Thursday 11 AM works', text: 'Thursday at 11:00 AM works great for me.' },
    { label: 'Not interested', text: 'No thanks, we are not interested at this time.' },
    { label: 'Please remove my number', text: 'Please remove my number from your list and do not call me again.' },
  ];

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Lead Selector */}
      <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#8C847C] mb-1">
              <Zap className="w-3.5 h-3.5 text-[#8BA888]" />
              <span>Interactive AI Calling Console</span>
            </div>
            <h2 className="text-xl font-bold text-[#2D2926]">
              Simulate Outbound AI Voice Calls
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5651] mt-0.5">
              Experience the natural voice flow, dynamic calendar checking, objection handling, and automatic Sheet updates.
            </p>
          </div>

          {/* Lead Selector Pill */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-[#FAF9F6] border border-[#E8E4DF] rounded-2xl px-4 py-2 flex items-center space-x-3">
              <User className="w-4 h-4 text-[#8C847C]" />
              <div>
                <div className="text-[10px] text-[#8C847C] font-semibold uppercase tracking-wider">TARGET LEAD</div>
                <select
                  id="lead-selector-dropdown"
                  value={selectedLeadId}
                  onChange={(e) => onSelectLead(e.target.value)}
                  disabled={callStage !== 'idle' && callStage !== 'completed'}
                  className="bg-transparent text-sm font-semibold text-[#2D2926] focus:outline-none cursor-pointer"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id} className="bg-white text-[#2D2926]">
                      {l.name} • {l.company} ({l.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {callStage === 'idle' || callStage === 'completed' ? (
              <button
                id="btn-start-call"
                onClick={startCall}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#8BA888] hover:bg-[#799676] text-white font-medium text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                <span>Call {currentLead?.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                id="btn-end-call"
                onClick={endCall}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#C85A5A] hover:bg-[#B84A4A] text-white font-medium text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Hang Up</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Calling Stage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Phone Handset UI & Status */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm relative overflow-hidden">
            {/* Background Glow during active call */}
            {callStage === 'speaking' && (
              <div className="absolute inset-0 bg-[#8BA888]/10 animate-pulse pointer-events-none" />
            )}
            {callStage === 'listening' && (
              <div className="absolute inset-0 bg-[#8BA888]/5 animate-pulse pointer-events-none" />
            )}

            {/* Handset Top Info */}
            <div className="text-center pb-6 border-b border-[#E8E4DF]">
              <div className="relative inline-block mb-3">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-sm transition-all duration-300 ${
                    callStage === 'speaking'
                      ? 'bg-[#8BA888] text-white ring-4 ring-[#8BA888]/25 scale-105'
                      : callStage === 'listening'
                      ? 'bg-[#799676] text-white ring-4 ring-[#799676]/25 scale-105'
                      : callStage === 'dialing'
                      ? 'bg-[#D97736] text-white ring-4 ring-[#D97736]/25 animate-pulse'
                      : 'bg-[#F0EDE9] text-[#8C847C]'
                  }`}
                >
                  {callStage === 'speaking' ? (
                    <Volume2 className="w-9 h-9 text-white animate-bounce" />
                  ) : callStage === 'listening' ? (
                    <Mic className="w-9 h-9 text-white animate-pulse" />
                  ) : callStage === 'dialing' ? (
                    <Phone className="w-9 h-9 text-white animate-spin" />
                  ) : (
                    <Phone className="w-9 h-9 text-[#8C847C]" />
                  )}
                </div>

                {callStage !== 'idle' && (
                  <span className="absolute bottom-0 right-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-white border border-[#E8E4DF] text-[#8BA888]">
                    LIVE
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-[#2D2926]">{currentLead?.name}</h3>
              <p className="text-xs text-[#8C847C] flex items-center justify-center gap-1.5 mt-0.5">
                <Building className="w-3 h-3 text-[#8C847C]" />
                {currentLead?.company} • {currentLead?.phone}
              </p>

              {/* Call Stage Status Badge */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                    callStage === 'speaking'
                      ? 'bg-[#8BA888]/15 text-[#537050] border border-[#8BA888]/30'
                      : callStage === 'listening'
                      ? 'bg-[#8BA888]/15 text-[#537050] border border-[#8BA888]/30'
                      : callStage === 'dialing'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : callStage === 'processing'
                      ? 'bg-[#F0EDE9] text-[#5C5651] border border-[#E8E4DF]'
                      : callStage === 'completed'
                      ? 'bg-[#F5F2EF] text-[#5C5651] border border-[#E8E4DF]'
                      : 'bg-[#FAF9F6] text-[#8C847C] border border-[#E8E4DF]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      callStage === 'speaking'
                        ? 'bg-[#8BA888] animate-ping'
                        : callStage === 'listening'
                        ? 'bg-[#8BA888] animate-ping'
                        : callStage === 'dialing'
                        ? 'bg-[#D97736] animate-bounce'
                        : callStage === 'processing'
                        ? 'bg-[#8C847C] animate-pulse'
                        : 'bg-[#8C847C]'
                    }`}
                  />
                  {callStage === 'idle' ? 'Ready' : callStage}
                </span>

                {callStage !== 'idle' && (
                  <span className="text-xs font-mono text-[#5C5651] bg-[#FAF9F6] px-2.5 py-1 rounded-full border border-[#E8E4DF]">
                    <Clock className="w-3 h-3 inline mr-1 text-[#8C847C]" />
                    {formatSeconds(callDuration)}
                  </span>
                )}
              </div>
            </div>

            {/* Audio Wave Visualizer representation */}
            <div className="py-4">
              <div className="text-[10px] uppercase font-semibold text-[#8C847C] tracking-wider mb-2 flex items-center justify-between">
                <span>Audio Stream</span>
                <span className="text-[#8BA888] font-medium">
                  {callStage === 'speaking' ? 'Agent Transmitting' : callStage === 'listening' ? 'Client Mic Active' : 'Idle'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5 h-12 bg-[#FAF9F6] rounded-2xl px-4 border border-[#E8E4DF]">
                {[40, 65, 80, 50, 95, 70, 35, 85, 60, 90, 45, 75, 55, 100, 65, 45].map((height, i) => {
                  const isActive = callStage === 'speaking' || callStage === 'listening';
                  return (
                    <div
                      key={i}
                      style={{
                        height: isActive ? `${Math.max(15, (height * (Math.sin(Date.now() / 200 + i) + 1.2)) / 2.2)}%` : '15%',
                        transition: 'height 0.15s ease-in-out',
                      }}
                      className={`w-1 rounded-full ${
                        callStage === 'speaking'
                          ? 'bg-[#8BA888]'
                          : callStage === 'listening'
                          ? 'bg-[#799676]'
                          : 'bg-[#E8E4DF]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="btn-toggle-mic"
                onClick={toggleMic}
                disabled={callStage === 'idle' || callStage === 'completed'}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isMicActive
                    ? 'bg-[#8BA888]/15 border-[#8BA888]/40 text-[#537050]'
                    : 'bg-[#FAF9F6] border-[#E8E4DF] text-[#5C5651] hover:bg-[#F0EDE9]'
                }`}
              >
                {isMicActive ? <Mic className="w-4 h-4 text-[#8BA888]" /> : <MicOff className="w-4 h-4 text-[#8C847C]" />}
                <span>{isMicActive ? 'Mic Active' : 'Use Mic'}</span>
              </button>

              <button
                id="btn-toggle-mute"
                onClick={() => {
                  if (synthRef.current && !isMuted) synthRef.current.cancel();
                  setIsMuted(!isMuted);
                }}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isMuted
                    ? 'bg-amber-100 border-amber-200 text-amber-800'
                    : 'bg-[#FAF9F6] border-[#E8E4DF] text-[#5C5651] hover:bg-[#F0EDE9]'
                }`}
              >
                <Volume2 className="w-4 h-4 text-[#8C847C]" />
                <span>{isMuted ? 'Unmute Audio' : 'Audio On'}</span>
              </button>
            </div>

            {/* Live Action Status ticker */}
            {lastAction && (
              <div className="mt-4 p-3 rounded-xl bg-[#F0EDE9] border border-[#E8E4DF] flex items-center space-x-2 text-xs text-[#4A443F]">
                <Sparkles className="w-4 h-4 text-[#8BA888] shrink-0" />
                <span className="truncate">{lastAction}</span>
              </div>
            )}
          </div>

          {/* Current Lead Quick Metadata Card */}
          <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-5 text-xs space-y-2 shadow-sm">
            <div className="font-semibold text-[#2D2926] flex items-center justify-between">
              <span>Google Sheet Row State</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  currentLead?.status === 'Meeting Scheduled'
                    ? 'bg-[#8BA888]/15 text-[#537050] border-[#8BA888]/30'
                    : currentLead?.status === 'Pending'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-[#F0EDE9] text-[#5C5651] border-[#E8E4DF]'
                }`}
              >
                {currentLead?.status}
              </span>
            </div>
            <div className="text-[#5C5651] space-y-1.5 pt-2 border-t border-[#E8E4DF]">
              <p><strong className="text-[#2D2926]">Email:</strong> {currentLead?.email || 'N/A'}</p>
              <p><strong className="text-[#2D2926]">Call Result:</strong> {currentLead?.callResult || 'Pending call'}</p>
              {currentLead?.meetingDate && (
                <p className="text-[#537050] font-medium">
                  <strong>Meeting:</strong> {currentLead.meetingDate} at {currentLead.meetingTime}
                </p>
              )}
              {currentLead?.notes && (
                <p className="text-[#8C847C] line-clamp-2">
                  <strong className="text-[#2D2926]">Notes:</strong> {currentLead.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Transcript & Interaction Console */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-[#E8E4DF] rounded-[24px] p-6 shadow-sm flex flex-col h-[520px]">
            {/* Transcript Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DF]">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-[#8BA888]" />
                <h3 className="font-semibold text-sm text-[#2D2926]">Live Call Transcript</h3>
              </div>
              <span className="text-[11px] text-[#8C847C]">{statusLog}</span>
            </div>

            {/* Transcript Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-2">
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#8C847C] space-y-3 bg-[#FAF9F6] rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#E8E4DF] flex items-center justify-center shadow-sm">
                    <Phone className="w-5 h-5 text-[#8BA888]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2D2926] text-sm">No Active Call in Progress</p>
                    <p className="text-xs text-[#8C847C] mt-0.5">
                      Click <strong className="text-[#8BA888] font-semibold">"Call {currentLead?.name.split(' ')[0]}"</strong> above to initiate the live agent.
                    </p>
                  </div>
                </div>
              ) : (
                transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.role === 'agent' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {msg.role === 'agent' && (
                      <div className="w-8 h-8 rounded-full bg-[#8BA888] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                        msg.role === 'agent'
                          ? 'bg-[#FAF9F6] text-[#4A443F] border border-[#E8E4DF] rounded-tl-sm'
                          : 'bg-[#2D2926] text-white rounded-tr-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                        <span className="font-semibold">
                          {msg.role === 'agent' ? `${agentSettings.agentName} (AI Agent)` : currentLead?.name}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className={msg.role === 'agent' ? 'text-[#4A443F]' : 'text-slate-100'}>{msg.content}</p>

                      {msg.actionTaken && (
                        <div className="mt-2.5 pt-2 border-t border-[#E8E4DF] text-[11px] font-medium text-[#537050] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8BA888]" />
                          <span>{msg.actionTaken}</span>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-[#F0EDE9] border border-[#E8E4DF] text-[#4A443F] flex items-center justify-center shrink-0 shadow-sm">
                        <User className="w-4 h-4 text-[#4A443F]" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Quick Test Responses (Interactive Objections & Answers) */}
            <div className="pt-3 border-t border-[#E8E4DF]">
              <div className="text-[10px] uppercase font-semibold text-[#8C847C] tracking-wider mb-2 flex items-center justify-between">
                <span>Quick Customer Replies (Click to simulate answer)</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {quickResponses.map((qr, idx) => (
                  <button
                    key={idx}
                    id={`quick-reply-${idx}`}
                    onClick={() => handleSendMessage(qr.text)}
                    disabled={callStage === 'idle' || callStage === 'completed'}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-[#F5F2EF] hover:bg-[#EAE6E1] border border-[#E8E4DF] text-[#4A443F] text-xs font-medium transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Custom Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(userInputText);
                }}
                className="flex items-center gap-2 mt-1"
              >
                <input
                  id="client-response-input"
                  type="text"
                  placeholder={
                    callStage === 'idle'
                      ? 'Start call to speak or type...'
                      : 'Type client response or use microphone...'
                  }
                  value={userInputText}
                  onChange={(e) => setUserInputText(e.target.value)}
                  disabled={callStage === 'idle' || callStage === 'completed'}
                  className="flex-1 bg-[#FAF9F6] border border-[#E8E4DF] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#2D2926] placeholder-[#8C847C] focus:outline-none focus:ring-2 focus:ring-[#8BA888]/40 focus:border-[#8BA888] disabled:opacity-50"
                />
                <button
                  id="btn-send-message"
                  type="submit"
                  disabled={!userInputText.trim() || callStage === 'idle' || callStage === 'completed'}
                  className="p-2.5 rounded-full bg-[#2D2926] hover:bg-[#1F1C1A] text-white disabled:opacity-50 transition-all shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

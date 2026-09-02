export type LeadStatus =
  | 'Pending'
  | 'Contacted'
  | 'Interested'
  | 'Not Interested'
  | 'No Answer'
  | 'Meeting Scheduled'
  | 'Do Not Contact'
  | 'Invalid Number';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: LeadStatus;
  callResult: string;
  meetingDate: string;
  meetingTime: string;
  notes: string;
  lastCalled: string;
}

export interface CalendarSlot {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "11:00 AM", "3:00 PM"
  dateTimeIso: string;
  available: boolean;
  bookedBy?: string;
  leadEmail?: string;
  title?: string;
  meetLink?: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  timestamp: string;
  actionTaken?: string;
}

export type CallStage =
  | 'idle'
  | 'dialing'
  | 'connected'
  | 'speaking'
  | 'listening'
  | 'processing'
  | 'booking'
  | 'completed'
  | 'failed';

export interface AgentSettings {
  companyName: string;
  serviceDescription: string;
  agentName: string;
  voiceName: string;
  speechRate: number;
  pitch: number;
  temperature: number;
  interruptible: boolean;
  maxCallDurationSeconds: number;
  customSystemPrompt?: string;
}

export interface CallSummaryResult {
  status: LeadStatus;
  callResult: string;
  notes: string;
  meetingScheduled: boolean;
  meetingDate?: string;
  meetingTime?: string;
  doNotContact: boolean;
}

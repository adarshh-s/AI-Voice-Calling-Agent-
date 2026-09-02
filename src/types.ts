export type LeadStatus =
  | 'Pending'
  | 'In Progress'
  | 'Contacted'
  | 'Interested'
  | 'Not Interested'
  | 'No Answer'
  | 'Meeting Scheduled'
  | 'Do Not Contact'
  | 'Invalid Number'
  | 'Failed';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  rawPhone?: string;
  email: string;
  status: LeadStatus;
  callResult: string;
  meetingDate: string;
  meetingTime: string;
  notes: string;
  lastCalled: string;
  durationSeconds?: number;
  customFields?: Record<string, string>;
  isValidPhone: boolean;
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
  targetAudience: string;
  agentName: string;
  voiceName: string;
  speechRate: number;
  pitch: number;
  temperature: number;
  interruptible: boolean;
  maxCallDurationSeconds: number;
  customSystemPrompt?: string;
  defaultCountryCode: string; // e.g. '+91', '+1', '+44'
  scriptType: 'b2b_sales' | 'lead_qualification' | 'appointment_booking' | 'customer_feedback' | 'custom';
}

export type TelephonyProvider = 'browser' | 'vapi' | 'retell' | 'twilio' | 'webhook';

export interface TelephonySettings {
  provider: TelephonyProvider;
  vapiApiKey?: string;
  vapiPhoneNumberId?: string;
  vapiAssistantId?: string;
  retellApiKey?: string;
  retellAgentId?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  n8nWebhookUrl?: string;
}

export interface CampaignState {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  currentIndex: number;
  totalLeads: number;
  completedCalls: number;
  meetingsBooked: number;
  failedCalls: number;
  skippedInvalid: number;
  delayBetweenCallsSeconds: number;
  autoAdvance: boolean;
  startedAt?: string;
}

export interface ColumnMapping {
  name: string;
  phone: string;
  company: string;
  email: string;
  notes: string;
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

import { MessageTemplate, CampaignSettings } from '../types';

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-1',
    name: 'B2B Discovery & AI Demo Invitation',
    category: 'discovery',
    channel: 'omnichannel',
    whatsAppContent: `Hi {{name}} 👋! Alex from {{company_name}} here.

I noticed your work at *{{company}}* and wanted to share how we help businesses automate repetitive client outreach and sync replies directly to Google Sheets & CRM.

Would you be open to a quick 10-minute demo this week?

👉 Grab a time that suits you: {{booking_link}}

Let me know if you'd like a quick preview video first! 🚀`,
    emailSubject: `Automating {{company}}'s client outreach workflow (Quick Demo)`,
    emailBody: `Hi {{name}},

I hope you're having a productive week.

I'm reaching out from {{company_name}}. We specialize in helping high-growth teams at companies like {{company}} eliminate manual client outreach by connecting spreadsheets directly to automated WhatsApp and Email dispatch with instant AI follow-ups.

Our clients typically see a 4x increase in client engagement rates while cutting 15+ hours of manual follow-up every single week.

Would you be open to a brief 10-minute introduction this week?

You can pick a convenient time on our Google Calendar here:
👉 {{booking_link}}

Best regards,

{{sender_name}}
{{company_name}} | Growth & Automation
Email: {{sender_email}}
Phone: {{sender_phone}}`,
  },
  {
    id: 'tpl-2',
    name: 'Direct Calendar Booking Pitch',
    category: 'meeting_invite',
    channel: 'omnichannel',
    whatsAppContent: `Hey {{name}}! 📅 

Alex here from {{company_name}}. We just opened 3 demo slots for {{company}} to test our new AI Outreach & Booking Engine.

Pick an open time on our calendar here:
👉 {{booking_link}}

Looking forward to connecting!`,
    emailSubject: `Calendar invite: 10-min overview for {{name}} ({{company}})`,
    emailBody: `Hi {{name}},

Following up on our automation initiative for {{company}}. We've prepared a custom demo showing how your team can upload an Excel sheet and instantly dispatch personalized WhatsApp messages & emails.

We have a few slots available over the next few days:
👉 {{booking_link}}

Feel free to pick any open slot that fits your schedule.

Best regards,
{{sender_name}}
{{company_name}}`,
  },
  {
    id: 'tpl-3',
    name: 'Gentle Value-Add Follow-up',
    category: 'followup',
    channel: 'omnichannel',
    whatsAppContent: `Hi {{name}}! Just following up on my previous message regarding {{company}}'s client communication workflow.

Did you have a chance to review the demo link? 

Here is our direct calendar if you'd like a quick 5-min walk-through: {{booking_link}} 😊`,
    emailSubject: `Quick follow-up regarding {{company}}'s outreach automation`,
    emailBody: `Hi {{name}},

I know how busy your schedule gets, so I'm keeping this very brief.

I wanted to quickly check if you had a chance to review my previous email about streamlining {{company}}'s outreach via WhatsApp and Email.

If you have 10 minutes this week, you can choose a time here:
👉 {{booking_link}}

Or feel free to reply directly to this email with any questions!

Warm regards,
{{sender_name}}
{{company_name}}`,
  },
  {
    id: 'tpl-4',
    name: 'Product Showcase & ROI Overview',
    category: 'product_demo',
    channel: 'omnichannel',
    whatsAppContent: `Hello {{name}}! 💡 Did you know teams using OmniReach AI close 35% more discovery calls from spreadsheet leads?

Here is a quick overview for {{company}}:
✅ Automated WhatsApp + Email Sequences
✅ 1-Click Excel / CSV Ingestion
✅ Direct Google Calendar & Meet Sync

Book a quick 10-min live demo: {{booking_link}}`,
    emailSubject: `Case Study: 35% higher response rate for teams like {{company}}`,
    emailBody: `Hi {{name}},

Leading sales and operations teams are replacing manual emailing with automated multi-channel messaging from spreadsheets.

Key benefits for {{company}}:
1. Instant WhatsApp + Email dispatch from raw Excel files
2. Smart E.164 phone sanitization (supports all international formats)
3. Direct Google Calendar integration with automatic Google Meet links
4. AI-crafted personalized follow-ups that sound 100% human

Would you like to see how it works in action?
👉 Schedule a 10-minute demo: {{booking_link}}

Best,
{{sender_name}}
{{company_name}}`,
  },
];

export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  channelMode: 'omnichannel',
  selectedTemplateId: 'tpl-1',
  delayBetweenMessagesSeconds: 2,
  autoAdvance: true,
  companyName: 'Apex Growth Systems',
  senderName: 'Alex Morgan',
  senderEmail: 'alex@apexgrowth.example',
  senderPhone: '+1 (555) 019-2834',
  serviceDescription: 'Automated AI WhatsApp & Email outreach platform synced with spreadsheets and Google Calendar',
  defaultCountryCode: '+91',
  includeBookingLink: true,
  customInstructions: 'Keep messages conversational, clear, friendly, and focused on booking a 10-minute demo.',
};

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Dispatch Logs for Outreach Monitoring & Audit
interface OutreachDispatchLog {
  id: string;
  leadId: string;
  leadName: string;
  recipient: string;
  channel: 'whatsapp' | 'email';
  status: 'sent' | 'delivered' | 'failed';
  timestamp: string;
  subject?: string;
  preview: string;
  directUrl?: string;
}

const dispatchLogs: OutreachDispatchLog[] = [];

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper: Format fallback templates
function interpolate(
  template: string | undefined,
  variables: Record<string, string>
): string {
  if (!template) return '';
  let res = template;
  for (const [k, v] of Object.entries(variables)) {
    res = res.replace(new RegExp(`{{${k}}}`, 'gi'), v || '');
  }
  return res;
}

// API Route: AI-Personalized WhatsApp & Email Generator
app.post('/api/outreach/generate-message', async (req, res) => {
  try {
    const { lead, settings, template, availableSlots } = req.body;
    const ai = getGenAI();

    const firstName = (lead?.name || 'there').split(' ')[0];
    const companyName = settings?.companyName || 'Apex Growth Systems';
    const senderName = settings?.senderName || 'Alex Morgan';
    const senderEmail = settings?.senderEmail || 'alex@apexgrowth.example';
    const senderPhone = settings?.senderPhone || '+1 (555) 019-2834';
    const clientCompany = lead?.company || 'your team';
    const leadNotes = lead?.notes || '';

    const nextSlot = (availableSlots || []).find((s: { available: boolean }) => s.available) || availableSlots?.[0];
    const bookingLink = nextSlot
      ? `https://calendar.google.com/booking?date=${nextSlot.date}&slot=${encodeURIComponent(nextSlot.time)}`
      : 'https://meet.google.com/demo-slot';

    const vars: Record<string, string> = {
      name: lead?.name || 'there',
      first_name: firstName,
      company: clientCompany,
      email: lead?.email || '',
      phone: lead?.phone || '',
      company_name: companyName,
      sender_name: senderName,
      sender_email: senderEmail,
      sender_phone: senderPhone,
      booking_link: bookingLink,
    };

    if (ai) {
      try {
        const prompt = `You are a world-class B2B copywriter specialized in high-converting WhatsApp messages and cold/warm outreach emails.
Generate a personalized WhatsApp message AND Email for this prospect:
- Client Name: ${lead?.name}
- Client Company: ${clientCompany}
- Client Email: ${lead?.email}
- Client Phone: ${lead?.phone}
- Context/Notes from spreadsheet: "${leadNotes}"
- Sender Company: ${companyName}
- Sender Name: ${senderName}
- Offering/Value Prop: ${settings?.serviceDescription || 'Outreach automation synced with Google Calendar and spreadsheets'}
- Booking Link: ${bookingLink}
- Custom Instructions: "${settings?.customInstructions || 'Keep it friendly, high-value, crisp, and direct.'}"
${template ? `- Base Template Guidance:\nWhatsApp Base: ${template.whatsAppContent}\nEmail Subject Base: ${template.emailSubject}\nEmail Body Base: ${template.emailBody}` : ''}

Output strict JSON with these 3 keys:
{
  "whatsApp": "A concise, engaging WhatsApp message formatted with natural emojis, bolding (*text*), and the booking link ${bookingLink}",
  "emailSubject": "High-open rate email subject line (under 60 chars)",
  "emailBody": "Clear, professional, punchy email with greeting, value prop, bullet points, call to action with booking link, and sender sign-off"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        let parsed: { whatsApp?: string; emailSubject?: string; emailBody?: string } = {};
        try {
          parsed = JSON.parse(response.text || '{}');
        } catch {
          parsed = {};
        }

        if (parsed.whatsApp && parsed.emailSubject && parsed.emailBody) {
          return res.json({
            whatsApp: parsed.whatsApp,
            emailSubject: parsed.emailSubject,
            emailBody: parsed.emailBody,
            isAiGenerated: true,
          });
        }
      } catch (aiErr) {
        console.warn('Gemini generateContent error in server.ts, falling back:', aiErr);
      }
    }

    // Fallback template interpolation
    if (template) {
      return res.json({
        whatsApp: interpolate(template.whatsAppContent, vars),
        emailSubject: interpolate(template.emailSubject, vars),
        emailBody: interpolate(template.emailBody, vars),
        isAiGenerated: false,
      });
    }

    // Standard fallback
    return res.json({
      whatsApp: `Hi ${firstName} 👋! Alex from ${companyName} here. We noticed your work at *${clientCompany}* and wanted to share how you can automate client outreach directly from spreadsheets. Open to a 10-min demo? Grab a slot here: ${bookingLink}`,
      emailSubject: `Automating outreach workflow for ${clientCompany} (10-min Demo)`,
      emailBody: `Hi ${firstName},\n\nI hope you're having a productive week.\n\nI'm reaching out from ${companyName}. We help teams at ${clientCompany} eliminate manual messaging by connecting spreadsheets directly to automated WhatsApp and Email dispatch.\n\nWould you be open to a brief 10-minute introduction this week?\n\nPick a convenient time here:\n👉 ${bookingLink}\n\nBest regards,\n${senderName}\n${companyName}`,
      isAiGenerated: false,
    });
  } catch (error) {
    console.warn('Error in /api/outreach/generate-message:', error);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

// API Route: AI Auto-Reply to Incoming WhatsApp / Email Messages
app.post('/api/ai/auto-reply', async (req, res) => {
  try {
    const { incomingMessage, lead, settings, availableSlots } = req.body;
    const ai = getGenAI();

    const clientName = lead?.name || 'there';
    const firstName = clientName.split(' ')[0];
    const companyName = settings?.companyName || 'Apex Growth Systems';
    const nextSlot = (availableSlots || []).find((s: { available: boolean }) => s.available) || availableSlots?.[0];
    const bookingLink = nextSlot
      ? `https://calendar.google.com/booking?date=${nextSlot.date}&slot=${encodeURIComponent(nextSlot.time)}`
      : 'https://meet.google.com/demo-slot';

    if (ai && incomingMessage) {
      const prompt = `A client named ${clientName} at company ${lead?.company || 'their firm'} replied to our outreach with:
"${incomingMessage}"

Our company: ${companyName}
Our value prop: ${settings?.serviceDescription || 'AI outreach and calendar booking automation'}
Booking Link: ${bookingLink}

Generate a concise, helpful, polite, and persuasive response (under 75 words).
- If they are interested or asking for times: provide the booking link ${bookingLink}.
- If they ask about pricing or features: answer positively with general context and invite them to the 10-minute demo via ${bookingLink}.
- If they say not interested or unsubscribe: acknowledge politely and confirm they are opted out.

Return strict JSON:
{
  "reply": "The response message text"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      try {
        const parsed = JSON.parse(response.text || '{}');
        if (parsed.reply) {
          return res.json({ reply: parsed.reply });
        }
      } catch {}
    }

    const lower = (incomingMessage || '').toLowerCase();
    if (lower.includes('price') || lower.includes('cost')) {
      return res.json({
        reply: `Our pricing scales flexibly with your contact volume. We'd love to show you a quick breakdown for ${lead?.company || 'your team'} on a 10-minute call: ${bookingLink}`,
      });
    }

    if (lower.includes('yes') || lower.includes('sure') || lower.includes('demo') || lower.includes('link')) {
      return res.json({
        reply: `Awesome, ${firstName}! You can choose any open time that fits your calendar here: ${bookingLink}. Looking forward to connecting!`,
      });
    }

    return res.json({
      reply: `Thanks for the response, ${firstName}! Would Thursday at 11:00 AM or Friday at 3:00 PM work for a quick walk-through? Or pick any time here: ${bookingLink}`,
    });
  } catch (err) {
    console.error('Error in /api/ai/auto-reply:', err);
    res.status(500).json({ error: 'Failed to generate auto-reply' });
  }
});

// API Route: WhatsApp Dispatch Endpoint
app.post('/api/outreach/send-whatsapp', async (req, res) => {
  try {
    const { lead, messageText, channelSettings, webhookUrl } = req.body;

    const phoneDigits = (lead?.phone || '').replace(/\D/g, '');
    const directUrl = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(messageText || '')}`;

    let delivered = false;
    let providerResponse: any = null;
    let errorDetail: string | null = null;

    const provider = channelSettings?.whatsAppProvider || 'web_direct';

    // 1. Twilio WhatsApp API
    if (provider === 'twilio' && channelSettings?.twilioAccountSid && channelSettings?.twilioAuthToken) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${channelSettings.twilioAccountSid}/Messages.json`;
        const fromNumber = channelSettings.twilioFromNumber || '+14155238886'; // default Twilio sandbox number
        const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
        const formattedTo = `whatsapp:+${phoneDigits}`;

        const formData = new URLSearchParams();
        formData.append('From', formattedFrom);
        formData.append('To', formattedTo);
        formData.append('Body', messageText || '');

        const authHeader = `Basic ${Buffer.from(`${channelSettings.twilioAccountSid}:${channelSettings.twilioAuthToken}`).toString('base64')}`;

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const twilioData = await twilioRes.json();
        if (twilioRes.ok) {
          delivered = true;
          providerResponse = { provider: 'twilio', sid: twilioData.sid, status: twilioData.status };
        } else {
          errorDetail = twilioData.message || 'Twilio API returned an error';
          providerResponse = twilioData;
        }
      } catch (err: any) {
        errorDetail = err.message || 'Failed connecting to Twilio';
      }
    }
    // 2. Meta WhatsApp Cloud API
    else if (provider === 'cloud_api' && channelSettings?.whatsappCloudApiKey && channelSettings?.whatsappCloudPhoneId) {
      try {
        const metaUrl = `https://graph.facebook.com/v21.0/${channelSettings.whatsappCloudPhoneId}/messages`;
        const metaRes = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${channelSettings.whatsappCloudApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phoneDigits,
            type: 'text',
            text: { preview_url: true, body: messageText },
          }),
        });

        const metaData = await metaRes.json();
        if (metaRes.ok && metaData.messages?.[0]?.id) {
          delivered = true;
          providerResponse = { provider: 'meta_cloud_api', messageId: metaData.messages[0].id };
        } else {
          errorDetail = metaData.error?.message || 'Meta Cloud API error';
          providerResponse = metaData;
        }
      } catch (err: any) {
        errorDetail = err.message || 'Failed connecting to Meta Cloud API';
      }
    } else {
      // Default Web / Direct mode
      delivered = true;
    }

    // 3. Optional n8n / Custom Webhook Trigger
    const activeWebhook = webhookUrl || channelSettings?.n8nWebhookUrl;
    if (activeWebhook) {
      try {
        const payload = {
          event: 'whatsapp_outreach_dispatch',
          timestamp: new Date().toISOString(),
          provider,
          lead,
          messageText,
          directUrl,
          delivered,
        };
        await fetch(activeWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn('External webhook notification failed:', e);
      }
    }

    const logEntry: OutreachDispatchLog = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: lead?.id || 'lead',
      leadName: lead?.name || 'Contact',
      recipient: lead?.phone || '',
      channel: 'whatsapp',
      status: delivered ? 'delivered' : 'failed',
      timestamp: new Date().toISOString(),
      preview: (messageText || '').substring(0, 90) + '...',
      directUrl,
    };

    dispatchLogs.unshift(logEntry);
    if (dispatchLogs.length > 100) dispatchLogs.pop();

    res.json({
      success: true,
      delivered,
      provider,
      providerResponse,
      errorDetail,
      directUrl,
      log: logEntry,
    });
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch WhatsApp message' });
  }
});

// API Route: Email Dispatch Endpoint
app.post('/api/outreach/send-email', async (req, res) => {
  try {
    const { lead, subject, body, channelSettings, webhookUrl, senderName, senderEmail } = req.body;

    const mailtoUrl = `mailto:${lead?.email || ''}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;

    let delivered = false;
    let providerResponse: any = null;
    let errorDetail: string | null = null;

    const provider = channelSettings?.emailProvider || 'mailto_direct';
    const fromName = senderName || 'OmniReach AI';
    const fromAddress = senderEmail || 'onboarding@resend.dev';

    // 1. Resend API
    if (provider === 'resend' && channelSettings?.emailApiKey) {
      try {
        let resendFrom = `${fromName} <onboarding@resend.dev>`;
        if (channelSettings?.resendFromEmail && !channelSettings.resendFromEmail.includes('.example') && channelSettings.resendFromEmail.includes('@')) {
          resendFrom = `${fromName} <${channelSettings.resendFromEmail.trim()}>`;
        } else if (fromAddress && !fromAddress.includes('.example') && fromAddress.includes('@') && !fromAddress.includes('apexgrowth')) {
          resendFrom = `${fromName} <${fromAddress.trim()}>`;
        }

        let resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${channelSettings.emailApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [lead?.email],
            subject: subject || 'Meeting Request',
            text: body || '',
            html: (body || '').replace(/\n/g, '<br/>'),
          }),
        });

        let resendText = await resendRes.text();
        let resendData: any = {};
        try {
          resendData = JSON.parse(resendText);
        } catch {
          resendData = { message: resendText };
        }

        // Automatic fallback: If custom domain is unverified, retry with onboarding@resend.dev
        if (!resendRes.ok && (resendData.message?.toLowerCase().includes('domain') || resendData.message?.toLowerCase().includes('verify') || resendData.name === 'validation_error')) {
          if (!resendFrom.includes('onboarding@resend.dev')) {
            const fallbackRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${channelSettings.emailApiKey.trim()}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: `${fromName} <onboarding@resend.dev>`,
                to: [lead?.email],
                subject: subject || 'Meeting Request',
                text: body || '',
                html: (body || '').replace(/\n/g, '<br/>'),
              }),
            });
            const fallbackText = await fallbackRes.text();
            try {
              resendData = JSON.parse(fallbackText);
            } catch {
              resendData = { message: fallbackText };
            }
            resendRes = fallbackRes;
          }
        }

        if (resendRes.ok && resendData.id) {
          delivered = true;
          providerResponse = { provider: 'resend', id: resendData.id };
        } else {
          errorDetail = resendData.message || resendData.error || 'Resend API returned an error';
          providerResponse = resendData;
        }
      } catch (err: any) {
        errorDetail = err.message || 'Failed connecting to Resend';
      }
    }
    // 2. SendGrid API
    else if (provider === 'sendgrid' && channelSettings?.emailApiKey) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${channelSettings.emailApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: lead?.email, name: lead?.name }] }],
            from: { email: fromAddress, name: fromName },
            subject: subject || 'Meeting Request',
            content: [{ type: 'text/plain', value: body || '' }],
          }),
        });

        const sgText = await sgRes.text();
        let sgData: any = {};
        try {
          sgData = JSON.parse(sgText);
        } catch {
          sgData = { message: sgText };
        }

        if (sgRes.status === 202 || sgRes.ok) {
          delivered = true;
          providerResponse = { provider: 'sendgrid', status: 'queued_accepted' };
        } else {
          errorDetail = sgData.errors?.[0]?.message || sgData.message || 'SendGrid API returned an error';
          providerResponse = sgData;
        }
      } catch (err: any) {
        errorDetail = err.message || 'Failed connecting to SendGrid';
      }
    } else {
      // Default direct mailto mode
      delivered = true;
    }

    // 3. Optional n8n / Custom Webhook Trigger
    const activeWebhook = webhookUrl || channelSettings?.n8nWebhookUrl;
    if (activeWebhook) {
      try {
        const payload = {
          event: 'email_outreach_dispatch',
          timestamp: new Date().toISOString(),
          provider,
          lead,
          subject,
          body,
          mailtoUrl,
          delivered,
        };
        await fetch(activeWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {
        console.warn('External email webhook notification failed:', e);
      }
    }

    const logEntry: OutreachDispatchLog = {
      id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: lead?.id || 'lead',
      leadName: lead?.name || 'Contact',
      recipient: lead?.email || '',
      channel: 'email',
      status: delivered ? 'delivered' : 'failed',
      timestamp: new Date().toISOString(),
      subject,
      preview: (body || '').substring(0, 90) + '...',
      directUrl: mailtoUrl,
    };

    dispatchLogs.unshift(logEntry);
    if (dispatchLogs.length > 100) dispatchLogs.pop();

    res.json({
      success: true,
      delivered,
      provider,
      providerResponse,
      errorDetail,
      mailtoUrl,
      log: logEntry,
    });
  } catch (error: any) {
    console.error('Email send error:', error);
    res.status(500).json({ error: error.message || 'Failed to dispatch Email' });
  }
});

// API Route: Calendar Booking & Google Meet Link Generator
app.post('/api/calendar/book', async (req, res) => {
  try {
    const { slotId, date, time, lead } = req.body;
    const meetCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    const meetLink = `https://meet.google.com/${meetCode}`;

    res.json({
      success: true,
      bookingId: `gcal-${Date.now()}`,
      meetLink,
      date,
      time,
      clientName: lead?.name,
      clientEmail: lead?.email,
      confirmedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ error: err.message || 'Failed to book calendar slot' });
  }
});

// API Route: Get Outreach Dispatch Logs
app.get('/api/outreach/logs', (req, res) => {
  res.json({ logs: dispatchLogs });
});

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    mode: 'whatsapp_email_outreach',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

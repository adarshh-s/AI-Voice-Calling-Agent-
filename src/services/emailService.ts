// Direct client/edge email sender compatible with Vercel and static hosting
import { ChannelApiSettings, Lead } from '../types';

export interface SendEmailPayload {
  lead: Partial<Lead> & { email: string; name?: string };
  subject: string;
  body: string;
  channelSettings: ChannelApiSettings;
  senderName?: string;
  senderEmail?: string;
}

export interface SendEmailResult {
  success: boolean;
  delivered: boolean;
  provider: string;
  providerResponse?: any;
  errorDetail?: string;
}

export async function sendEmailDirectOrBackend(payload: SendEmailPayload): Promise<SendEmailResult> {
  const { lead, subject, body, channelSettings, senderName = 'OmniReach AI', senderEmail } = payload;
  const provider = channelSettings?.emailProvider || 'mailto_direct';
  const apiKey = (channelSettings?.emailApiKey || '').trim();

  // Try server endpoint first (for full-stack / Node hosting)
  try {
    const res = await fetch('/api/outreach/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const raw = await res.text();
      try {
        const data = JSON.parse(raw);
        // If server successfully processed it
        if (data && (data.delivered !== undefined || data.success)) {
          return data;
        }
      } catch {
        // Fall through to client direct delivery
      }
    }
  } catch {
    // If backend route returned 404 (e.g. on Vercel static export), proceed with client fallback
  }

  // Client-Side direct dispatch (Essential for Vercel static deployments / Serverless without server.ts)
  if (provider === 'resend') {
    if (!apiKey) {
      return {
        success: false,
        delivered: false,
        provider: 'resend',
        errorDetail: 'Please enter your Resend API Key in Settings.',
      };
    }

    try {
      const fromAddr = senderEmail && senderEmail.includes('@') && !senderEmail.includes('@resend.dev')
        ? `${senderName} <${senderEmail}>`
        : `${senderName} <onboarding@resend.dev>`;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [lead.email],
          subject: subject || 'Outreach from OmniReach AI',
          text: body || '',
        }),
      });

      const raw = await resendRes.text();
      let resendData: any = {};
      try {
        resendData = JSON.parse(raw);
      } catch {
        resendData = { message: raw };
      }

      if (resendRes.ok && (resendData.id || resendRes.status === 200 || resendRes.status === 201)) {
        return {
          success: true,
          delivered: true,
          provider: 'resend',
          providerResponse: resendData,
        };
      }

      return {
        success: false,
        delivered: false,
        provider: 'resend',
        errorDetail: resendData.message || resendData.error || 'Resend error. Check your API key or verified domain.',
        providerResponse: resendData,
      };
    } catch (err: any) {
      return {
        success: false,
        delivered: false,
        provider: 'resend',
        errorDetail: err.message || 'Direct connection to Resend API failed.',
      };
    }
  }

  if (provider === 'sendgrid') {
    if (!apiKey) {
      return {
        success: false,
        delivered: false,
        provider: 'sendgrid',
        errorDetail: 'Please enter your SendGrid API Key in Settings.',
      };
    }

    try {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: lead.email }] }],
          from: { email: senderEmail || 'noreply@example.com', name: senderName },
          subject: subject || 'Outreach',
          content: [{ type: 'text/plain', value: body || '' }],
        }),
      });

      if (sgRes.status === 202 || sgRes.ok) {
        return {
          success: true,
          delivered: true,
          provider: 'sendgrid',
          providerResponse: { status: 'queued' },
        };
      }

      const raw = await sgRes.text();
      let sgData: any = {};
      try {
        sgData = JSON.parse(raw);
      } catch {
        sgData = { message: raw };
      }

      return {
        success: false,
        delivered: false,
        provider: 'sendgrid',
        errorDetail: sgData.errors?.[0]?.message || sgData.message || 'SendGrid error',
        providerResponse: sgData,
      };
    } catch (err: any) {
      return {
        success: false,
        delivered: false,
        provider: 'sendgrid',
        errorDetail: err.message || 'Direct SendGrid request failed',
      };
    }
  }

  // Webhook / n8n
  if (provider === 'webhook' && channelSettings.n8nWebhookUrl) {
    try {
      const hookRes = await fetch(channelSettings.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return {
        success: true,
        delivered: hookRes.ok,
        provider: 'webhook',
      };
    } catch (err: any) {
      return {
        success: false,
        delivered: false,
        provider: 'webhook',
        errorDetail: err.message,
      };
    }
  }

  // Default mailto fallback
  return {
    success: true,
    delivered: false,
    provider: 'mailto_direct',
  };
}

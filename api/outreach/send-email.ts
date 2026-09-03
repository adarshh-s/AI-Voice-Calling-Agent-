interface ApiRequest {
  method?: string;
  body?: any;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lead, subject, body, channelSettings, webhookUrl, senderName, senderEmail } = req.body || {};

    const mailtoUrl = `mailto:${lead?.email || ''}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;

    let delivered = false;
    let providerResponse: any = null;
    let errorDetail: string | null = null;

    const provider = channelSettings?.emailProvider || 'mailto_direct';
    const apiKey = (channelSettings?.emailApiKey || process.env.RESEND_API_KEY || '').trim();
    const fromName = senderName || 'OmniReach AI';
    const fromAddress = senderEmail || 'onboarding@resend.dev';

    // 1. Resend API
    if (provider === 'resend' && apiKey) {
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
            Authorization: `Bearer ${apiKey}`,
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
                Authorization: `Bearer ${apiKey}`,
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

        if (resendRes.ok && (resendData.id || resendRes.status === 200 || resendRes.status === 201)) {
          delivered = true;
          providerResponse = { provider: 'resend', id: resendData.id };
        } else {
          errorDetail = resendData.message || resendData.error || 'Resend API error';
          providerResponse = resendData;
        }
      } catch (err: any) {
        errorDetail = err.message || 'Failed connecting to Resend';
      }
    }
    // 2. SendGrid API
    else if (provider === 'sendgrid' && apiKey) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
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
          errorDetail = sgData.errors?.[0]?.message || sgData.message || 'SendGrid API error';
          providerResponse = sgData;
        }
      } catch (err: any) {
        errorDetail = err.message || 'Failed connecting to SendGrid';
      }
    }
    // 3. Webhook Trigger
    else if (provider === 'webhook' && (webhookUrl || channelSettings?.n8nWebhookUrl)) {
      try {
        const targetUrl = webhookUrl || channelSettings?.n8nWebhookUrl;
        const hookRes = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'email_outreach_dispatch',
            timestamp: new Date().toISOString(),
            lead,
            subject,
            body,
          }),
        });
        delivered = hookRes.ok;
        providerResponse = { status: hookRes.status };
      } catch (err: any) {
        errorDetail = err.message || 'Webhook trigger failed';
      }
    } else {
      delivered = false;
      if (provider === 'resend' || provider === 'sendgrid') {
        errorDetail = 'API key is missing. Please enter your API key in Settings.';
      }
    }

    const logEntry = {
      id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      leadId: lead?.id || 'lead',
      leadName: lead?.name || 'Contact',
      recipient: lead?.email || '',
      channel: 'email',
      status: delivered ? 'delivered' : 'failed',
      timestamp: new Date().toISOString(),
      subject: subject || 'Outreach',
      preview: (body || '').substring(0, 90) + '...',
      directUrl: mailtoUrl,
    };

    return res.status(200).json({
      success: true,
      delivered,
      provider,
      providerResponse,
      errorDetail,
      mailtoUrl,
      log: logEntry,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      delivered: false,
      error: error.message || 'Failed to dispatch email',
      errorDetail: error.message,
    });
  }
}

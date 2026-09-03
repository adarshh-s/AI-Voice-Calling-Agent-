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
    const { lead, messageText, channelSettings, webhookUrl } = req.body || {};
    const phoneDigits = (lead?.phone || '').replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(messageText || '');
    const directUrl = `https://wa.me/${phoneDigits}?text=${encodedText}`;

    let delivered = false;
    let providerResponse: any = null;
    let errorDetail: string | null = null;

    const provider = channelSettings?.whatsappProvider || 'web_direct';

    // 1. Twilio WhatsApp
    if (provider === 'twilio' && channelSettings?.twilioAccountSid && channelSettings?.twilioAuthToken) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${channelSettings.twilioAccountSid}/Messages.json`;
        const fromNumber = channelSettings.twilioFromNumber || '+14155238886';
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

    const logEntry = {
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

    return res.status(200).json({
      success: true,
      delivered,
      provider,
      providerResponse,
      errorDetail,
      directUrl,
      log: logEntry,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || 'Failed to dispatch WhatsApp message',
    });
  }
}

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function isConfigured() {
  return Boolean(WEBHOOK_URL);
}

async function sendEmbed({ title, description, fields = [], footer, url }) {
  if (!WEBHOOK_URL) {
    return { ok: false, error: 'DISCORD_WEBHOOK_URL is not configured on the server.' };
  }
  const payload = {
    embeds: [
      {
        title,
        description,
        color: 0xc77b3c,
        fields,
        footer: footer ? { text: footer } : undefined,
        url,
        timestamp: new Date().toISOString(),
      },
    ],
  };
  try {
    const resp = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return { ok: false, error: `Discord responded with ${resp.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function sendContactNotification({ name, email, phone, message }, siteUrl) {
  return sendEmbed({
    title: '🔔 NEW WEBSITE MESSAGE',
    description: `💬 ${message}`,
    fields: [
      { name: '👤 Name', value: name || 'N/A', inline: true },
      { name: '📧 Email', value: email || 'N/A', inline: true },
      { name: '📱 Phone', value: phone || 'N/A', inline: true },
    ],
    footer: '🌐 Source: Portfolio Website',
    url: siteUrl,
  });
}

module.exports = { isConfigured, sendEmbed, sendContactNotification };

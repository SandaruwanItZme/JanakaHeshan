const express = require('express');
const { requireAuth, csrfProtection } = require('../middleware/auth');
const { sendEmbed, isConfigured } = require('../utils/discord');
const { logActivity, notify } = require('../utils/log');

const router = express.Router();

router.get('/status', requireAuth, (req, res) => {
  res.json({ configured: isConfigured() });
});

router.post('/test', requireAuth, csrfProtection, async (req, res) => {
  if (!isConfigured()) {
    return res.status(400).json({ ok: false, error: 'DISCORD_WEBHOOK_URL is not set in .env.' });
  }
  const result = await sendEmbed({
    title: '✅ Test notification',
    description: 'This is a test message from the admin dashboard.',
    fields: [{ name: 'Triggered by', value: req.user.username, inline: true }],
    footer: 'Portfolio admin dashboard',
  });
  await logActivity({
    action: 'Discord webhook test',
    user: req.user.username,
    ip: req.ip,
    result: result.ok ? 'success' : 'failure',
  });
  await notify({
    type: result.ok ? 'discord_success' : 'discord_failure',
    title: result.ok ? 'Discord webhook connected successfully.' : 'Discord webhook failed.',
    body: result.ok ? '' : result.error,
  });
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });
  res.json({ ok: true });
});

module.exports = router;

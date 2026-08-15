const express = require('express');
const rateLimit = require('express-rate-limit');
const { Messages, Settings } = require('../models');
const { sendContactNotification } = require('../utils/discord');
const { notify, logActivity } = require('../utils/log');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' },
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/', contactLimiter, async (req, res) => {
  const settings = Settings.get();
  if (!settings.contactFormEnabled) {
    return res.status(403).json({ error: 'The contact form is currently disabled.' });
  }

  const { name, email, phone, message, company } = req.body || {};

  // Honeypot field — bots fill hidden fields, real visitors never do.
  if (company) return res.json({ ok: true });

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email and message are required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ error: 'Message is too long.' });
  }

  const saved = await Messages.create({
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    phone: phone ? String(phone).slice(0, 50) : '',
    message: String(message).slice(0, 5000),
    status: 'NEW',
    discordSent: false,
  });

  await notify({ type: 'message', title: 'New contact message', body: `From ${name}` });

  if (settings.discordNotificationsEnabled) {
    const result = await sendContactNotification(
      { name, email, phone, message },
      req.protocol + '://' + req.get('host')
    );
    await Messages.update(saved.id, { discordSent: result.ok });
    await notify({
      type: result.ok ? 'discord_success' : 'discord_failure',
      title: result.ok ? 'Discord notification sent' : 'Discord notification failed',
      body: result.ok ? `Message from ${name}` : result.error,
    });
    await logActivity({
      action: 'Discord contact notification',
      user: 'system',
      ip: req.ip,
      result: result.ok ? 'success' : 'failure',
    });
  }

  res.json({ ok: true });
});

module.exports = router;

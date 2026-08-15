const express = require('express');
const { Settings } = require('../models');
const { requireAuth, csrfProtection } = require('../middleware/auth');
const { logActivity } = require('../utils/log');
const { isConfigured } = require('../utils/discord');

const router = express.Router();

// Public: only the flags the live site needs to render correctly.
router.get('/public', (req, res) => {
  const s = Settings.get();
  res.json({
    siteTitle: s.siteTitle,
    siteDescription: s.siteDescription,
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
    maintenanceMode: s.maintenanceMode,
    contactFormEnabled: s.contactFormEnabled,
    analyticsEnabled: s.analyticsEnabled,
    showProjects: s.showProjects,
    showSocialLinks: s.showSocialLinks,
    showResumeButton: s.showResumeButton,
    theme: s.theme,
    accentColor: s.accentColor,
    animationIntensity: s.animationIntensity,
  });
});

router.get('/', requireAuth, (req, res) => {
  res.json({ ...Settings.get(), discordConfigured: isConfigured() });
});

router.put('/', requireAuth, csrfProtection, async (req, res) => {
  const body = { ...(req.body || {}) };
  // Discord webhook URL is never accepted from the client — env-only.
  delete body.discordWebhookUrl;
  const updated = await Settings.set(body);
  await logActivity({ action: 'Updated settings', user: req.user.username, ip: req.ip });
  res.json(updated);
});

module.exports = router;

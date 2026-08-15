const express = require('express');
const rateLimit = require('express-rate-limit');
const { AnalyticsEvents, Settings } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { parseUA } = require('../utils/ua');

const router = express.Router();

const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

router.post('/track', trackLimiter, async (req, res) => {
  const settings = Settings.get();
  if (!settings.analyticsEnabled) return res.json({ ok: true });
  const { path: pagePath, referrer } = req.body || {};
  const { device, browser, os } = parseUA(req.headers['user-agent']);
  await AnalyticsEvents.create({
    path: (pagePath || '/').slice(0, 200),
    referrer: (referrer || '').slice(0, 300),
    device,
    browser,
    os,
  });
  res.json({ ok: true });
});

router.get('/summary', requireAuth, (req, res) => {
  const events = AnalyticsEvents.all();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay.getTime() - 6 * 86400000);
  const startOfMonth = new Date(startOfDay.getTime() - 29 * 86400000);

  const count = (since) => events.filter((e) => new Date(e.createdAt) >= since).length;
  const tally = (key) => {
    const map = {};
    for (const e of events) map[e[key]] = (map[e[key]] || 0) + 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  };

  res.json({
    totalVisitors: events.length,
    today: count(startOfDay),
    week: count(startOfWeek),
    month: count(startOfMonth),
    popularPages: tally('path'),
    referrers: tally('referrer'),
    devices: tally('device'),
    browsers: tally('browser'),
    operatingSystems: tally('os'),
  });
});

module.exports = router;

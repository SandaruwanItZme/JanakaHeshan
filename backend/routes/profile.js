const express = require('express');
const { Profile, About } = require('../models');
const { requireAuth, csrfProtection } = require('../middleware/auth');
const { logActivity } = require('../utils/log');

const router = express.Router();

router.get('/', (req, res) => res.json(Profile.get()));

router.put('/', requireAuth, csrfProtection, async (req, res) => {
  const updated = await Profile.set(req.body || {});
  await logActivity({ action: 'Updated profile', user: req.user.username, ip: req.ip });
  res.json(updated);
});

router.get('/about', (req, res) => res.json(About.get()));

router.put('/about', requireAuth, csrfProtection, async (req, res) => {
  const updated = await About.set(req.body || {});
  await logActivity({ action: 'Updated about section', user: req.user.username, ip: req.ip });
  res.json(updated);
});

module.exports = router;

const express = require('express');
const { Messages } = require('../models');
const { requireAuth, csrfProtection } = require('../middleware/auth');
const { logActivity } = require('../utils/log');

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const all = Messages.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({
    total: all.length,
    unread: all.filter((m) => m.status === 'NEW').length,
    read: all.filter((m) => m.status !== 'NEW').length,
    items: all,
  });
});

router.patch('/:id', csrfProtection, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['NEW', 'READ', 'REPLIED', 'ARCHIVED'];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of ${allowed.join(', ')}` });
  }
  const updated = await Messages.update(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not found.' });
  await logActivity({ action: `Message marked ${status || 'updated'}`, user: req.user.username, ip: req.ip });
  res.json(updated);
});

router.delete('/:id', csrfProtection, async (req, res) => {
  const ok = await Messages.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found.' });
  await logActivity({ action: 'Deleted message', user: req.user.username, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;

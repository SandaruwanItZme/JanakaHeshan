const express = require('express');
const { ActivityLog } = require('../models');
const { Notifications } = require('../utils/log');
const { requireAuth, csrfProtection } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const items = ActivityLog.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items.slice(0, 200));
});

router.get('/notifications', (req, res) => {
  const items = Notifications.all().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ unread: items.filter((n) => !n.read).length, items: items.slice(0, 50) });
});

router.patch('/notifications/:id', csrfProtection, async (req, res) => {
  const updated = await Notifications.update(req.params.id, { read: true });
  if (!updated) return res.status(404).json({ error: 'Not found.' });
  res.json(updated);
});

router.post('/notifications/read-all', csrfProtection, async (req, res) => {
  const items = Notifications.all().map((n) => ({ ...n, read: true }));
  await Notifications.replaceAll(items);
  res.json({ ok: true });
});

module.exports = router;

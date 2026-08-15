const express = require('express');
const { requireAuth, csrfProtection } = require('../middleware/auth');
const { logActivity } = require('../utils/log');

/**
 * Builds a REST router for a store collection.
 * GET routes are public (so the live site can render content).
 * Mutations require an authenticated admin session + CSRF token.
 */
function crudRouter(model, { label, validate } = {}) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json(model.all());
  });

  router.get('/:id', (req, res) => {
    const item = model.get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found.' });
    res.json(item);
  });

  router.post('/', requireAuth, csrfProtection, async (req, res) => {
    const err = validate ? validate(req.body, false) : null;
    if (err) return res.status(400).json({ error: err });
    const item = await model.create(req.body || {});
    await logActivity({ action: `Created ${label}`, user: req.user.username, ip: req.ip });
    res.status(201).json(item);
  });

  router.put('/:id', requireAuth, csrfProtection, async (req, res) => {
    const err = validate ? validate(req.body, true) : null;
    if (err) return res.status(400).json({ error: err });
    const item = await model.update(req.params.id, req.body || {});
    if (!item) return res.status(404).json({ error: 'Not found.' });
    await logActivity({ action: `Updated ${label}`, user: req.user.username, ip: req.ip });
    res.json(item);
  });

  router.delete('/:id', requireAuth, csrfProtection, async (req, res) => {
    const ok = await model.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found.' });
    await logActivity({ action: `Deleted ${label}`, user: req.user.username, ip: req.ip });
    res.json({ ok: true });
  });

  return router;
}

module.exports = crudRouter;

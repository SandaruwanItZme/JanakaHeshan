const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { Users } = require('../models');
const {
  COOKIE_NAME,
  CSRF_COOKIE,
  signToken,
  requireAuth,
  csrfProtection,
  checkLockout,
  recordFailure,
  recordSuccess,
} = require('../middleware/auth');
const { logActivity } = require('../utils/log');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const isProd = process.env.NODE_ENV === 'production';

function setSessionCookies(res, user) {
  const token = signToken({ sub: user.id, username: user.username });
  const csrf = crypto.randomBytes(24).toString('hex');
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 12 * 60 * 60 * 1000,
  });
  // Readable on purpose: double-submit CSRF pattern requires JS to read it.
  res.cookie(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 12 * 60 * 60 * 1000,
  });
  return csrf;
}

router.post('/login', loginLimiter, async (req, res) => {
  const ip = req.ip;
  const { locked, retryAfterMs } = checkLockout(ip);
  if (locked) {
    return res.status(429).json({
      error: `Too many failed attempts. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).`,
    });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = Users.all().find((u) => u.username === username);
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    recordFailure(ip);
    await logActivity({ action: 'Login failed', user: username, ip, result: 'failure' });
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  recordSuccess(ip);
  const csrf = setSessionCookies(res, user);
  await logActivity({ action: 'Login', user: username, ip, result: 'success' });
  res.json({ ok: true, username: user.username, csrfToken: csrf });
});

router.post('/logout', requireAuth, csrfProtection, async (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.clearCookie(CSRF_COOKIE);
  await logActivity({ action: 'Logout', user: req.user.username, ip: req.ip });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.user.username });
});

router.post('/change-password', requireAuth, csrfProtection, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 10) {
    return res.status(400).json({ error: 'New password must be at least 10 characters.' });
  }
  const user = Users.get(req.user.sub);
  if (!user || !(await bcrypt.compare(currentPassword || '', user.passwordHash))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await Users.update(user.id, { passwordHash });
  await logActivity({ action: 'Password changed', user: user.username, ip: req.ip });
  res.json({ ok: true });
});

module.exports = router;

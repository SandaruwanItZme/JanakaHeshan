const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'admin_session';
const CSRF_COOKIE = 'csrf_token';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    '[SECURITY] JWT_SECRET is not set. Set a long random value in your .env before deploying.'
  );
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET || 'insecure-dev-secret-change-me', { expiresIn: '12h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET || 'insecure-dev-secret-change-me');
  } catch {
    return null;
  }
}

/** Requires a valid session cookie. Attaches req.user. */
function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  const decoded = token && verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  req.user = decoded;
  next();
}

/**
 * Double-submit CSRF check for state-changing requests. The login response
 * sets a readable csrf_token cookie; the admin JS must echo it back in the
 * X-CSRF-Token header on every POST/PUT/PATCH/DELETE.
 */
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const header = req.headers['x-csrf-token'];
  const cookie = req.cookies?.[CSRF_COOKIE];
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ error: 'CSRF token missing or invalid.' });
  }
  next();
}

// Simple in-memory login-attempt lockout (per IP). Fine for a single-admin
// low-traffic site; resets on process restart.
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function checkLockout(ip) {
  const rec = attempts.get(ip);
  if (!rec) return { locked: false };
  if (rec.lockUntil && rec.lockUntil > Date.now()) {
    return { locked: true, retryAfterMs: rec.lockUntil - Date.now() };
  }
  return { locked: false };
}

function recordFailure(ip) {
  const rec = attempts.get(ip) || { count: 0, lockUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockUntil = Date.now() + LOCK_MS;
    rec.count = 0;
  }
  attempts.set(ip, rec);
}

function recordSuccess(ip) {
  attempts.delete(ip);
}

module.exports = {
  COOKIE_NAME,
  CSRF_COOKIE,
  signToken,
  verifyToken,
  requireAuth,
  csrfProtection,
  checkLockout,
  recordFailure,
  recordSuccess,
};

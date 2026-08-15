require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { Settings, Users, Skills, Projects, Experience, Education } = require('./models');
const crudRouter = require('./routes/crudFactory');

const app = express();
const SITE_ROOT = path.join(__dirname, '..');

app.set('trust proxy', 1);

app.use(
  helmet({
    // Portfolio pulls in Google Fonts and other external assets — build a
    // real CSP against your exact asset list before relying on this in prod.
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.SITE_ORIGIN ? process.env.SITE_ORIGIN.split(',') : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Generous global limiter as a backstop; individual routes have tighter limits.
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 120 }));

// ---- One-time bootstrap: create the first admin user from env if none exists.
async function ensureAdminUser() {
  const bcrypt = require('bcryptjs');
  if (Users.all().length > 0) return;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.warn(
      '[setup] No admin user exists yet and ADMIN_USERNAME/ADMIN_PASSWORD are not set in .env — ' +
        'set them and restart to create the first admin account.'
    );
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await Users.create({ username, passwordHash });
  console.log(`[setup] Created initial admin user "${username}". You can now log in at /admin.`);
}
ensureAdminUser();

// ---- API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/skills', crudRouter(Skills, { label: 'skill' }));
app.use('/api/projects', crudRouter(Projects, { label: 'project' }));
app.use('/api/experience', crudRouter(Experience, { label: 'experience entry' }));
app.use('/api/education', crudRouter(Education, { label: 'education entry' }));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/discord', require('./routes/discord'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/contact', require('./routes/contact'));

// ---- Maintenance mode gate for the public site only (never blocks /api or
// /admin, so the admin can always log in and turn maintenance mode back off).
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) return next();
  const settings = Settings.get();
  if (!settings.maintenanceMode) return next();
  res.status(503).sendFile(path.join(__dirname, 'maintenance.html'));
});

// ---- Static hosting: public site at /, admin SPA at /admin
app.use(express.static(SITE_ROOT, { index: 'index.html', extensions: ['html'] }));
app.use('/admin', express.static(path.join(SITE_ROOT, 'admin')));
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(SITE_ROOT, 'admin', 'index.html'));
});

// ---- 404 for unmatched API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// ---- Preserve the site's existing 404 page for any other unmatched route.
app.use((req, res) => {
  res.status(404).sendFile(path.join(SITE_ROOT, '404.html'));
});

// ---- Friendly error handler — never leak stack traces to visitors.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message =
    status === 500 ? 'Something went wrong. Please try again.' : err.message || 'Request failed.';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;

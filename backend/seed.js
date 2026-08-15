/**
 * Optional helper: pre-fills Skills/Experience with entries that mirror what
 * was already hardcoded in index.html, so the dashboard isn't empty on day
 * one. Safe to run multiple times — skips collections that already have data.
 * Run with: npm run seed
 */
const { Skills, Experience } = require('./models');

async function seedIfEmpty(model, items, label) {
  if (model.all().length > 0) {
    console.log(`[seed] ${label} already has data, skipping.`);
    return;
  }
  for (const item of items) await model.create(item);
  console.log(`[seed] Added ${items.length} ${label}.`);
}

async function run() {
  await seedIfEmpty(
    Skills,
    [
      { name: 'JavaScript', category: 'Software', level: 80, icon: 'js' },
      { name: 'Node.js', category: 'Software', level: 75, icon: 'nodejs' },
      { name: 'Java', category: 'Software', level: 65, icon: 'java' },
      { name: 'PC Repair & Diagnostics', category: 'Hardware & Systems', level: 90, icon: 'tool' },
      { name: 'Networking', category: 'Hardware & Systems', level: 70, icon: 'network' },
    ],
    'skills'
  );

  await seedIfEmpty(
    Experience,
    [
      {
        company: 'Freelance',
        position: 'First soldering iron',
        description: 'Where it all started — hands-on hardware repair.',
        startDate: '',
        endDate: '',
        current: false,
      },
      {
        company: 'Freelance',
        position: 'Hardware technician',
        description: 'PC repair and diagnostics for local clients.',
        startDate: '',
        endDate: '',
        current: false,
      },
      {
        company: 'Self-taught',
        position: 'Web development',
        description: 'Taught myself web development.',
        startDate: '',
        endDate: '',
        current: false,
      },
      {
        company: 'Freelance',
        position: 'Web developer & Discord bot developer',
        description: 'First client websites & Discord bots.',
        startDate: '',
        endDate: '',
        current: true,
      },
    ],
    'experience entries'
  );

  console.log('[seed] Done. Edit or delete any of this from the admin dashboard.');
}

run();

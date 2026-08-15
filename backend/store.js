/**
 * Lightweight JSON-file data store.
 *
 * Chosen instead of SQLite so the whole backend runs with zero native
 * dependencies and zero external database to provision — appropriate for a
 * single-admin personal portfolio. Writes are serialized per-file with an
 * in-process queue to avoid corrupting the file under concurrent requests.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const writeQueues = new Map();

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readJSON(name, fallback) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return fallback;
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Failed to read ${name}.json, using fallback:`, err.message);
    return fallback;
  }
}

// Serialize writes to the same file so two near-simultaneous requests can't race.
function writeJSON(name, data) {
  const prev = writeQueues.get(name) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(
      () =>
        new Promise((resolve, reject) => {
          const fp = filePath(name);
          const tmp = `${fp}.${crypto.randomBytes(4).toString('hex')}.tmp`;
          fs.writeFile(tmp, JSON.stringify(data, null, 2), (err) => {
            if (err) return reject(err);
            fs.rename(tmp, fp, (err2) => (err2 ? reject(err2) : resolve()));
          });
        })
    );
  writeQueues.set(name, next);
  return next;
}

function genId() {
  return crypto.randomBytes(8).toString('hex');
}

/** Collection helper: array-of-objects stored under `name`.json, each with an `id`. */
function collection(name, defaults = []) {
  return {
    all() {
      return readJSON(name, defaults);
    },
    get(id) {
      return this.all().find((item) => item.id === id) || null;
    },
    async create(data) {
      const items = this.all();
      const item = { id: genId(), createdAt: new Date().toISOString(), ...data };
      items.push(item);
      await writeJSON(name, items);
      return item;
    },
    async update(id, patch) {
      const items = this.all();
      const idx = items.findIndex((item) => item.id === id);
      if (idx === -1) return null;
      items[idx] = { ...items[idx], ...patch, id, updatedAt: new Date().toISOString() };
      await writeJSON(name, items);
      return items[idx];
    },
    async remove(id) {
      const items = this.all();
      const next = items.filter((item) => item.id !== id);
      const changed = next.length !== items.length;
      if (changed) await writeJSON(name, next);
      return changed;
    },
    async replaceAll(items) {
      await writeJSON(name, items);
      return items;
    },
  };
}

/** Singleton helper: one object stored under `name`.json. */
function singleton(name, defaults = {}) {
  return {
    get() {
      return { ...defaults, ...readJSON(name, {}) };
    },
    async set(patch) {
      const current = this.get();
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      await writeJSON(name, next);
      return next;
    },
  };
}

module.exports = { readJSON, writeJSON, genId, collection, singleton, DATA_DIR };

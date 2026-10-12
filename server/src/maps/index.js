// Map registry loader — reads every .json (except index.json) in this folder.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadMap(id) {
  const file = path.join(__dirname, id + '.json');
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    console.warn('[maps] failed to parse', id, e.message);
    return null;
  }
}

export function listMaps() {
  return fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.json') && f !== 'index.json')
    .map(f => f.slice(0, -5));
}

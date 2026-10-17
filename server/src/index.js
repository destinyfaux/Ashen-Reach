// ASHENREACH server — node:http + 'ws'. No express, no socket.io.
// Serves the built client (client/public + client/index.html), the invite
// REST endpoint, map JSON, and the /ws WebSocket endpoint (see ws.js).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameManager } from './GameManager.js';
import { attachWs } from './ws.js';
import {
  list_top_level, keys, get, get_race, get_class,
  get_spell, get_spell_list, get_equipment_stats, get_feat, get_background
} from './rules/srd.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');           // game/
const PUBLIC = path.join(ROOT, 'client', 'public');       // built bundle + assets
const INDEX = path.join(ROOT, 'client', 'index.html');
const PORT = Number(process.env.PORT || 3000);

const gm = new GameManager({ startMapId: 'ashen_reach' });

// ─── static file serving ───────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',   // cooked asset kits (Wave 1 pipeline)
  '.ktx2': 'image/ktx2'          // BasisU texture payload inside the kits
};

function serveFile(res, file) {
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('404 — lost in the ash'); return; }
    res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
    res.end(buf);
  });
}

function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    // ── REST API ──────────────────────────────────────────────────────
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/invite' && (req.method === 'POST' || req.method === 'GET')) {
        await readBody(req); // body ignored (a POST with no payload is fine)
        const code = gm.session.inviteCode;
        return json(res, 200, { url: `/j/${code}`, code });
      }
      if (pathname === '/api/health' && req.method === 'GET') {
        return json(res, 200, { ok: true, name: 'ASHENREACH', players: gm.presenceCount(), map: gm.state.mapId });
      }
      if (pathname === '/api/maps' && req.method === 'GET') {
        return json(res, 200, { maps: gm.listMaps() });
      }
      const mapMatch = pathname.match(/^\/api\/map\/([a-z0-9_]+)$/i);
      if (mapMatch && req.method === 'GET') {
        const map = gm.getMap(mapMatch[1]);
        if (!map) return json(res, 404, { error: 'map_not_found' });
        return json(res, 200, gm.getPublicMap(null, mapMatch[1]));
      }

      // ── SRD Database API ──────────────────────────────────────────
      if (pathname.startsWith('/api/srd')) {
        const sp = url.searchParams;
        if (pathname === '/api/srd/top' || pathname === '/api/srd') {
          return json(res, 200, list_top_level());
        }
        if (pathname === '/api/srd/races') {
          return json(res, 200, keys('/races'));
        }
        if (pathname === '/api/srd/classes') {
          return json(res, 200, keys('/classes'));
        }
        if (pathname === '/api/srd/keys') {
          return json(res, 200, keys(sp.get('path') || '/'));
        }
        if (pathname === '/api/srd/get') {
          const val = get(sp.get('path') || '/');
          return val !== undefined ? json(res, 200, val) : json(res, 404, { error: 'not_found' });
        }
        const raceMatch = pathname.match(/^\/api\/srd\/race\/([^/]+)$/i);
        if (raceMatch) {
          const r = get_race(decodeURIComponent(raceMatch[1]), sp.get('subrace') || undefined);
          return r ? json(res, 200, r) : json(res, 404, { error: 'race_not_found' });
        }
        const classMatch = pathname.match(/^\/api\/srd\/class\/([^/]+)$/i);
        if (classMatch) {
          const c = get_class(decodeURIComponent(classMatch[1]), sp.get('subclass') || undefined, sp.get('level') || undefined);
          return c ? json(res, 200, c) : json(res, 404, { error: 'class_not_found' });
        }
        if (pathname === '/api/srd/spells') {
          const cls = sp.get('class');
          if (!cls) return json(res, 400, { error: 'class_required' });
          return json(res, 200, get_spell_list(cls, Number(sp.get('level')) || 9));
        }
        const spellMatch = pathname.match(/^\/api\/srd\/spell\/([^/]+)$/i);
        if (spellMatch) {
          const s = get_spell(decodeURIComponent(spellMatch[1]));
          return s ? json(res, 200, s) : json(res, 404, { error: 'spell_not_found' });
        }
        const eqMatch = pathname.match(/^\/api\/srd\/equipment\/([^/]+)$/i);
        if (eqMatch) {
          const e = get_equipment_stats(decodeURIComponent(eqMatch[1]));
          return e ? json(res, 200, e) : json(res, 404, { error: 'equipment_not_found' });
        }
        const featMatch = pathname.match(/^\/api\/srd\/feat\/([^/]+)$/i);
        if (featMatch) {
          const f = get_feat(decodeURIComponent(featMatch[1]));
          return f ? json(res, 200, f) : json(res, 404, { error: 'feat_not_found' });
        }
        const bgMatch = pathname.match(/^\/api\/srd\/background\/([^/]+)$/i);
        if (bgMatch) {
          const b = get_background(decodeURIComponent(bgMatch[1]));
          return b ? json(res, 200, b) : json(res, 404, { error: 'background_not_found' });
        }
        return json(res, 404, { error: 'srd_not_found' });
      }

      return json(res, 404, { error: 'not_found' });
    }

    // ── WebSocket upgrade is handled by ws.js; everything else: static ─
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'text/plain' });
      return res.end('405');
    }

    if (pathname === '/favicon.ico') {
      res.writeHead(204);
      return res.end();
    }

    if (pathname === '/') {
      return serveFile(res, INDEX);
    }

    // invite links (/j/<code>) and any extensionless route → SPA index
    let reqPath = pathname;
    if (reqPath.startsWith('/j/')) {
      const match = reqPath.match(/^\/j\/[^/]+(\/.*)?$/);
      if (match && match[1]) {
        // static asset requested relative to /j/<code>/ -> redirect to root asset path
        reqPath = match[1];
      } else {
        // direct invite landing page /j/<code> or /j/<code>/
        return serveFile(res, INDEX);
      }
    }

    const hasExt = /\.[a-z0-9]+$/i.test(reqPath);
    if (!hasExt) {
      return serveFile(res, INDEX);
    }

    // static asset from client/public (path-traversal safe)
    const rel = path.normalize(reqPath).replace(/^([/\\])+/, '');
    const file = path.join(PUBLIC, rel);
    if (file.startsWith(PUBLIC) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      return serveFile(res, file);
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404 — lost in the ash');
  } catch (e) {
    console.error('[http]', e);
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('500 — the fire gutters');
  }
});

attachWs(server, gm);
// P3.10: start the ambient monster simulation at real-server bootstrap only —
// tests never import index.js, so the world never simulates under assertions.
gm.startAmbientTick?.();

function getLocalIp() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) return net.address;
      }
    }
  } catch { /* fallback */ }
  return 'localhost';
}

server.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`[ASHENREACH] server listening on http://localhost:${PORT}`);
  console.log(`[ASHENREACH] local host invite: http://localhost:${PORT}/j/${gm.session.inviteCode}`);
  if (localIp !== 'localhost') {
    console.log(`[ASHENREACH] same Wi-Fi/LAN invite: http://${localIp}:${PORT}/j/${gm.session.inviteCode}`);
  }
  console.log(`[ASHENREACH] to host over the internet for friends at home: run 'npm run host'`);
  console.log(`[ASHENREACH] dm: http://localhost:${PORT}/?dm=${gm.dmKey}`);
});

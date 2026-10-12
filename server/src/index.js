// ASHENREACH server — node:http + 'ws'. No express, no socket.io.
// Serves the built client (client/public + client/index.html), the invite
// REST endpoint, map JSON, and the /ws WebSocket endpoint (see ws.js).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameManager } from './GameManager.js';
import { attachWs } from './ws.js';

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
  '.wasm': 'application/wasm'
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
      return json(res, 404, { error: 'not_found' });
    }

    // ── WebSocket upgrade is handled by ws.js; everything else: static ─
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'text/plain' });
      return res.end('405');
    }

    if (pathname === '/') {
      return serveFile(res, INDEX);
    }

    // invite links (/j/<code>) and any extensionless route → SPA index
    const hasExt = /\.[a-z0-9]+$/i.test(pathname);
    if (!hasExt || pathname.startsWith('/j/')) {
      return serveFile(res, INDEX);
    }

    // static asset from client/public (path-traversal safe)
    const rel = path.normalize(pathname).replace(/^([/\\])+/, '');
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

server.listen(PORT, () => {
  console.log(`[ASHENREACH] server listening on http://localhost:${PORT}`);
  console.log(`[ASHENREACH] invite: http://localhost:${PORT}/j/${gm.session.inviteCode}`);
  console.log(`[ASHENREACH] dm:     http://localhost:${PORT}/?dm=${gm.dmKey}`);
});

import http from 'node:http';
import { WebSocket } from 'ws';
import { GameManager } from '../server/src/GameManager.js';
import { attachWs } from '../server/src/ws.js';

const server = http.createServer();
const gm = new GameManager({ startMapId: 'ashen_reach' });
attachWs(server, gm);

await new Promise(res => server.listen(0, res));
const port = server.address().port;

function connect(name) {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    ws.msgs = [];
    ws.on('open', () => resolve(ws));
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      ws.msgs.push(msg);
      console.log(`[${name} RECV] ${msg.ev}`, msg.data?.tokens ? `tokens count=${msg.data.tokens.length} tokens=${JSON.stringify(msg.data.tokens.map(t => ({ id: t.id, x: Math.round(t.x), z: Math.round(t.z) })))}` : (msg.data?.reason ? `reason=${msg.data.reason} pos=${JSON.stringify(msg.data.position)}` : ''));
    });
  });
}

const ws1 = await connect('Player1');
const ws2 = await connect('Player2');

ws1.send(JSON.stringify({ ev: 'session:join', data: { name: 'Alice', archetype: 'warden' } }));
await new Promise(r => setTimeout(r, 100));

ws2.send(JSON.stringify({ ev: 'session:join', data: { name: 'Bob', archetype: 'shadowdancer' } }));
await new Promise(r => setTimeout(r, 100));

console.log('--- Alice walks ---');
const p1Tok = gm.state.tokens.find(t => t.name === 'Alice');
console.log('Alice initial pos:', p1Tok.x, p1Tok.z);

for (let i = 1; i <= 5; i++) {
  await new Promise(r => setTimeout(r, 100));
  ws1.send(JSON.stringify({ ev: 'intent:move', data: { x: p1Tok.x + i * 2, z: p1Tok.z, rotY: 0 } }));
}

await new Promise(r => setTimeout(r, 200));

console.log('--- Bob walks while Alice walks ---');
const p2Tok = gm.state.tokens.find(t => t.name === 'Bob');
console.log('Bob initial pos:', p2Tok.x, p2Tok.z);

for (let i = 1; i <= 5; i++) {
  await new Promise(r => setTimeout(r, 100));
  ws1.send(JSON.stringify({ ev: 'intent:move', data: { x: p1Tok.x + 10 + i * 2, z: p1Tok.z, rotY: 0 } }));
  ws2.send(JSON.stringify({ ev: 'intent:move', data: { x: p2Tok.x + i * 2, z: p2Tok.z, rotY: 0 } }));
}

await new Promise(r => setTimeout(r, 500));

ws1.close();
ws2.close();
server.close();

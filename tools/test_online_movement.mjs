import { WebSocket } from 'ws';

function connect(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    ws.name = name;
    ws.events = [];
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      ws.events.push(msg);
      if (msg.ev === 'move:rejected') {
        console.log(`[${name} REJECTED]`, msg.data);
      } else if (msg.ev === 'state:patch') {
        const tokInfo = (msg.data.tokens || []).map(t => `${t.name || t.id}@(${t.x.toFixed(1)},${t.z.toFixed(1)})`).join(', ');
        console.log(`[${name} PATCH] version=${msg.data.version} tokens=[${tokInfo}]`);
      } else if (msg.ev === 'state:sync') {
        const tokInfo = (msg.data.state?.tokens || []).map(t => `${t.name || t.id}@(${t.x.toFixed(1)},${t.z.toFixed(1)})`).join(', ');
        console.log(`[${name} SYNC] you=${msg.data.you?.id} tokens=[${tokInfo}]`);
      }
    });
  });
}

const c1 = await connect('C1');
const c2 = await connect('C2');

c1.send(JSON.stringify({ ev: 'session:join', data: { name: 'Player1', archetype: 'warden' } }));
await new Promise(r => setTimeout(r, 200));

c2.send(JSON.stringify({ ev: 'session:join', data: { name: 'Player2', archetype: 'shadowdancer' } }));
await new Promise(r => setTimeout(r, 200));

const sync1 = c1.events.find(e => e.ev === 'state:sync');
const sync2 = c2.events.find(e => e.ev === 'state:sync');
const p1Tok = sync1.data.state.tokens.find(t => t.ownerId === sync1.data.you.id);
const p2Tok = sync2.data.state.tokens.find(t => t.ownerId === sync2.data.you.id);

console.log('Initial P1 pos:', p1Tok.x, p1Tok.z);
console.log('Initial P2 pos:', p2Tok.x, p2Tok.z);

console.log('\n--- C1 moving ---');
for (let i = 1; i <= 5; i++) {
  c1.send(JSON.stringify({ ev: 'intent:move', data: { x: p1Tok.x + i * 2, z: p1Tok.z, rotY: 0 } }));
  await new Promise(r => setTimeout(r, 100));
}

console.log('\n--- Both moving simultaneously ---');
for (let i = 1; i <= 5; i++) {
  c1.send(JSON.stringify({ ev: 'intent:move', data: { x: p1Tok.x + 10 + i * 2, z: p1Tok.z, rotY: 0 } }));
  c2.send(JSON.stringify({ ev: 'intent:move', data: { x: p2Tok.x + i * 2, z: p2Tok.z, rotY: 0 } }));
  await new Promise(r => setTimeout(r, 100));
}

await new Promise(r => setTimeout(r, 300));
c1.close();
c2.close();

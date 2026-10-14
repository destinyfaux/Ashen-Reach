// dump/undump tooling for file transfer over shell gateway
// dump: node tf.cjs dump <file> [part nparts]  -> gz+base64 to stdout (+ md5 always)
// md5:  node tf.cjs md5 <file>
// undump: node tf.cjs undump <dest> <b64file>  -> decode gz+b64 file to dest, print md5+lines
// len: node tf.cjs len <file> -> exact line count, CRLF count
const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const [, , cmd, a, b, c] = process.argv;
function md5(buf) { return crypto.createHash('md5').update(buf).digest('hex'); }
if (cmd === 'dump') {
  const gz = zlib.gzipSync(fs.readFileSync(a));
  const b64 = gz.toString('base64');
  console.error(`md5=${md5(fs.readFileSync(a))} raw=${fs.readFileSync(a).length} gz=${gz.length} b64=${b64.length}`);
  if (b !== undefined && c !== undefined) {
    const part = parseInt(b), n = parseInt(c);
    const size = Math.ceil(b64.length / n);
    process.stdout.write(b64.slice(part * size, (part + 1) * size));
  } else process.stdout.write(b64);
} else if (cmd === 'md5') {
  const buf = fs.readFileSync(a);
  console.log(`md5=${md5(buf)} bytes=${buf.length}`);
} else if (cmd === 'undump') {
  const b64 = fs.readFileSync(b, 'utf8').replace(/\s+/g, '');
  const raw = zlib.gunzipSync(Buffer.from(b64, 'base64'));
  fs.writeFileSync(a, raw);
  const text = raw.toString('utf8');
  console.log(`wrote ${a}: md5=${md5(raw)} bytes=${raw.length} lines=${text.split(/\r?\n/).length} crlf=${(text.match(/\r\n/g) || []).length}`);
} else if (cmd === 'len') {
  const text = fs.readFileSync(a, 'utf8');
  console.log(`lines=${text.split(/\r?\n/).length} crlf=${(text.match(/\r\n/g) || []).length}`);
}

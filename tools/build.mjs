// esbuild bundler — the entire build pipeline. No framework, no config sprawl.
import { build } from 'esbuild';
import { cpSync, mkdirSync, existsSync } from 'fs';
import path from 'node:path';

const dev = process.argv.includes('--dev');
mkdirSync('client/public', { recursive: true });

// T2-e's character-creation module (client/src/ui/create/creation.ts) may not
// exist yet while the pivot ships. ui/createLoader.js dynamically imports it;
// this plugin resolves that specifier to an inline stub when the file is
// absent (build + runtime stay green) and bundles the real module when it
// lands. No other import is affected.
const pendingCreatePlugin = {
  name: 'ar-pending-create',
  setup(b) {
    b.onResolve({ filter: /(^|\/)create\/creation(\.js)?$/ }, (args) => {
      if (args.namespace !== 'file') return null;
      const base = path.resolve(args.resolveDir, args.path.replace(/\.js$/, ''));
      for (const cand of [base + '.ts', base + '.tsx', base + '.js', base + '.mjs', base + '/index.ts', base + '/index.js']) {
        if (existsSync(cand)) return { path: cand, namespace: 'file' };
      }
      return { path: 'ar-pending:creation', namespace: 'ar-pending' };
    });
    b.onLoad({ filter: /.*/, namespace: 'ar-pending' }, () => ({
      // mountCreation = null → createLoader returns null → placeholder card
      contents: 'export const mountCreation = null; export default null;',
      loader: 'js',
    }));
  }
};

await build({
  entryPoints: ['client/src/main.ts'],
  bundle: true,
  minify: !dev,
  sourcemap: dev,
  target: 'es2022',
  outfile: 'client/public/app.js',
  logLevel: 'info',
  plugins: [pendingCreatePlugin],
  define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"' },
});

// static assets that live next to index.html are already in client/public (theme.css, fonts/)
console.log(dev ? '[build] dev bundle written' : '[build] production bundle written');

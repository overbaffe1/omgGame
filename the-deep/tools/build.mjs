// build.mjs : inline every script of index.html into one self-contained
// dist/the-deep.html — the shippable artefact, openable straight from disk.
//
//   node tools/build.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let html = readFileSync(join(root, 'index.html'), 'utf8');

html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  const code = readFileSync(join(root, src), 'utf8');
  return '<script>\n' + code + '\n</script>';
});

// The single file must not reference anything external.
if (/<script src=/.test(html)) throw new Error('external script tags remain');
if (/<link /.test(html)) throw new Error('external stylesheet tags remain');

mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', 'the-deep.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(1)} kB)`);

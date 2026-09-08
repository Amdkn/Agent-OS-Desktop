import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const JETONS = /\b(TODO|FIXME|XXX|HACK)\b/i;
const AUTRES = [
  /\bnot[ -_]implemented\b/i,
  /\bà implémenter\b/i,
  /\bà compléter\b/i,
  /\bcoming soon\b/i,
];

function ligneMarquee(line) {
  let idx = line.indexOf('//');
  const idxBloc = line.indexOf('/*');
  if (idxBloc !== -1 && (idx === -1 || idxBloc < idx)) idx = idxBloc;
  if (idx !== -1 && JETONS.test(line.slice(idx))) return true;
  if (/^\s*\*/.test(line) && JETONS.test(line)) return true;
  return AUTRES.some((m) => m.test(line));
}

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html']);

function scanFile(file) {
  const hits = [];
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return hits;
  }
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (ligneMarquee(line)) {
      hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
    }
  });
  return hits;
}

const arg = process.argv[2];
if (arg === '--file' && process.argv[3]) {
  const hits = scanFile(path.resolve(process.argv[3]));
  if (hits.length) {
    console.log(hits.join('\n'));
    process.exit(1);
  }
  console.log('NO_PLACEHOLDER_MARKERS');
  process.exit(0);
}

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const status = execSync('git status --porcelain -uall', { cwd: racine, encoding: 'utf8' });
const fichiers = status
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.slice(3).trim())
  .filter((f) => !f.includes('->'))
  .filter((f) => EXT.has(path.extname(f).toLowerCase()))
  .filter((f) => path.relative(racine, path.join(racine, f)).split(/[\\/]/)[0] !== 'verif')
  .map((f) => path.join(racine, f))
  .filter((f) => fs.existsSync(f));

const tous = fichiers.flatMap(scanFile);
if (tous.length) {
  console.log(`MARQUEURS TROUVES (${tous.length}) :`);
  console.log(tous.slice(0, 40).join('\n'));
  process.exit(1);
}
console.log(`NO_PLACEHOLDER_MARKERS (${fichiers.length} fichiers changes scannes)`);

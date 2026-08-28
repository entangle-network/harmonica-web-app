/**
 * Finds user-facing English text still hardcoded in the source.
 *
 * The ad-hoc greps used during the translation missed whole classes of strings:
 * text split across lines, values inside hooks rather than components, `.ts`
 * files, and template literals. This looks at the source rather than at one line
 * at a time, so those show up.
 *
 * Run: node scripts/find-untranslated.js [--all]
 * Without --all, files already covered (admin, dev-only screens) are skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

// Anything matching these is not user-facing copy.
const IGNORE_VALUE = [
  /^[A-Z0-9_]+$/, //                              SCREAMING_CASE constants
  /^[a-z0-9-]+$/, //                              slugs, ids, css tokens
  /^[\w.-]+\/[\w./-]+$/, //                       paths and mime types
  /^https?:/,
  /^#[0-9a-f]{3,8}$/i,
  /^\s*$/,
  /^[^a-zA-Z]*$/, //                              no letters at all
  // HTTP header names and other protocol strings read like English labels.
  /^(Content-Type|Content-Length|User-Agent|Cache-Control|Authorization|Accept|Content-Disposition|Content-Security-Policy)$/,
];

// Attributes and calls whose string arguments are never shown to a user.
const IGNORE_CONTEXT =
  /(className|classname|key|id|href|src|type|name|role|aria-hidden|data-|import |require\(|console\.|from |useTranslations|getTranslations|serverMessage|\.test\(|process\.env)/;

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full);
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
})(ROOT);

const SKIP_UNLESS_ALL = /[\\/](admin|test-chat)[\\/]|onboarding\.tsx|defaultPrompts\.ts/;
const includeAll = process.argv.includes('--all');

// Two or more words, starting with a letter — the shape of a sentence or label.
const ENGLISH_LIKE = /^[A-Z][a-z]+(?:[\s,'’-][A-Za-z][\w'’-]*){1,}[.!?:]?$/;

const findings = [];

for (const file of files) {
  if (!includeAll && SKIP_UNLESS_ALL.test(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split('\n');

  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments

    // Log messages are for developers, not users. They often wrap onto the next
    // line, so look back a little as well.
    const window = lines.slice(Math.max(0, i - 2), i + 1).join(' ');
    if (/console\.(log|error|warn|info)/.test(window)) return;
    if (/^\s*(name|description|title):\s*'/.test(line) && /meta|Metadata/.test(source)) return;

    // JSX text nodes, including ones that continue on the next line.
    const jsxText = line.match(/>\s*([A-Z][^<>{}\n]{3,})\s*$/);
    if (jsxText && !IGNORE_CONTEXT.test(line)) {
      const value = jsxText[1].trim();
      if (ENGLISH_LIKE.test(value)) {
        findings.push({ file, line: i + 1, value, kind: 'jsx' });
      }
    }

    // Quoted strings in props and code.
    const quoted = line.matchAll(/(['"`])([A-Z][^'"`\n]{4,})\1/g);
    for (const match of quoted) {
      const value = match[2].trim();
      if (IGNORE_VALUE.some((r) => r.test(value))) continue;
      if (IGNORE_CONTEXT.test(line)) continue;
      if (!ENGLISH_LIKE.test(value)) continue;
      findings.push({ file, line: i + 1, value, kind: 'string' });
    }
  });
}

const byFile = new Map();
for (const f of findings) {
  const rel = path.relative(path.join(__dirname, '..'), f.file).replace(/\\/g, '/');
  if (!byFile.has(rel)) byFile.set(rel, []);
  byFile.get(rel).push(f);
}

const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [rel, items] of sorted) {
  console.log(`\n${rel}  (${items.length})`);
  for (const item of items.slice(0, 8)) {
    console.log(`  ${item.line}: ${item.value.slice(0, 78)}`);
  }
  if (items.length > 8) console.log(`  … a ${items.length - 8} dalších`);
}

console.log(`\nCELKEM: ${findings.length} v ${byFile.size} souborech`);

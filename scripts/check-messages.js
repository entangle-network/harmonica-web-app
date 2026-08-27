/**
 * Validates the message catalogs.
 *
 * Two failure modes this catches, both of which otherwise surface only when a
 * user happens to open the screen that renders the broken message:
 *   1. invalid ICU syntax (a malformed plural/select throws at format time)
 *   2. a key present in one locale but missing from another
 *
 * Run: node scripts/check-messages.js
 */
const fs = require('fs');
const path = require('path');
const { IntlMessageFormat } = require('intl-messageformat');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const REFERENCE_LOCALE = 'en';

function flatten(obj, prefix = '') {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flatten(value, full));
    } else {
      acc[full] = value;
    }
    return acc;
  }, {});
}

const locales = fs
  .readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => path.basename(f, '.json'));

const catalogs = {};
for (const locale of locales) {
  catalogs[locale] = flatten(
    JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'))
  );
}

const problems = [];

// 1. ICU syntax
for (const locale of locales) {
  for (const [key, value] of Object.entries(catalogs[locale])) {
    if (typeof value !== 'string') continue;
    try {
      new IntlMessageFormat(value, locale);
    } catch (error) {
      problems.push(`[${locale}] ${key}: ${error.message}`);
    }
  }
}

// 2. key parity against the reference locale
const referenceKeys = Object.keys(catalogs[REFERENCE_LOCALE]);
for (const locale of locales) {
  if (locale === REFERENCE_LOCALE) continue;
  const keys = new Set(Object.keys(catalogs[locale]));
  for (const key of referenceKeys) {
    if (!keys.has(key)) problems.push(`[${locale}] missing key: ${key}`);
  }
  for (const key of keys) {
    if (!referenceKeys.includes(key)) {
      problems.push(`[${locale}] key not in ${REFERENCE_LOCALE}: ${key}`);
    }
  }
}

const total = referenceKeys.length;
if (problems.length) {
  console.error(`${problems.length} problem(s) across ${total} keys:\n`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}

console.log(`OK — ${total} keys, locales: ${locales.join(', ')}`);

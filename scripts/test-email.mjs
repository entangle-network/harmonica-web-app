/**
 * Ověří odesílání e-mailů proti stejným proměnným, jaké čte aplikace.
 *
 * Spuštění:
 *   node scripts/test-email.mjs prijemce@example.com
 *
 * Proměnné se berou z prostředí nebo z .env, takže tenhle test prochází
 * přesně tou cestou, kterou pak půjde ostrý provoz — ne nějakou vlastní.
 */
import nodemailer from 'nodemailer';
import { readFileSync } from 'node:fs';

// .env načteme sami; skript má běžet i bez dalších závislostí.
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch {
  // Bez .env je to v pořádku — proměnné mohou přijít z prostředí.
}

const prijemce = process.argv[2];
if (!prijemce) {
  console.error('Použití: node scripts/test-email.mjs prijemce@example.com');
  process.exit(1);
}

const {
  BREVO_API_KEY,
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER,
  SMTP_PASSWORD,
  EMAIL_FROM,
  EMAIL_FROM_NAME = 'Harmonica',
  GMAIL_USER,
  SENDGRID_API_KEY,
} = process.env;

const PREDMET = 'Zkušební zpráva z platformy Témata';
const TEXT =
  'Tohle je zkušební zpráva. Když ji čtete, odesílání e-mailů z Harmonicy funguje.';
const HTML =
  '<p>Tohle je zkušební zpráva.</p><p>Když ji čtete, odesílání e-mailů z Harmonicy funguje.</p>';

// Stejné pořadí jako v sendEmail(): klíč k API má přednost před SMTP.
if (BREVO_API_KEY) {
  if (!EMAIL_FROM) {
    console.error('Chybí EMAIL_FROM.');
    process.exit(1);
  }

  console.log('Cesta:      Brevo API (BREVO_API_KEY je nastavený)');
  console.log(`  klíč      ${'*'.repeat(12)} (${BREVO_API_KEY.length} znaků)`);
  console.log(`  odesílatel "${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`);
  console.log(`  příjemce   ${prijemce}\n`);

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
      to: [{ email: prijemce }],
      subject: PREDMET,
      htmlContent: HTML,
      textContent: TEXT,
    }),
  });

  const telo = await response.text();
  if (!response.ok) {
    console.error(`Selhalo: HTTP ${response.status}\n${telo}`);
    if (response.status === 401) {
      console.error('\n401 = neplatný klíč. Zkontrolujte, že jde o API klíč z app.brevo.com/settings/keys/api.');
    }
    if (response.status === 400 && /sender/i.test(telo)) {
      console.error('\nBrevo odmítlo odesílatele — adresa v EMAIL_FROM musí být ověřená v Senders & Domains.');
    }
    process.exit(1);
  }

  console.log(`Odesláno: ${telo}`);
  console.log('\nZkontrolujte schránku včetně spamu.');
  process.exit(0);
}

console.log('Cesta:      SMTP (BREVO_API_KEY nenastavený)\n');

// getTransporter() v aplikaci zkouší Gmail a SendGrid dřív než SMTP. Když je
// některá z těch proměnných nastavená, SMTP se vůbec nepoužije — což je při
// hledání chyby velmi matoucí, tak na to upozorníme rovnou.
if (GMAIL_USER || SENDGRID_API_KEY) {
  console.warn(
    '! Pozor: je nastavené GMAIL_USER nebo SENDGRID_API_KEY.\n' +
      '  Aplikace je v emailService.ts zkouší dřív než SMTP, takže by Brevo\n' +
      '  nepoužila. V produkci je odstraňte.\n',
  );
}

const chybi = Object.entries({ SMTP_HOST, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM })
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (chybi.length) {
  console.error('Chybí proměnné: ' + chybi.join(', '));
  process.exit(1);
}

console.log('Konfigurace:');
console.log(`  host       ${SMTP_HOST}:${SMTP_PORT} (secure=${SMTP_SECURE})`);
console.log(`  uživatel   ${SMTP_USER}`);
console.log(`  heslo      ${'*'.repeat(Math.min(SMTP_PASSWORD.length, 12))} (${SMTP_PASSWORD.length} znaků)`);
console.log(`  odesílatel "${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`);
console.log(`  příjemce   ${prijemce}\n`);

// Mezera nebo zlom na konci klíče je u Brevo častá příčina chyby 535.
if (SMTP_PASSWORD !== SMTP_PASSWORD.trim()) {
  console.warn('! SMTP_PASSWORD má na začátku nebo konci mezeru — Brevo to odmítne.\n');
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: SMTP_SECURE === 'true',
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
});

try {
  console.log('Ověřuji spojení a přihlášení...');
  await transporter.verify();
  console.log('  spojení i přihlášení v pořádku\n');

  console.log('Odesílám zkušební zprávu...');
  const info = await transporter.sendMail({
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
    to: prijemce,
    subject: PREDMET,
    text: TEXT,
    html: HTML,
  });
  console.log(`  odesláno, messageId ${info.messageId}`);
  console.log(`  odpověď serveru: ${info.response}`);
  console.log('\nZkontrolujte schránku včetně spamu.');
} catch (error) {
  console.error('\nSelhalo: ' + error.message);
  if (/535|authentication/i.test(error.message)) {
    console.error(
      '\n535 znamená odmítnuté přihlášení. U Brevo bývá příčina:\n' +
        '  - použitý API klíč místo SMTP klíče (jsou to jiné věci)\n' +
        '  - jako SMTP_USER zadaný smtp-relay.brevo.com místo přihlašovacího e-mailu\n' +
        '  - mezera nebo zlom řádku zkopírovaný spolu s klíčem',
    );
  }
  process.exit(1);
}

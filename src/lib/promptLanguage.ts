/**
 * Language directive appended to the prompts that generate session content.
 *
 * The prompts themselves live in the database and are written in English, so a
 * model given nothing else answers in English — which is how a Czech deployment
 * ended up showing hosts an English "Recommended Structure" and generating an
 * English facilitation prompt for Czech participants.
 *
 * Appending the deployment language keeps that working without every host having
 * to rewrite the stored prompts, and it still lets them do so if they want.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  cs: 'Czech',
  en: 'English',
  de: 'German',
  sk: 'Slovak',
  pl: 'Polish',
};

/**
 * Terms the model would otherwise render inconsistently with the interface
 * around it. Left to itself a model calls a session "relace" in Czech, while
 * every button and heading in the app says "sezení" — the same thing under two
 * names inside one screen.
 */
const GLOSSARIES: Record<string, string[]> = {
  cs: [
    'session = sezení (nikoli "relace")',
    'participant = účastník',
    'facilitator = facilitátor',
    'host = pořadatel',
    'summary = shrnutí',
    'insights = poznatky',
  ],
};

export function outputLanguageDirective(): string {
  const locale = process.env.APP_LOCALE || 'en';
  const name = LANGUAGE_NAMES[locale] ?? locale;

  if (locale === 'en') return '';

  const lines = [
    '',
    '',
    `LANGUAGE: Write your entire output in ${name}, including all headings,`,
    'section titles and labels. Do not leave any part in English and do not add',
    'a translation or a note about the language — the reader only reads',
    `${name}.`,
  ];

  const glossary = GLOSSARIES[locale];
  if (glossary) {
    lines.push(
      '',
      'Use these terms so the text matches the interface it appears in:',
      ...glossary.map((entry) => `- ${entry}`),
    );
  }

  return lines.join('\n');
}

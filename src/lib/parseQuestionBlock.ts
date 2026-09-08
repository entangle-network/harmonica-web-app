import { QuestionInfo, QuestionType } from 'app/create/types';

/**
 * Převede vložený text na otázky formuláře.
 *
 * Naklikat deset otázek s pěti možnostmi je práce na čtvrt hodiny, přitom je
 * pořadatel skoro vždycky má už napsané — v zadání, v mailu, v promptu.
 * Formát je proto takový, jak si je lidé přirozeně píšou:
 *
 *   Jaké je vaše pohlaví?
 *   - Žena
 *   - Muž
 *
 *   Ve které části města bydlíte?
 *
 * Řádek bez odrážky začíná novou otázku, odrážky pod ním jsou její možnosti.
 * Otázka bez odrážek je krátká textová odpověď. Prázdné řádky nevadí.
 *
 * Snese i tvary, ve kterých bývají zadání psaná: číslování ("1. Pohlaví"),
 * hvězdičkové odrážky z Markdownu a vedlejší řádky typu "Nabídni možnosti:"
 * nebo "Počkej na odpověď", které patří promptu pro model, ne formuláři.
 */

/** Řádky, které v zadáních řídí model a do formuláře nepatří. */
const INSTRUCTION_LINES = [
  /^nab[ií]dni\s+mo[žz]nosti/i,
  /^po[čc]kej\s+na\s+odpov[ěe][ďd]/i,
  /^nab[ií]dni\s+jej/i,
  /^jinak\s+umo[žz]ni/i,
  /^pokud\s+existuje\s+p[řr]ipraven[ýy]\s+seznam/i,
];

const BULLET = /^[-*•–—]\s+(.+)$/;
/** "1. Pohlaví" i "1) Pohlaví" — číslo je nadpis bloku, ne součást otázky. */
const NUMBERED = /^\d+[.)]\s+(.+)$/;

function isInstruction(line: string) {
  return INSTRUCTION_LINES.some((re) => re.test(line));
}

let counter = 0;
function nextId() {
  counter += 1;
  return `q_${Date.now().toString(36)}_${counter}`;
}

export function parseQuestionBlock(input: string): QuestionInfo[] {
  const questions: QuestionInfo[] = [];
  let current: QuestionInfo | null = null;

  const flush = () => {
    if (!current) return;
    // Otázka bez možností je textové pole; s možnostmi výběr.
    if (current.options && current.options.length > 0) {
      current.type = QuestionType.OPTIONS;
      current.typeValue = 'OPTIONS';
    } else {
      current.type = QuestionType.SHORT_FIELD;
      current.typeValue = 'SHORT_FIELD';
      delete current.options;
    }
    questions.push(current);
    current = null;
  };

  for (const raw of input.split('\n')) {
    const line = raw.trim();
    if (!line || isInstruction(line)) continue;

    const bullet = BULLET.exec(line);
    if (bullet) {
      // Odrážka bez předchozí otázky nemá kam patřit — přeskočíme ji, než
      // abychom vyrobili otázku bez znění.
      if (!current) continue;
      current.options = [...(current.options ?? []), bullet[1].trim()];
      continue;
    }

    flush();

    // Číslovaný nadpis: "1. Pohlaví" bývá jen návěští, samotná otázka přijde
    // na dalším řádku. Nechá se jako znění jen tehdy, když nic dalšího nepřijde.
    const numbered = NUMBERED.exec(line);
    const label = (numbered ? numbered[1] : line).replace(/^\*\*|\*\*$/g, '').trim();

    current = {
      id: nextId(),
      label,
      type: QuestionType.SHORT_FIELD,
      typeValue: 'SHORT_FIELD',
      required: false,
      options: [],
    };

    // Návěští typu "1. Pohlaví" nahradí následující otázka, pokud přijde
    // dřív než odrážky.
    if (numbered) {
      (current as QuestionInfo & { fromHeading?: boolean }).fromHeading = true;
    }
  }

  flush();

  // Návěští následované skutečnou otázkou: "1. Pohlaví" + "Jaké je vaše
  // pohlaví?" jsou jedna otázka, ne dvě. Návěští bez možností a bez otazníku,
  // po kterém hned následuje otázka, se zahodí.
  return questions.filter((q, i) => {
    const heading = (q as QuestionInfo & { fromHeading?: boolean }).fromHeading;
    const next = questions[i + 1];
    const nadbytecne =
      heading &&
      (!q.options || q.options.length === 0) &&
      !q.label.includes('?') &&
      next &&
      !(next as QuestionInfo & { fromHeading?: boolean }).fromHeading;
    return !nadbytecne;
  }).map((q) => {
    const clean = { ...q } as QuestionInfo & { fromHeading?: boolean };
    delete clean.fromHeading;
    return clean as QuestionInfo;
  });
}

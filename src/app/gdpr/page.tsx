import type { Metadata } from 'next';

/**
 * Privacy notice for the participant-facing side of this deployment.
 *
 * Written as JSX rather than rendered from the Markdown in docs/: the project's
 * Markdown component has no GFM plugin, so the tables in the text would come out
 * as rows of pipes, and adding remark-gfm would touch the lockfile for the sake
 * of one static page.
 *
 * The text is Czech only and deliberately not routed through the message
 * catalogs. It is a legal document about a Czech controller under Czech
 * supervision — a machine-assisted second language version would be a liability
 * rather than a service, because whichever version a participant read is the one
 * they consented to.
 */

const EMAIL = 'info@mestovdialogu.cz';

export const metadata: Metadata = {
  title: 'Zpracování osobních údajů — Témata',
  description:
    'Jak nakládáme s údaji, které nám svěříte při zapojení do konverzace na platformě Témata.',
};

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-semibold mb-4">
        <span className="text-muted-foreground mr-2">{number}.</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Wide tables must scroll on their own rather than widening the page. */
function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300">
            {headers.map((h) => (
              <th key={h} className="py-2 pr-4 font-semibold align-top">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Mail() {
  return (
    <a href={`mailto:${EMAIL}`} className="underline hover:text-foreground">
      {EMAIL}
    </a>
  );
}

export default function GdprPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Zpracování osobních údajů
        </h1>
        <p className="text-muted-foreground">
          Platforma Témata — Město v dialogu
          <br />
          Účinné od 7. září 2026
        </p>
      </header>

      <p className="mb-10 text-lg leading-relaxed">
        Tento dokument vysvětluje, co se děje s údaji, které nám svěříte, když se
        zapojíte do konverzace na této platformě. Snažili jsme se ho napsat
        srozumitelně, ne právnicky. Pokud vám něco nebude jasné, napište nám na{' '}
        <Mail />.
      </p>

      <div className="space-y-10">
        <Section number={1} title="Kdo je správcem vašich údajů">
          <p>Správcem osobních údajů je:</p>
          <address className="not-italic rounded-lg border border-gray-200 bg-gray-50 p-4 leading-relaxed">
            <strong>Prostor plus o.p.s.</strong>
            <br />
            Na Pustině 1068, 280 02 Kolín 2
            <br />
            IČO: 265 94 633
            <br />
            Datová schránka: 4xbn84r
            <br />
            Kontakt pro ochranu osobních údajů: <Mail />
          </address>
          <p>
            Platformu Témata provozujeme v rámci projektu Město v dialogu.
            Správcem jsme my, nikoli obec či organizace, která konkrétní sezení
            zadala — pokud by to u některého sezení bylo jinak, uvedeme to přímo
            u pozvánky do konverzace.
          </p>
          <p>
            Pověřence pro ochranu osobních údajů podle čl. 37 GDPR jmenovaného
            nemáme — povinnost nám nevzniká. Ve věcech ochrany údajů se obracejte
            na kontakt výše.
          </p>
        </Section>

        <Section number={2} title="Jaké údaje zpracováváme">
          <h3 className="text-lg font-semibold pt-2">
            Údaje, které nám dáte ve formuláři
          </h3>
          <p>Před začátkem konverzace vás požádáme o některé z těchto údajů:</p>
          <Table
            headers={['Údaj', 'K čemu ho potřebujeme']}
            rows={[
              ['Jméno', 'Abychom vás mohli v konverzaci oslovit'],
              ['E-mail', 'Abychom vám mohli poslat výstupy, pokud o ně stojíte'],
              ['Věk', 'Abychom viděli, které věkové skupiny se zapojily'],
              ['Pohlaví', 'Totéž — jestli se ozývají muži i ženy'],
              ['Město', 'Abychom odlišili názory z různých míst'],
              ['Vzdělání', 'Abychom viděli, jestli jsme oslovili různorodou skupinu'],
            ]}
          />
          <p>
            Věk, pohlaví, město a vzdělání používáme{' '}
            <strong>pro souhrnný pohled na to, kdo se zapojil</strong> — ne k
            tomu, abychom si o vás vytvářeli profil. Vyplnění jednotlivých polí je
            dobrovolné, pokud u nich není hvězdička.
          </p>

          <h3 className="text-lg font-semibold pt-2">Obsah konverzace</h3>
          <p>
            Ukládáme celý průběh vaší konverzace s moderátorem — vaše odpovědi i
            otázky, které vám položil. Z těchto odpovědí pak vzniká souhrn za celé
            sezení.
          </p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <strong>Do konverzace prosím nepište citlivé údaje</strong>, které tam
            nepatří — zdravotní stav, politickou příslušnost, náboženské vyznání,
            údaje o jiných konkrétních osobách. Nepotřebujeme je a nechceme je
            zpracovávat.
          </p>

          <h3 className="text-lg font-semibold pt-2">Hlasový vstup</h3>
          <p>
            Pokud pro odpověď použijete mikrofon, nahrávka se odešle k přepisu do
            textu. <strong>Zvukovou nahrávku neukládáme</strong> — pracujeme dál
            jen s přepsaným textem.
          </p>

          <h3 className="text-lg font-semibold pt-2">Technické údaje</h3>
          <p>
            Server zaznamenává běžné provozní údaje (IP adresa, čas požadavku, typ
            prohlížeče) v rozsahu nutném pro provoz a bezpečnost.
          </p>
        </Section>

        <Section number={3} title="Proč údaje zpracováváme a na základě čeho">
          <Table
            headers={['Účel', 'Právní titul']}
            rows={[
              [
                'Vedení konverzace a její vyhodnocení',
                'Váš souhlas — čl. 6 odst. 1 písm. a) GDPR',
              ],
              [
                'Souhrnné výstupy ze sezení pro zadavatele',
                'Váš souhlas — čl. 6 odst. 1 písm. a) GDPR',
              ],
              [
                'Zaslání výstupů na váš e-mail',
                'Váš souhlas — čl. 6 odst. 1 písm. a) GDPR',
              ],
              [
                'Provoz a zabezpečení platformy',
                'Náš oprávněný zájem — čl. 6 odst. 1 písm. f) GDPR',
              ],
            ]}
          />
          <p>
            Souhlas dáváte zaškrtnutím políčka před začátkem konverzace.{' '}
            <strong>Můžete ho kdykoli odvolat</strong> — napište na <Mail />.
            Odvoláním souhlasu není dotčena zákonnost zpracování před jeho
            odvoláním.
          </p>
          <p>
            Pokud souhlas nedáte, konverzaci nezahájíte. Jinou nevýhodu z toho mít
            nebudete.
          </p>
        </Section>

        <Section number={4} title="Jak dlouho si údaje necháváme">
          <Table
            headers={['Co', 'Jak dlouho']}
            rows={[
              [
                'Formulářové údaje a obsah konverzace',
                <>
                  <strong>3 roky</strong> od konce sezení
                </>,
              ],
              [
                'Souhrnné a anonymizované výstupy',
                'Bez omezení — už neobsahují osobní údaje',
              ],
              ['Provozní logy serveru', <strong>12 měsíců</strong>],
            ]}
          />
          <p>
            Po uplynutí lhůty údaje smažeme. Souhrny, které z konverzací vznikly,
            si ponecháváme dál — v podobě, ze které vás nelze identifikovat.
          </p>
        </Section>

        <Section number={5} title="Kdo se k údajům dostane">
          <p>Kromě nás jde o tyto zpracovatele:</p>
          <Table
            headers={['Zpracovatel', 'Co dělá', 'Kde']}
            rows={[
              [
                <strong>Hetzner Online GmbH</strong>,
                'Server a databáze, kde jsou údaje uložené',
                'Norimberk, Německo (EU)',
              ],
              [
                <strong>OpenAI, L.L.C.</strong>,
                'Jazykový model, který vede konverzaci, tvoří souhrny a přepisuje hlas',
                'USA',
              ],
            ]}
          />
          <p>
            Zadavateli sezení (obci, organizaci) předáváme{' '}
            <strong>souhrnné výstupy</strong>. Jednotlivé odpovědi se jménem a
            kontaktem mu nepředáváme, pokud jste k tomu výslovně nedali souhlas.
          </p>
          <p>
            Údaje <strong>neprodáváme</strong> a nepředáváme je nikomu pro
            marketingové účely.
          </p>
          <p>
            Pokud je na úvodní stránce sezení vložené video, načte se z YouTube
            nebo Vimea a tito poskytovatelé se dozvědí, že jste stránku otevřeli.
            YouTube používáme v režimu bez cookies (youtube-nocookie.com), Vimeo
            v režimu bez sledování.
          </p>
          <p>
            <strong>Nepoužíváme</strong> žádné nástroje pro měření návštěvnosti
            ani reklamní sledování.
          </p>
        </Section>

        <Section number={6} title="Předání mimo Evropskou unii">
          <p>
            Jediné předání mimo EU je do <strong>USA společnosti OpenAI</strong>,
            která provozuje jazykový model vedoucí konverzaci. Bez tohoto předání
            by platforma nefungovala.
          </p>
          <p>
            Předání je zajištěno standardními smluvními doložkami schválenými
            Evropskou komisí, které jsou součástí smlouvy o zpracování údajů
            s OpenAI.
          </p>
        </Section>

        <Section number={7} title="Umělá inteligence — co s vašimi údaji dělá">
          <p>
            Konverzaci vede jazykový model společnosti OpenAI. Je poctivé říct, co
            to znamená:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Obsah vaší konverzace se posílá OpenAI</strong>, aby model
              mohl formulovat další otázku a na konci souhrn.
            </li>
            <li>
              <strong>OpenAI na vašich odpovědích netrénuje své modely.</strong>{' '}
              Data odeslaná přes programové rozhraní k tomu podle podmínek OpenAI
              nepoužívá.
            </li>
            <li>
              OpenAI si data ponechává nejdéle 30 dní kvůli kontrole zneužití a
              pak je maže.
            </li>
            <li>
              <strong>Model o vás nerozhoduje.</strong> Nevyhodnocuje vás,
              nepřiděluje vám skóre a nic z toho, co napíšete, nemá pro vás žádný
              automatický důsledek.
            </li>
          </ul>
        </Section>

        <Section number={8} title="Cookies">
          <p>
            Používáme pouze technicky nezbytné úložiště prohlížeče, které drží
            vaši rozepsanou konverzaci, abyste o ni nepřišli při obnovení stránky.
            Není to sledovací cookie a nepotřebuje váš souhlas.
          </p>
        </Section>

        <Section number={9} title="Zabezpečení">
          <p>
            Spojení je šifrované (HTTPS). Databáze není přístupná z internetu, jen
            zevnitř serveru. Přístup k odpovědím má jen okruh lidí, kteří sezení
            vyhodnocují. Server pravidelně aktualizujeme.
          </p>
        </Section>

        <Section number={10} title="Automatizované rozhodování">
          <p>
            Neprovádíme automatizované rozhodování ani profilování ve smyslu
            čl. 22 GDPR. Nic z toho, co napíšete, nevede k automatickému
            rozhodnutí, které by se vás dotýkalo.
          </p>
        </Section>

        <Section number={11} title="Vaše práva">
          <p>Máte právo:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>na přístup</strong> — chtít kopii údajů, které o vás máme
              (čl. 15)
            </li>
            <li>
              <strong>na opravu</strong> — nechat opravit nepřesné údaje (čl. 16)
            </li>
            <li>
              <strong>na výmaz</strong> — nechat údaje smazat (čl. 17)
            </li>
            <li>
              <strong>na omezení zpracování</strong> — dočasně zpracování
              pozastavit (čl. 18)
            </li>
            <li>
              <strong>na přenositelnost</strong> — dostat údaje ve strojově
              čitelné podobě (čl. 20)
            </li>
            <li>
              <strong>vznést námitku</strong> proti zpracování z oprávněného zájmu
              (čl. 21)
            </li>
            <li>
              <strong>odvolat souhlas</strong> kdykoli, bez udání důvodu (čl. 7
              odst. 3)
            </li>
          </ul>
          <p>
            Napište na <Mail />. Odpovíme nejpozději do jednoho měsíce.
          </p>
          <p>
            Pokud budete mít pocit, že s vašimi údaji nakládáme špatně, můžete
            podat stížnost u dozorového úřadu:
          </p>
          <address className="not-italic rounded-lg border border-gray-200 bg-gray-50 p-4 leading-relaxed">
            <strong>Úřad pro ochranu osobních údajů</strong>
            <br />
            Pplk. Sochora 27, 170 00 Praha 7
            <br />
            <a
              href="https://www.uoou.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              www.uoou.cz
            </a>
          </address>
        </Section>

        <Section number={12} title="Změny tohoto dokumentu">
          <p>
            Pokud se způsob zpracování změní, upravíme i tento text a změníme
            datum účinnosti nahoře. U podstatných změn, které se týkají už
            sebraných údajů, vás oslovíme přímo.
          </p>
        </Section>

        <Section number={13} title="Otevřený kód">
          <p>
            Platforma běží na otevřeném softwaru Harmonica pod licencí AGPL-3.0.
            Zdrojový kód verze, kterou právě používáte, najdete pod odkazem
            „Zdrojový kód" v patičce. Můžete si tedy sami ověřit, jak s údaji
            nakládáme.
          </p>
        </Section>
      </div>

    </main>
  );
}

# Fork: entangle-network/harmonica-web-app

Český fork [harmonicabot/harmonica-web-app](https://github.com/harmonicabot/harmonica-web-app).
Licence upstreamu je **AGPL-3.0**, proto je i tento fork veřejný — §13 vyžaduje nabídnout
zdrojové kódy uživatelům, kteří se službou komunikují po síti.

## Remotes a větve

| Remote | Repo |
|---|---|
| `upstream` | `harmonicabot/harmonica-web-app` (jen čteme) |
| `origin` | `entangle-network/harmonica-web-app` (náš fork) |

| Větev | Role |
|---|---|
| `master` | **Čisté zrcadlo upstreamu. Nikdy sem necommitovat.** |
| `cs` | Veškerá naše práce. Z téhle větve se nasazuje. |

## Aktualizace z upstreamu

```bash
git fetch upstream
git checkout master && git merge --ff-only upstream/master && git push origin master
git checkout cs && git merge master
```

Když merge zahlásí konflikt v `package-lock.json`, neřeš ho ručně:

```bash
git checkout --theirs package-lock.json && npm install && git add package-lock.json
```

## Proč jsou naše změny malé

Konflikty vznikají jen na řádcích, které editujeme my i upstream. **Nové soubory
nekonfliktují nikdy**, takže maximum změn míří do nových souborů.

Zásahy do upstream souborů, které nešly obejít:

| Soubor | Změna | Rozsah |
|---|---|---|
| `next.config.js` | obalení `withNextIntl`, `output: 'standalone'`, produkční doména v `serverActions.allowedOrigins` | ~8 řádků |
| `src/app/layout.tsx` | `NextIntlClientProvider`, `lang={locale}` | ~10 řádků |
| `package.json` | závislost `next-intl` | 1 řádek |

Plus postupně komponenty ve `src/`, jak se v nich nahrazují natvrdo psané texty za `t('klic')`.

## i18n

Použit **next-intl v režimu „without i18n routing"**. Standardní setup vyžaduje přesun
celého `src/app/` do `src/app/[locale]/` — to by přesunulo ~100 route souborů a vyrobilo
trvalý konflikt s každou změnou upstreamu. Místo toho se jazyk bere z proměnné `APP_LOCALE`.

- `src/i18n/request.ts` — výběr locale, načtení katalogu
- `messages/en.json` — originální anglické texty (drží se doslova originálu)
- `messages/cs.json` — český překlad
- `APP_LOCALE=cs|en` — **záměrně bez prefixu `NEXT_PUBLIC_`**: takové proměnné Next zapéká
  do bundlu při buildu, takže by změna jazyka vyžadovala rebuild. Tahle se čte na serveru
  za běhu.
- `src/middleware.ts` zůstává nedotčený — žádný next-intl middleware, aby nekolidoval
  s `withMiddlewareAuthRequired` od Auth0.

Commit `feat(i18n): add next-intl scaffolding` je záměrně bez českých textů v komponentách
a dá se nabídnout upstreamu jako PR. Kdyby ho přijali, náš fork se scvrkne na `cs.json`.

### Co se nepřekládá v kódu

| Vrstva | Kde se mění |
|---|---|
| Facilitační prompty (co říká AI účastníkům) | za běhu v UI na `/admin/prompts`, uloženo v DB |
| Jazyk konverzace účastníka | řeší sama aplikace přes `preferred_language` |

### Glosář

session → sezení · workspace → pracovní prostor · facilitator → facilitátor ·
host → pořadatel · participant → účastník · summary → shrnutí · prompt → prompt ·
insights → poznatky

## Lokální vývoj

```bash
docker start harmonica-postgres
npx next dev -p 3001
```

Postgres běží v Dockeru na portu **5433** (5432 drží nesouvisející kontejner `masaryk-pgvector`).
Dev server na **3001** (3000 obsazuje jiný proces) — na tenhle port je navázaná i callback URL v Auth0.

### Pasti v repu

- Migrace `010_20250204_add_summary_assistant` používá `process.env.SUMMARY_ASSISTANT` jako
  default sloupce. Když proměnná chybí, celý běh migrací spadne na
  `invalid immediate value undefined`. V `.env` musí být `SUMMARY_ASSISTANT=` i prázdné.
- `new Stripe(process.env.STRIPE_SECRET_KEY!)` běží na úrovni modulu
  (`src/lib/stripe.ts`, `src/app/api/webhook/stripe/route.ts`), takže bez neprázdného klíče
  neprojde `next build`. Placeholder stačí, i když se Stripe nepoužívá.
- Repo nemá `.env.example`, přestože ho README zmiňuje.

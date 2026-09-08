import { Kysely } from 'kysely';

/**
 * Tag, pod kterým se kontakty z tohoto sezení zakládají v CRM.
 *
 * Facilitátor si ho vyplní v nastavení vzhledu sezení (vedle odkazu na zásady
 * zpracování) a kontakty z formuláře pak v CRM dostanou právě tenhle tag —
 * takže jde pozvat zvlášť lidi z jednoho konkrétního sezení.
 *
 * Vyplněný tag zároveň funguje jako vypínač: teprve když tu něco je, ukáže se
 * v úvodním formuláři nepovinné zaškrtnutí „chci pozvánky na akce“ a teprve
 * pak se kdokoli do CRM posílá. Jeden údaj místo dvou přepínačů, které by
 * spolu stejně musely držet krok.
 *
 * Sloupec je session-only (nedědí se z projektu): tag jednoho sezení nemá
 * smysl přebírat do jiného.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_crm_tag', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_crm_tag')
    .execute();
}

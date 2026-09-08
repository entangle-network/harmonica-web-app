import { Kysely } from 'kysely';

/**
 * Úvodní text závěrečného dotazníku.
 *
 * Dotazník se ptá na věk, pohlaví a vzdělání — údaje, které účastník dá jen
 * tehdy, když ví proč a co se s nimi stane. To vysvětlení je pokaždé jiné
 * podle toho, kdo sezení pořádá a k čemu data slouží, takže nemůže být
 * napevno v překladech.
 *
 * Prázdné pole znamená výchozí znění z katalogu zpráv.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .addColumn('final_survey_intro', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .dropColumn('final_survey_intro')
    .execute();
}

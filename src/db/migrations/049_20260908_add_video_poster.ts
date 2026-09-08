import { Kysely } from 'kysely';

/**
 * Náhledový obrázek úvodního videa.
 *
 * Bez něj je do prvního vykresleného snímku vidět jen tmavý obdélník — a když
 * prohlížeč zakáže spuštění se zvukem, což na telefonu udělá skoro vždycky,
 * zůstane tmavý až do doby, než návštěvník klikne. Právě tam náhledovka
 * nejvíc pomáhá: místo prázdné plochy je vidět, co si pouští.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_intro_video_poster', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_intro_video_poster')
    .execute();
}

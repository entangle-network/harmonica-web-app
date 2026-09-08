import { Kysely } from 'kysely';

/**
 * Odpovědi z úvodního formuláře a časy udělených souhlasů u účastníka.
 *
 * Do téhle chvíle se odpovědi nikam neukládaly jako údaj: slily se do jedné
 * věty („User shared the following context: …“) a zapsaly jako zpráva
 * konverzace, protože je tam potřebuje jazykový model. Do user_db padlo jen
 * jméno. Kdokoli je pak chtěl zpracovat — poslat kontakt do CRM, vyřídit
 * žádost o výmaz, spočítat, odkud se lidé zapojili — musel parsovat přepisy
 * konverzací. Ukládáme je proto zvlášť; zpráva pro model zůstává, jak byla.
 *
 * jsonb, ne json: klíče formuláře si určuje facilitátor, takže pevné sloupce
 * nedávají smysl, ale zároveň potřebujeme umět v odpovědích hledat (typicky
 * podle e-mailu, když někdo požádá o výmaz).
 *
 * Souhlasy jako časy, ne booleany: „nezaškrtnuto“ a „zaškrtnuto v 14:32“ nesou
 * jinou informaci a u souhlasu je okamžik jeho udělení to, co je potřeba umět
 * doložit. NULL znamená nedal.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user_db')
    .addColumn('answers', 'jsonb')
    .addColumn('consent_at', 'timestamp')
    .addColumn('marketing_consent_at', 'timestamp')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user_db')
    .dropColumn('answers')
    .dropColumn('consent_at')
    .dropColumn('marketing_consent_at')
    .execute();
}

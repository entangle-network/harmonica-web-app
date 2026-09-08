import { Kysely } from 'kysely';

/**
 * Dotazník na konec konverzace.
 *
 * Úvodní formulář (`questions`) se ptá dřív, než člověk cokoli řekl, takže
 * každá otázka navíc tam snižuje šanci, že vůbec začne. Po dokončeném
 * rozhovoru je ochota jiná — a demografické údaje tam dávají větší smysl,
 * protože už je jasné, ke které odpovědi patří.
 *
 * Stejný tvar jako `questions`: pole QuestionInfo v JSON. Tím se dá znovu
 * použít FormBuilder i vykreslení voleb, včetně výběru z možností.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .addColumn('final_questions', 'json')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('host_db').dropColumn('final_questions').execute();
}

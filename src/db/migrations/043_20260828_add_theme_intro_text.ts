import { Kysely } from 'kysely';

/**
 * The welcome paragraph on the participant invitation card.
 *
 * It was a fixed string in the UI copy, so every session greeted people the same
 * way regardless of what it was about — a municipal topic collection and an
 * internal company retro got identical wording. Hosts can now write their own,
 * inherited from the project like the rest of the appearance settings.
 */

export async function up(db: Kysely<any>): Promise<void> {
  for (const table of ['workspaces', 'host_db']) {
    await db.schema
      .alterTable(table)
      .addColumn('theme_intro_text', 'text')
      .execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const table of ['host_db', 'workspaces']) {
    await db.schema.alterTable(table).dropColumn('theme_intro_text').execute();
  }
}

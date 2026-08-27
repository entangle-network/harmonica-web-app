import { Kysely } from 'kysely';

/**
 * A host-supplied privacy policy link for the participant footer.
 *
 * The footer pointed at harmonica.chat's policy, which is wrong for a
 * self-hosted instance: the data controller is whoever runs it, not the project
 * whose code they run. Hosts need to point participants at their own policy.
 */

export async function up(db: Kysely<any>): Promise<void> {
  for (const table of ['workspaces', 'host_db']) {
    await db.schema
      .alterTable(table)
      .addColumn('theme_privacy_url', 'text')
      .execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const table of ['host_db', 'workspaces']) {
    await db.schema.alterTable(table).dropColumn('theme_privacy_url').execute();
  }
}

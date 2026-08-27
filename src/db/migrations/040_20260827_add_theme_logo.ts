import { Kysely } from 'kysely';

/**
 * A host's own logo in the participant footer, replacing the "Powered by
 * Harmonica" lockup.
 *
 * The link target is stored alongside the image because a logo without one is a
 * dead end — hosts put their organisation's site behind it.
 *
 * Note this does not affect the AGPL §13 source link, which stays regardless of
 * branding: the licence covers the code, the Harmonica wordmark is a trademark
 * that was never licensed to begin with.
 */

async function addLogoColumns(db: Kysely<any>, table: string) {
  await db.schema
    .alterTable(table)
    .addColumn('theme_logo_id', 'uuid')
    .addColumn('theme_logo_url', 'text')
    .execute();
}

async function dropLogoColumns(db: Kysely<any>, table: string) {
  await db.schema
    .alterTable(table)
    .dropColumn('theme_logo_id')
    .dropColumn('theme_logo_url')
    .execute();
}

export async function up(db: Kysely<any>): Promise<void> {
  await addLogoColumns(db, 'workspaces');
  await addLogoColumns(db, 'host_db');
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropLogoColumns(db, 'host_db');
  await dropLogoColumns(db, 'workspaces');
}

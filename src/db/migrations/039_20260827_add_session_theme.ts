import { Kysely, sql } from 'kysely';

/**
 * Participant-facing theming: a session can be made to look like the project it
 * belongs to.
 *
 * Images live in the database rather than in blob storage. The existing upload
 * path (src/actions/upload-logo.ts) uses @vercel/blob, which a self-hosted
 * deployment has no token for; keeping the bytes here means no extra service and
 * they are covered by the database backup.
 *
 * Colours are stored on both workspaces and sessions. Each value is inherited
 * independently, so a session can override just the button colour and keep the
 * rest from its project.
 */

async function addThemeColumns(db: Kysely<any>, table: string) {
  await db.schema
    .alterTable(table)
    .addColumn('theme_primary', 'text')
    .addColumn('theme_gradient_from', 'text')
    .addColumn('theme_surface', 'text')
    // No foreign key on purpose: deleting an image should not cascade into
    // sessions, and a dangling id simply falls back to the default artwork.
    .addColumn('theme_intro_image_id', 'uuid')
    .addColumn('theme_avatar_id', 'uuid')
    .execute();
}

async function dropThemeColumns(db: Kysely<any>, table: string) {
  await db.schema
    .alterTable(table)
    .dropColumn('theme_primary')
    .dropColumn('theme_gradient_from')
    .dropColumn('theme_surface')
    .dropColumn('theme_intro_image_id')
    .dropColumn('theme_avatar_id')
    .execute();
}

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('theme_images')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('mime_type', 'text', (col) => col.notNull())
    .addColumn('data', sql`bytea`, (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await addThemeColumns(db, 'workspaces');
  await addThemeColumns(db, 'host_db');
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropThemeColumns(db, 'host_db');
  await dropThemeColumns(db, 'workspaces');
  await db.schema.dropTable('theme_images').execute();
}

import { Kysely, sql } from 'kysely';

/**
 * Creates the api_keys table.
 *
 * The application has always queried it — src/lib/db.ts declares the table and
 * the settings page lists keys from it — but no migration ever created it, so on
 * any database built from migrations alone every lookup failed with
 * `relation "api_keys" does not exist`. The error is caught and logged, which is
 * why the key list simply stayed empty instead of breaking the page.
 *
 * Columns follow ApiKeysTable in src/lib/schema.ts.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('api_keys')
    .ifNotExists()
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'text', (col) => col.notNull())
    // Only the hash is stored; the key itself is shown once at creation and
    // never again, which is what the create dialog warns about.
    .addColumn('key_hash', 'text', (col) => col.notNull().unique())
    // The visible "sk_live_abc…" fragment, so a user can tell their keys apart.
    .addColumn('key_prefix', 'text', (col) => col.notNull())
    .addColumn('name', 'text')
    .addColumn('last_used_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    // Revoking sets this rather than deleting the row, so a leaked key cannot be
    // silently re-created and past usage stays auditable.
    .addColumn('revoked_at', 'timestamptz')
    .execute();

  // Every read filters on the owner and skips revoked keys.
  await db.schema
    .createIndex('api_keys_user_id_idx')
    .ifNotExists()
    .on('api_keys')
    .columns(['user_id', 'revoked_at'])
    .execute();

  // Authenticating a request looks the key up by its hash.
  await db.schema
    .createIndex('api_keys_key_hash_idx')
    .ifNotExists()
    .on('api_keys')
    .column('key_hash')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('api_keys').ifExists().execute();
}

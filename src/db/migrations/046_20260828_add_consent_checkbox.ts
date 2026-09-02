import { Kysely } from 'kysely';

/**
 * Optional consent checkbox on the participant form.
 *
 * A self-hosted instance makes whoever runs it the data controller, and public
 * consultations often need explicit consent before any answer is collected.
 * Hosts can switch a required checkbox on; it links to the privacy policy set
 * on the same appearance screen (theme_privacy_url).
 *
 * Nullable rather than NOT NULL DEFAULT false: the resolver reads null as off,
 * and this keeps "never configured" distinct from "deliberately turned off".
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_require_consent', 'boolean')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_require_consent')
    .execute();
}

import { Kysely } from 'kysely';

/**
 * Per-session control over the participant invitation card.
 *
 * The card had a fixed shape: illustration, the "share your perspective"
 * heading, then the welcome paragraph. Hosts running very different sessions
 * want different amounts of that — a short internal round needs none of it,
 * while a public consultation may want to open with a video message instead.
 *
 * Only host_db gets these. The colours and images are inherited from the
 * project because a project has a look; how much intro copy a particular
 * conversation needs is a property of that conversation, so there is nothing
 * sensible to inherit and a workspace-level column would never be written.
 *
 * The flags are nullable rather than NOT NULL DEFAULT true so that "never
 * touched" stays distinguishable from "deliberately switched on"; the resolver
 * reads null as shown.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_show_intro_image', 'boolean')
    .execute();
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_show_intro_heading', 'boolean')
    .execute();
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_show_intro_text', 'boolean')
    .execute();
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_intro_video_url', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_intro_video_url')
    .execute();
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_show_intro_text')
    .execute();
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_show_intro_heading')
    .execute();
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_show_intro_image')
    .execute();
}

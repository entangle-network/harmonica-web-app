import { Kysely } from 'kysely';

/**
 * Video-first invitation card.
 *
 * With the video sitting in the narrow left column above the welcome box it
 * reads as an illustration next to the text. Hosts who record an introduction
 * want the opposite: the video is the message, and everything else is in its
 * way. This flag drops the illustration, the heading and the welcome box, and
 * gives the video the full width with a single prominent button under it.
 */

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .addColumn('theme_video_fullscreen', 'boolean')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('host_db')
    .dropColumn('theme_video_fullscreen')
    .execute();
}

'use server';

import { getSession } from '@auth0/nextjs-auth0';
import { getDbInstance, getPermissions } from '@/lib/db';
import { serverMessage } from '@/lib/serverMessages';

type Target = { kind: 'SESSION' | 'WORKSPACE'; id: string };
type ThemeImageSlot = 'intro' | 'avatar' | 'logo';

const IMAGE_COLUMNS: Record<ThemeImageSlot, string> = {
  intro: 'theme_intro_image_id',
  avatar: 'theme_avatar_id',
  logo: 'theme_logo_id',
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

function tableFor(kind: Target['kind']) {
  return kind === 'WORKSPACE' ? 'workspaces' : 'host_db';
}

const MAY_EDIT = ['admin', 'owner', 'editor'];

/**
 * Appearance is what participants see, so changing it is gated like editing the
 * session itself rather than being open to anyone who can view it.
 *
 * The check is written here rather than reused because the repository has no
 * server-side role helper — src/app/actions/permissions.ts still carries a
 * "TODO: Add permission check" where one belongs.
 */
async function assertMayEdit(target: Target) {
  const session = await getSession();
  const userId = session?.user?.sub;
  if (!userId) {
    throw new Error(await serverMessage('authRequired'));
  }

  const permissions = await getPermissions(target.id, target.kind);
  const mine = permissions.find((p) => p.user_id === userId);

  if (!mine || !MAY_EDIT.includes(mine.role)) {
    throw new Error(await serverMessage('unauthorized'));
  }
}

export async function saveThemeColors(
  target: Target,
  colors: {
    primary?: string | null;
    gradientFrom?: string | null;
    surface?: string | null;
    logoUrl?: string | null;
    privacyUrl?: string | null;
    introText?: string | null;
    showIntroImage?: boolean;
    showIntroHeading?: boolean;
    showIntroText?: boolean;
    introVideoUrl?: string | null;
    videoFullscreen?: boolean;
  },
) {
  await assertMayEdit(target);

  const db = await getDbInstance();
  await db
    .updateTable(tableFor(target.kind) as any)
    .set({
      // undefined means "leave as is"; null clears the override so the value is
      // inherited again.
      ...(colors.primary !== undefined ? { theme_primary: colors.primary } : {}),
      ...(colors.gradientFrom !== undefined
        ? { theme_gradient_from: colors.gradientFrom }
        : {}),
      ...(colors.surface !== undefined ? { theme_surface: colors.surface } : {}),
      ...(colors.logoUrl !== undefined ? { theme_logo_url: colors.logoUrl } : {}),
      ...(colors.privacyUrl !== undefined
        ? { theme_privacy_url: colors.privacyUrl }
        : {}),
      ...(colors.introText !== undefined
        ? { theme_intro_text: colors.introText }
        : {}),
      // Invitation card layout lives on the session only, so these are ignored
      // for a project even if a caller passes them.
      ...(target.kind === 'SESSION'
        ? {
            ...(colors.showIntroImage !== undefined
              ? { theme_show_intro_image: colors.showIntroImage }
              : {}),
            ...(colors.showIntroHeading !== undefined
              ? { theme_show_intro_heading: colors.showIntroHeading }
              : {}),
            ...(colors.showIntroText !== undefined
              ? { theme_show_intro_text: colors.showIntroText }
              : {}),
            ...(colors.introVideoUrl !== undefined
              ? { theme_intro_video_url: colors.introVideoUrl }
              : {}),
            ...(colors.videoFullscreen !== undefined
              ? { theme_video_fullscreen: colors.videoFullscreen }
              : {}),
          }
        : {}),
    } as any)
    .where('id', '=', target.id)
    .execute();

  return { success: true };
}

export async function uploadThemeImage(formData: FormData) {
  const kind = formData.get('kind') as Target['kind'];
  const id = formData.get('id') as string;
  const slot = formData.get('slot') as ThemeImageSlot;
  const file = formData.get('file') as File | null;

  if (!kind || !id || !slot || !file) {
    throw new Error(await serverMessage('invalidRequest'));
  }

  await assertMayEdit({ kind, id });

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(await serverMessage('imageTypeUnsupported'));
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(await serverMessage('imageTooLarge'));
  }

  const db = await getDbInstance();
  const bytes = Buffer.from(await file.arrayBuffer());

  const inserted = await db
    .insertInto('theme_images')
    .values({ mime_type: file.type, data: bytes })
    .returning('id')
    .executeTakeFirstOrThrow();

  const column = IMAGE_COLUMNS[slot];
  await db
    .updateTable(tableFor(kind) as any)
    .set({ [column]: inserted.id } as any)
    .where('id', '=', id)
    .execute();

  // A previous image is intentionally left in place: its id is cached
  // indefinitely by browsers and may still be referenced elsewhere. Pruning
  // unreferenced rows is a maintenance job, not part of an upload.
  return { success: true, imageId: inserted.id };
}

export async function clearThemeImage(target: Target, slot: ThemeImageSlot) {
  await assertMayEdit(target);

  const column = IMAGE_COLUMNS[slot];
  const db = await getDbInstance();
  await db
    .updateTable(tableFor(target.kind) as any)
    .set({ [column]: null } as any)
    .where('id', '=', target.id)
    .execute();

  return { success: true };
}

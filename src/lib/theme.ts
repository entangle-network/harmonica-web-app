'use server';

import { getDbInstance } from '@/lib/db';
import { EMPTY_THEME, type SessionTheme } from '@/lib/themeColors';

/**
 * Resolves the participant-facing appearance for one session.
 *
 * Values are resolved per field, not per level: a session that only sets a button
 * colour keeps its project's background. `null` means "inherit further", and a
 * fully unset theme leaves the app's default look untouched.
 */

type ThemeColumns = {
  theme_primary?: string | null;
  theme_gradient_from?: string | null;
  theme_surface?: string | null;
  theme_intro_image_id?: string | null;
  theme_avatar_id?: string | null;
  theme_logo_id?: string | null;
  theme_logo_url?: string | null;
  theme_privacy_url?: string | null;
  theme_intro_text?: string | null;
};

function pick(...levels: (ThemeColumns | undefined)[]): SessionTheme {
  const first = (key: keyof ThemeColumns) =>
    levels.find((level) => level?.[key])?.[key] ?? null;

  return {
    primary: first('theme_primary'),
    gradientFrom: first('theme_gradient_from'),
    surface: first('theme_surface'),
    introImageId: first('theme_intro_image_id'),
    avatarId: first('theme_avatar_id'),
    logoId: first('theme_logo_id'),
    logoUrl: first('theme_logo_url'),
    privacyUrl: first('theme_privacy_url'),
    introText: first('theme_intro_text'),
  };
}

export async function getSessionTheme(
  sessionId: string,
): Promise<SessionTheme> {
  try {
    const db = await getDbInstance();

    const session = await db
      .selectFrom('host_db')
      .where('id', '=', sessionId)
      .select([
        'theme_primary',
        'theme_gradient_from',
        'theme_surface',
        'theme_intro_image_id',
        'theme_avatar_id',
        'theme_logo_id',
        'theme_logo_url',
        'theme_privacy_url',
        'theme_intro_text',
      ])
      .executeTakeFirst();

    // A session can belong to several projects. Rather than leaving the look to
    // whichever row the database returns first, take the project it was linked
    // to first, so the appearance does not change when it joins another one.
    const workspace = await db
      .selectFrom('workspaces')
      .innerJoin(
        'workspace_sessions',
        'workspace_sessions.workspace_id',
        'workspaces.id',
      )
      .where('workspace_sessions.session_id', '=', sessionId)
      .orderBy('workspaces.created_at', 'asc')
      .select([
        'workspaces.theme_primary',
        'workspaces.theme_gradient_from',
        'workspaces.theme_surface',
        'workspaces.theme_intro_image_id',
        'workspaces.theme_avatar_id',
        'workspaces.theme_logo_id',
        'workspaces.theme_logo_url',
        'workspaces.theme_privacy_url',
        'workspaces.theme_intro_text',
      ])
      .executeTakeFirst();

    return pick(session ?? undefined, workspace ?? undefined);
  } catch (error) {
    // Appearance is decoration: a failure here must not stop a participant from
    // joining, so fall back to the default look.
    console.error('[i] Failed to resolve session theme:', error);
    return EMPTY_THEME;
  }
}

export async function getWorkspaceTheme(
  workspaceId: string,
): Promise<SessionTheme> {
  try {
    const db = await getDbInstance();
    const workspace = await db
      .selectFrom('workspaces')
      .where('id', '=', workspaceId)
      .select([
        'theme_primary',
        'theme_gradient_from',
        'theme_surface',
        'theme_intro_image_id',
        'theme_avatar_id',
        'theme_logo_id',
        'theme_logo_url',
        'theme_privacy_url',
        'theme_intro_text',
      ])
      .executeTakeFirst();

    return pick(workspace ?? undefined);
  } catch (error) {
    console.error('[i] Failed to resolve workspace theme:', error);
    return EMPTY_THEME;
  }
}

/**
 * The values set directly on one resource, without inheritance.
 *
 * The editor needs these rather than the resolved theme: showing an inherited
 * colour in the input would make an empty field look filled, and saving would
 * silently turn inheritance into a fixed override.
 */
export async function getOwnTheme(
  kind: 'SESSION' | 'WORKSPACE',
  id: string,
): Promise<SessionTheme> {
  try {
    const db = await getDbInstance();
    const row = await db
      .selectFrom(kind === 'WORKSPACE' ? 'workspaces' : 'host_db')
      .where('id', '=', id)
      .select([
        'theme_primary',
        'theme_gradient_from',
        'theme_surface',
        'theme_intro_image_id',
        'theme_avatar_id',
        'theme_logo_id',
        'theme_logo_url',
        'theme_privacy_url',
        'theme_intro_text',
      ])
      .executeTakeFirst();

    return pick(row ?? undefined);
  } catch (error) {
    console.error('[i] Failed to read theme:', error);
    return EMPTY_THEME;
  }
}

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
  // Session-only, see migration 044.
  theme_show_intro_image?: boolean | null;
  theme_show_intro_heading?: boolean | null;
  theme_show_intro_text?: boolean | null;
  theme_intro_video_url?: string | null;
  theme_video_fullscreen?: boolean | null;
  theme_require_consent?: boolean | null;
};

/** Columns both tables carry, and which inherit session -> project. */
const SHARED_COLUMNS = [
  'theme_primary',
  'theme_gradient_from',
  'theme_surface',
  'theme_intro_image_id',
  'theme_avatar_id',
  'theme_logo_id',
  'theme_logo_url',
  'theme_privacy_url',
  'theme_intro_text',
] as const;

/** Invitation card layout — only ever set on a session. */
const SESSION_COLUMNS = [
  'theme_show_intro_image',
  'theme_show_intro_heading',
  'theme_show_intro_text',
  'theme_intro_video_url',
  'theme_video_fullscreen',
  'theme_require_consent',
] as const;

function pick(...levels: (ThemeColumns | undefined)[]): SessionTheme {
  const first = (key: keyof ThemeColumns) =>
    levels.find((level) => level?.[key])?.[key] ?? null;

  // `first` selects on truthiness, which is right for "" and wrong for `false`:
  // a switch turned off would look unset and inherit back to on. The flags are
  // therefore read from the session level directly, with null meaning shown.
  const flag = (key: keyof ThemeColumns) => levels[0]?.[key] !== false;

  return {
    primary: first('theme_primary') as string | null,
    gradientFrom: first('theme_gradient_from') as string | null,
    surface: first('theme_surface') as string | null,
    introImageId: first('theme_intro_image_id') as string | null,
    avatarId: first('theme_avatar_id') as string | null,
    logoId: first('theme_logo_id') as string | null,
    logoUrl: first('theme_logo_url') as string | null,
    privacyUrl: first('theme_privacy_url') as string | null,
    introText: first('theme_intro_text') as string | null,
    showIntroImage: flag('theme_show_intro_image'),
    showIntroHeading: flag('theme_show_intro_heading'),
    showIntroText: flag('theme_show_intro_text'),
    introVideoUrl: (levels[0]?.theme_intro_video_url ?? null) as string | null,
    // Opt-in, so the default here is off rather than on.
    videoFullscreen: levels[0]?.theme_video_fullscreen === true,
    requireConsent: levels[0]?.theme_require_consent === true,
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
      .select([...SHARED_COLUMNS, ...SESSION_COLUMNS] as any)
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
      .select(SHARED_COLUMNS.map((c) => `workspaces.${c}`) as any)
      .executeTakeFirst();

    return pick(
      (session ?? undefined) as ThemeColumns | undefined,
      (workspace ?? undefined) as ThemeColumns | undefined,
    );
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
      .select(SHARED_COLUMNS as any)
      .executeTakeFirst();

    return pick((workspace ?? undefined) as ThemeColumns | undefined);
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
    const columns =
      kind === 'WORKSPACE'
        ? [...SHARED_COLUMNS]
        : [...SHARED_COLUMNS, ...SESSION_COLUMNS];

    const row = await db
      .selectFrom(kind === 'WORKSPACE' ? 'workspaces' : 'host_db')
      .where('id', '=', id)
      .select(columns as any)
      .executeTakeFirst();

    return pick((row ?? undefined) as ThemeColumns | undefined);
  } catch (error) {
    console.error('[i] Failed to read theme:', error);
    return EMPTY_THEME;
  }
}

'use client';

import { useTranslations } from 'next-intl';

/**
 * AGPL-3.0 §13: anyone interacting with this app over a network must be offered
 * the Corresponding Source of the *running* version. A link to the repository's
 * default branch is not that — it drifts from what is deployed — so the link
 * points at the exact commit whenever the build knows it.
 *
 * NEXT_PUBLIC_SOURCE_URL and NEXT_PUBLIC_SOURCE_COMMIT are inlined at build
 * time, which is what makes the commit correspond to this build.
 */
const REPO =
  process.env.NEXT_PUBLIC_SOURCE_URL ||
  'https://github.com/entangle-network/harmonica-web-app';

const COMMIT = process.env.NEXT_PUBLIC_SOURCE_COMMIT;

// Some build platforms hand the builder an export of the repository with no git
// metadata, leaving the commit unknown. Falling back to the deployed branch is
// still a correct offer of the Corresponding Source — unlike the repository
// root, which says nothing about which code is running.
const BRANCH = process.env.NEXT_PUBLIC_SOURCE_BRANCH || 'cs';

export function sourceUrl() {
  return `${REPO}/tree/${COMMIT || BRANCH}`;
}

export function SourceLink({ className }: { className?: string }) {
  const t = useTranslations('common');

  return (
    <a
      href={sourceUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        'text-xs text-muted-foreground hover:text-foreground transition-colors underline'
      }
      title={COMMIT ? `${t('sourceCode')} (${COMMIT.slice(0, 7)})` : t('sourceCode')}
    >
      {t('sourceCode')}
    </a>
  );
}

'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSessionTheme } from '@/components/SessionTheme';
import { themeImageUrl } from '@/lib/themeColors';

/**
 * The branding line in the participant footer.
 *
 * With a logo configured it replaces the "Powered by Harmonica" lockup entirely
 * — the wordmark is a trademark rather than something the AGPL requires to be
 * shown, so a host may put their own organisation there. The source link that
 * §13 does require is rendered separately and is unaffected by this.
 */
export function ParticipantFooterBrand({
  className = 'inline-flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors',
  // Sized against the chat sidebar (w-80 minus padding), which is the tightest
  // place it appears; max-width keeps a wide wordmark from overflowing there.
  logoClassName = 'h-10 w-auto max-w-[240px]',
}: {
  className?: string;
  logoClassName?: string;
}) {
  const t = useTranslations('chat');
  const theme = useSessionTheme();
  const logo = themeImageUrl(theme.logoId);

  if (logo) {
    const image = (
      <img src={logo} alt="" className={logoClassName} />
    );

    // A logo with nowhere to go is a dead end, but an unset link should not turn
    // into a link to this app either — show it plain instead.
    return theme.logoUrl ? (
      <a
        href={theme.logoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center"
      >
        {image}
      </a>
    ) : (
      <span className="inline-flex items-center">{image}</span>
    );
  }

  return (
    <Link href="/" className={className}>
      {t('poweredBy')}{' '}
      <img src="/harmonica-lockup.svg" alt="Harmonica" className="h-3 w-auto" />
    </Link>
  );
}

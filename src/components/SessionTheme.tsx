'use client';

import { createContext, useContext, useMemo } from 'react';
import {
  EMPTY_THEME,
  deriveAccents,
  hexToHslTriplet,
  readableForeground,
  type SessionTheme as Theme,
} from '@/lib/themeColors';

const ThemeContext = createContext<Theme>(EMPTY_THEME);

/** The images a themed screen should use, or null to keep the default artwork. */
export function useSessionTheme() {
  return useContext(ThemeContext);
}

/**
 * Applies a session's appearance to everything inside it.
 *
 * Colours are set as CSS variables on a wrapper rather than as classes on each
 * element. That is what keeps this feature nearly free of changes to the app's
 * own components: buttons already read `--primary` (see tailwind.config.js), so
 * overriding the variable here restyles them without touching Button at all.
 *
 * Unset values are simply not emitted, so anything the host left alone keeps
 * inheriting the app's defaults instead of being overwritten with a guess.
 */
export function SessionTheme({
  theme,
  className,
  children,
}: {
  theme?: Theme | null;
  className?: string;
  children: React.ReactNode;
}) {
  const resolved = theme ?? EMPTY_THEME;

  const style = useMemo(() => {
    const vars: Record<string, string> = {};

    const primary = resolved.primary && hexToHslTriplet(resolved.primary);
    if (primary) {
      vars['--primary'] = primary;
      // Without this the label keeps the default foreground and can end up
      // white-on-yellow.
      vars['--primary-foreground'] = readableForeground(resolved.primary!);
    }

    const accents = deriveAccents(resolved.primary);
    if (accents) {
      vars['--session-accent'] = accents.accent;
      vars['--session-accent-foreground'] = accents.accentForeground;
      vars['--session-ring'] = accents.ring;
    }

    if (resolved.gradientFrom) {
      vars['--session-gradient-from'] = resolved.gradientFrom;
    }
    if (resolved.surface) {
      vars['--session-surface'] = resolved.surface;
    }

    return vars as React.CSSProperties;
  }, [resolved.primary, resolved.gradientFrom, resolved.surface]);

  return (
    <ThemeContext.Provider value={resolved}>
      <div style={style} className={className}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

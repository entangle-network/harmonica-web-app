'use client';

import { useLocale } from 'next-intl';
import { cs, enUS } from 'date-fns/locale';

/**
 * The date-fns locale matching the active UI locale.
 *
 * Use it together with date-fns' localized format tokens (P, PP, PPp) rather
 * than hardcoded patterns such as 'MMM d, yyyy' — those keep an English shape
 * even when the month name gets localized.
 */
export function useDateLocale() {
  return useLocale() === 'cs' ? cs : enUS;
}

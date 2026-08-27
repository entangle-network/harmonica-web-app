import { getTranslations } from 'next-intl/server';

/**
 * Message text for something a server action reports back to the UI.
 *
 * Server actions have no React context, so they cannot use useTranslations. The
 * strings matter because the components that display them treat the server's
 * message as authoritative — `result.message || t('fallback')` means an
 * untranslated server string wins over the component's translated fallback.
 *
 * next-intl caches getTranslations per request, so calling this per message is
 * cheap and avoids threading a translator through every action.
 */
export async function serverMessage(key: string): Promise<string> {
  const t = await getTranslations('serverErrors');
  return t(key);
}

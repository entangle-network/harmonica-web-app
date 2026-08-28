import { getRequestConfig } from 'next-intl/server';

// Single-locale setup ("without i18n routing"): the active locale is chosen via the
// APP_LOCALE environment variable rather than a URL segment. This deliberately avoids
// moving the app into a src/app/[locale]/ route group, which would relocate every route
// file in the project.
//
// APP_LOCALE is intentionally not a NEXT_PUBLIC_ variable: those are inlined into the
// client bundle at build time, which would put the locale in every JS chunk.
//
// It is read on the server, but it still has to be set for `next build` as well as at
// run time: statically prerendered routes (/create, /admin/*, /settings, /templates)
// are rendered during the build, so their text — and <html lang> — come from whatever
// this said back then. Changing it in the deployment environment alone leaves those
// pages in the build-time language. See the APP_LOCALE build argument in the Dockerfile.
export const locales = ['en', 'cs'] as const;
export const defaultLocale: Locale = 'en';

export type Locale = (typeof locales)[number];

function resolveLocale(): Locale {
  const configured = process.env.APP_LOCALE;
  return locales.includes(configured as Locale)
    ? (configured as Locale)
    : defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = resolveLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

import { getRequestConfig } from 'next-intl/server';

// Single-locale setup ("without i18n routing"): the active locale is chosen via the
// APP_LOCALE environment variable rather than a URL segment. This deliberately avoids
// moving the app into a src/app/[locale]/ route group, which would relocate every route
// file in the project.
//
// APP_LOCALE is intentionally not a NEXT_PUBLIC_ variable: those are inlined at build
// time, which would mean a rebuild for every locale change. This one is read on the
// server at runtime, so changing it in the deployment environment is enough.
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

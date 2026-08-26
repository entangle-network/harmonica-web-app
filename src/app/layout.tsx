import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Providers } from './providers';
import '../styles/global.css';
import { Instrument_Sans } from 'next/font/google';
import ClientLayout from './clientLayout';
import { getGeneratedMetadata } from './api/metadata';
import { Toaster } from '@/components/ui/toaster';

const instrumentSans = Instrument_Sans({ subsets: ['latin'] });
export const metadata = getGeneratedMetadata('/');

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = await getTranslations('common');

  return (
    <html lang={locale} className={instrumentSans.className}>
      <body>
        <Suspense fallback={<div>{t('loading')}</div>}>
          <NextIntlClientProvider>
            <Providers>
              <Toaster />
              <ClientLayout>{children}</ClientLayout>
            </Providers>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}

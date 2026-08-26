'use client';

import { useTranslations } from 'next-intl';

export function StepHeader() {
  const t = useTranslations('dashboard');

  return (
    <div className="flex items-center justify-center mb-6">

      <h1 className="font-medium text-sm text-gray-400 px-4 py-2 border rounded-lg shadow-sm">{t('newSession')}</h1>

    </div>
  );
}

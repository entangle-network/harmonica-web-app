'use client';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  const router = useRouter();
  const isAccessDenied = error.message.includes('Access denied');

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h2 className="mt-6 text-2xl font-bold tracking-tight">
          {isAccessDenied ? t('accessDenied') : t('somethingWrong')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {isAccessDenied
            ? t('noPermissionWorkspace')
            : t('loadWorkspaceFailed')}
        </p>
        <div className="mt-8 flex gap-2">
          <Button onClick={() => router.push('/')} className="mr-2" variant="outline">
            {t('goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
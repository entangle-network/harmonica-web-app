'use client';

import { useTranslations } from 'next-intl'; // Error boundaries must be Client Components

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('misc');
  useEffect(() => {
    console.error('Error from main app: ', error);
  }, [error]);
  console.log('Error message: ', error.message);
  return (
    <div className="pt-16 sm:px-14 pb-16 ">
      <div className="flex flex-col items-center justify-center gap-4">
        <h2>{t('errorTitle')}</h2>
        {error.message}
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

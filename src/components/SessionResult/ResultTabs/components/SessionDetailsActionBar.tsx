'use client';

import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface SessionDetailsActionBarProps {
  onSave: () => void;
  onCancel: () => void;
}

export function SessionDetailsActionBar({
  onSave,
  onCancel,
}: SessionDetailsActionBarProps) {
  const t = useTranslations('common');

  return (
    <div className="sticky bottom-0 left-0 right-0 flex-grow-0 flex-shrink-0 px-[60px] py-4 bg-background border-t border-border -mx-[60px]">
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          variant="default"
          size="sm"
        >
          {t('update')}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}


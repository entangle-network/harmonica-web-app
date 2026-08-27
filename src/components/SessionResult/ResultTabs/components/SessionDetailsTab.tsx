'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SessionDetailsTabProps {
  formData: {
    sessionName: string;
    goal: string;
    critical: string;
    context: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export function SessionDetailsTab({
  formData,
  onFieldChange,
}: SessionDetailsTabProps) {
  const t = useTranslations('sessionDetails');

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* a. Session Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">{t('nameLabel')}</Label>
        <Input
          value={formData.sessionName}
          onChange={(e) => onFieldChange('sessionName', e.target.value)}
          placeholder={t('namePlaceholder')}
        />
      </div>

      {/* b. Goal */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">{t('goalLabel')}</Label>
        <Textarea
          value={formData.goal}
          onChange={(e) => onFieldChange('goal', e.target.value)}
          placeholder={t('goalPlaceholder')}
          rows={4}
        />
      </div>

      {/* c. Critical Info */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">{t('criticalLabel')}</Label>
        <Textarea
          value={formData.critical}
          onChange={(e) => onFieldChange('critical', e.target.value)}
          placeholder={t('criticalPlaceholder')}
          rows={4}
        />
      </div>

      {/* d. Context */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">{t('contextLabel')}</Label>
        <Textarea
          value={formData.context}
          onChange={(e) => onFieldChange('context', e.target.value)}
          placeholder={t('contextPlaceholder')}
          rows={4}
        />
      </div>
    </div>
  );
}


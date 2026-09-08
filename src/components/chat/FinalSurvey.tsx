'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { QuestionInfo, QuestionType } from 'app/create/types';

/**
 * Dotazník po dokončené konverzaci.
 *
 * Ptát se na věk, bydliště nebo vzdělání až tady má dvě výhody proti
 * úvodnímu formuláři: účastníka to nezdrží, než vůbec začne, a ptáme se
 * někoho, kdo už rozhovor absolvoval a je vstřícnější.
 *
 * Odpovědi se ukládají stejně jako ty z úvodního formuláře — jako zpráva
 * ve vlákně. Tím se dostanou do přepisu, do souhrnů i do exportu, aniž by
 * je bylo potřeba vést zvlášť.
 */
export function FinalSurvey({
  questions,
  intro,
  onSubmit,
  onSkip,
}: {
  questions: QuestionInfo[];
  /** Vysvetleni od poradatele; prazdne pouzije vychozi zneni. */
  intro?: string;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onSkip: () => void;
}) {
  const t = useTranslations('finalSurvey');
  const tCommon = useTranslations('common');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const missing: Record<string, string> = {};
    questions.forEach((q) => {
      if (q.required && !answers[q.id]?.trim()) {
        missing[q.id] = t('fieldRequired');
      }
    });

    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h3 className="text-xl font-semibold">{t('heading')}</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
          {intro?.trim() || t('body')}
        </p>

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-gray-700">
                {q.label}{' '}
                {q.required && <span className="text-gray-400">*</span>}
              </Label>

              {q.type === QuestionType.OPTIONS && q.options ? (
                <Select
                  value={answers[q.id]}
                  onValueChange={(value) => setAnswer(q.id, value)}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder={t('selectOption')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(q.options)).map((opt) => (
                      <SelectItem key={`${q.id}_${opt}`} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={q.type === QuestionType.EMAIL ? 'email' : 'text'}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="bg-white"
                />
              )}

              {errors[q.id] && (
                <p className="text-sm text-red-500">{errors[q.id]}</p>
              )}
            </div>
          ))}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {/* Vyplnění je dobrovolné: konverzace už proběhla a nikoho o její
                výsledek nepřipravíme jen proto, že nechce uvést věk. */}
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              {t('skip')}
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tCommon('sending')}
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

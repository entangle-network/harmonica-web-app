import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';
import { toast, useToast } from 'hooks/use-toast';

interface GenerateResponsesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export default function GenerateResponsesModal({
  isOpen,
  onOpenChange,
  sessionId,
}: GenerateResponsesModalProps) {
  const t = useTranslations('generateResponses');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    numSessions: 1,
    temperature: 0.7,
    maxAnswers: 10,
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sessions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t('toast.generateFailed'));
      }

      onOpenChange(false);

      toast({
        title: tCommon('success'),
        description: t('toast.generated', { count: formData.numSessions }),
      });
    } catch (error) {
      console.error('Failed to generate sessions:', error);
      toast({
        title: tCommon('error'),
        description:
          error instanceof Error
            ? error.message
            : t('toast.generateFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCharacters = async () => {
    setIsGeneratingCharacters(true);
    try {
      const response = await fetch(
        `/api/sessions/${sessionId}/generate-characters`,
        {
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error(t('toast.charactersFailed'));
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        prompt: data.characters,
      }));
    } catch (error) {
      console.error('Failed to generate characters:', error);
      toast({
        title: tCommon('error'),
        description: t('toast.charactersFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCharacters(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="prompt">{t('promptLabel')}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateCharacters}
                disabled={isGeneratingCharacters}
              >
                {isGeneratingCharacters ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon('generating')}
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('addCharacters')}
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="prompt"
              value={formData.prompt}
              onChange={(e) =>
                setFormData({ ...formData, prompt: e.target.value })
              }
              placeholder={t('promptPlaceholder')}
              className="min-h-[200px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sessions">{t('sessionsLabel')}</Label>
              <Input
                id="sessions"
                type="number"
                min="1"
                value={formData.numSessions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numSessions: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="temperature">{t('temperatureLabel')}</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxAnswers">{t('maxAnswersLabel')}</Label>
            <Input
              id="maxAnswers"
              type="number"
              min="1"
              max="100"
              value={formData.maxAnswers}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxAnswers: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon('generating')}
              </>
            ) : (
              tCommon('generate')
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

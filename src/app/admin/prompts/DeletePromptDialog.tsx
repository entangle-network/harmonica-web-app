'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deletePrompt } from './api';
import { useToast } from 'hooks/use-toast';
import { useTranslations } from 'next-intl';

interface Props {
  prompt: { id: string; type_name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeletePromptDialog({
  prompt,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const t = useTranslations('admin');
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!prompt) return;

    try {
      await deletePrompt(prompt.id);
      toast({ title: t('toast.promptDeleted') });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('toast.promptDeleteFailed'),
        description: t('toast.tryAgain'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{t('deletePrompt')}</DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to delete this prompt of type{' '}
          <span className="font-semibold">{prompt?.type_name}</span>? This
          action cannot be undone.
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

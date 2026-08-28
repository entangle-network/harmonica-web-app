'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deletePromptType } from './api';
import { useToast } from 'hooks/use-toast';
import { useTranslations } from 'next-intl';

interface Props {
  promptType: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeletePromptTypeDialog({
  promptType,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const t = useTranslations('admin');
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!promptType) return;
    try {
      await deletePromptType(promptType.id);
      toast({ title: t('toast.typeDeleted') });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: t('toast.typeDeleteFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deletePromptType')}</DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to delete the prompt type "{promptType?.name}"?
          This action cannot be undone.
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

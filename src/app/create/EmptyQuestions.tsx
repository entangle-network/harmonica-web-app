import { Button } from '@/components/ui/button';
import { ClipboardList, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EmptyQuestionsProps {
  openModal: () => void;
}

export default function EmptyQuestions({ openModal }: EmptyQuestionsProps) {
  const t = useTranslations('questionList');

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-lg bg-gray-50">
      <div className="bg-white p-4 rounded-full shadow-sm mb-6">
        <ClipboardList className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {t('emptyTitle')}
      </h3>
      <div className="space-y-2 mb-6 text-center">
        <p className="text-sm text-gray-500 px-6">
          {t('emptyBody')}
        </p>
      </div>
      <Button 
        variant="outline" 
        onClick={openModal}
        className="flex items-center gap-2 hover:bg-gray-100"
      >
        <Plus className="h-4 w-4" />
        {t('addQuestion')}
      </Button>
    </div>
  );
} 
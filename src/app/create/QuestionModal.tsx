import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionInfo, QuestionType } from './types';
import { Checkbox } from "@/components/ui/checkbox"

interface QuestionModalProps {
  currentQuestion: QuestionInfo | null;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<QuestionInfo | null>>;
  modalOpen: boolean;
  closeModal: () => void;
  addOrUpdateQuestion: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  currentQuestion,
  setCurrentQuestion,
  modalOpen,
  closeModal,
  addOrUpdateQuestion,
}) => {
  const t = useTranslations('questionModal');
  const tCommon = useTranslations('common');

  return (
    modalOpen && (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 overflow-hidden" onClick={closeModal} />
        <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md relative">
            <h2 className="text-2xl font-semibold">
              {currentQuestion?.label ? t('editTitle') : t('addTitle')}
            </h2>
            <p className="pb-6">{t('description')}</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-base">{t('questionLabel')}</label>
                <input
                  type="text"
                  value={currentQuestion?.label || ''}
                  onChange={(e) => setCurrentQuestion((prev): QuestionInfo => ({
                    ...prev!,
                    label: e.target.value,
                  }))}
                  placeholder={t('questionPlaceholder')}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-base">{t('typeLabel')}</label>
                <Select
                  value={currentQuestion?.type || QuestionType.SHORT_FIELD}
                  onValueChange={(value) => setCurrentQuestion((prev): QuestionInfo => ({
                    ...prev!,
                    type: value as QuestionType
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('typePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={0}>
                    <SelectItem value={QuestionType.SHORT_FIELD}>{t('types.shortField')}</SelectItem>
                    <SelectItem value={QuestionType.EMAIL}>{t('types.email')}</SelectItem>
                    <SelectItem value={QuestionType.OPTIONS}>{t('types.options')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentQuestion?.type === 'Options' && (
                <div className="space-y-2">
                  <label className="text-base">{t('optionsLabel')}</label>
                  <input
                    type="text"
                    value={currentQuestion.optionsInput || ''}
                    onChange={(e) => setCurrentQuestion((prev): QuestionInfo => ({
                      ...prev!,
                      optionsInput: e.target.value,
                      options: e.target.value.split(',')
                    }))}
                    placeholder={t('optionsPlaceholder')}
                    className="border p-2 rounded w-full"
                  />
                  <p className="text-sm text-gray-500">{t('optionsHint')}</p>
                </div>
              )}

              <label className="flex items-center">
                <Checkbox
                  checked={currentQuestion?.required || false}
                  onCheckedChange={(checked: boolean) => setCurrentQuestion((prev): QuestionInfo => ({
                    ...prev!,
                    required: checked
                  }))}
                  className="mr-2"
                />
                <span className="text-base">{t('required')}</span>
              </label>
            </div>
            <div className="flex justify-between gap-2 mt-8">
              <Button variant="outline" onClick={closeModal}>{tCommon('back')}</Button>
              <Button 
                onClick={addOrUpdateQuestion}
                className="normal-case"
                disabled={
                  !currentQuestion?.label || 
                  (currentQuestion.type === 'Options' && 
                   (!currentQuestion.options || currentQuestion.options.length < 2))
                }
              >
                {currentQuestion?.label ? t('saveChanges') : tCommon('create')}
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  );
};

export default QuestionModal; 
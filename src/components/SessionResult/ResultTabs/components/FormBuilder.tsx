'use client';

import { useTranslations } from 'next-intl';

import { useState, useEffect, useRef } from 'react';
import { QuestionInfo, QuestionType } from 'app/create/types';
import QuestionModal from 'app/create/QuestionModal';
import { QuestionContainer } from 'app/create/QuestionContainer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown } from 'lucide-react';
import { parseQuestionBlock } from '@/lib/parseQuestionBlock';

interface FormBuilderProps {
  questions: QuestionInfo[];
  onQuestionsUpdate: (questions: QuestionInfo[]) => void;
  /** Stejny stavitel slouzi uvodnimu i zaverecnemu dotazniku; lisi se jen popiskem. */
  title?: string;
  intro?: string;
}

export function FormBuilder({
  questions: initialQuestions,
  onQuestionsUpdate,
  title,
  intro,
}: FormBuilderProps) {
  const t = useTranslations('misc');
  const [questions, setQuestions] = useState<QuestionInfo[]>(initialQuestions);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionInfo | null>(
    null,
  );
  const prevInitialQuestionsRef = useRef<string>(JSON.stringify(initialQuestions));
  const isUserActionRef = useRef(false);

  const tImport = useTranslations('questionImport');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = (replace = false) => {
    const parsed = parseQuestionBlock(importText);
    if (parsed.length === 0) {
      setImportError(tImport('nothingFound'));
      return;
    }

    const next = replace ? parsed : [...questions, ...parsed];
    isUserActionRef.current = true;
    setQuestions(next);
    onQuestionsUpdate(next);

    setImportText('');
    setImportError(null);
    setShowImport(false);
  };

  // Update local state when initialQuestions change (only if different to avoid loops)
  useEffect(() => {
    const currentInitial = JSON.stringify(initialQuestions);
    if (currentInitial !== prevInitialQuestionsRef.current && !isUserActionRef.current) {
      setQuestions(initialQuestions);
      prevInitialQuestionsRef.current = currentInitial;
    }
    isUserActionRef.current = false;
  }, [initialQuestions]);

  const addOrUpdateQuestion = () => {
    if (!currentQuestion) return;

    const cleanedQuestion = {
      ...currentQuestion,
      options: currentQuestion.options
        ?.map((opt: string) => opt.trim())
        ?.filter((opt: string) => opt !== ''),
    };

    isUserActionRef.current = true;
    setQuestions((prev) => {
      const editingIndex = prev.findIndex((q) => q.id === currentQuestion.id);
      let updated;
      if (editingIndex >= 0) {
        updated = prev.map((q) =>
          q.id === currentQuestion.id ? cleanedQuestion : q,
        );
      } else {
        updated = [...prev, cleanedQuestion];
      }
      // Notify parent of the change
      onQuestionsUpdate(updated);
      return updated;
    });

    setModalOpen(false);
    setCurrentQuestion(null);
  };

  const handleDelete = (index: number) => {
    isUserActionRef.current = true;
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    // Notify parent of the change
    onQuestionsUpdate(updatedQuestions);
  };

  const handleReorder = (reorderedQuestions: QuestionInfo[]) => {
    isUserActionRef.current = true;
    setQuestions(reorderedQuestions);
    // Notify parent of the change
    onQuestionsUpdate(reorderedQuestions);
  };

  const openModal = (question?: QuestionInfo) => {
    setCurrentQuestion(
      () =>
        question || {
          id: Math.random().toString(36).substr(2, 9),
          label: '',
          type: QuestionType.SHORT_FIELD,
          typeValue: 'SHORT_FIELD',
          required: false,
          options: [],
          optionsInput: '',
        },
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentQuestion(null);
  };

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title ?? t('formQuestions')}</h3>
        <p className="text-sm text-muted-foreground">
          {intro ?? t('formIntro')}
        </p>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <QuestionContainer
          questions={questions}
          openModal={openModal}
          handleDelete={handleDelete}
          onReorder={handleReorder}
        />
      </div>

      {/* Naklikat deset otázek s pěti možnostmi je práce na čtvrt hodiny,
          přitom je pořadatel skoro vždycky má už napsané. */}
      <div className="rounded-lg border">
        <button
          type="button"
          onClick={() => setShowImport((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-muted/50"
        >
          {tImport('title')}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showImport ? 'rotate-180' : ''}`}
          />
        </button>

        {showImport && (
          <div className="space-y-3 border-t p-4">
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {tImport('hint')}
            </p>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              placeholder={tImport('placeholder')}
              className="font-mono text-sm"
            />
            {importError && (
              <p className="text-sm text-red-500">{importError}</p>
            )}
            <div className="flex items-center gap-2">
              <Button type="button" onClick={() => handleImport()}>
                {tImport('append')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleImport(true)}
              >
                {tImport('replace')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <QuestionModal
        currentQuestion={currentQuestion}
        setCurrentQuestion={setCurrentQuestion}
        modalOpen={modalOpen}
        closeModal={closeModal}
        addOrUpdateQuestion={addOrUpdateQuestion}
      />
    </div>
  );
}


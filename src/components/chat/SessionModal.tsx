import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { encryptId } from '@/lib/encryptionUtils';
import type { UserProfile } from '@auth0/nextjs-auth0/client';
import { ChevronRight, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import {
  QuestionsModal,
  SUPPORTED_LANGUAGES,
  resolveLanguageName,
  useDefaultLanguageCode,
} from './QuestionsModal';
import { QuestionInfo, QuestionType } from 'app/create/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SessionModalProps {
  userFinished: boolean;
  sessionClosed: boolean;
  sessionId: string | null;
  user?: UserProfile;
  hostData?: { topic: string; questions?: QuestionInfo[] };
  onStart: (answers?: Record<string, string>) => void;
  loadingUserInfo?: boolean;
}

export const SessionModal = ({
  userFinished,
  sessionClosed,
  sessionId,
  user,
  hostData,
  onStart,
  loadingUserInfo = false,
}: SessionModalProps) => {
  const t = useTranslations('chatIntro');
  const tForm = useTranslations('questionsForm');
  const tCommon = useTranslations('common');
  const tChat = useTranslations('chat');
  const defaultLanguage = useDefaultLanguageCode();
  const [showQuestions, setShowQuestions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (id: string, value: string, type: QuestionType) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleInputBlur = (id: string, value: string, type: QuestionType) => {
    setTouched({ ...touched, [id]: true });

    if (type === QuestionType.EMAIL) {
      const question = hostData?.questions?.find((q) => q.id === id);
      if (question?.required && !value) {
        setErrors({ ...errors, [id]: tForm('emailRequired') });
      } else if (value && !validateEmail(value)) {
        setErrors({ ...errors, [id]: tForm('emailInvalid') });
      } else {
        const newErrors = { ...errors };
        delete newErrors[id];
        setErrors(newErrors);
      }
    }
  };

  const handleStart = () => {
    if (hostData?.questions) {
      setShowForm(true);
    } else {
      onStart({});
    }
  };

  const handleQuestionsSubmit = (formAnswers?: Record<string, string>) => {
    // Validate and submit form answers (keep validation as is)
    const newErrors: Record<string, string> = {};
    hostData?.questions?.forEach((q) => {
      if (q.required && !answers[q.id]) {
        newErrors[q.id] = `${q.label} is required`;
      }
      if (
        q.type === QuestionType.EMAIL &&
        answers[q.id] &&
        !validateEmail(answers[q.id])
      ) {
        newErrors[q.id] = tForm('emailInvalid');
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Pass answers directly to onStart (no transformation)
    onStart({
      ...answers,
      preferred_language: resolveLanguageName(
        answers.preferred_language,
        defaultLanguage,
      ),
    });
  };

  if (showQuestions && hostData?.questions) {
    return (
      <QuestionsModal
        questions={hostData.questions as QuestionInfo[]}
        onSubmit={handleQuestionsSubmit}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 md:p-10 rounded-lg w-full h-full md:w-[calc(100%-2rem)] md:h-[calc(100%-2rem)] flex items-start justify-center m-0 md:m-4 overflow-y-auto relative">
        <div className="max-w-6xl w-full flex flex-col min-h-full">
          {loadingUserInfo ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-4" />
              <p className="text-gray-600">{t('loadingSession')}</p>
            </div>
          ) : userFinished ? (
            <div className="flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold mb-4">
                {t('thanksTitle')}
              </h2>
              <p className="mb-4">
                {t('thanksBody')}
              </p>
              {user && user.sub && (
                <Link href={`/sessions/${encryptId(sessionId!)}`} passHref>
                  <Button size="lg" className="mt-4">
                    {t('viewResults')}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:justify-between flex-1">
              {/* Left side content - 60% width */}
              <div className="w-full lg:w-3/5 flex flex-col justify-start max-w-xl pb-16">
                {/* Header content - outside the flex row */}
                <div className="mb-8 mt-4">
                  <img src="/invitation.svg" alt={t('invitationAlt')} className="w-16 mb-4" />
                  <h2 className="font-semibold text-muted-foreground mb-4 sm:mb-6">
                    {loadingUserInfo
                      ? tCommon('loading')
                      : sessionClosed
                      ? t('headingClosed')
                      : t('headingOpen')}
                  </h2>
                </div>
                
                {!showForm ? (
                  /* Welcome Card */
                  <div className="bg-gradient-to-b from-amber-50 to-white border border-gray-200 rounded-lg p-10 shadow-md mb-8">
                    <h3 className="text-2xl font-semibold mb-4">{hostData?.topic}</h3>
                    <p className={`${sessionClosed ? 'sm:mb-8' : ''}`}>
                      {loadingUserInfo
                        ? t('bodyLoading')
                        : sessionClosed
                        ? t('bodyClosed')
                        : t('bodyOpen')}
                    </p>
                  </div>
                ) : (
                  /* Form Card */
                  <div className="bg-gradient-to-b from-amber-50 to-white border border-gray-200 rounded-lg p-10 shadow-md mb-8">
                    <h3 className="text-2xl font-semibold mb-4">{hostData?.topic}</h3>
                    <p className="text-muted-foreground mb-6">
                      {t('formIntro')}
                    </p>
                    <form onSubmit={(e) => { e.preventDefault(); handleQuestionsSubmit(); }} className="space-y-4">
                      {hostData?.questions?.map((q, index) => (
                        <div key={`_${index}`} className="space-y-2">
                          <Label className="text-gray-700">
                            {q.label}{' '}
                            {q.required && <span className="text-gray-400">*</span>}
                          </Label>
                          {q.type === QuestionType.OPTIONS && q.options ? (
                            <Select
                              required={q.required}
                              onValueChange={(value) =>
                                handleInputChange(q.id, value, q.type)
                              }
                              value={answers[q.id]}
                            >
                              <SelectTrigger className="w-full bg-white border-gray-200 focus:ring-gray-200">
                                <SelectValue placeholder={tForm('selectOption')} />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from(new Set(q.options)).map((opt, index) => (
                                  <SelectItem
                                    key={`${q.id}_${opt}`}
                                    value={opt}
                                    className="text-gray-700"
                                  >
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="space-y-1">
                              <Input
                                type={q.type === QuestionType.EMAIL ? 'email' : 'text'}
                                required={q.required}
                                value={answers[q.id] || ''}
                                onChange={(e) =>
                                  handleInputChange(q.id, e.target.value, q.type)
                                }
                                onBlur={(e) =>
                                  handleInputBlur(q.id, e.target.value, q.type)
                                }
                                className="bg-white border-gray-200 focus:ring-gray-200"
                              />
                              {touched[q.id] && errors[q.id] && (
                                <p className="text-sm text-red-500">{errors[q.id]}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Language Selector */}
                      <div className="space-y-2">
                        <Label className="text-gray-700">{tForm('selectLanguageLabel')}</Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange(
                              'preferred_language',
                              value,
                              QuestionType.OPTIONS,
                            )
                          }
                          value={answers['preferred_language'] || defaultLanguage}
                        >
                          <SelectTrigger className="w-[200px] bg-white border-gray-200 focus:ring-gray-200">
                            <SelectValue placeholder={tForm('selectLanguagePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                              <SelectItem
                                key={`lang_${code}`}
                                value={code}
                                className="text-gray-700"
                              >
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </form>
                  </div>
                )}
                
                  {sessionClosed ? (
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-8">
                      {user && user.sub && (
                        <Link
                          href={`/sessions/${encryptId(sessionId!)}`}
                          passHref
                          className="w-full sm:w-auto"
                        >
                          <Button size="lg" className="w-full sm:w-auto">
                            {t('viewSessionResults')}
                          </Button>
                        </Link>
                      )}
                      <Link
                        href="/create"
                        passHref
                        className="w-full sm:w-auto"
                      >
                        <Button
                          size="lg"
                          variant="ghost"
                          className="w-full sm:w-auto"
                        >
                          {t('startNewSession')}
                        </Button>
                      </Link>
                    </div>
                ) : !showForm ? (
                    <>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                      {/* 3 points on the left */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{t('tip1')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{t('tip2')}</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-muted-foreground">{t('tip3')}</p>
                        </div>
                      </div>
                      
                      {/* Start button and dots on the right */}
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full ${!showForm ? 'bg-amber-400' : 'bg-gray-300'}`}></div>
                          <div className={`w-2 h-2 rounded-full ${showForm ? 'bg-amber-400' : 'bg-gray-300'}`}></div>
                        </div>
                        <Button
                          onClick={handleStart}
                          size="lg"
                          className="flex-shrink-0 flex items-center gap-2"
                        >
                          {tCommon('continue')} <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Form submission button and dots */}
                    <div className="flex justify-between items-center mt-6">
                      <Button
                        onClick={() => setShowForm(false)}
                        variant="ghost"
                        size="lg"
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" /> {tCommon('back')}
                      </Button>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full ${!showForm ? 'bg-amber-400' : 'bg-gray-300'}`}></div>
                          <div className={`w-2 h-2 rounded-full ${showForm ? 'bg-amber-400' : 'bg-gray-300'}`}></div>
                        </div>
                        <Button
                          onClick={() => handleQuestionsSubmit({})}
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          {t('begin')} <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              
              {/* Right side image - 40% width */}
              <div className="hidden lg:flex w-full lg:w-2/5 items-start justify-end">
                <img 
                  src="/chat-example.png" 
                  alt={t('chatExampleAlt')}
                  
                  className="w-full max-w-md h-auto object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-auto pt-8 text-center flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-center">
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {tChat('poweredBy')}{' '}
              <img src="/harmonica-lockup.svg" alt="Harmonica" className="h-3 w-auto" />
            </Link>
            <p className="text-xs text-muted-foreground">
              {t.rich('privacyNote', {
                link: (chunks) => (
                  <Link href="https://harmonica.chat/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

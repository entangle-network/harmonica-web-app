import { useTranslations } from 'next-intl';
import { SourceLink } from '@/components/SourceLink';
import { useSessionTheme } from '@/components/SessionTheme';
import { ParticipantFooterBrand } from '@/components/theme/ParticipantFooterBrand';
import { parseVideoEmbed, themeImageUrl } from '@/lib/themeColors';
import { IntroVideo } from '@/components/theme/IntroVideo';
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
  const theme = useSessionTheme();
  const [showQuestions, setShowQuestions] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Video-first invitation: the video fills the width and the only thing under
   * it is the button. Requires a usable video — the flag alone would
   * otherwise strip the card down to nothing. Off once the participant moves
   * on to the questions, and off for the closed and finished states, which
   * have their own message to deliver.
   */
  const heroVideo =
    theme.videoFullscreen &&
    !!parseVideoEmbed(theme.introVideoUrl) &&
    !showForm &&
    !sessionClosed &&
    !userFinished;

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
        newErrors[q.id] = tForm('fieldRequired', { field: q.label });
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
      // The error text renders behind `touched`, which only a blur sets. Without
      // this, submitting a pristine form sets errors nobody can see: the form
      // simply refuses to advance and says nothing.
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(newErrors).map((id) => [id, true])),
      }));
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
              {/* Left side content - 60% width. The video-first variant drops
                  the width cap so the player is not stuck in the narrow
                  column, and centres what little is left. */}
              <div
                className={`w-full flex flex-col justify-start pb-16 ${
                  heroVideo ? 'mx-auto max-w-4xl' : 'max-w-xl'
                }`}
              >
                {/* Header content - outside the flex row */}
                {/* Both parts can be switched off per session, so the wrapper
                    only exists when something is left to put in it — otherwise
                    its margins would leave a gap above the card. */}
                {!heroVideo && (theme.showIntroImage || theme.showIntroHeading) && (
                  <div className="mb-8 mt-4">
                    {theme.showIntroImage && (
                      <img
                        src={themeImageUrl(theme.introImageId) ?? '/invitation.svg'}
                        alt={t('invitationAlt')}
                        className={themeImageUrl(theme.introImageId) ? 'h-16 w-16 mb-4 rounded-lg object-cover' : 'w-16 mb-4'}
                      />
                    )}
                    {/* The closed and loading variants report state rather than
                        decorate, so they stay even when the heading is off. */}
                    {(theme.showIntroHeading || loadingUserInfo || sessionClosed) && (
                      <h2 className="font-semibold text-muted-foreground mb-4 sm:mb-6">
                        {loadingUserInfo
                          ? tCommon('loading')
                          : sessionClosed
                          ? t('headingClosed')
                          : t('headingOpen')}
                      </h2>
                    )}
                  </div>
                )}

                <IntroVideo
                  url={theme.introVideoUrl}
                  className={heroVideo ? 'mb-10' : 'mb-8'}
                />

                {heroVideo ? null : !showForm ? (
                  /* Welcome Card — the whole box goes, session name included,
                     when the host switches the welcome text off. The loading
                     and closed variants report state rather than decorate, so
                     they always show. */
                  (theme.showIntroText || loadingUserInfo || sessionClosed) && (
                    <div className="bg-gradient-to-b from-session-gradient to-white border border-gray-200 rounded-lg p-10 shadow-md mb-8">
                      <h3 className="text-2xl font-semibold mb-4">{hostData?.topic}</h3>
                      <p className={`${sessionClosed ? 'sm:mb-8' : ''}`}>
                        {loadingUserInfo
                          ? t('bodyLoading')
                          : sessionClosed
                          ? t('bodyClosed')
                          : theme.introText || t('bodyOpen')}
                      </p>
                    </div>
                  )
                ) : (
                  /* Form Card */
                  <div className="bg-gradient-to-b from-session-gradient to-white border border-gray-200 rounded-lg p-10 shadow-md mb-8">
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
                ) : heroVideo ? (
                  /* Nothing competes with the video, so the button carries the
                     whole call to action: centred, full width on a phone, and
                     without the step dots that only make sense beside a card. */
                  <div className="flex justify-center">
                    <Button
                      onClick={handleStart}
                      size="lg"
                      className="w-full sm:w-auto sm:min-w-[16rem] h-14 text-lg flex items-center justify-center gap-2"
                    >
                      {tCommon('continue')} <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                ) : !showForm ? (
                    <>
                    <div className="flex items-center justify-end gap-4">
                      {/* Start button and dots on the right */}
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                          <div className={`w-2 h-2 rounded-full ${!showForm ? 'bg-primary' : 'bg-gray-300'}`}></div>
                          <div className={`w-2 h-2 rounded-full ${showForm ? 'bg-primary' : 'bg-gray-300'}`}></div>
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
                          <div className={`w-2 h-2 rounded-full ${!showForm ? 'bg-primary' : 'bg-gray-300'}`}></div>
                          <div className={`w-2 h-2 rounded-full ${showForm ? 'bg-primary' : 'bg-gray-300'}`}></div>
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
              
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-auto pt-8 text-center flex flex-col md:flex-row justify-center gap-4 md:gap-8 items-center">
            <ParticipantFooterBrand className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors" />
            <SourceLink />
            {/* The host's own policy when they set one: on a self-hosted
                instance the data controller is whoever runs it, not the project
                whose code they run. */}
            <Link
              href={theme.privacyUrl || 'https://harmonica.chat/privacy'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
            >
              {t('privacyLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

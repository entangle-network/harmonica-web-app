import type { ParticipantConsent } from '@/lib/clientUtils';
import { useTranslations } from 'next-intl';
import { SourceLink } from '@/components/SourceLink';
import { ParticipantFooterBrand } from '@/components/theme/ParticipantFooterBrand';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { FullscreenChat } from './FullscreenChat';
import { OpenAIMessage } from '@/lib/types';
import { RatingModal } from './RatingModal';
import { useState, useEffect, useRef } from 'react';
import { updateUserSession, increaseSessionsCount, insertChatMessage } from '@/lib/db';
import { QuestionInfo } from 'app/create/types';
import { FinalSurvey } from './FinalSurvey';
import { usePermissions } from '@/lib/permissions';

interface ChatInterfaceProps {
  hostData: {
    topic?: string;
    assistant_id?: string;
    id?: string;
    cross_pollination?: boolean;
  };
  userSessionId: string | undefined;
  setUserSessionId: (id: string) => void;
  onFinish: () => void;
  isMounted: boolean;
  isLoading: boolean;
  message: OpenAIMessage;
  assistantId?: string;
  userContext?: Record<string, string>;
  userConsent?: ParticipantConsent | null;
  questions?: JSON;
  finalQuestions?: QuestionInfo[];
  finalSurveyIntro?: string;
}

export const ChatInterface = ({
  hostData,
  userSessionId,
  setUserSessionId,
  onFinish,
  isMounted,
  isLoading,
  message,
  assistantId,
  userContext,
  userConsent,
  questions,
  finalQuestions = [],
  finalSurveyIntro = '',
}: ChatInterfaceProps) => {
  const t = useTranslations('chat');
  const tEnd = useTranslations('chatEnd');
  const { hasMinimumRole }  = usePermissions(hostData.id || '');
  const mainPanelRef = useRef<HTMLElement>(null);
  const [showRating, setShowRating] = useState(false);
  const [threadId, setThreadId] = useState<string>();
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  /**
   * Konec konverzace se sem nedostane přes `message.is_final` — ta cesta vede
   * z window.postMessage, které nikdo neposílá, takže je vždycky false.
   * Skutečný signál dává useChat tím, že zavolá setShowRating.
   *
   * Zamykáme ho, protože `showRating` se vrátí na false, jakmile účastník
   * hodnocení zavře.
   */
  const [conversationEnded, setConversationEnded] = useState(false);
  useEffect(() => {
    if (showRating) setConversationEnded(true);
  }, [showRating]);

  /**
   * Poslední zpráva shrne, co model pochopil, a ptá se, jestli to tak je.
   * Dokud na to účastník neodpoví, nesmí mu nic zakrýt text — dotazník, který
   * naskočí sám, ho o tu kontrolu připraví.
   *
   * confirm  — shrnutí je vidět, pod ním potvrzení nebo doplnění
   * editing  — účastník doplňuje v chatu, dokončit může tlačítkem
   * survey   — závěrečné otázky
   * thanks   — rozloučení
   */
  type EndStep = 'confirm' | 'editing' | 'survey' | 'thanks';
  const [endStep, setEndStep] = useState<EndStep>('confirm');

  const hasFinalSurvey = finalQuestions.length > 0 && Boolean(threadId);
  const atEnd = conversationEnded && Boolean(threadId);

  const showConfirmBar = atEnd && endStep === 'confirm';
  const showFinishAgain = atEnd && endStep === 'editing';
  const showFinalSurvey = atEnd && endStep === 'survey';
  const showThanks = atEnd && endStep === 'thanks';

  /** Potvrzení shrnutí: buď se doptáme na demografii, nebo se rozloučíme. */
  const handleConfirmSummary = () => {
    setEndStep(hasFinalSurvey ? 'survey' : 'thanks');
  };

  /**
   * Doplnění: schováme lištu a vrátíme účastníka do psaní. Kurzor přesouváme
   * přes DOM — vstupní pole je o tři komponenty níž a protahovat kvůli jednomu
   * fokusu ref přes celý řetězec by bylo horší než tenhle dotaz.
   */
  const handleAmendSummary = () => {
    setEndStep('editing');
    setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>('textarea[name="messageText"]')
        ?.focus();
    }, 0);
  };

  /**
   * Odpovědi se ukládají jako zpráva do vlákna — stejně jako ty z úvodního
   * formuláře. Díky tomu se dostanou do přepisu, souhrnů i exportu, aniž by
   * je bylo potřeba vést zvlášť.
   */
  const handleFinalSurveySubmit = async (answers: Record<string, string>) => {
    const summary = Object.entries(answers)
      .filter(([, value]) => value?.trim())
      .map(([id, value]) => {
        const label = finalQuestions.find((q) => q.id === id)?.label ?? id;
        return `${label}: ${value}`;
      })
      .join('; ');

    if (summary && threadId) {
      try {
        await insertChatMessage({
          thread_id: threadId,
          role: 'user',
          content: `Účastník na závěr doplnil:\n${summary}`,
          created_at: new Date(),
        });
      } catch (error) {
        // Konverzace je hotová a odpovědi jsou doplňkové: selhání zápisu
        // nesmí účastníkovi zabránit v dokončení.
        console.error('[e] Závěrečný dotazník se nepodařilo uložit:', error);
      }
    }

    setEndStep('thanks');
  };
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);
  const [isMobileHowItWorksOpen, setIsMobileHowItWorksOpen] = useState(false);

  // Handler to receive thread_id from Chat component
  const handleThreadIdReceived = (id: string) => {
    setThreadId(id);
  };

  const handleFinish = () => {
    setIsSessionFinished(true);
    onFinish();
    // Show rating modal after 2 seconds
    setTimeout(() => {
      setShowRating(true);
    }, 2000);
  };

  useEffect(() => {
    console.log('[ChatInterface] Message or state changed:', {
      messageContent: message?.content?.slice(0, 100) + '...',
      is_final: message?.is_final,
      threadId,
      showRating,
      isSessionFinished,
    });

    if (message?.is_final && threadId) {
      console.log(
        '[ChatInterface] Final message detected, showing rating modal in 2s',
      );
      // Show rating modal after 2 seconds when final message is received
      setTimeout(() => {
        console.log('[ChatInterface] Showing rating modal now');
        setShowRating(true);
      }, 2000);
    }
  }, [message?.is_final, threadId, message]);

  useEffect(() => {
    const updateSession = async () => {
      if (showRating && userSessionId) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 3000));

          await updateUserSession(userSessionId, {
            active: false,
            last_edit: new Date(),
          });

          // Počítadlo patří k SEZENÍ, ne k účastníkovi: s id účastníka dotaz
          // na host_db nic nenašel, vyhodil výjimku a ta se tu tiše polkla —
          // num_finished proto nikdy nerostlo.
          if (hostData?.id) {
            await increaseSessionsCount(hostData.id, 'num_finished');
          }
        } catch (error) {
          console.error('Error updating session:', error);
        }
      }
    };

    updateSession();
  }, [showRating, userSessionId]);

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-80 fixed top-0 left-0 h-screen border-r border-gray-200 bg-session-surface z-20">
        <div className="p-6 pb-4">
          <p className="text-sm text-muted-foreground mb-2">{t('yourSession')}</p>
          <h1 className="text-xl font-semibold mb-4 break-words" title={hostData?.topic}>
            {hostData?.topic ?? 'Test'}
          </h1>
        </div>
        {isMounted && !isLoading && showRating && threadId && (
          <div className="px-6 pb-4">
            <RatingModal threadId={threadId} onClose={() => setShowRating(false)} />
          </div>
        )}
        <div className="flex flex-col justify-end flex-1">
          <div className="border-t border-gray-200">
            <button
              onClick={() => setIsHowItWorksExpanded(!isHowItWorksExpanded)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-session-accent transition-colors"
            >
              <h3 className="text-sm font-medium text-gray-900">{t('howItWorks')}</h3>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isHowItWorksExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isHowItWorksExpanded && (
              <div className="px-4 pb-4">
                <div className="space-y-2 pt-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-session-accent text-session-accent-foreground text-xs font-medium rounded-full flex items-center justify-center">1</span>
                    <p className="text-xs text-gray-600">{t('tip1')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-session-accent text-session-accent-foreground text-xs font-medium rounded-full flex items-center justify-center">2</span>
                    <p className="text-xs text-gray-600">{t('tip2')}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 bg-session-accent text-session-accent-foreground text-xs font-medium rounded-full flex items-center justify-center">3</span>
                    <p className="text-xs text-gray-600">{t('tip3')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <ParticipantFooterBrand />
              {/* AGPL-3.0 §13: the running version's source must be reachable
                  from the interface participants actually use. */}
              <div className="mt-1">
                <SourceLink />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main ref={mainPanelRef} className="md:ml-80 flex-1 h-screen overflow-y-auto flex flex-col relative bg-session-surface px-3">
        {/* Top nav (mobile) */}
        <div className="md:hidden w-full border-b border-gray-200 bg-session-surface px-4 min-h-12 flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between w-full py-3">
            <h1 className="text-lg font-semibold truncate flex-1 mr-4" title={hostData?.topic}>
              {hostData?.topic ?? 'Test'}
            </h1>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setIsMobileHowItWorksOpen(!isMobileHowItWorksOpen)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
          {/* Mobile How it Works Dropdown */}
          {isMobileHowItWorksOpen && (
            <div className="mb-2 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-session-accent text-session-accent-foreground text-xs font-medium rounded-full flex items-center justify-center">1</span>
                  <p className="text-sm text-gray-600">{t('tip1')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-session-accent text-session-accent-foreground text-xs font-medium rounded-full flex items-center justify-center">2</span>
                  <p className="text-sm text-gray-600">{t('tip2')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-session-accent text-session-accent-foreground text-xs font-medium rounded-full flex items-center justify-center">3</span>
                  <p className="text-sm text-gray-600">{t('tip3')}</p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <ParticipantFooterBrand />
                  <div className="mt-1">
                    <SourceLink />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showFinalSurvey && (
          <div className="flex w-full flex-1 items-start justify-center pt-12">
            <FinalSurvey
              questions={finalQuestions}
              intro={finalSurveyIntro}
              onSubmit={handleFinalSurveySubmit}
              onSkip={() => setEndStep('thanks')}
            />
          </div>
        )}

        {showThanks && (
          <div className="flex w-full flex-1 items-start justify-center pt-12">
            <div className="mx-auto w-full max-w-2xl px-4 text-center">
              <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-semibold">{tEnd('thanksTitle')}</h3>
                <p className="mt-2 text-muted-foreground">
                  {tEnd('thanksBody')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chat area */}
        <div
          className={`flex flex-col w-full max-w-3xl mx-auto flex-1 pt-12 min-h-0 ${
            showFinalSurvey || showThanks ? 'hidden' : ''
          }`}
        >
          <FullscreenChat
            sessionIds={[hostData?.id ?? '']}
            userSessionId={userSessionId}
            setUserSessionId={setUserSessionId}
            userContext={userContext}
            userConsent={userConsent}
            crossPollination={hostData?.cross_pollination ?? false}
            sessionId={hostData?.id}
            onThreadIdReceived={handleThreadIdReceived}
            setShowRating={setShowRating}
            isHost={hasMinimumRole('owner')}
            mainPanelRef={mainPanelRef}
            questions={questions as { id: string; label: string }[] | undefined}
            /* Tlačítka jsou odpovědí na otázku z poslední zprávy, takže patří
               za ni do toku konverzace. Pod vstupním polem visela bez
               souvislosti s tím, na co se ptají. */
            afterMessages={
              (showConfirmBar || showFinishAgain) && (
                /* Stejná stavba jako zpráva asistenta — mezera za avatarem
                   (na mobilu schovaný) a ps-4 — aby tlačítka lícovala s textem,
                   na který odpovídají. */
                <div className="flex">
                  <div className="h-10 w-10 flex-none hidden md:block" />
                  <div className="ps-4 flex flex-wrap gap-2">
                    {showConfirmBar && (
                      <>
                        <Button onClick={handleConfirmSummary}>
                          {tEnd('confirm')}
                        </Button>
                        <Button variant="outline" onClick={handleAmendSummary}>
                          {tEnd('amend')}
                        </Button>
                      </>
                    )}

                    {/* Po doplnění tlačítko nezmizí — jinak by účastník neměl
                        jak rozhovor uzavřít a dotazník by ho nepotkal. */}
                    {showFinishAgain && (
                      <Button variant="outline" onClick={handleConfirmSummary}>
                        {tEnd('finish')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            }
          />
        </div>
      </main>
    </div>
  );
};

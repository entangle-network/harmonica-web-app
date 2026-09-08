import { SessionData } from '@/lib/hooks/useSessionData';
import SessionResultHeader from '@/components/SessionResult/SessionResultHeader';
import SessionResultsOverview from '@/components/SessionResult/SessionResultsOverview';
import SessionResultsSection from '@/components/SessionResult/SessionResultsSection';
import { OpenAIMessage } from '@/lib/types';
import { ResultTabsVisibilityConfig } from '@/lib/schema';
import { SessionStatus } from '@/lib/clientUtils';
import { QuestionInfo } from 'app/create/types';

interface SessionPageProps {
  data: SessionData;
  visibilityConfig: ResultTabsVisibilityConfig;
  showShare?: boolean;
  chatEntryMessage?: OpenAIMessage;
}

export default function SessionPage({
  data,
  visibilityConfig,
  showShare = true,
  chatEntryMessage,
}: SessionPageProps) {
  const { hostData, usersWithChat, stats } = data;

  const status =
    !hostData.active || hostData.final_report_sent
      ? SessionStatus.FINISHED
      : stats.totalUsers === 0
        ? SessionStatus.DRAFT
        : SessionStatus.ACTIVE;

  // Parse questions from hostData. The column is json, but older rows hold a
  // string, so both shapes have to be handled.
  const parseQuestions = (raw: unknown, label: string): QuestionInfo[] => {
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error(`Error parsing ${label}:`, error);
      return [];
    }
  };

  const questions = parseQuestions(hostData.questions, 'questions');
  const finalQuestions = parseQuestions(
    hostData.final_questions,
    'final questions',
  );

  return (
    <div className="p-4 md:p-8">
      <SessionResultHeader
        sessionId={hostData.id}
        topic={hostData.topic}
        status={status}
      />
      <SessionResultsOverview
        id={hostData.id}
        status={status}
        startTime={hostData.start_time}
        numSessions={stats.totalUsers}
        completedSessions={stats.finishedUsers}
        showShare={showShare}
        currentPrompt={hostData.prompt}
        summaryPrompt={hostData.summary_prompt}
        crossPollination={hostData.cross_pollination}
        sessionData={{
          topic: hostData.topic,
          goal: hostData.goal,
          critical: hostData.critical || '',
          context: hostData.context || '',
          crossPollination: hostData.cross_pollination,
          promptSummary: hostData.prompt_summary || '',
          facilitationPrompt: hostData.prompt || '',
        }}
        questions={questions}
        finalQuestions={finalQuestions}
        finalSurveyIntro={hostData.final_survey_intro ?? ''}
      />
      <SessionResultsSection
        hostData={hostData}
        userData={usersWithChat}
        resourceId={hostData.id}
        visibilityConfig={visibilityConfig}
        showShare={showShare}
        chatEntryMessage={chatEntryMessage}
      />
    </div>
  );
}

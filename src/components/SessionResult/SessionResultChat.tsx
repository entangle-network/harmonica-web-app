'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmbeddedChat } from '@/components/chat/EmbeddedChat';
import { UserSession } from '@/lib/schema';
import { OpenAIMessage } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface SessionResultChatProps {
  userData: UserSession[];
  customMessageEnhancement?: (
    message: OpenAIMessage,
    index: number,
  ) => React.ReactNode;
  entryMessage?: OpenAIMessage;
  sessionIds?: string[];
}

export default function SessionResultChat({
  userData,
  customMessageEnhancement,
  entryMessage,
  sessionIds,
}: SessionResultChatProps) {
  const tAskAi = useTranslations('askAi');
  const defaultEntryMessage: OpenAIMessage = {
    role: 'assistant',
    content: tAskAi('entryMessage'),
  };

  return (
    <Card className="bg-secondary/50 shadow-none flex flex-col h-full mt-4" style={{ minHeight: 'calc(100vh - 4rem)', maxHeight: 'calc(100vh - 2rem)' }}>
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="text-md flex justify-normal items-center">
          <img src="/ask-ask-pfp.png" alt="" className="h-10 w-10 mr-2 rounded-full" />
          {tAskAi('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {userData && userData.length > 0 && (
          <EmbeddedChat
            context={{
              role: 'assistant',
              content: `You will be asked questions based on the session data. Answer short.`,
              userData: userData.filter((user) => user.include_in_summary),
            }}
            sessionIds={
              sessionIds && sessionIds.length > 0
                ? sessionIds
                : [userData[0].session_id]
            }
            entryMessage={entryMessage || defaultEntryMessage}
            placeholderText={tAskAi('placeholder')}
            customMessageEnhancement={customMessageEnhancement}
            isAskAi={true}
          />
        )}
      </CardContent>
    </Card>
  );
}

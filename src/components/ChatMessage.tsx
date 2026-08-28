import { useTranslations } from 'next-intl';
import { Message } from '@/lib/schema';
import { useSessionTheme } from '@/components/SessionTheme';
import { themeImageUrl } from '@/lib/themeColors';
import { HRMarkdown } from './HRMarkdown';
import { Button } from './ui/button';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { encryptId } from '@/lib/encryptionUtils';
import { usePermissions } from '@/lib/permissions';

interface ChatMessageProps {
  message: Partial<Message>;
  sessionId?: string;
  showButtons?: boolean;
  hideProfilePicture?: boolean;
}

export function ChatMessage({
  message,
  sessionId,
  showButtons = false,
  hideProfilePicture = false,
}: ChatMessageProps) {
  const t = useTranslations('chatIntro');
  const theme = useSessionTheme();
  const { isPublic } = usePermissions(sessionId ?? '');
  const isUser = message.role === 'user';
  const router = useRouter();
  return (
    <div className={`${isUser ? 'flex justify-end' : 'flex'}`}>
      {!isUser && !hideProfilePicture && (
        <img
          className="h-10 w-10 flex-none rounded-full hidden md:block object-cover"
          src={themeImageUrl(theme.avatarId) ?? '/hm-chat-icon.svg'}
          alt=""
        />
      )}
      <div
        className={
          isUser
            ? 'md:ms-20 px-4 py-3.5 m-3 rounded-xl bg-white shadow-md'
            : ''
        }
      >
        <div className={!isUser ? 'pt-2' : ''}>
          <div className={!isUser ? 'ps-4' : ''}>
            <div className="text-sm">
              <HRMarkdown content={message.content ?? ''} className="text-sm" />
              {!isUser && message.is_final && showButtons && (
                <div className="mt-6">
                  {isPublic && (
                    <Button
                      variant="default"
                      onClick={() => {
                        if (sessionId) {
                          router.push(`/sessions/${encryptId(sessionId)}`);
                        }
                      }}
                    >
                      {t('viewResults')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                  {/* The "Try Harmonica yourself" call to action was removed: it
                      advertises the upstream product to participants of someone
                      else's session, which is not this deployment's purpose. */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

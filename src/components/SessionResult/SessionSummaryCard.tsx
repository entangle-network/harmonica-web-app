import { useLocale, useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { HostSession, UserSession } from '@/lib/schema';
import { format, intlFormatDistance } from 'date-fns';
import { useDateLocale } from '@/lib/dateLocale';
import { encryptId } from '@/lib/encryptionUtils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Stav se tu pocita velkymi pismeny kvuli podminkam nize, klice v katalogu
// maji tvar z enumu SessionStatus.
const STATUS_KEY = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  FINISHED: 'Finished',
} as const;

export default function SessionSummaryCard({
  hostData,
  userData,
  workspace_id,
  id,
  onRemove,
}: {
  hostData: HostSession;
  userData: UserSession[];
  workspace_id: string;
  id: string;
  onRemove?: (sessionId: string) => void;
}) {
  const t = useTranslations('common');
  const tCard = useTranslations('sessionSummaryCard');
  const tStatus = useTranslations('sessionsTable');
  const locale = useLocale();
  const dateLocale = useDateLocale();
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link from navigating
    e.stopPropagation(); // Stop event propagation

    if (onRemove) {
      if (confirm(tCard('removeConfirm', { topic: hostData.topic }))) {
        onRemove(id);
      }
    }
  };
  // Not 100% what we use elsewhere (where we actually check for how many users have sent more than 2 messages);
  // but maybe good enough for now.
  const totalUsers = userData.filter(user => user.include_in_summary).length;
  
  const status = 
            !hostData.active || hostData.final_report_sent
              ? "FINISHED"
              : totalUsers === 0
              ? "DRAFT"
              : "ACTIVE";

  return (
    <div className="relative group">
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white shadow-md border opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={handleRemove}
          aria-label={t('removeSession')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Link href={`/sessions/${encryptId(id)}`}>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="text-xl truncate">{hostData.topic}</span>
            </CardTitle>
            {hostData.goal && (
              <div>
                <dt className="text-sm text-gray-500">{t('objective')}</dt>
                <p className="text-sm mt-2 line-clamp-2">{hostData.goal}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-gray-500">{t('participants')}</dt>
                <dd className="text-2xl font-semibold">{userData.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">{t('started')}</dt>
                <dd className="text-sm">
                  {Date.now() - new Date(hostData.start_time).getTime() >
                  7 * 24 * 60 * 60 * 1000
                    ? format(new Date(hostData.start_time), 'PP', {
                        locale: dateLocale,
                      })
                    : intlFormatDistance(
                        new Date(hostData.start_time),
                        new Date(),
                        { locale }
                      )}
                </dd>
              </div>
              <div>
                <Badge
                  variant="outline"
                  className={`${
                    status === 'ACTIVE' ? 'bg-lime-100 text-lime-900'
                      : status === 'DRAFT' ? 'bg-purple-100 text-purple-900' 
                      : '' // Finished, remain white
                  }`}
                >
                  {tStatus(`status.${STATUS_KEY[status]}`)}
                </Badge>
              </div>
            </dl>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

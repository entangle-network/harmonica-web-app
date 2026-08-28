import { useTranslations } from 'next-intl';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { SessionStatus } from "@/lib/clientUtils";
import { useDateLocale } from "@/lib/dateLocale";

interface SessionResultStatusProps {
  status: SessionStatus;
  startTime: Date | string;
  numSessions: number;
  completedSessions: number;
}

export default function SessionResultStatus({
  status,
  startTime,
  numSessions,
  completedSessions
}: SessionResultStatusProps) {
  const t = useTranslations('common');
  const tStatus = useTranslations('sessionsTable');
  const tCount = useTranslations('sessionStatus');
  const dateLocale = useDateLocale();
  // In the past, some sessions did not have a start time. Just set 'a while ago' for those.
  const startTimeString = !startTime
    ? t('aWhileAgo')
    : format(new Date(startTime), 'PP', { locale: dateLocale });
  
  return (
    <div className="flex flex-grow gap-4">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-md">{t('status')}</CardTitle>
            <Badge variant="outline" className={
            status === SessionStatus.ACTIVE ? "bg-lime-100 text-lime-900"
              : status === SessionStatus.DRAFT ? "text-purple-900 bg-purple-100"
                : "text-gray-500 bg-gray-100"}>
              {tStatus(`status.${status}`)}
            </Badge>

          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 justify-end items-start">
            <p> {t('startedOn')}
            <span className="font-medium"> {startTimeString}</span>
          </p>
        <div className='flex gap-2 items-center border rounded-2xl'>
              <User className="w-4 h-4 ml-2 text-muted-foreground" />
              <div className="flex gap-1 px-1 py-1">{tCount('startedCount', { count: numSessions })}</div>
              <div className="flex gap-1 bg-lime-50 px-3 py-1 border-l rounded-2xl">{tCount('completedCount', { count: completedSessions })}</div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
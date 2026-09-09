import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../../_lib/auth';
import { forbidden, internalError, notFound } from '../../../_lib/errors';
import { checkSessionAccess } from '../../../_lib/permissions';
import {
  getHostSessionById,
  getNumUsersAndMessages,
  getUsersBySessionId,
} from '@/lib/db';

/**
 * Souhrnná čísla o průchodu sezením — jen čísla, žádný obsah.
 *
 * Sousední /responses vrací každého účastníka i s celou konverzací; na
 * statistiku (dashboard na webu projektu) je to zbytečně mnoho osobních údajů
 * přes drát. Tahle trasa spočítá totéž na místě a pošle jen agregáty.
 *
 * Definice „zapojený“ (> 2 zprávy a započítaný do souhrnu) je záměrně ta
 * samá, kterou používá administrace sezení — aby obě místa ukazovala stejná
 * čísla. Viz getUserStats v src/lib/clientUtils.ts.
 */

/** Datum ve dni webu, ne v UTC: účastník z 00:30 patří do svého dne, ne do včerejška. */
const DAY_IN_PRAGUE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Prague',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

type DayRow = { date: string; participants: number; engaged: number; finished: number };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticateRequest();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const role = await checkSessionAccess(user, id);
    if (!role) return forbidden();

    const session = await getHostSessionById(id);

    const [perUser, rows] = await Promise.all([
      getNumUsersAndMessages([id]),
      getUsersBySessionId(id, [
        'id',
        'start_time',
        'include_in_summary',
        'marketing_consent_at',
      ]),
    ]);
    const stats = perUser[id] ?? {};

    let engaged = 0;
    let finished = 0;
    let marketingOptins = 0;
    const messageCounts: number[] = [];
    const days = new Map<string, DayRow>();

    for (const row of rows) {
      const s = stats[row.id];
      const isEngaged = !!s && s.num_messages > 2 && s.includedInSummary;
      const isFinished = isEngaged && s.finished;

      if (isEngaged) {
        engaged += 1;
        messageCounts.push(s.num_messages);
      }
      if (isFinished) finished += 1;
      if (row.marketing_consent_at) marketingOptins += 1;

      const date = DAY_IN_PRAGUE.format(row.start_time);
      const day = days.get(date) ?? { date, participants: 0, engaged: 0, finished: 0 };
      day.participants += 1;
      if (isEngaged) day.engaged += 1;
      if (isFinished) day.finished += 1;
      days.set(date, day);
    }

    messageCounts.sort((a, b) => a - b);
    const messagesAvg = messageCounts.length
      ? messageCounts.reduce((sum, n) => sum + n, 0) / messageCounts.length
      : 0;
    const messagesMedian = messageCounts.length
      ? messageCounts[Math.floor((messageCounts.length - 1) / 2)]
      : 0;

    return NextResponse.json({
      session_id: id,
      topic: session.topic,
      active: session.active,
      participants: rows.length,
      engaged,
      finished,
      marketing_optins: marketingOptins,
      messages_avg: Math.round(messagesAvg * 10) / 10,
      messages_median: messagesMedian,
      by_day: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error: any) {
    if (error?.message?.includes('no result')) {
      return notFound('Session not found');
    }
    console.error('Error in GET /api/v1/sessions/[id]/stats:', error);
    return internalError();
  }
}

'use server';

import { getHostSessionById, getUserSessionById } from '@/lib/db';
import { getCityFromContext, getEmailFromContext } from '@/lib/clientUtils';
import { subscribeToCrm } from '@/lib/crmSubscribe';
import { QuestionInfo } from 'app/create/types';

/**
 * Předání účastníka do CRM po tom, co si v úvodním formuláři řekl o pozvánky
 * na akce.
 *
 * Z klienta sem jde jediné — id právě založeného účastníka. Všechno ostatní
 * (jestli souhlas padl, jaký tag sezení nese, jaká je adresa) se čte z databáze:
 * účastník se do sezení dostane odkazem bez přihlášení, takže cokoli, co by
 * poslal prohlížeč, by šlo podvrhnout. Takhle nejde ani vnutit cizí tag, ani
 * poslat do CRM adresu, kterou nikdo do formuláře nenapsal.
 *
 * Nikdy nevyhazuje výjimku: nedostupné CRM nesmí účastníkovi zabránit
 * v konverzaci, kvůli které přišel.
 */

/** Zastřešující tag — aby šlo v CRM vybrat „všichni z Témat“ jedním klikem. */
const BASE_TAG = 'Harmonica';

export async function syncParticipantToCrm(
  userSessionId: string,
): Promise<void> {
  try {
    const userSession = await getUserSessionById(userSessionId);
    // Bez zaškrtnutého nepovinného souhlasu se nikam nic neposílá.
    if (!userSession?.marketing_consent_at) return;

    const host = await getHostSessionById(userSession.session_id);
    const tag = host?.theme_crm_tag?.trim();
    // Prázdný tag = sezení nemá CRM nastavené; pak se ani zaškrtávátko
    // neukazuje, ale kdyby ho někdo obešel, končíme tady.
    if (!tag) return;

    const answers = userSession.answers as unknown as
      | Record<string, string>
      | undefined;
    const questions = host?.questions as unknown as QuestionInfo[] | undefined;

    const email = getEmailFromContext(answers, questions);
    if (!email) return;

    await subscribeToCrm({
      email,
      name: userSession.user_name ?? null,
      city: getCityFromContext(answers, questions),
      tags: [BASE_TAG, tag],
    });
  } catch (error) {
    console.error('[e] Kontakt se nepodařilo předat do CRM:', error);
  }
}

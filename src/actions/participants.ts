'use server';

import { getSession } from '@auth0/nextjs-auth0';
import { getDbInstance, getPermissions } from '@/lib/db';
import { serverMessage } from '@/lib/serverMessages';

/**
 * Smazání odpovědi jednoho účastníka.
 *
 * Aplikace to dosud neuměla. `deleteUserSession` v db.ts sice existuje, ale
 * nikdo ji nevolá a maže jen řádek v user_db — zprávy i hodnocení by po ní
 * zůstaly v databázi bez vazby, započítávaly by se do souhrnů a nedaly by se
 * už dohledat.
 *
 * Maže se proto celá stopa účastníka: zprávy vlákna, jeho hodnocení a nakonec
 * jeho záznam. Účastník se do sezení dostane odkazem bez přihlášení, takže
 * jediné, co ho identifikuje, je thread_id — podle něj se váže všechno
 * ostatní.
 */

const MAY_EDIT = ['admin', 'owner', 'editor'];

/**
 * Mazat smí jen ten, kdo smí sezení upravovat. Kontrola je tady, ne převzatá:
 * upstream src/app/actions/permissions.ts na tomhle místě stále nese
 * "TODO: Add permission check".
 */
async function assertMayEditSession(sessionId: string) {
  const session = await getSession();
  const userId = session?.user?.sub;
  if (!userId) {
    throw new Error(await serverMessage('authRequired'));
  }

  const permissions = await getPermissions(sessionId, 'SESSION');
  const mine = permissions.find((p) => p.user_id === userId);

  if (!mine || !MAY_EDIT.includes(mine.role)) {
    throw new Error(await serverMessage('unauthorized'));
  }
}

export async function deleteParticipantResponse(
  sessionId: string,
  userSessionId: string,
): Promise<{ success: boolean }> {
  await assertMayEditSession(sessionId);

  const db = await getDbInstance();

  // Ověření, že ten účastník opravdu patří k tomuhle sezení: bez něj by
  // oprávnění k jednomu sezení stačilo ke smazání odpovědi u kteréhokoli
  // jiného.
  const participant = await db
    .selectFrom('user_db')
    .where('id', '=', userSessionId)
    .where('session_id', '=', sessionId)
    .select(['id', 'thread_id'])
    .executeTakeFirst();

  if (!participant) {
    throw new Error(await serverMessage('notFound'));
  }

  // V transakci, ať po přerušení nezůstane účastník bez zpráv ani naopak.
  await db.transaction().execute(async (trx) => {
    if (participant.thread_id) {
      await trx
        .deleteFrom('messages_db')
        .where('thread_id', '=', participant.thread_id)
        .execute();
      await trx
        .deleteFrom('session_ratings')
        .where('thread_id', '=', participant.thread_id)
        .execute();
    }
    await trx.deleteFrom('user_db').where('id', '=', userSessionId).execute();
  });

  console.log(
    `[i] Smazána odpověď účastníka ${userSessionId} ze sezení ${sessionId}`,
  );

  return { success: true };
}

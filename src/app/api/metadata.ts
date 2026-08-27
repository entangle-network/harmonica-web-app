'use server';
import { decryptId } from '@/lib/encryptionUtils';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import * as db from '@/lib/db';

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || 'https://app.harmonica.chat';

// Titles, descriptions and keywords are what a browser tab, a shared link
// preview and a search engine show, so they follow the UI language like the
// rest of the app. They cannot live in module-level constants any more:
// getTranslations is async, so the copy is resolved per request instead.
async function buildMetadata(
  customTitle: string | { absolute: string },
  description?: string,
): Promise<Metadata> {
  const t = await getTranslations('metadata');
  const title =
    typeof customTitle === 'string' ? `${customTitle} | Harmonica` : customTitle;
  const resolved = description || t('defaultDescription');

  return {
    applicationName: 'Harmonica',
    keywords: t.raw('keywords') as string[],
    title,
    description: resolved,
    openGraph: {
      title,
      description: resolved,
    },
  };
}

export async function getGeneratedMetadata(path: string) {
  const t = await getTranslations('metadata');

  // Handle dynamic session & chat routes
  let sessionId;
  if (path.startsWith('/sessions/')) {
    const rawSessionId = path.split('/')[2];
    sessionId = decryptId(rawSessionId);
    const hostData = await db.getHostSessionById(sessionId);
    return buildMetadata(hostData.topic);
  } else if (path.startsWith('/workspace/')) {
    const wspaceId = path.split('/')[2];
    const wspaceData = await db.getWorkspaceById(wspaceId);
    return buildMetadata(
      wspaceData?.title || t('workspaceFallback'),
      wspaceData?.description || t('workspaceDescription'),
    );
  } else if (path.startsWith('/chat?s=')) {
    sessionId = path.split('?s=')[1];
    const hostData = await db.getHostSessionById(sessionId);
    const description = t('chatDescription');
    const absoluteTitle = `${hostData.topic}${
      hostData.topic.length < 15 ? t('poweredBySuffix') : ''
    }`;
    return {
      ...(await buildMetadata({ absolute: absoluteTitle }, description)),
      openGraph: {
        title: hostData.topic,
        description,
      },
    };
  }

  switch (path) {
    case '/create':
      return buildMetadata(t('create'), t('createDescription'));
    case '/templates':
      return buildMetadata(t('templates'), t('templatesDescription'));
    default:
      return {
        metadataBase: new URL(baseUrl),
        ...(await buildMetadata(t('dashboard'))),
      };
  }
}

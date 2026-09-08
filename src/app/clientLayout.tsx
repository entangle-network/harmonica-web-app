'use client';
import PostHogPageView from './PostHogPageView';
import { usePathname } from 'next/navigation';
import Navigation from './navigation';
// import SmallDonateBanner from '@/components/SmallDonateBanner';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname?.startsWith('/chat');
  const isCanvasDemo = pathname?.startsWith('/canvas-demo');
  // The privacy notice is reached from the participant flow, where the app's
  // own navigation — Harmonica's logo and a link to its help centre — is both
  // off-topic and misleading about who the controller is.
  const isPrivacyPage = pathname?.startsWith('/gdpr');
  const isWorkSpacePage = pathname?.startsWith('/workspace');
  const isAdminPage = pathname?.startsWith('/admin');
  // The root serves two audiences now: a landing for visitors without a session
  // and the dashboard for organisers. Only the dashboard wants the app's
  // navigation, and only the server knows which one is rendering, so the page
  // brings its own — see (dashboard)/page.tsx.
  const isRootPage = pathname === '/';

  return (
    <div>
      {/* {!isRootPage && !isChatPage && !isWorkSpacePage && (
        <SmallDonateBanner/>
      )} */}

      {isChatPage || isCanvasDemo || isPrivacyPage ? (
        <div>{children}</div>
      ) : (
        <div className="flex flex-col min-h-screen">
          {!isAdminPage && !isRootPage && <Navigation />}
          <main className="flex flex-col justify-start flex-grow bg-background">
            {children}
          </main>
        </div>
      )}
      <PostHogPageView />
    </div>
  );
}

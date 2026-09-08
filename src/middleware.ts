import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';
import { isbot } from 'isbot';

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
  const isAbot = isbot(req.headers.get('User-Agent'));
  // robots.txt has to survive this rewrite. Every crawler that would ever read
  // it is itself a bot, so without the exception the file is answered with the
  // preview page's HTML and no crawler ever sees the rules.
  const isCrawlerFile = req.nextUrl.pathname === '/robots.txt';
  if (isAbot && !isCrawlerFile && !req.nextUrl.pathname.startsWith('/api')) {
    const botUrl = new URL('/bots', req.nextUrl);
    const path = req.nextUrl.pathname;

    if (path.startsWith('/chat')) {
      botUrl.pathname = '/bots/chat';
    } else {
      botUrl.pathname = '/bots/';
    }

    botUrl.searchParams.set('pathAndSearch', path + req.nextUrl.search);
    return NextResponse.rewrite(botUrl);
  }

  // The landing page is public: sending every visitor straight to Auth0 asks
  // people who only came to fill in a session to create an account. Organisers
  // sign in at /api/auth/login, which nothing links to. Matched exactly, so
  // every other route keeps its own rule.
  if (req.nextUrl.pathname === '/' || isCrawlerFile) {
    return NextResponse.next();
  }

  if (
    // Allow these without authentication:
    // Video hostované u nás patří k pozvánce, kterou účastník otevírá bez
    // přihlášení. Bez výjimky by se požadavek na soubor přesměroval na Auth0
    // a přehrávač by dostal přihlašovací stránku místo videa.
    req.nextUrl.pathname.match(
      /^\/(?:api|login|chat|gdpr|canvas-demo|.*\.ico|.*\.png|.*\.svg|.*\.mp4|.*\.webm|.*\.ogv|_next\/static|_next\/image)/
    )
  ) {
    return NextResponse.next();
  }

  // Check public access parameter
  const isPublicAccess = req.nextUrl.searchParams.get('access') === 'public';
  if (isPublicAccess) {
    return NextResponse.next();
  }

  const authRequiredMiddleware = withMiddlewareAuthRequired();
  return authRequiredMiddleware(req, ev);
}
import Link from 'next/link';

/**
 * What a visitor without a session sees at the root.
 *
 * The root used to be behind the login wall, so anyone who opened the bare
 * domain — a participant checking the address off a poster, someone following a
 * truncated link — was asked to create an account for a tool that is not theirs.
 *
 * There is deliberately no sign-in control here. Organisers go straight to
 * /api/auth/login, which nothing links to; that is not a security measure, it
 * just keeps an account prompt out of a participant's way.
 */
export function PublicLanding() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Témata
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Platforma pro sběr názorů projektu Město v dialogu. Do konverzace se
        vchází odkazem, který dostanete od pořadatele.
      </p>

      <Link
        href="https://mestovdialogu.cz"
        className="mt-8 inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
      >
        Přejít na mestovdialogu.cz
      </Link>

      <Link
        href="/gdpr"
        className="mt-10 text-xs text-muted-foreground underline hover:text-foreground"
      >
        Zpracování osobních údajů
      </Link>
    </main>
  );
}

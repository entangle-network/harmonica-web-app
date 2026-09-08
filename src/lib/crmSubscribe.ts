'use server';

/**
 * Předání kontaktu do CRM projektu Město v dialogu.
 *
 * Posílá se na úzký endpoint na webu projektu, ne rovnou do REST API FluentCRM:
 * aplikační heslo by téhle aplikaci otevřelo celé CRM, kdežto endpoint umí
 * jedinou operaci — založit kontakt čekající na potvrzení. Double opt-in,
 * zařazení do seznamu i potvrzovací e-mail zůstávají na straně webu, takže se
 * chovají stejně jako u přihlášení přes formulář na webu.
 *
 * Bez MVD_CRM_URL a MVD_CRM_TOKEN je integrace vypnutá a funkce jen vrátí
 * false — stejně jako to dělá odesílání přes Brevo bez klíče.
 */

export async function subscribeToCrm({
  email,
  name,
  city,
  tags,
}: {
  email: string;
  name?: string | null;
  city?: string | null;
  tags: string[];
}): Promise<boolean> {
  const endpoint = process.env.MVD_CRM_URL;
  const token = process.env.MVD_CRM_TOKEN;
  if (!endpoint || !token) return false;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'X-MVD-Token': token,
      },
      body: JSON.stringify({
        email,
        name: name ?? '',
        city: city ?? '',
        source: 'harmonica',
        tags,
      }),
      // Účastník čeká na start konverzace; kdyby CRM neodpovídalo, nesmí ho to
      // držet. Delší prodlevu radši vzdáme — kontakt není kritický zápis.
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(
        `[e] CRM odmítlo kontakt: HTTP ${response.status} ${detail.slice(0, 300)}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('[e] CRM je nedostupné:', error);
    return false;
  }
}

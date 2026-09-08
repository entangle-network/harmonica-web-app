'use server';

/**
 * Odesílání přes transakční API Brevo.
 *
 * Alternativa k SMTP, ne jeho náhrada. Má dvě praktické výhody:
 *
 *  - Nepotřebuje odchozí SMTP port. Poskytovatelé serverů odchozí porty 25,
 *    465 a 587 běžně blokují kvůli spamu a odblokování se musí žádat; HTTPS
 *    ven vede vždycky.
 *  - Když odeslání selže, Brevo vrátí důvod v těle odpovědi. SMTP vrátí
 *    číselný kód, ze kterého se příčina hádá hůř.
 *
 * Používá se, jen když je nastavené BREVO_API_KEY; jinak se jde přes SMTP.
 */

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export async function sendViaBrevoApi({
  to,
  subject,
  html,
  text,
  fromEmail,
  fromName,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  fromEmail: string;
  fromName: string;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!response.ok) {
      // Tělo odpovědi nese důvod (neověřený odesílatel, neplatný klíč,
      // vyčerpaný limit). Bez něj by v logu zůstalo jen číslo.
      const detail = await response.text().catch(() => '');
      console.error(
        `[e] Brevo odmítlo zprávu: HTTP ${response.status} ${detail.slice(0, 300)}`,
      );
      return false;
    }

    console.log(`[i] E-mail odeslán přes Brevo API na ${to}`);
    return true;
  } catch (error) {
    console.error('[e] Volání Brevo API selhalo:', error);
    return false;
  }
}

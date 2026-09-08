import type { MetadataRoute } from 'next';

/**
 * Nothing here belongs in search results.
 *
 * The rule that achieves that is the `X-Robots-Tag: noindex` header in
 * next.config.js, not this file. Crawling is deliberately left open so that
 * header can be read at all — a blanket `Disallow: /` would stop the fetch, and
 * a crawler that never fetches never learns the page should not be listed.
 *
 * What is disallowed here is the organiser's side of the app. Those routes sit
 * behind Auth0 anyway, so a crawler only ever gets a redirect out of them;
 * saying so up front just saves everyone the requests.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: [
        '/api/',
        '/admin/',
        '/create',
        '/settings',
        '/templates',
        '/sessions/',
        '/workspace/',
      ],
    },
  };
}

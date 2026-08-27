import { NextResponse } from 'next/server';
import { getDbInstance } from '@/lib/db';

// Participants are not signed in, so this has to be reachable without a session.
// The id is a random uuid and the response is an image the host chose to show
// them, so there is nothing to gate.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const db = await getDbInstance();
    const image = await db
      .selectFrom('theme_images')
      .where('id', '=', params.id)
      .select(['mime_type', 'data'])
      .executeTakeFirst();

    if (!image) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.data), {
      headers: {
        'Content-Type': image.mime_type,
        // Uploading a replacement creates a new row with a new id, so a given id
        // never changes content and can be cached indefinitely.
        'Cache-Control': 'public, max-age=31536000, immutable',
        // SVG uploads are documents, not just pixels: opened directly they can
        // run script in this origin. Rendering them through <img> is safe, but
        // the URL is reachable on its own, so lock the response down.
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Failed to serve theme image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}

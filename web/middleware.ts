/**
 * Vercel Routing Middleware: link previews for shared vehicle pages.
 *
 * The app is a static SPA, so a crawler fetching /vehicle/1234567 would only
 * see the generic shell. For known preview bots (WhatsApp, Telegram, Facebook,
 * …) this returns the shell with that vehicle's title and image tags. People
 * are passed straight through — no registry call, no added latency.
 */
import { next } from '@vercel/functions';
import { isValidPlate, normalizePlate } from './src/lib/plate';
import { injectMeta } from './server/injectMeta';
import { PREVIEW_DESCRIPTION, fetchVehicleMeta, previewTitle } from './server/vehicleMeta';

export const config = { matcher: ['/vehicle/:plate*'] };

const PREVIEW_BOTS =
  /facebookexternalhit|facebookcatalog|Facebot|WhatsApp|TelegramBot|Twitterbot|Slackbot|LinkedInBot|Discordbot|SkypeUriPreview|Applebot|Pinterest|redditbot|Embedly|vkShare|Googlebot|bingbot/i;

export function isPreviewBot(userAgent: string | null): boolean {
  return PREVIEW_BOTS.test(userAgent ?? '');
}

export default async function middleware(
  request: Request,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  if (!isPreviewBot(request.headers.get('user-agent'))) return next();

  const url = new URL(request.url);
  const plate = normalizePlate(url.pathname.split('/').filter(Boolean)[1] ?? '');
  if (!isValidPlate(plate)) return next();

  const [shell, meta] = await Promise.all([
    fetchImpl(new URL('/index.html', url)),
    fetchVehicleMeta(plate, fetchImpl),
  ]);
  if (!shell.ok) return next();

  const html = injectMeta(await shell.text(), {
    title: previewTitle(meta),
    description: PREVIEW_DESCRIPTION,
    url: url.toString(),
    image: new URL(`/api/og?plate=${plate}`, url).toString(),
  });

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Registry facts barely change; let the preview service cache it.
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

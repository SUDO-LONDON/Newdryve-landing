/**
 * GET /app: the QR code target. Sends a phone straight to its store:
 *   iPhone / iPad -> App Store
 *   Android       -> Google Play
 *   anything else -> app.newdryve.com, the download page with both buttons
 *
 * Runs on the server (not prerendered) because it reads the User-Agent.
 * The QR artwork at /qr-app.svg encodes https://newdryve.com/app.
 */
import type { APIRoute } from 'astro';
import { APP } from '../config/site';

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const ua = request.headers.get('user-agent') || '';

  let target: string = APP.web.url;
  if (/iPhone|iPad|iPod/i.test(ua)) target = APP.ios.url;
  else if (/Android/i.test(ua)) target = APP.android.url;

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      // The answer depends on the device, so never cache one device's answer
      // for another.
      'Cache-Control': 'no-store',
      Vary: 'User-Agent',
    },
  });
};

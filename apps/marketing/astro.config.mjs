// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://newdryve.com';

export default defineConfig({
  site: SITE_URL,
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  // Static by default: every marketing page is prerendered to plain HTML at
  // build time. The two form endpoints opt out individually with
  // `export const prerender = false`, because they hold server-only secrets
  // (Resend + Supabase service role) and must never run in the browser.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      // Keep private utility/legal noindex URLs out of XML sitemaps.
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/$/, '') || '/';

        return (
          !pathname.startsWith('/ops') &&
          ![
            '/terms',
            '/reset-password',
            '/datadeletion',
            '/connect/return',
            '/connect/refresh',
            '/instructor/setup',
            '/instructors/activate',
          ].includes(pathname)
        );
      },
      // Canonical URLs omit trailing slashes, so sitemap entries must use the
      // same URL shape. The home page remains https://newdryve.com/.
      serialize: (item) => {
        const url = new URL(item.url);

        if (url.pathname !== '/') {
          url.pathname = url.pathname.replace(/\/$/, '');
        }

        return { ...item, url: url.href };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});

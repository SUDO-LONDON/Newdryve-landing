// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://newdryve.com';

export default defineConfig({
  site: SITE_URL,
  // Static by default: every marketing page is prerendered to plain HTML at
  // build time. The two form endpoints opt out individually with
  // `export const prerender = false`, because they hold server-only secrets
  // (Resend + Supabase service role) and must never run in the browser.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      // The founder portal lives on a separate service and must stay unindexed.
      filter: (page) => !page.includes('/ops'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});

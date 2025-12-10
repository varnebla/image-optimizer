// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';


// https://astro.build/config
export default defineConfig({
  site: 'https://image-optimizer.xyz',
  integrations: [vue(), sitemap()],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
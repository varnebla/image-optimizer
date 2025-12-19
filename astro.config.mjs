// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';


import mdx from '@astrojs/mdx';


// https://astro.build/config
export default defineConfig({
  site: 'https://image-optimizer.xyz',
  integrations: [vue(), sitemap(), mdx()],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
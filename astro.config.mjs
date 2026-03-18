import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  site: 'https://vitalychauffeur.com',

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});
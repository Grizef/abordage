// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://abordage-sud-sarthe.fr',
  output: 'server', // Permet d'activer les routes API POST
  adapter: node({ mode: 'standalone' }), // Adapter Node pour les routes serveur
  integrations: [mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
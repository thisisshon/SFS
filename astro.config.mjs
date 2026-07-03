// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Shriram Financial Services — built to organisation scale (4,000+ pages).
// Static output, directory-format URLs (/products/equity/ → products/equity/index.html),
// sitemap generated automatically from the page tree.
export default defineConfig({
  site: 'https://www.shriramfinancialservices.com',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});

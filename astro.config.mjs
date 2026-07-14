// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Shriram Financial Services - built to organisation scale (4,000+ pages).
// Static output, file-format extensionless URLs with NO trailing slash
// (/mutualfunds → mutualfunds.html); slugs carry no hyphens. Sitemap generated
// automatically from the page tree.
export default defineConfig({
  // UAT/draft deploy (GitHub Pages user site). For production, switch back to
  // the real domain: 'https://www.shriramfinancialservices.com'.
  site: 'https://thisisshon.github.io',
  trailingSlash: 'never',
  // Hide the Astro dev toolbar (the floating dev-only pill at the bottom).
  devToolbar: { enabled: false },
  build: {
    // 'file' emits foo.html (served at /foo, no trailing slash) instead of the
    // directory index foo/index.html (which GitHub Pages 301s to /foo/).
    format: 'file',
  },
  integrations: [
    sitemap({
      // Keep internal tooling out of the PUBLIC sitemap so UAT/prod never
      // advertises it to crawlers or stakeholders. Proofkit's admin routes
      // (/review, /review-guide, /reviewdash[/*], /teamdash) stay reachable for
      // reviewers who know the URL but are unlisted; the /designsystem pages are
      // excluded defensively in case they're ever restored into src/pages (they
      // now live in internal/ and don't build). Marketing/product pages only.
      filter: (page) =>
        !/\/(review|review-guide|reviewdash|teamdash|designsystem)(\/|$)/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

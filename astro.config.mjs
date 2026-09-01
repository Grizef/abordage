// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://abordage-sud-sarthe.fr",
  output: "server", // Permet d'activer les routes API POST
  adapter: node({ mode: "standalone" }), // Adapter Node pour les routes serveur
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/admin"),
    }),
  ],
  experimental: {
    // Génère automatiquement les hachages CSP des scripts/styles produits par Astro.
    csp: {
      directives: [
        "default-src 'self'",
        "frame-ancestors 'none'",
        "connect-src 'self' https://*.supabase.co",
        "img-src 'self' data:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://formspree.io",
      ],
    },
  },
});

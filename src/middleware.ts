import { defineMiddleware } from "astro:middleware";
import { verifyAdmin } from "./lib/auth";

const SITE_ORIGIN = new URL(
  import.meta.env.SITE ?? "https://abordage-sud-sarthe.fr",
).origin;

/**
 * Limiteur de débit en mémoire (fenêtre glissante, par IP).
 * Suffisant pour un déploiement mono-processus ; à remplacer par un store
 * partagé (Redis/Upstash) en cas de passage à plusieurs instances.
 */
const RATE_LIMIT = { windowMs: 60_000, max: 30 };
const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function rateLimited(request: Request): boolean {
  const ip = clientIp(request);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT.max;
}

function securityHeaders(headers: Headers): void {
  // La politique CSP (script-src / style-src avec hachages) est générée par Astro
  // sous forme de <meta> (experimental.csp). Ici : en-têtes qui doivent être HTTP.
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const { pathname } = context.url;

  if (pathname.startsWith("/api/")) {
    if (rateLimited(request)) {
      return json({ error: "Trop de requêtes. Réessayez plus tard." }, 429);
    }

    // Protection CSRF : sur les mutations, l'origine doit correspondre au site.
    if (request.method !== "GET" && request.method !== "HEAD") {
      const origin = request.headers.get("origin");
      if (origin && new URL(origin).origin !== SITE_ORIGIN) {
        return json({ error: "Origine non autorisée." }, 403);
      }
    }

    // Toutes les routes /api/* sont réservées à l'administration.
    const check = await verifyAdmin(request);
    if (!check.ok) return check.response;
  }

  const response = await next();
  securityHeaders(response.headers);

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
});

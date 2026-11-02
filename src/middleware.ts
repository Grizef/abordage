import { defineMiddleware } from "astro:middleware";
import { verifyAdmin } from "./lib/auth";

// /api/health reste public : Uptime Kuma le sonde sans session.
const PUBLIC_API = new Set(["/api/health"]);

export const onRequest = defineMiddleware(async ({ request, url }, next) => {
  if (url.pathname.startsWith("/api/") && !PUBLIC_API.has(url.pathname.replace(/\/$/, ""))) {
    const denied = await verifyAdmin(request);
    if (denied) return denied;
  }
  return next();
});

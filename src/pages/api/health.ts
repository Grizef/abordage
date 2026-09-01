import { supabaseServer } from '../../lib/supabaseServer';

export const prerender = false;

// Endpoint de santé consommé par le monitoring (Uptime Kuma).
// Renvoie 200 si tout va bien, 503 si un composant est dégradé.
export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; ms: number; error?: string }> = {};

  // Connexion Supabase : count HEAD sur la table news, sans transférer de lignes.
  const dbStart = Date.now();
  try {
    const { error } = await supabaseServer
      .from('news')
      .select('slug', { head: true, count: 'exact' });
    checks.supabase = {
      ok: !error,
      ms: Date.now() - dbStart,
      ...(error ? { error: error.message } : {}),
    };
  } catch (err) {
    checks.supabase = {
      ok: false,
      ms: Date.now() - dbStart,
      error: err instanceof Error ? err.message : 'unknown error',
    };
  }

  const healthy = Object.values(checks).every((c) => c.ok);

  return new Response(
    JSON.stringify({
      status: healthy ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startedAt,
      checks,
    }),
    {
      status: healthy ? 200 : 503,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
      },
    },
  );
}

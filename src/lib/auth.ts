import { supabaseServer } from "./supabaseServer";

const ADMIN_USER_ID = import.meta.env.ADMIN_USER_ID;

if (!ADMIN_USER_ID) {
  throw new Error("Missing ADMIN_USER_ID environment variable");
}

export type AdminCheck =
  { ok: true; userId: string } | { ok: false; response: Response };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Extrait le jeton d'accès Supabase d'une requête.
 * Accepté via l'en-tête `Authorization: Bearer <token>`.
 */
export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Vérifie côté serveur que la requête provient de l'administrateur autorisé.
 * Valide le JWT auprès de Supabase et compare l'UUID à `ADMIN_USER_ID`.
 */
export async function verifyAdmin(request: Request): Promise<AdminCheck> {
  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: json({ error: "Authentification requise." }, 401),
    };
  }

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, response: json({ error: "Session invalide." }, 401) };
  }

  if (data.user.id !== ADMIN_USER_ID) {
    return { ok: false, response: json({ error: "Accès non autorisé." }, 403) };
  }

  return { ok: true, userId: data.user.id };
}

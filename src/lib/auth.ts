import { supabaseServer } from "./supabaseServer";

const ADMIN_USER_ID = import.meta.env.ADMIN_USER_ID;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Vérifie côté serveur que la requête provient de l'administrateur autorisé :
 * valide le JWT Supabase (`Authorization: Bearer <token>`) et compare l'UUID à `ADMIN_USER_ID`.
 * Renvoie `null` si autorisé, sinon la réponse d'erreur à renvoyer.
 */
export async function verifyAdmin(request: Request): Promise<Response | null> {
  // Fail closed : sans ADMIN_USER_ID configuré, personne n'est admin.
  if (!ADMIN_USER_ID) return json({ error: "Administration non configurée." }, 503);

  const match = (request.headers.get("authorization") ?? "").match(/^Bearer\s+(.+)$/i);
  if (!match) return json({ error: "Authentification requise." }, 401);

  const { data, error } = await supabaseServer.auth.getUser(match[1].trim());
  if (error || !data.user) return json({ error: "Session invalide." }, 401);
  if (data.user.id !== ADMIN_USER_ID) return json({ error: "Accès non autorisé." }, 403);

  return null;
}

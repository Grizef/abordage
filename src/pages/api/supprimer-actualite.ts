import type { APIRoute } from "astro";
import { supabaseServer } from "../../lib/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const slug = body?.slug;

  if (!slug) {
    return Response.json({ success: false, error: "slug manquant" }, { status: 400 });
  }

  try {
    const { error } = await supabaseServer.from("news").delete().eq("slug", slug);

    if (error) {
      console.error("Supabase delete error:", error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de la suppression:", err);
    return Response.json(
      { success: false, error: "Suppression impossible." },
      { status: 500 },
    );
  }
};

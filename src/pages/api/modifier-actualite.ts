import type { APIRoute } from "astro";
import { supabaseServer } from "../../lib/supabaseServer";
import { sanitizeArticleHtml } from "../../lib/sanitize";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json(
      { success: false, error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const { slug, title, description, contenu, publishDate } = body;
  if (!slug || !title || !description || !contenu || !publishDate) {
    return Response.json(
      { success: false, error: "Tous les champs sont requis." },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabaseServer
      .from("news")
      .update({
        title,
        description,
        content_html: sanitizeArticleHtml(String(contenu)),
        publish_date: publishDate,
      })
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de la modification:", err);
    return Response.json(
      { success: false, error: "Modification impossible." },
      { status: 500 },
    );
  }
};

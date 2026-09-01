import type { APIRoute } from "astro";
import { supabaseServer } from "../../lib/supabaseServer";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const slug = body?.slug;
    if (!slug) {
      return Response.json({ success: false, error: "slug manquant" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("news")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      console.error("Supabase select error:", error);
      return Response.json({ success: false, error: "introuvable" }, { status: 404 });
    }

    const frontmatter = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      publishDate: data.publish_date,
      image: data.image_url,
    };

    return Response.json(
      { success: true, frontmatter, content: data.content_html },
      { status: 200 },
    );
  } catch (err) {
    console.error("Erreur lors de la récupération:", err);
    return Response.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
};

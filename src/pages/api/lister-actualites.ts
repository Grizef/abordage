import type { APIRoute } from "astro";
import { supabaseServer } from "../../lib/supabaseServer";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabaseServer
      .from("news")
      .select("slug, title, description, publish_date")
      .order("publish_date", { ascending: false });

    if (error) {
      console.error("Supabase select error:", error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    const list = (data ?? []).map((item) => ({
      slug: item.slug,
      title: item.title,
      description: item.description,
      publishDate: item.publish_date,
    }));

    return Response.json({ success: true, list }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors du listage:", err);
    return Response.json(
      { success: false, error: "Impossible de lister." },
      { status: 500 },
    );
  }
};

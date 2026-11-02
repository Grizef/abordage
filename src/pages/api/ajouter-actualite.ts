import type { APIRoute } from "astro";
import { supabaseServer } from "../../lib/supabaseServer";
import { sanitizeArticleHtml } from "../../lib/sanitize";

export const prerender = false;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Renvoie un slug non déjà utilisé dans la table `news`. */
async function uniqueSlug(base: string): Promise<string> {
  const { data } = await supabaseServer
    .from("news")
    .select("slug")
    .like("slug", `${base}%`);

  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;

  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => null);
  if (!data) {
    return Response.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const { title, publishDate, description, image, contenu } = data;
  if (!title || !publishDate || !description || !contenu) {
    return Response.json(
      { error: "Tous les champs sont requis." },
      { status: 400 },
    );
  }

  const base = slugify(String(title));
  if (!base) {
    return Response.json({ error: "Titre invalide." }, { status: 400 });
  }

  const slug = await uniqueSlug(base);
  const contentHtml = sanitizeArticleHtml(String(contenu));

  try {
    const { data: inserted, error } = await supabaseServer
      .from("news")
      .insert({
        slug,
        title,
        description,
        content_html: contentHtml,
        publish_date: publishDate,
        image_url: image || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data: inserted }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors de la sauvegarde:", err);
    return Response.json(
      { error: "Erreur lors de la sauvegarde." },
      { status: 500 },
    );
  }
};

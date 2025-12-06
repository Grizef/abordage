import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const { title, publishDate, description, image, contenu } = data;
  if (!title || !publishDate || !description || !contenu) {
    return new Response(JSON.stringify({ error: 'Tous les champs sont requis.' }), { status: 400 });
  }
  // Générer le slug automatiquement à partir du titre
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const safeSlug = slug.replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${safeSlug}.md`;
  const filePath = path.join(process.cwd(), 'src/content/actualites', filename);
  const markdown = `---\ntitle: ${title}\nslug: ${slug}\npublishDate: ${publishDate}\ndescription: ${description}\n${image ? `image: ${image}\n` : ''}---\n\n${contenu}\n`;
  try {
    fs.writeFileSync(filePath, markdown);
    return new Response(JSON.stringify({ success: true, filename }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde.' }), { status: 500 });
  }
};


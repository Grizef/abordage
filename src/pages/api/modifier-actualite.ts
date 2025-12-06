import fs from 'fs';
import path from 'path';

export async function POST({ request }: { request: any }) {
  const { slug, title, description, contenu, publishDate } = await request.json();
  const filePath = path.join(process.cwd(), 'src/content/actualites', `${slug}.md`);
  const frontmatter = `---\ntitle: ${title}\nslug: ${slug}\npublishDate: ${publishDate}\ndescription: ${description}\n---\n\n`;
  try {
    fs.writeFileSync(filePath, frontmatter + contenu, 'utf-8');
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Modification impossible.' }), { status: 500 });
  }
}

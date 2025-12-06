import fs from 'fs';
import path from 'path';

export async function POST({ request }: { request: any }) {
  try {
    const { slug } = await request.json();
    if (!slug) return new Response(JSON.stringify({ success: false, error: 'slug manquant' }), { status: 400 });
    const filePath = path.join(process.cwd(), 'src/content/actualites', `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ success: false, error: 'introuvable' }), { status: 404 });
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fmMatch = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/m.exec(raw);
    const fm: any = {};
    let content = '';
    if (fmMatch) {
      const fmText = fmMatch[1];
      content = fmMatch[2] || '';
      fmText.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > -1) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          fm[key] = val.replace(/^"|"$/g, '');
        }
      });
    } else {
      content = raw;
    }
    return new Response(JSON.stringify({ success: true, frontmatter: fm, content }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Erreur serveur' }), { status: 500 });
  }
}

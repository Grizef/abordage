import fs from 'fs';
import path from 'path';

export async function GET() {
  const dir = path.join(process.cwd(), 'src/content/actualites');
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    const list = files.map((file) => {
      const full = path.join(dir, file);
      const raw = fs.readFileSync(full, 'utf-8');
      const fmMatch = /^---\s*([\s\S]*?)\s*---/m.exec(raw);
      const fm: any = {};
      if (fmMatch) {
        const fmText = fmMatch[1];
        fmText.split('\n').forEach(line => {
          const idx = line.indexOf(':');
          if (idx > -1) {
            const key = line.slice(0, idx).trim();
            const val = line.slice(idx + 1).trim();
            fm[key] = val.replace(/^"|"$/g, '');
          }
        });
      }
      return {
        slug: file.replace(/\.md$/, ''),
        title: fm.title || file.replace(/\.md$/, ''),
        description: fm.description || '',
        publishDate: fm.publishDate || '',
      };
    });
    return new Response(JSON.stringify({ success: true, list }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Impossible de lister.' }), { status: 500 });
  }
}

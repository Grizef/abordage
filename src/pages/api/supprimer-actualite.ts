import fs from 'fs';
import path from 'path';

export async function POST({ request }: { request: any }) {
  const { slug } = await request.json();
  const filePath = path.join(process.cwd(), 'src/content/actualites', `${slug}.md`);
  try {
    fs.unlinkSync(filePath);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Suppression impossible.' }), { status: 500 });
  }
}

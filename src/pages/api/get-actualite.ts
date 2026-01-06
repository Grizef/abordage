import { supabaseServer } from '../../lib/supabaseServer';

export async function POST({ request }: { request: any }) {
  try {
    const { slug } = await request.json();
    if (!slug) return new Response(JSON.stringify({ success: false, error: 'slug manquant' }), { status: 400 });
    
    const { data, error } = await supabaseServer
      .from('news')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      console.error('Supabase select error:', error);
      return new Response(JSON.stringify({ success: false, error: 'introuvable' }), { status: 404 });
    }
    
    const frontmatter = {
      title: data.title,
      slug: data.slug,
      description: data.description,
      publishDate: data.publish_date,
      image: data.image_url
    };
    
    return new Response(JSON.stringify({ success: true, frontmatter, content: data.content_html }), { status: 200 });
  } catch (err) {
    console.error('Erreur lors de la récupération:', err);
    return new Response(JSON.stringify({ success: false, error: 'Erreur serveur' }), { status: 500 });
  }
}

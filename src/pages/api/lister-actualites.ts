import { supabaseServer } from '../../lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('news')
      .select('slug, title, description, publish_date')
      .order('publish_date', { ascending: false });
    
    if (error) {
      console.error('Supabase select error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
    
    const list = data.map(item => ({
      slug: item.slug,
      title: item.title,
      description: item.description,
      publishDate: item.publish_date
    }));
    
    return new Response(JSON.stringify({ success: true, list }), { status: 200 });
  } catch (err) {
    console.error('Erreur lors du listage:', err);
    return new Response(JSON.stringify({ success: false, error: 'Impossible de lister.' }), { status: 500 });
  }
}

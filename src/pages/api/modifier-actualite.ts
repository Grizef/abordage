import { supabaseServer } from '../../lib/supabaseServer';

export async function POST({ request }: { request: any }) {
  const { slug, title, description, contenu, publishDate } = await request.json();
  
  if (!slug || !title || !description || !contenu || !publishDate) {
    return new Response(JSON.stringify({ success: false, error: 'Tous les champs sont requis.' }), { status: 400 });
  }
  
  try {
    const { data, error } = await supabaseServer
      .from('news')
      .update({
        title,
        description,
        content_html: contenu,
        publish_date: publishDate
      })
      .eq('slug', slug)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase update error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
    
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (err) {
    console.error('Erreur lors de la modification:', err);
    return new Response(JSON.stringify({ success: false, error: 'Modification impossible.' }), { status: 500 });
  }
}

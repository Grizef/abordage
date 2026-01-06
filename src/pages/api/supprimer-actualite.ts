import { supabaseServer } from '../../lib/supabaseServer';

export async function POST({ request }: { request: any }) {
  const { slug } = await request.json();
  
  if (!slug) {
    return new Response(JSON.stringify({ success: false, error: 'slug manquant' }), { status: 400 });
  }
  
  try {
    const { error } = await supabaseServer
      .from('news')
      .delete()
      .eq('slug', slug);
    
    if (error) {
      console.error('Supabase delete error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    return new Response(JSON.stringify({ success: false, error: 'Suppression impossible.' }), { status: 500 });
  }
}

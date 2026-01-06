import type { APIRoute } from 'astro';
import { supabaseServer } from '../../lib/supabaseServer';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  const { title, publishDate, description, image, contenu } = data;
  
  if (!title || !publishDate || !description || !contenu) {
    return new Response(JSON.stringify({ error: 'Tous les champs sont requis.' }), { status: 400 });
  }
  
  // Générer le slug automatiquement à partir du titre
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  try {
    const { data: insertedData, error } = await supabaseServer
      .from('news')
      .insert({
        slug,
        title,
        description,
        content_html: contenu,
        publish_date: publishDate,
        image_url: image || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    
    return new Response(JSON.stringify({ success: true, data: insertedData }), { status: 200 });
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde.' }), { status: 500 });
  }
};


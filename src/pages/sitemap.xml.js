import { getCollection } from 'astro:content';
import { SITE_URL } from '../../src/consts';

export async function get() {
  const blog = await getCollection('blog');
  let pages = blog.map(post => ({ url: `${SITE_URL}${post.slug.startsWith('/') ? '' : '/'}${post.slug}`, lastmod: post.data.pubDate || new Date().toISOString() }));

  // Try to include 'actualites' collection if present
  try {
    const news = await getCollection('actualites');
    const newsPages = news.map(n => ({ url: `${SITE_URL}${n.slug.startsWith('/') ? '' : '/'}${n.slug}`, lastmod: n.data.publishDate || new Date().toISOString() }));
    pages = pages.concat(newsPages);
  } catch (e) {
    // collection may not exist in some setups
    console.warn('No actualites collection found for sitemap');
  }

  // Add common site pages
  const staticPages = ['/', '/actualites', '/activites', '/about', '/contact', '/services', '/evenements', '/temoignages'];
  staticPages.forEach(p => pages.push({ url: `${SITE_URL}${p}`, lastmod: new Date().toISOString() }));

  // Deduplicate by URL
  const uniq = new Map();
  pages.forEach(p => { uniq.set(p.url, p); });
  const finalPages = Array.from(uniq.values());

  const pagesXml = finalPages
    .map(p => `  <url>\n    <loc>${p.url}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pagesXml}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

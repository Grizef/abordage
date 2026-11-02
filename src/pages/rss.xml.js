import rss from "@astrojs/rss";
import { supabase } from "../lib/supabase";
import { SITE_TITLE, SITE_DESCRIPTION } from "../consts";

export const prerender = false;

export async function GET(context) {
  const { data: news } = await supabase
    .from("news")
    .select("slug, title, description, publish_date")
    .order("publish_date", { ascending: false });

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: (news ?? []).map((post) => ({
      title: post.title,
      description: post.description ?? "",
      pubDate: post.publish_date ? new Date(post.publish_date) : new Date(),
      link: `/actualites/${post.slug}/`,
    })),
  });
}

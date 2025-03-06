import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_TITLE, SITE_DESCRIPTION } from "@lib/consts";
import { getLangFromUrl } from "@i18n/utils";
export async function GET(context) {
	const lang = getLangFromUrl(context.url);
	const posts = await getCollection("blog");
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/${lang}/blog/${post.id}/`,
		})),
	});
}

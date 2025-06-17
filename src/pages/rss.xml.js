import rss from "@astrojs/rss";
import { localBlogDB } from "@services/indexedDB";
import { getLangFromUrl } from "@i18n/utils";
import { sanitizeString } from "@lib/utils";

export async function GET(context) {
	const lang = getLangFromUrl(context.url);
	const blogs = await localBlogDB.getAllDrafts();

	return rss({
		title: "Blogii",
		description: "Your ideas, your blog",
		site: context.site,
		items: blogs
			.filter((blog) => blog.title) // Filtra apenas blogs com título
			.map((blog) => ({
				title: blog.title,
				description: blog.description || "No description available",
				pubDate: blog.pubDate || new Date(),
				link: `/${lang}/blog/${sanitizeString(blog.title, 1)}/`,
				content: blog.body || "",
			})),
		customData: `
            <language>${lang}</language>
            <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        `,
	});
}

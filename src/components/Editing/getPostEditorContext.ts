import { getLangFromUrl } from "@/i18n/utils";
import { generateShortNumericId, redirectToBlog } from "@/lib/utils";
import { getUser, getBlogWithPosts, createNewPost, getUserById } from "@/lib/utilsDB";
import type { BlogData } from "@/lib/types";

export async function getPostEditorContext(Astro: any) {
  const urlParts = Astro.url.pathname.split("/").filter(Boolean);
  const lang = getLangFromUrl(Astro.url);
  const blogId = urlParts.at(-2);
  const postId = urlParts.at(-1);
  const editing = Astro.url.searchParams.get("editing") === "true";
  const isNewPost = Astro.url.pathname.endsWith("/new");

  const user = await getUser(Astro);

  let blogData: BlogData;
  let blogPosts = [];
  let postData = null;

  if (user) {
    const fetched = await getBlogWithPosts(String(blogId));
    blogData = fetched;
    blogPosts = [fetched];
    if (!blogData.posts) blogData.posts = [];
    postData = blogData.posts.find((p: any) => p.id === postId);

    if (!blogData || (!postData && !isNewPost)) {
      return redirectToBlog(Astro, lang, String(blogId));
    }

    if (!postData && isNewPost) {
      const newPostId = generateShortNumericId();
      blogData.posts.push({
        id: newPostId, title: "New Post",
        title_sanitized: "new-post",
        blog_id: String(blogId)
      });
      await createNewPost(String(blogId), newPostId, "New Post");
      return Astro.redirect(`/${lang}/dashboard/${blogId}/${newPostId}?editing=true`);
    }
  } else {
    const cookie = Astro.cookies.get("blogiis");
    const stored = cookie ? JSON.parse(decodeURIComponent(cookie.value)) : [];
    blogPosts = stored;
    blogData = stored.find((b: any) => b.id === blogId);
    if (!blogData.posts) blogData.posts = [];
    postData = blogData.posts.find((p: any) => p.id === postId);

    if (!blogData || (!postData && !isNewPost)) {
      return redirectToBlog(Astro, lang, String(blogId));
    }

    if (!postData && isNewPost) {
      const newPostId = generateShortNumericId();
      blogData.posts.push({ id: newPostId, title: "New Post", title_sanitized: "new-post", blog_id: String(blogId), thisPostIsNew: true });
      Astro.cookies.set("blogiis", JSON.stringify(blogPosts), {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return Astro.redirect(`/${lang}/dashboard/${blogId}/${newPostId}?editing=true`);
    }
  }

  if (!Astro.url.searchParams.has("editing")) {
    const url = new URL(Astro.url);
    url.searchParams.set("editing", "true");
    return Astro.redirect(url.toString());
  }

  return {
    lang,
    editing,
    isNewPost: postData?.thisPostIsNew || false,
    blog: {
      id: blogId,
      title: blogData?.title,
      posts: [postData],
      pubDate: new Date(),
    } as BlogData,
    blogPosts,
    user,
  };
}

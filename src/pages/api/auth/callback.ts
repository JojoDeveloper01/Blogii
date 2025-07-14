import type { APIRoute } from "astro";
import { supabase } from "@/lib/supabase";
import { ensureUserInDatabase, checkUserHasBlogs } from "@/lib/utilsDB";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
	const code = url.searchParams.get("code");
	if (!code) return new Response("No code provided", { status: 400 });

	const { data, error } = await supabase.auth.exchangeCodeForSession(code);
	if (error) return new Response(error.message, { status: 500 });

	const { access_token, refresh_token, user } = data.session;

	cookies.set("sb-access-token", access_token, { path: "/" });
	cookies.set("sb-refresh-token", refresh_token, { path: "/" });

	if (user?.email && user.id) {
		await ensureUserInDatabase(user);

		const hasBlogsInTheDB = await checkUserHasBlogs(user.id);

		if (!hasBlogsInTheDB) {
			const blogs = cookies.get("blogiis");
			if (blogs) {
				cookies.set("user-id", user.id, {
					path: "/",
					secure: import.meta.env.PROD,
					maxAge: 60 * 3,
					sameSite: "lax"
				});
				return redirect(`/auth-finish`);
			}
		}
	}

	return redirect("/");
};

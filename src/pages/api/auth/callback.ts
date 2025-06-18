import type { APIRoute } from "astro";
import { supabase } from "@/lib/supabase";
import type { BlogData } from "@/lib/types";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  if (!code) return new Response("No code provided", { status: 400 });

  const tempBlogsJson = cookies.get('temp-blogs-data')?.value;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return new Response(error.message, { status: 500 });

  const { access_token, refresh_token, user } = data.session;
  cookies.set("sb-access-token", access_token, { path: "/" });
  cookies.set("sb-refresh-token", refresh_token, { path: "/" });

  if (tempBlogsJson && user) {
    try {
      const tempBlogs = JSON.parse(tempBlogsJson) as BlogData[];
      if (!tempBlogs.length) throw new Error("No temp blogs");

      // Verifica se o usuário existe
      const { data: userExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      // Se não existe, cria usuário
      if (!userExists) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0]
        });
      }

      // Verifica se o usuário tem blog
      const { data: blogExists } = await supabase
        .from('blogs')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!blogExists) {
        // Cria blog com o primeiro temporário
        const blogData = {
          user_id: user.id,
          title: tempBlogs[0].title,
          description: tempBlogs[0].description || ''
        };

        const { data: newBlog } = await supabase
          .from('blogs')
          .insert(blogData)
          .select('id')
          .single();

        // Insere posts se existirem
        if (newBlog && tempBlogs[0].posts?.length) {
          const posts = tempBlogs[0].posts.map(post => ({
            blog_id: newBlog.id,
            title: post.title,
            content: post.content || '',
            created_at: post.created_at
          }));
          await supabase.from('posts').insert(posts);
        }
      }
    } catch {
      // Ignora erros na migração, segue login
    }
  }

  return redirect("/");
};

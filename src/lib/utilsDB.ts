import { getLangFromUrl } from '@/i18n/utils';
import { supabase } from './supabase';
import type { BlogData, SubscriptionPlan, UserInfo } from './types';
import { sanitizeString } from './utils';

//User:
export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Check if it's an AuthSessionMissingError
      if (error.message && error.message.includes('Auth session missing')) {
        // Silently handle this specific error - it's expected when session expires
        // Clear any auth cookies or local storage
        if (typeof window !== 'undefined') {
          await supabase.auth.signOut();
        }
        return null;
      }

      // Only log other types of errors
      console.error('[getUser] Erro ao buscar usuário:', error);
      throw error;
    }

    const user = await getUserById(String(data.user?.id));

    return user;
  } catch (error) {
    // Check if it's an AuthSessionMissingError
    if (error instanceof Error && error.message && error.message.includes('Auth session missing')) {
      // Silently handle this specific error
      if (typeof window !== 'undefined') {
        await supabase.auth.signOut();
      }
      return null;
    }

    // Only log other types of errors
    console.error('[getUser] Erro ao buscar usuário (catch):', error);
    return null;
  }
}

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[getUserById] Erro ao buscar usuário:', error);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      throw error;
    }
  }

  return data;
}

export async function getAllBlogs() {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAllBlogs] Erro ao buscar blogs:', error);
    throw error;
  }

  return data;
}

export async function loadUserBlogsData(userId: any, Astro: any): Promise<BlogData[]> {
  try {
    if (userId) {
      return await getUserBlogsWithPosts(userId) || [];
    } else {
      const cookie = Astro.cookies.get("blogiis");
      return cookie ? JSON.parse(cookie.value) : [];
    }
  } catch (error) {
    console.error("Error while fetching blog data:", error);
    return [];
  }
}

export async function getUserPlan(userId: string): Promise<SubscriptionPlan | null> {
  // Busca o user

  const { data: user } = await supabase
    .from('users')
    .select('subscription_plan_id')
    .eq('id', userId)
    .single();

  if (!user?.subscription_plan_id) {
    console.warn('[getUserPlan] User sem plano.');
    return null;
  }

  // Busca o plano usando o ID do user
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', user.subscription_plan_id)
    .single();

  if (!plan) {
    console.warn('[getUserPlan] User sem plano.');
    return null;
  }

  return plan;
}

//Get:

export async function getUserBlogsWithPosts(userId: string) {
  if (!userId) {
    console.warn('[getUserBlogsWithPosts] User ID não fornecido');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('blogs')
      .select(`*, posts(*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getBlogWithPosts(blogId: string) {
  const { data, error } = await supabase
    .from('blogs')
    .select(`*, posts(*)`)
    .eq('id', blogId)
    .single();

  if (error) {
    // Se o erro for que nenhum blog foi encontrado, retorne null em vez de lançar erro
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[getBlogWithPosts] Erro ao buscar blog:', error);
    throw error;
  }

  return data;
}

export async function getBlogByTitlePublished(blogTitle: string): Promise<BlogData | null> {
  const { data, error } = await supabase
    .from('blogs')
    .select('*, posts(*)')
    .eq('title_sanitized', blogTitle) // Busca exata (case-sensitive)
    .eq('status', 'published')
    .limit(2); // Para validar único

  if (error) {
    console.error('[getBlogByTitlePublished] Erro ao buscar blog:', error);
    throw error;
  }

  if (data.length > 1) {
    throw new Error(`[getBlogByTitlePublished] Título não é único: ${blogTitle}`);
  }

  const blog = data[0];

  // Se não encontrou blog, retorna null
  if (!blog) {
    return null;
  }

  // Filtra apenas posts publicados
  blog.posts = (blog.posts || []).filter((post: any) => post.status === 'published');

  return blog;
}

export async function getPostsByBlog(blogId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('blog_id', blogId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPostsByBlog] Erro ao buscar posts:', error);
    throw error;
  }

  return data;
}

export async function getPostById(postId: string, isAuthorized: boolean, Astro: any) {
  if (isAuthorized) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data;
  }

  try {
    const blogs = JSON.parse(Astro.cookies.get('blogiis')?.value || '[]');
    return blogs.flatMap((b: any) => b.posts || []).find((p: any) => p.id === postId) || null;
  } catch {
    return null;
  }
}

export async function getPostByTitle(postTitle: string, blogTitle: string): Promise<any | null> {
  // Primeiro, encontra o blog pelo título único
  const blog = await getBlogByTitlePublished(blogTitle);
  if (!blog) {
    // Retorna null em vez de lançar erro quando o blog não for encontrado
    return null;
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('blog_id', blog.id) // Usa o ID real do blog
    .eq('title_sanitized', postTitle) // Busca exata pelo título sanitizado
    .limit(2); // Para validar se não há duplicados

  if (error) {
    console.error('[getPostByTitle] Erro ao buscar post:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null; // Não existe
  }

  if (data.length > 1) {
    throw new Error(`[getPostByTitle] Título duplicado dentro do blog: ${postTitle}`);
  }

  return data[0];
}

/* Context: */
export async function getDashboardContextOfTheBlog(Astro: any) {
  const lang = getLangFromUrl(Astro.url);
  const currentPage = Astro.url.pathname.split('/').filter(Boolean).at(-1);

  const user = await getUser();
  const isAuthorized = Boolean(user);

  let blogId: string | null = null;
  let blogData: BlogData | null = null;

  // Se a página NÃO for dashboard, precisamos ter blogId e blogData
  if (currentPage !== "dashboard") {
    blogId = currentPage;

    if (!blogId) return { redirect: `/${lang}` };

    if (isAuthorized && user) {
      const parts = Astro.url.pathname.split('/').filter(Boolean);
      const possibleBlogIds = [parts.at(-1), parts.at(-2)];

      for (const id of possibleBlogIds) {
        const data = await getBlogWithPosts(id!);
        if (data) {
          blogData = data;
          blogId = id; // <-- atualiza o blogId se encontrar
          break;
        }
      }
    }

    if (!blogData && !isAuthorized) {
      const parts = Astro.url.pathname.split('/').filter(Boolean);
      const possibleBlogIds = [parts.at(-1), parts.at(-2)].filter(Boolean) as string[];

      const cookie = Astro.cookies.get("blogiis");
      const blogs = cookie ? safeParseJSON(cookie.value) : [];

      for (const id of possibleBlogIds) {
        // Primeiro: tenta achar no cookie
        const found = blogs.find((blog: any) => blog.id === id);
        if (found) {
          blogData = found;
          blogId = id;
          break;
        }
      }
    }

    // Se mesmo após tudo ainda não tiver blogData, redireciona
    if (!blogData) return { redirect: `/${lang}` };
  }

  // Se a página for "dashboard", blogId e blogData não devem existir
  if (currentPage === "dashboard") {
    const userBlogs = await loadUserBlogsData(user?.id, Astro);

    if (!userBlogs.length) return { redirect: `/${lang}` };

    blogId = userBlogs.at(0)?.id || null;
    blogData = userBlogs.at(0) || null;
  }

  return { lang, blogId, blogData, user };
}
function safeParseJSON(str: string): any[] {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

//Create:

export async function createBlog(blogData: BlogData) {
  if (!blogData.posts?.length) {
    return { success: false, error: 'No posts provided' };
  }

  try {
    // Start a transaction by using RLS policies
    const { data: blogResult, error: blogError } = await supabase
      .from('blogs')
      .insert({
        id: blogData.id,
        user_id: blogData.user_id,
        title: blogData.title,
        title_sanitized: sanitizeString(blogData.title, 1),
        created_at: blogData.created_at,
      })
      .select()
      .single();

    if (blogError) {
      console.error('[createBlog] Erro ao criar blog:', blogError);
      return { success: false, error: blogError };
    }

    // Create initial post
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .insert(blogData.posts.map(post => ({
        ...post,
        blog_id: blogData.id,
        content: post.content || '',
      })))
      .select();

    if (postsError) {
      console.error('[createBlog] Erro ao criar posts:', postsError);
      // Try to rollback by deleting the blog
      await supabase.from('blogs').delete().eq('id', blogData.id);
      return { success: false, error: postsError };
    }

    return {
      success: true,
      data: {
        blog: blogResult,
        posts: postsData
      }
    };
  } catch (error) {
    console.error('[createBlog] Erro inesperado:', error);
    return { success: false, error };
  }
}

export async function createNewPost(blogId: string, postId: string, title: string) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      id: postId,
      title,
      title_sanitized: sanitizeString(title, 1),
      blog_id: blogId,
      created_at: new Date(),
    });

  if (error) {
    console.error('[createNewPost] Erro ao criar post:', error);
    throw error;
  }

  return { data, error };
}

//Update:

export async function updateUser(userInfo: UserInfo) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(userInfo)
      .eq('id', userInfo.id)
      .select();

    if (error) {
      console.error('[updateUser] Erro ao atualizar perfil:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[updateUser] Erro ao atualizar perfil:', error);
    return { success: false, error };
  }
}

export async function updateBlogTitleInDB(blogId: string, title: string, title_sanitized: string) {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .update({ title, title_sanitized })
      .eq('id', blogId)
      .select();

    if (error) {
      console.error('[updateBlogTitleInDB] Erro ao atualizar título do blog:', error);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      console.error('[updateBlogTitleInDB] Nenhum blog encontrado com esse ID.');
      return { success: false, error: 'Blog not found' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[updateBlogTitleInDB] Erro ao atualizar título do blog:', error);
    return { success: false, error };
  }
}

export async function updateBlogDescription(blogId: string, description: string) {
  const { error } = await supabase
    .from('blogs')
    .update({ description })
    .eq('id', blogId);

  if (error) throw error;
  return { success: true };
}

export async function updatePostContentInDB(blogId: string, postId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ content })
      .eq('id', postId)
      .eq('blog_id', blogId)
      .select();

    if (error || !data?.length) {
      return { success: false, error: error || 'Post not found' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function updatePostTitleInDB(blogId: string, postId: string, title: string, title_sanitized: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ title, title_sanitized })
      .eq('id', postId)
      .eq('blog_id', blogId)
      .select();

    if (error || !data?.length) {
      return { success: false, error: error || 'Post not found' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

//Delete:

export async function deleteUser(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteBlogByUserId(blogId: string, userId: string) {
  try {
    // Delete all posts first (due to foreign key constraint)
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .eq('blog_id', blogId);

    if (postsError) {
      return { success: false, error: postsError };
    }

    // Then delete the blog
    const { error: blogError, data } = await supabase
      .from('blogs')
      .delete()
      .eq('id', blogId)
      .eq('user_id', userId)
      .select();

    if (blogError) {
      return { success: false, error: blogError };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deletePostFromDB(blogId: string, postId: string) {
  try {
    // First check if this is the only post
    const { data: posts, error: countError } = await supabase
      .from('posts')
      .select('id')
      .eq('blog_id', blogId);

    if (countError) {
      return { success: false, error: countError };
    }

    if (!posts || posts.length <= 1) {
      return { success: false, error: 'Cannot delete the only post' };
    }

    // Delete the post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('blog_id', blogId);

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

//Check:

export async function checkEmailExists(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .limit(1)
    .single();

  if (error) {
    console.error('[checkEmailExists] Erro ao verificar se o email existe:', error);
    throw error;
  }

  return data;
}


export async function checkUserHasBlogs(userId: string): Promise<boolean> {
  try {
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    return blogs !== null && blogs.length > 0;
  } catch (error) {
    console.error('[DB] Erro ao verificar blogs do usuário:', error);
    return false;
  }
}

export async function getUserBlogsCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('blogs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);

    return count || 0;
  } catch (error) {
    console.error('[DB] Erro ao contar blogs do usuário:', error);
    return 0;
  }
}

export async function getBlogPostsCount(blogId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact' })
      .eq('blog_id', blogId);

    return count || 0;
  } catch (error) {
    console.error('[DB] Erro ao contar posts do blog:', error);
    return 0;
  }
}

export async function createBlogFromTemp(userId: string, tempBlogData: string): Promise<void> {
  try {
    const tempBlogs = JSON.parse(tempBlogData);
    if (!Array.isArray(tempBlogs) || !tempBlogs.length) return;

    // Pega o primeiro blog temporário
    const firstBlog = tempBlogs[0];

    // Cria o blog
    const { data: blog, error: blogError } = await supabase
      .from('blogs')
      .insert({
        user_id: userId,
        title: firstBlog.title,
        description: firstBlog.description || ''
      })
      .select('id')
      .single();

    if (blogError || !blog) {
      console.error('[DB] Erro ao criar blog:', blogError);
      return;
    }

    // Se tem posts, cria-os
    if (firstBlog.posts?.length) {
      const posts = firstBlog.posts.map((post: { title: string; content?: string; created_at: string }) => ({
        blog_id: blog.id,
        title: post.title,
        content: post.content || '',
        created_at: post.created_at
      }));

      const { error: postsError } = await supabase
        .from('posts')
        .insert(posts);

      if (postsError) {
        console.error('[DB] Erro ao criar posts:', postsError);
      }
    }
  } catch (error) {
    console.error('[DB] Erro ao processar blog temporário:', error);
  }
}

export async function ensureUserInDatabase(user: any): Promise<void> {
  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select()
      .eq("id", user.id)
      .maybeSingle();

    if (!existingUser && !fetchError) {
      const { error: insertError } = await supabase.from("users").insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url
      });

      if (insertError) {
        console.error("[AUTH] Erro ao inserir utilizador:", insertError);
      }
    }
  } catch (err) {
    console.error("[AUTH] Erro na verificação/criação de utilizador:", err);
  }
}

// Publish:

const allowedStatuses = ['published', 'draft'] as const;

export async function updatePostsStatus(postIds: string[], status: string) {
  if (!allowedStatuses.includes(status as any)) {
    return { success: false, error: 'Invalid status value' };
  }

  if (postIds.length === 0) {
    return { success: true }; // Nada para atualizar
  }

  try {
    const { error } = await supabase
      .from('posts')
      .update({ status })
      .in('id', postIds);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[updatePostsStatus] Erro ao atualizar posts:', error);
    return { success: false, error };
  }
}

export async function updateBlogStatus(blogId: string, status: string, postIds?: string[] | null | 'all') {
  if (!allowedStatuses.includes(status as any)) {
    return { success: false, error: 'Invalid status value' };
  }

  try {
    const { error } = await supabase
      .from('blogs')
      .update({ status })
      .eq('id', blogId);

    if (error) throw error;

    // Se postIds for 'all', busca todos os posts do blog e atualiza
    if (Array.isArray(postIds) && postIds[0] === 'all') {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('blog_id', blogId);

      if (postsError) throw postsError;

      if (posts && posts.length > 0) {
        const postIds = posts.map(post => post.id);
        const postUpdateResult = await updatePostsStatus(postIds, status);
        if (!postUpdateResult.success) throw postUpdateResult.error;
      }
    }
    // Atualiza os posts específicos se postIds for um array
    else if (postIds && Array.isArray(postIds) && postIds.length > 0) {
      const postUpdateResult = await updatePostsStatus(postIds, status);
      if (!postUpdateResult.success) throw postUpdateResult.error;
    }

    return { success: true };
  } catch (error) {
    console.error('[updateBlogStatus] Erro ao atualizar blog e posts:', error);
    return { success: false, error };
  }
}

export async function updatePostStatus(blogId: string, status: string, postIds: string[]) {
  if (!allowedStatuses.includes(status as any)) {
    return { success: false, error: 'Invalid status value' };
  }

  try {
    const { error } = await supabase
      .from('posts')
      .update({ status })
      .eq('blog_id', blogId)
      .in('id', postIds);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[updatePostStatus] Erro ao atualizar posts:', error);
    return { success: false, error };
  }
}

export async function updateBlogTheme(blogId: string, theme: string) {
  const { error } = await supabase
    .from('blogs')
    .update({ theme })
    .eq('id', blogId);

  if (error) {
    console.error('[updateBlogTheme] Error updating theme:', error);
    throw error;
  }
  return { success: true };
}

/* Settings: */

export async function getSubscriptionPlans() {

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, price, billing_cycle, blog_limit, post_limit, features, created_at')
    .order('price', { ascending: true });

  if (error) {
    console.error('[getSubscriptionPlans] Error:', error.message);
    return [];
  }

  return (data as SubscriptionPlan[]) || [];
}
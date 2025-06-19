import { getLangFromUrl } from '@/i18n/utils';
import { supabase } from './supabase';
import type { BlogData } from './types';

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

    return data.user;
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

//Get:
export async function getUserBlogsWithPosts(userId: string) {
  if (!userId) throw new Error('User ID é obrigatório');

  const { data, error } = await supabase
    .from('blogs')
    .select(`*, posts(*)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getUserBlogsWithPosts] Erro ao buscar blogs:', error);
    throw error;
  }

  return data;
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

export async function getPostById(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('[getPostById] Erro ao buscar post:', error);
    throw error;
  }

  return data;
}

/* Settings: */
export async function getAppSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[getAppSettings] Erro ao buscar configurações:', error);
    throw error;
  }

  return data;
}

/* Context: */
export async function getDashboardContextOfTheBlog(Astro: any) {
  const lang = getLangFromUrl(Astro.url);
  const blogId = Astro.url.pathname.split("/").find((id: string) => /^\d+$/.test(id));

  if (!blogId) return { redirect: `/${lang}` };

  const user = await getUser();
  const isAuthorized = Boolean(user);

  let blogData: BlogData | null = null;
  if (isAuthorized && user) {
    blogData = await getBlogWithPosts(blogId);
  }

  if (!blogData && !isAuthorized) {
    let blogs = [];
    const cookie = Astro.cookies.get("blogiis");
    try {
      blogs = cookie ? JSON.parse(cookie.value) : [];
    } catch { }

    const foundBlog = blogs.find((blog: any) => blog.id === blogId);
    if (foundBlog) blogData = foundBlog;
  }

  if (!blogData) return { redirect: `/${lang}` };

  return { lang, blogId, blogData, user };
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

export async function updatePostTitleInDB(blogId: string, postId: string, title: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update({ title })
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

export async function updateBlogTitleInDB(blogId: string, title: string) {
  try {
    const { data, error } = await supabase
      .from('blogs')
      .update({ title })
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

//Delete Blog:

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
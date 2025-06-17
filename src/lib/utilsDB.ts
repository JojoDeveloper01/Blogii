import { getLangFromUrl } from '@i18n/utils';
import { supabase } from './supabase';
import type { BlogData } from './types';

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

// Obter todos os blogs de um user com os respetivos posts
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

// Obter um único blog com seus posts
export async function getBlogWithPosts(blogId: string) {
  const { data, error } = await supabase
    .from('blogs')
    .select(`*, posts(*)`)
    .eq('id', blogId)
    .single();

    
    if (error) {
        console.error('[getBlogWithPosts] Erro ao buscar blog:', error);
        throw error;
    }
    
  return data;
}

// Obter todos os posts de um determinado blog
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

// Obter as configurações globais da aplicação
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


export async function getDashboardContext(Astro: any) {
	const lang = getLangFromUrl(Astro.url);
	const blogId = Astro.url.pathname.split("/").find((id: string) => /^\d+$/.test(id));

	if (!blogId) return { redirect: `/${lang}` };

	const user = await getUser();
	const isAuthorized = Boolean(user);

	let blogData: BlogData | null = null;
	if (isAuthorized && user) {
		blogData = await getBlogWithPosts(blogId);
	}

	if (!blogData) {
		let blogs = [];
		const cookie = Astro.cookies.get("blogiis");
		try {
			blogs = cookie ? JSON.parse(cookie.value) : [];
		} catch {}

		const foundBlog = blogs.find((blog: any) => blog.id === blogId);
		if (foundBlog) blogData = foundBlog;
	}

	if (!blogData) return { redirect: `/${lang}` };

	return { lang, blogId, blogData, user };
}

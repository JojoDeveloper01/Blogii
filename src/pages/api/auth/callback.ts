import type { APIRoute } from "astro";
import { supabase } from "@lib/supabase";
import type { BlogData } from "@lib/types";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  console.log('[CALLBACK] Iniciando callback de autenticação');
  const authCode = url.searchParams.get("code");
  
  // Verificar se temos blogs temporários no cookie
  const tempBlogsData = cookies.get('temp-blogs-data')?.value;
  
  console.log('[CALLBACK] Código de autenticação presente:', !!authCode);
  console.log('[CALLBACK] Blogs temporários no cookie:', !!tempBlogsData);

  if (!authCode) {
    console.error('[CALLBACK] Nenhum código fornecido');
    return new Response("No code provided", { status: 400 });
  }

  console.log('[CALLBACK] Trocando código por sessão...');
  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    console.error('[CALLBACK] Erro ao trocar código por sessão:', error.message);
    return new Response(error.message, { status: 500 });
  }
  
  console.log('[CALLBACK] Sessão obtida com sucesso');
  const { access_token, refresh_token } = data.session;

  cookies.set("sb-access-token", access_token, {
    path: "/",
  });
  cookies.set("sb-refresh-token", refresh_token, {
    path: "/",
  });
  
  // Processar blogs temporários se existirem
  if (tempBlogsData && data.session?.user) {
    try {
      console.log('[CALLBACK] Processando blogs temporários do cookie...');
      const tempBlogs = JSON.parse(tempBlogsData) as BlogData[];
      
      if (tempBlogs && tempBlogs.length > 0) {
        console.log('[CALLBACK] Encontrados', tempBlogs.length, 'blogs temporários');
        
        // Verificar se o usuário já existe na tabela de usuários
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.session.user.email)
          .single();
        
        if (userError && userError.code !== 'PGRST116') {
          console.error('[CALLBACK] Erro ao verificar usuário existente:', userError);
        }
        
        // Se o usuário não existir, criar um novo
        if (!existingUser) {
          const userData = {
            id: data.session.user.id,
            email: data.session.user.email,
            name: data.session.user.user_metadata?.name || 
                  data.session.user.user_metadata?.full_name || 
                  data.session.user.user_metadata?.given_name || 
                  data.session.user.email?.split('@')[0]
          };
          
          console.log('[CALLBACK] Inserindo novo usuário:', userData.email);
          const { error: insertError } = await supabase
            .from('users')
            .insert(userData);
            
          if (insertError) {
            console.error('[CALLBACK] Erro ao inserir usuário:', insertError);
          } else {
            console.log('[CALLBACK] Usuário inserido com sucesso');
          }
        }
        
        // Verificar se o usuário já tem um blog
        const { data: existingBlog } = await supabase
          .from('blogs')
          .select('id')
          .eq('user_id', data.session.user.id)
          .single();
          
        if (!existingBlog) {
          // Salvar o blog temporário no Supabase
          const blogData = {
            user_id: data.session.user.id,
            title: tempBlogs[0].title,
            description: tempBlogs[0].description || ''
          };
          
          console.log('[CALLBACK] Inserindo novo blog:', blogData.title);
          const { data: newBlog, error: blogError } = await supabase
            .from('blogs')
            .insert(blogData)
            .select('id')
            .single();
            
          if (blogError) {
            console.error('[CALLBACK] Erro ao inserir blog:', blogError);
          } else if (newBlog) {
            console.log('[CALLBACK] Blog inserido com sucesso, ID:', newBlog.id);
            
            // Se houver posts no blog temporário, salvá-los também
            if (tempBlogs[0].posts && tempBlogs[0].posts.length > 0) {
              const posts = tempBlogs[0].posts.map(post => ({
                blog_id: newBlog.id,
                title: post.title,
                content: post.content || '',
                created_at: post.created_at
              }));
              
              console.log('[CALLBACK] Inserindo', posts.length, 'posts');
              const { error: postsError } = await supabase
                .from('posts')
                .insert(posts);
                
              if (postsError) {
                console.error('[CALLBACK] Erro ao inserir posts:', postsError);
              } else {
                console.log('[CALLBACK] Posts inseridos com sucesso');
              }
            }
          }
        } else {
          console.log('[CALLBACK] Usuário já possui um blog, ignorando blogs temporários');
        }
      }
    } catch (error) {
      console.error('[CALLBACK] Erro ao processar blogs temporários:', error);
      // Não interromper o fluxo de login se houver erro na migração
    }
  }
  
  console.log('[CALLBACK] Redirecionando para a página principal');
  return redirect("/");
};
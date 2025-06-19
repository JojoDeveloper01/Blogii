import { $, useSignal } from "@builder.io/qwik";
import { localBlogDB } from "@/services/indexedDB";
import { validateTitle, cookieUtils } from "@/lib/utils";
import type { UpdateBlogTitleParams, UpdatePostTitleParams } from "@/lib/types";
import { actions } from "astro:actions";

export function useAutoSave() {
    const saveTimeout = useSignal<number | null>(null);
    const hasChanges = useSignal(false);
    const isSaving = useSignal(false);

    const createAutoSave = $(async (
        newValue: string,
        originalValue: string,
        onSave: (value: string) => Promise<void>
    ) => {
        if (saveTimeout.value) {
            clearTimeout(saveTimeout.value);
        }

        if (newValue === originalValue) {
            hasChanges.value = false;
            return;
        }

        hasChanges.value = true;
        isSaving.value = true;

        saveTimeout.value = window.setTimeout(async () => {
            try {
                await onSave(newValue);
            } finally {
                isSaving.value = false;
            }
        }, 1000) as unknown as number;
    });

    return {
        saveTimeout,
        hasChanges,
        isSaving,
        createAutoSave
    };
}

export const updateBlogTitle = $(async (params: UpdateBlogTitleParams) => {
    const { blogId, titleValue, isAuthorized } = params;

    const { isValid, sanitized } = validateTitle(titleValue);
    if (!isValid) {
        params.errorMessage.value = 'Title validation failed';
        return false;
    }

    params.isSaving.value = true;
    params.hasChanges.value = false;

    const updateUI = () => {
        params.showSaveSuccess.value = true;
        setTimeout(() => (params.showSaveSuccess.value = false), 1000);
        params.originalTitle.value = sanitized;
        params.isSaving.value = false;
    };

    try {
        if (isAuthorized) {
            const { data, error } = await actions.blog.updateTitle({ blogId, title: sanitized });
            if (!error && data?.success) {
                updateUI();
                return true;
            }
        }

        // Fallback: IndexedDB
        const blog = await localBlogDB.getBlog(blogId);
        if (!blog) throw new Error('Blog not found');
        await localBlogDB.saveBlog({ ...blog, title: sanitized });

        // Fallback: Cookie
        cookieUtils.updateBlogInCookie(blogId, sanitized);

        updateUI();
        return true;

    } catch (error) {
        params.errorMessage.value = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error updating blog title:', error);
        return false;

    } finally {
        params.isSaving.value = false;
    }
});


export const updatePostTitleWithParams = $(async (params: UpdatePostTitleParams) => {
    const {
        blogId, postId, titleValue, showSaveSuccess,
        hasChanges, isSaving, originalTitle, isAuthorized,
        errorMessage
    } = params;

    if (!blogId || !postId) {
        errorMessage.value = 'Blog ID and Post ID are required';
        return false;
    }

    isSaving.value = true;
    hasChanges.value = false;

    if (isAuthorized) {
        try {
            const { data, error } = await actions.post.updateTitle({ blogId, postId, title: titleValue });

            if (!error && data?.success) {
                updateUIStates();
                return true;
            }
        } catch (err) {
            console.warn('Erro ao atualizar no servidor:', err);
            // Continua com local fallback
        }
    }

    // 💾 Fallback para IndexedDB
    const blog = await localBlogDB.getBlog(blogId);
    if (!blog) {
        errorMessage.value = 'Blog not found';
        return false;
    }

    const post = blog.posts?.find(p => p.id === postId);
    if (!post) {
        errorMessage.value = `Post ${postId} não encontrado`;
        return false;
    }

    post.title = titleValue;
    await localBlogDB.saveBlog(blog);

    // 🍪 Atualiza cookie
    const blogs = cookieUtils.getStoredBlogs();
    const cookieBlog = blogs?.find(b => b.id === blogId);
    const cookiePost = cookieBlog?.posts?.find(p => p.id === postId);
    if (cookiePost) {
        cookiePost.title = titleValue;
        cookieUtils.setCookie('blogiis', JSON.stringify(blogs), 30);
    }

    updateUIStates();
    return true;

    function updateUIStates() {
        showSaveSuccess.value = true;
        setTimeout(() => (showSaveSuccess.value = false), 1000);
        if (originalTitle) originalTitle.value = titleValue;
        hasChanges.value = false;
        isSaving.value = false;
    }
});


/* export const createNewPost = $(async (blogId: string, postId: string, title: string = 'New Post') => {
    try {
        // Get blog from IndexedDB
        const blog = await localBlogDB.getBlog(blogId);
        if (!blog) throw new Error('Blog not found');

        // Check if post already exists in IndexedDB
        const posts = blog.posts || [];
        const existingPost = posts.find(p => p.id === postId);
        if (existingPost) {
            return true;
        }

        // Get blog from cookie to validate
        const blogs = cookieUtils.getStoredBlogs();
        if (!blogs) {
            throw new Error('No blogs found in cookie');
        }

        const cookieBlog = blogs.find((b: any) => b.id === blogId);

        const cookiePost = cookieBlog?.posts?.find((p: any) => p.id === postId);

        if (!cookiePost) {
            throw new Error('Post not found in cookie');
        }

        // Create new post in IndexedDB
        posts.push({
            id: postId,
            title: cookiePost.title || title,
            content: '',
            created_at: new Date(),
            updated_at: new Date()
        });

        await localBlogDB.saveBlog({
            ...blog,
            posts
        });

        return true;
    } catch (error) {
        console.error('Error creating new post:', error);
        return false;
    }
}); */

export const createNewPost = $(async (
    blogId: string,
    postId: string,
    title: string
) => {
    try {
        const blog = await localBlogDB.getBlog(blogId);

        if (!blog) return false;

        const existingPost = blog.posts?.find(p => p.id === postId);
        if (existingPost) {
            return true;
        }

        // Garante que 'posts' está inicializado
        if (!blog.posts) {
            blog.posts = [];
        }

        blog.posts.push({
            id: postId,
            blog_id: blogId,
            title,
            content: '',
            created_at: new Date(),
        });

        await localBlogDB.saveBlog(blog);

        // 🧼 Limpar a flag "isNewPost" do post correspondente no cookie
        const blogsInCookie = cookieUtils.getStoredBlogs();
        const blogInCookie = blogsInCookie.find(b => b.id === blogId);

        if (blogInCookie?.posts) {
            const postInCookie = blogInCookie.posts.find(p => p.id === postId);
            if (postInCookie && 'thisPostIsNew' in postInCookie) {
                delete postInCookie.thisPostIsNew;
            }

            cookieUtils.setCookie('blogiis', JSON.stringify(blogsInCookie), 30);
        }

        return true;
    } catch (error) {
        console.error('Error creating new post:', error);
        return false;
    }
});

export const deletePost = $(async (blogId: string, postId: string, lang: string, isAuthorized: boolean = false) => {
    try {
        // If authorized, try to delete from DB first
        if (isAuthorized) {
            try {
              const { data, error } = await actions.post.delete({ blogId, postId });
              if (!error && data?.success) {
                if (typeof window !== 'undefined') {
                  window.location.href = `/${lang}/dashboard/${blogId}`;
                }
                return true;
              }
            } catch (err) {
              console.warn('Falha ao apagar post do DB:', err);
            }
          }          

        // Get blog from IndexedDB
        const blog = await localBlogDB.getBlog(blogId);
        if (!blog) throw new Error('Blog not found');

        // Get posts and verify we have more than one
        const posts = blog?.posts || [];
        if (posts.length <= 1) {
            throw new Error('Cannot delete the only post');
        }

        // Remove the post
        const updatedPosts = posts.filter(p => p.id !== postId);

        // Update IndexedDB
        await localBlogDB.saveBlog({
            ...blog,
            posts: updatedPosts
        });

        // Update cookie
        const blogs = cookieUtils.getStoredBlogs();
        const blogIndex = blogs.findIndex((b: any) => b.id === blogId);
        if (blogIndex !== -1) {
            blogs[blogIndex].posts = blogs[blogIndex].posts.filter((p: any) => p.id !== postId);
            document.cookie = `blogiis=${encodeURIComponent(JSON.stringify(blogs))}; path=/`;
        }

        // Redirect to the first remaining post
        if (typeof window !== 'undefined') {
            window.location.href = `/${lang}/dashboard/${blogId}`;
        }

        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
});

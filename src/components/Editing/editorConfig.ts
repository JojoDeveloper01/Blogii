import { $, useSignal, type Signal } from "@builder.io/qwik";
import { BlogDatabase, localBlogDB } from "@services/indexedDB";
import { validateTitle, cookieUtils } from "@lib/utils";
import type { BlogData, UpdateBlogTitleParams, UpdatePostTitleParams } from "@lib/types";

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
    try {
        const { isValid, sanitized } = validateTitle(params.titleValue);
        if (!isValid) {
            throw new Error('Title validation failed');
        }

        // Get the current blogs from cookie
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('blogiis='));

        if (!cookie) {
            throw new Error('No blogs found');
        }

        const storedBlogs = JSON.parse(decodeURIComponent(cookie.split('=')[1]));

        // Find and update the blog title
        const blogIndex = storedBlogs.findIndex((blog: any) => blog.id === params.blogId);
        if (blogIndex === -1) {
            throw new Error('Blog not found');
        }

        params.isSaving.value = true;
        params.hasChanges.value = false;

        // Update in IndexedDB
        const blog = await localBlogDB.getBlog(params.blogId);
        if (!blog) throw new Error('Blog not found');

        await localBlogDB.saveBlog({
            ...blog,
            title: sanitized
        });

        // Update in cookies
        cookieUtils.updateBlogInCookie(params.blogId, sanitized);

        params.showSaveSuccess.value = true;
        setTimeout(() => {
            params.showSaveSuccess.value = false;
        }, 2000);

        params.originalTitle.value = sanitized;
        params.hasChanges.value = false;

        return true;
    } catch (error) {
        params.errorMessage.value = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error updating blog title:', error);

        params.isSaving.value = false;
        return false;
    }
});

export const updatePostTitleWithParams = $(async (params: UpdatePostTitleParams) => {
    try {
        const { blogId, postId, titleValue, showSaveSuccess, hasChanges, isSaving, originalTitle } = params;

        if (!blogId || !postId) {
            throw new Error('Blog ID and Post ID are required');
        }

        const blog = await localBlogDB.getBlog(blogId);

        isSaving.value = true;
        hasChanges.value = false;

        console.log("blog.value", blog)

        // Atualiza o título do post no objeto blog
        if (blog?.posts && blog.posts.length > 0) {
            // Encontra o post pelo ID em vez de sempre usar o primeiro
            const postIndex = blog.posts.findIndex(p => p.id === postId);
            console.log("postIndex", postIndex)
            console.log("blog.value.posts", blog.posts)
            console.log("postId", postId)
            if (postIndex !== -1) {
                blog.posts[postIndex].title = titleValue;
            } else {
                console.error(`Post com ID ${postId} não encontrado no blog`);
            }
        }

        // Salva no IndexedDB
        if (!blog) {
            throw new Error('Blog not found');
        }
        await localBlogDB.saveBlog(blog);
        
        // Atualiza nos cookies
        const blogs = cookieUtils.getStoredBlogs();
        if (blogs) {
            const blogIndex = blogs.findIndex((b) => b.id === blogId);
            if (blogIndex !== -1) {
                const postIndex = blogs[blogIndex].posts?.findIndex((p) => p.id === postId);
                if (postIndex !== -1) {
                    blogs[blogIndex].posts[postIndex].title = titleValue;
                    cookieUtils.setCookie('blogiis', JSON.stringify(blogs), 30); // 30 dias
                }
            }
        }

        showSaveSuccess.value = true;
        setTimeout(() => {
            showSaveSuccess.value = false;
        }, 2000);

        if (originalTitle) {
            originalTitle.value = titleValue;
        }
        hasChanges.value = false;

        return true;
    } catch (error) {
        params.errorMessage.value = error instanceof Error ? error.message : 'Error updating post title';
        return false;
    } finally {
        params.isSaving.value = false;
    }
});

/* export const createNewPost = $(async (blogId: string, postId: string, title: string = 'New Post') => {
    try {
        // Get blog from IndexedDB
        const blog = await localBlogDB.getBlog(blogId);
        if (!blog) throw new Error('Blog not found');

        // Check if post already exists in IndexedDB
        const posts = blog.posts || [];
        console.log("posts111111: ", posts)
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

export const deletePost = $(async (blogId: string, postId: string, lang: string) => {
    try {
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
            window.location.href = `/${lang}/${blogId}`;
        }

        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
});

import { $, useSignal, type Signal } from "@builder.io/qwik";
import { localBlogDB } from "@services/indexedDB";
import { validateTitle, cookieUtils } from "@lib/utils";

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

export const updateBlogTitle = $(async (title: string, blogId: string, showSaveSuccess: Signal<boolean>, hasChanges: Signal<boolean>, isSaving: Signal<boolean>, errorMessage: Signal<string>, originalTitle: Signal<string>) => {
    try {
        const { isValid, sanitized } = validateTitle(title);
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

        const blogs = JSON.parse(decodeURIComponent(cookie.split('=')[1]));

        // Find and update the blog title
        const blogIndex = blogs.findIndex((blog: any) => blog.id === blogId);
        if (blogIndex === -1) {
            throw new Error('Blog not found');
        }

        blogs[blogIndex].title = sanitized;

        // Save back to cookie
        document.cookie = `blogiis=${encodeURIComponent(JSON.stringify(blogs))}; path=/`;

        // Update IndexedDB
        const blog = await localBlogDB.getBlog(blogId);
        if (blog) {
            const updatedBlog = {
                ...blog,
                data: {
                    ...blog.data,
                    title: sanitized,
                    updatedDate: new Date()
                }
            };
            await localBlogDB.saveBlog(updatedBlog);
        }

        showSaveSuccess.value = true;
        setTimeout(() => {
            showSaveSuccess.value = false;
        }, 2000);

        originalTitle.value = sanitized;
        hasChanges.value = false;
    } catch (error) {
        console.error('Error updating blog title:', error);
        errorMessage.value = error instanceof Error ? error.message : 'Error updating blog title';
    } finally {
        isSaving.value = false;
    }
});

export const updatePostTitle = $(async (title: string, blogId: string, postId: string, showSaveSuccess: Signal<boolean>, hasChanges: Signal<boolean>, isSaving: Signal<boolean>, errorMessage: Signal<string>, originalTitle: Signal<string>) => {
    try {
        if (!blogId || !postId) {
            throw new Error('Blog ID and Post ID are required');
        }

        // Update in IndexedDB
        const blog = await localBlogDB.getBlog(blogId);
        if (!blog) throw new Error('Blog not found');

        const posts = blog.data.posts || [];
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) throw new Error('Post not found');

        posts[postIndex] = {
            ...posts[postIndex],
            title,
            updated_at: new Date()
        };

        await localBlogDB.saveBlog({
            ...blog,
            data: {
                ...blog.data,
                posts
            }
        });

        // Update in cookies
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('blogiis='));

        if (cookie) {
            const blogs = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
            const blogIndex = blogs.findIndex((b: any) => b.id === blogId);

            if (blogIndex !== -1) {
                const postIndex = blogs[blogIndex].posts?.findIndex((p: any) => p.id === postId);
                if (postIndex !== -1) {
                    blogs[blogIndex].posts[postIndex].title = title;
                    document.cookie = `blogiis=${encodeURIComponent(JSON.stringify(blogs))}; path=/`;
                }
            }
        }

        showSaveSuccess.value = true;
        setTimeout(() => {
            showSaveSuccess.value = false;
        }, 2000);

        originalTitle.value = title;
        hasChanges.value = false;
    } catch (error) {
        console.error('Error updating post title:', error);
        errorMessage.value = error instanceof Error ? error.message : 'Error updating post title';
    } finally {
        isSaving.value = false;
    }
});

export const createNewPost = $(async (blogId: string, postId: string, title: string = 'New Post') => {
    try {
        // Get blog from IndexedDB
        const blog = await localBlogDB.getBlog(blogId);
        if (!blog) throw new Error('Blog not found');

        // Check if post already exists in IndexedDB
        const posts = blog.data.posts || [];
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
            data: {
                ...blog.data,
                posts
            }
        });

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
        const posts = blog.data.posts || [];
        if (posts.length <= 1) {
            throw new Error('Cannot delete the only post');
        }

        // Remove the post
        const updatedPosts = posts.filter(p => p.id !== postId);

        // Update IndexedDB
        await localBlogDB.saveBlog({
            ...blog,
            data: {
                ...blog.data,
                posts: updatedPosts
            }
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

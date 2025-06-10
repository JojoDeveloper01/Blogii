import { $, useSignal, type Signal } from "@builder.io/qwik";
import { localBlogDB } from "@services/indexedDB";
import { validateTitle, deleteBlog } from "@lib/utils";

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

export const handleDelete = $(async (blogId: string, lang: string, errorMessage: Signal<string>) => {
    if (!blogId) {
        errorMessage.value = "Could not find blog ID";
        return;
    }

    await deleteBlog(blogId, {
        onSuccess: () => {
            if (typeof window !== 'undefined') {
                window.location.href = `/${lang}/`;
            }
        },
        onError: (error) => {
            errorMessage.value = error;
        }
    });
});
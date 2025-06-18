import { component$, useSignal, useStylesScoped$, $, useVisibleTask$ } from "@builder.io/qwik";
import type { QRL, Signal } from "@builder.io/qwik";
import { actions } from "astro:actions";
import { Toast } from '@/components/shared/Toast';
import { localBlogDB } from '@/services/indexedDB';
import type EditorJS from '@editorjs/editorjs';
import { createEditor, sanitizeEditorData } from '@/services/editorService';
import type { BlogData } from '@/lib/types';

interface EditorContentProps {
    blog: BlogData;
    fetchBlog: QRL<() => Promise<BlogData>>;
    isPreviewMode: Signal<boolean>;
    onSave?: QRL<() => void> | undefined;
    isAuthorized: boolean;
}

export const EditorContent = component$<EditorContentProps>(({ blog, fetchBlog, isPreviewMode, onSave, isAuthorized }) => {
    // Add custom styles for EditorJS to improve visibility in dark mode
    useStylesScoped$(`        
        /* EditorJS toolbar styles */
        :global(.ce-toolbar__plus),
        :global(.ce-toolbar__settings-btn) {
            background-color: #e2e8f0 !important;
            color: #1e293b !important;
        }
        
        :global(.dark) :global(.ce-toolbar__plus),
        :global(.dark) :global(.ce-toolbar__settings-btn) {
            background-color: #475569 !important;
            color: #f8fafc !important;
        }
        
        /* EditorJS block tunes menu */
        :global(.ce-popover) {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
        }
        
        :global(.dark) :global(.ce-popover) {
            background-color: #334155 !important;
            border-color: #475569 !important;
        }
        
        :global(.ce-popover__item) {
            color: #1e293b !important;
        }
        
        :global(.dark) :global(.ce-popover__item) {
            color: #f1f5f9 !important;
        }
        
        :global(.ce-popover__item:hover) {
            background-color: #e2e8f0 !important;
        }
        
        :global(.dark) :global(.ce-popover__item:hover) {
            background-color: #475569 !important;
        }
        
        /* EditorJS inline toolbar */
        :global(.ce-inline-toolbar) {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
        }
        
        :global(.dark) :global(.ce-inline-toolbar) {
            background-color: #334155 !important;
            border-color: #475569 !important;
        }
        
        :global(.ce-inline-toolbar__buttons) {
            color: #1e293b !important;
        }
        
        :global(.dark) :global(.ce-inline-toolbar__buttons) {
            color: #f1f5f9 !important;
        }
        
        /* EditorJS conversion toolbar */
        :global(.ce-conversion-toolbar) {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
        }
        
        :global(.dark) :global(.ce-conversion-toolbar) {
            background-color: #334155 !important;
            border-color: #475569 !important;
        }
        
        :global(.ce-conversion-tool) {
            color: #1e293b !important;
        }
        
        :global(.dark) :global(.ce-conversion-tool) {
            color: #f1f5f9 !important;
        }
        
        :global(.ce-conversion-tool:hover) {
            background-color: #e2e8f0 !important;
        }
        
        :global(.dark) :global(.ce-conversion-tool:hover) {
            background-color: #475569 !important;
        }
    `);
    const editor = useSignal<EditorJS | null>(null);
    const isSaving = useSignal(false);
    const showToast = useSignal(false);
    const toastMessage = useSignal('');
    const toastType = useSignal<'success' | 'error'>('success');
    const editorHolder = useSignal<Element>();

    // Initialize editor when component mounts
    useVisibleTask$(async ({ cleanup }) => {
        const postId = String(blog.posts?.[0]?.id);

        try {
            // Get the post content and parse it if it's a string
            let content;
            try {
                // First try to get the content from IndexedDB
                const savedBlog = await fetchBlog();

                // Find the specific post by ID
                const savedPost = savedBlog?.posts?.find(p => p.id === postId);
                const currentPost = blog.posts?.find(p => p.id === postId);

                const rawContent = savedPost?.content || currentPost?.content;

                if (typeof rawContent === 'string') {
                    content = JSON.parse(rawContent);
                } else if (rawContent) {
                    content = rawContent;
                } else {
                    content = { blocks: [] };
                }
            } catch (e) {
                console.error('Error parsing content:', e);
                content = { blocks: [] };
            }

            const editorInstance = await createEditor({
                holder: 'editor-holder',
                data: content,
                readOnly: isPreviewMode.value,
                onChange: async () => {
                    if (!editor.value || isSaving.value) return;

                    try {
                        // Get saved data from editor
                        const savedData = await editor.value.save();
                        const sanitizedData = sanitizeEditorData(savedData);
                        // Get current blog data
                        const currentBlog = await fetchBlog();

                        if (!currentBlog) throw new Error("Blog not found");

                        // Find and update the post
                        const posts = currentBlog.posts || [];
                        const postIndex = posts.findIndex(p => p.id === postId);
                        if (postIndex === -1) throw new Error("Post not found");

                        const stringifiedContent = JSON.stringify(sanitizedData);

                        // Make sure we preserve all post data
                        posts[postIndex] = {
                            id: postId,
                            title: posts[postIndex]?.title ?? blog.posts?.[0]?.title ?? 'Untitled Post',
                            content: stringifiedContent,
                            created_at: posts[postIndex]?.created_at || new Date(),
                            updated_at: new Date()
                        };

                        const updatedBlog = {
                            ...currentBlog,
                            posts
                        };
                        // If authorized, save to DB first
                        if (isAuthorized && postId) {
                            try {
                                const { error } = await actions.post.updateContent({
                                    blogId: blog.id,
                                    postId,
                                    content: JSON.stringify(savedData)
                                });
                                if (error) throw error;
                            } catch (err) {
                                console.warn('Falha ao salvar no DB:', err);
                                // Continue with local save if DB fails
                            }
                        }
                        if (!isAuthorized) {
                            // Save to local storage
                            await localBlogDB.saveBlog(updatedBlog);
                        }

                        toastMessage.value = 'Saved';
                        toastType.value = 'success';
                        showToast.value = true;

                        await onSave?.();
                    } catch (error) {
                        toastMessage.value = 'Error saving content';
                        toastType.value = 'error';
                        showToast.value = true;
                    } finally {
                        isSaving.value = false;
                    }
                }
            });

            editor.value = editorInstance;

            cleanup(() => {
                editor.value?.destroy();
                editor.value = null;
            });
        } catch (error) {
            console.error("Error initializing editor:", error);
        }
    });

    return (
        <div class="relative min-h-[500px]">
            <div
                ref={editorHolder}
                id="editor-holder"
                class="prose dark:prose-invert max-w-none p-6 text-gray-800 dark:text-gray-200"
            />
            {showToast.value && (
                <Toast
                    message={toastMessage.value}
                    type={toastType.value}
                    onClose$={() => showToast.value = false}
                />
            )}
        </div>
    );
});

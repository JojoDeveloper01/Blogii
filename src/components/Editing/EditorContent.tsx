import { component$, useSignal, useVisibleTask$, type Signal, type QRL } from '@builder.io/qwik';
import { Toast } from '@components/shared/Toast';
import { localBlogDB } from '@services/indexedDB';
import type EditorJS from '@editorjs/editorjs';
import { createEditor, sanitizeEditorData } from '@services/editorService';
import type { BlogData } from '@lib/types';

interface EditorContentProps {
    blog: BlogData;
    isPreviewMode: Signal<boolean>;
    onSave?: QRL<() => void> | undefined;
}

export const EditorContent = component$<EditorContentProps>(({ blog, isPreviewMode, onSave }) => {
    const editor = useSignal<EditorJS | null>(null);
    const isSaving = useSignal(false);
    const showToast = useSignal(false);
    const toastMessage = useSignal('');
    const toastType = useSignal<'success' | 'error'>('success');
    const editorHolder = useSignal<Element>();

    // Initialize editor when component mounts
    useVisibleTask$(async ({ cleanup }) => {
        const blogId = String(blog.id);
        const postId = String(blog.data.posts?.[0]?.id);

        try {
            // Get the post content and parse it if it's a string
            let content;
            try {
                // First try to get the content from IndexedDB
                const savedBlog = await localBlogDB.getBlog(blogId);

                // Find the specific post by ID
                const savedPost = savedBlog?.data?.posts?.find(p => p.id === postId);
                const currentPost = blog.data.posts?.find(p => p.id === postId);
                
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
                        const currentBlog = await localBlogDB.getBlog(blogId);
                        
                        if (!currentBlog) throw new Error("Blog not found");

                        // Find and update the post
                        const posts = currentBlog.data.posts || [];
                        const postIndex = posts.findIndex(p => p.id === postId);                        
                        if (postIndex === -1) throw new Error("Post not found");

                        const stringifiedContent = JSON.stringify(sanitizedData);

                        // Make sure we preserve all post data
                        posts[postIndex] = {
                            id: postId,
                            title: posts[postIndex]?.title ?? blog.data.posts?.[0]?.title ?? 'Untitled Post',
                            content: stringifiedContent,
                            created_at: posts[postIndex]?.created_at || new Date(),
                            updated_at: new Date()
                        };

                        const updatedBlog = {
                            ...currentBlog,
                            data: {
                                ...currentBlog.data,
                                posts
                            }
                        };                        
                        // Save updated blog
                        await localBlogDB.saveBlog(updatedBlog);                        
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

import { component$, $, useSignal, useVisibleTask$, useOnDocument } from "@builder.io/qwik";
import EditorJS from "@editorjs/editorjs";
import { EditorToolbar } from "./EditorToolbar";
import { EditorContent } from "./EditorContent";
import { PostNavigator } from "./PostNavigator";
import { createNewPost } from "./editorConfig";
import type { BlogData, BlogCookieItem } from "@lib/types";

interface EditorProps {
    blog: BlogData;
    blogPosts: BlogCookieItem[];
    editing: string;
    lang: string;
}

export const Editor = component$<EditorProps>(({ blog, blogPosts, editing, lang}) => {
    
    const editor = useSignal<EditorJS | null>(null);
    const isPreviewMode = useSignal<boolean>(editing === 'false');
    const showSaveSuccess = useSignal(false);
    const isNewPost = useSignal(blog.data.posts?.[0]?.content === undefined);

    // Set editor to readonly if in preview mode
    useVisibleTask$(() => {
        if (isPreviewMode.value && editor.value?.isReady) {
            editor.value.readOnly.toggle();
        }
    });

    // Function to sync URL with current preview mode
    const syncUrlWithMode = $(() => {
        if (typeof window === 'undefined') return;

        const url = new URL(window.location.href);
        url.searchParams.set('editing', (!isPreviewMode.value).toString());
        window.history.pushState({}, '', url);
    });

    // Function to toggle preview mode
    const togglePreviewMode = $(() => {
        isPreviewMode.value = !isPreviewMode.value;
        if (editor.value?.isReady) {
            editor.value.readOnly.toggle();
        }
        syncUrlWithMode();
    });

    useVisibleTask$(async () => {
        // If this is a new post, initialize it in IndexedDB
        if (isNewPost.value && blog.id && blog.data.posts?.[0]?.id) {
            await createNewPost(
                String(blog.id),
                String(blog.data.posts[0].id),
                blog.data.posts[0].title
            );
            isNewPost.value = false;
        }
    });

    useOnDocument('keydown', $((event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            handleSave();
        }
    }));

    const handleSave = $(async () => {
        showSaveSuccess.value = true;
        setTimeout(() => {
            showSaveSuccess.value = false;
        }, 2000);
    });

    return (
        <div class="flex flex-col gap-4">
            <EditorToolbar
                blogId={String(blog.id)}
                postId={String(blog.data.posts?.[0]?.id)}
                title={useSignal(blog.data.posts?.[0]?.title ?? '')}
                lang={lang}
                editor={editor}
                isPreviewMode={isPreviewMode}
                onTogglePreview$={togglePreviewMode}
            />
            <div class="flex gap-4">
                <div class="flex-1">
                    <EditorContent
                        blog={blog}
                        isPreviewMode={isPreviewMode}
                        onSave={handleSave}
                    />
                </div>
                <PostNavigator 
                    blogId={String(blog.id)}
                    postId={String(blog.data.posts?.[0]?.id)}
                    lang={lang}
                    blogPosts={blogPosts}
                    isPreviewMode={isPreviewMode}
                />
            </div>
        </div>
    );
});

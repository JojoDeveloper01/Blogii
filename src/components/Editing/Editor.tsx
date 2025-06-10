import { component$, useSignal, $ } from '@builder.io/qwik';
import type EditorJS from '@editorjs/editorjs';
import type { BlogData } from '@lib/types';
import { EditorToolbar } from './EditorToolbar';
import { EditorContent } from './EditorContent';

export interface EditorProps {
    blog: BlogData;
    lang: string;
}

export const Editor = component$<EditorProps>(({ blog, lang }) => {
    const editor = useSignal<EditorJS | null>(null);
    const showSaveSuccess = useSignal(false);
    const isPreviewMode = useSignal(false);

    // Create save handler
    const handleSave = $(() => {
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
            />
            <EditorContent
                blog={blog}
                isPreviewMode={isPreviewMode}
                onSave={handleSave}
            />
        </div>
    );
});

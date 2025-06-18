import { component$, useSignal, $, useVisibleTask$, type Signal, type QRL } from '@builder.io/qwik';
import type EditorJS from '@editorjs/editorjs';
import { icons } from './icons';
import { executeEditorCommand } from "@/lib/utils";
import { PathPost } from './PathPost';
import type { BlogData } from "@/lib/types";

interface EditorToolbarProps {
    editor: Signal<EditorJS | null>;
    blogId: string;
    postId: string;
    title: Signal<string>;
    blogTitle: string;
    lang: string;
    isPreviewMode: Signal<boolean>;
    togglePreviewMode: QRL<() => void>;
    fetchBlog: QRL<() => Promise<BlogData>>;
    isAuthorized: boolean;
}

export const EditorToolbar = component$<EditorToolbarProps>(({ editor, blogId, postId, title, blogTitle, lang, isPreviewMode, togglePreviewMode, fetchBlog, isAuthorized }) => {

    const executeCommand = $((command: string, params?: any) => {
        executeEditorCommand(editor.value, command, params);
    });

    return (
        <div class="flex flex-col gap-1 bg-[--bg-color] border-b border-gray-700 rounded-t-lg">
            {/* Breadcrumb path */}
            <PathPost
                blogId={blogId}
                postId={postId}
                title={title}
                blogTitle={blogTitle}
                lang={lang}
                isPreviewMode={isPreviewMode}
                onTogglePreview$={togglePreviewMode}
                fetchBlog={fetchBlog}
                isAuthorized={isAuthorized}
            />

            <hr class="h-[0.9px] w-11/12 m-auto bg-[--noir-core] dark:bg-[--blanc-core] opacity-10 border-0" />

            {/* Barra de ferramentas do editor com estilo moderno */}
            <div class={`flex ${isPreviewMode.value ? 'hidden' : 'block'}`}>
                <div class="editor-toolbar w-full grid gap-2">
                    <div class="flex items-center px-4 py-3">
                        {/* Editor toolbar only shown in edit mode */}
                        <div class="group relative">
                            <button
                                class="flex items-center justify-between gap-16 text-sm p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg"
                            >
                                <span class="font-medium">Add text</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:rotate-180 transition-transform duration-200">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute left-0 top-full mt-1 w-full z-50 bg-white dark:bg-[--noir-core] rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 transform origin-top scale-95 group-hover:scale-100">
                                <button
                                    class="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-gradient-to-r hover:bg-black/5 dark:hover:bg-white/5 border-b border-gray-100 dark:border-gray-700 first:rounded-t-lg"
                                    onClick$={() => executeCommand('header', 1)}
                                >
                                    <span class="font-bold">H1</span> - Heading 1
                                </button>
                                <button
                                    class="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-gradient-to-r hover:bg-black/5 dark:hover:bg-white/5 border-b border-gray-100 dark:border-gray-700"
                                    onClick$={() => executeCommand('header', 2)}
                                >
                                    <span class="font-bold">H2</span> - Heading 2
                                </button>
                                <button
                                    class="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-gradient-to-r hover:bg-black/5 dark:hover:bg-white/5 border-b border-gray-100 dark:border-gray-700"
                                    onClick$={() => executeCommand('header', 3)}
                                >
                                    <span class="font-bold">H3</span> - Heading 3
                                </button>
                                <button
                                    class="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-gradient-to-r hover:bg-black/5 dark:hover:bg-white/5 last:rounded-b-lg"
                                    onClick$={() => executeCommand('paragraph')}
                                >
                                    <span class="font-bold">P</span> - Paragraph
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center border-l border-gray-200/30 dark:border-white/5 pl-4 *:p-1.5 *:rounded-lg *:text-black *:dark:text-white *:transition-colors">
                            <button
                                class="hover:bg-gray-100/70 dark:hover:bg-white/5 rounded-lg"
                                onClick$={() => executeCommand('style', 'bold')}
                                dangerouslySetInnerHTML={icons.bold}
                            />
                            <button
                                class="hover:bg-gray-100/70 dark:hover:bg-white/5 rounded-lg"
                                onClick$={() => executeCommand('style', 'italic')}
                                dangerouslySetInnerHTML={icons.italic}
                            />
                            <button
                                onClick$={() => executeCommand('style', 'underline')}
                                dangerouslySetInnerHTML={icons.underline}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

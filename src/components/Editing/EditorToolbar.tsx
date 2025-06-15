import { component$, useSignal, $, useVisibleTask$, type Signal, type QRL } from '@builder.io/qwik';
import type EditorJS from '@editorjs/editorjs';
import { icons } from './icons';
import { executeEditorCommand } from "@lib/utils";
import { validateTitle } from "@lib/utils";
import { TitleInputBase } from '@components/shared/TitleInputBase';
import { ConfirmDialog } from '@components/shared/ConfirmDialog';
import { updatePostTitle, useAutoSave, deletePost } from "./editorConfig";
import { localBlogDB } from "@services/indexedDB";

interface EditorToolbarProps {
    blogId: string;
    postId: string;
    title: Signal<string>;
    lang: string;
    editor: Signal<EditorJS | null>;
    isPreviewMode: Signal<boolean>;
    onTogglePreview$: QRL<() => void>;
}

export const EditorToolbar = component$<EditorToolbarProps>(({ title, lang, editor, blogId, postId, isPreviewMode, onTogglePreview$ }) => {
    const showOptions = useSignal(false);

    // Initialize preview and edit icons
    icons.preview = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    icons.edit = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;



    const canDelete = useSignal(false);
    const errorMessage = useSignal("");

    // Check if we can show delete button (more than one post)
    useVisibleTask$(async () => {
        try {
            const blog = await localBlogDB.getBlog(blogId);
            const posts = blog?.data?.posts || [];
            if (posts.length > 1) {
                canDelete.value = true;
            }
        } catch (error) {
            console.error('Error checking posts count:', error);
        }
    });

    const handleDeletePost = $(async () => {
        try {
            await deletePost(blogId, postId, lang);
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Error deleting post';
        }
    });
    useVisibleTask$(({ track }) => {
        if (typeof window === 'undefined') return;

        // Listen for URL changes
        window.addEventListener('popstate', () => {
            const currentEditing = new URLSearchParams(window.location.search).get('editing');
            const shouldBePreview = currentEditing === 'false';
            if (shouldBePreview !== isPreviewMode.value) {
                onTogglePreview$();
            }
        });
    });

    const originalTitle = useSignal(title.value);
    const { hasChanges, isSaving, createAutoSave } = useAutoSave();
    const showSaveSuccess = useSignal(false);

    const executeCommand = $((command: string, params?: any) => {
        executeEditorCommand(editor.value, command, params);
    });

    const handleAutoSave = $((newValue: string) => {
        const validation = validateTitle(newValue);
        if (!validation.isValid) {
            errorMessage.value = 'Title must be at least 3 characters long and contain only letters, numbers, and spaces';
            return;
        }
        errorMessage.value = '';
        title.value = validation.sanitized;
        createAutoSave(validation.sanitized, originalTitle.value, async (value) => {
            await updatePostTitle(value, blogId, postId, showSaveSuccess, hasChanges, isSaving, errorMessage, originalTitle);
        });
    });

    return (
        <div class="editor-toolbar w-full">
            <div class="flex items-center p-2 border-b border-gray-200/30 dark:border-gray-700/70/50">
                <div class="flex items-center space-x-2 px-2 w-full">
                    <div class="flex items-center space-x-3 pr-4 border-r border-gray-200/30 dark:border-gray-700/70/50">
                        <a href={`/${lang}/${blogId}`} class="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <span dangerouslySetInnerHTML={icons.back} />
                            <span>Back</span>
                        </a>
                    </div>
                    <div class="flex-1 flex items-center space-x-2 relative">
                        {isPreviewMode.value ? (
                            <div class="flex-1 px-4 py-2 text-lg font-medium text-gray-800 dark:text-gray-200">
                                {title.value}
                            </div>
                        ) : (
                            <TitleInputBase
                                value={title}
                                onInput$={handleAutoSave}
                                onEnter$={() => updatePostTitle(title.value, blogId, postId, showSaveSuccess, hasChanges, isSaving, errorMessage, originalTitle)}
                                placeholder="Title of the post"
                            />
                        )}
                        {hasChanges.value && isSaving.value && (
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 animate-pulse">
                                Saving...
                            </div>
                        )}
                        {showSaveSuccess.value && (
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400 flex items-center space-x-1 animate-fade-in">
                                <span>Saved</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        )}
                    </div>
                    <div class="flex items-center space-x-3 pl-4 border-l border-gray-200/30 dark:border-gray-700/70/50">
                        <button
                            onClick$={onTogglePreview$}
                            class="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/30 rounded-md transition-colors duration-200"
                        >
                            <span dangerouslySetInnerHTML={isPreviewMode.value ? icons.edit : icons.preview} />
                            <span class="text-sm font-medium">
                                {isPreviewMode.value ? "Edit" : "Preview"}
                            </span>
                        </button>

                        {/* Three dots menu */}
                        {canDelete.value && (
                            <div class="relative">
                                <button
                                    onClick$={() => showOptions.value = !showOptions.value}
                                    class="p-2 hover:bg-gray-100/70 dark:hover:bg-gray-800/30 rounded-lg focus:outline-none text-gray-700 dark:text-gray-300 transition-colors"
                                    title="More options"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="12" cy="12" r="1"></circle>
                                        <circle cx="12" cy="5" r="1"></circle>
                                        <circle cx="12" cy="19" r="1"></circle>
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {showOptions.value && (
                                    <div
                                        class="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg bg-[--blanc-core] dark:bg-[--noir-core] backdrop-blur-md border border-gray-100/50 dark:border-gray-700/70/50 focus:outline-none z-50"
                                        role="menu"
                                    >
                                        <div class="py-1" role="none">
                                            <button
                                                onClick$={() => {
                                                    if (window) {
                                                        showOptions.value = false;
                                                        const dialog = document.getElementById(`delete-post-dialog-${postId}`) as HTMLDialogElement;
                                                        dialog.showModal();
                                                    }
                                                }}
                                                class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 transition-colors"
                                                role="menuitem"
                                            >
                                                Delete Post
                                            </button>
                                            {/* Add more options here */}
                                        </div>
                                    </div>
                                )}

                                {/* Click outside to close dropdown */}
                                {showOptions.value && (
                                    <div
                                        class="fixed inset-0 z-40"
                                        onClick$={() => showOptions.value = false}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div class="flex items-center p-2 space-x-4" style={{ display: isPreviewMode.value ? 'none' : 'flex' }}>
                {/* Editor toolbar only shown in edit mode */}
                <div class="flex items-center space-x-1">
                    <select
                        class="text-sm p-2 text-gray-300 dark:text-gray-300 bg-[--blanc-core] dark:bg-[--noir-core]"
                        onChange$={(e) => {
                            const val = (e.target as HTMLSelectElement).value;
                            if (val === 'p') {
                                executeCommand('paragraph');
                            } else {
                                executeCommand('header', parseInt(val));
                            }
                        }}
                    >
                        <option value="">Add text type</option>
                        <option value="1">Heading 1</option>
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                        <option value="p">Paragraph</option>
                    </select>
                </div>
                <div class="flex items-center space-x-1 border-l border-gray-200/30 dark:border-gray-700/70/50 pl-4 *:p-1.5 *:hover:bg-gray-100/70 *:dark:hover:bg-gray-800/30 *:rounded-md *:text-black *:dark:text-white *:transition-colors">
                    <button
                        onClick$={() => executeCommand('style', 'bold')}
                        dangerouslySetInnerHTML={icons.bold}
                    />
                    <button
                        onClick$={() => executeCommand('style', 'italic')}
                        dangerouslySetInnerHTML={icons.italic}
                    />
                    <button
                        onClick$={() => executeCommand('style', 'underline')}
                        dangerouslySetInnerHTML={icons.underline}
                    />
                </div>
            </div>
            <ConfirmDialog
                id={`delete-post-dialog-${postId}`}
                onConfirm$={handleDeletePost}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
            />
            {errorMessage.value && (
                <div class="mt-2 text-red-500 dark:text-red-400 p-2 bg-red-50/50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-800/30">
                    {errorMessage.value}
                </div>
            )}
        </div>
    );
});

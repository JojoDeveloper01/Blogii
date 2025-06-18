import { component$, useSignal, $, useVisibleTask$, type Signal, type QRL } from '@builder.io/qwik';
import type { BlogData } from "@/lib/types";
import { useAutoSave, updatePostTitleWithParams, deletePost } from "./editorConfig";
import { validateTitle } from "@/lib/utils";
import { TitleInputBase } from "@/components/shared/TitleInputBase";
import { icons } from './icons';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface PathPostProps {
    blogId: string;
    postId: string;
    title: Signal<string>;
    blogTitle: string;
    lang: string;
    isPreviewMode: Signal<boolean>;
    onTogglePreview$: QRL<() => void>;
    fetchBlog: QRL<() => Promise<BlogData>>;
    isAuthorized: boolean;
}

export const PathPost = component$(({blogId, postId, title, blogTitle, lang, isPreviewMode, onTogglePreview$, fetchBlog, isAuthorized }: PathPostProps) => {
    const showOptions = useSignal(false);
    const showSaveSuccess = useSignal(false);
    const errorMessage = useSignal("");
    const originalTitle = useSignal(title.value);

    const indexedBlogs = useSignal<BlogData>({
        id: '',
        title: '',
        pubDate: new Date(),
        posts: [],
    });

    const { hasChanges, isSaving, createAutoSave } = useAutoSave();

    const canDelete = useSignal(false);

    // Initialize preview and edit icons
    icons.preview = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    icons.edit = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

    // Check if we can show delete button (more than one post)
    useVisibleTask$(async () => {
        try {
            const blog = await fetchBlog();
            const posts = blog?.posts || [];
            indexedBlogs.value = blog;
            if (posts.length >= 1) {
                canDelete.value = true;
            }
        } catch (error) {
            console.error('Error checking posts count:', error);
        }
    });

    const handleAutoSave = $((newValue: string) => {
        const validation = validateTitle(newValue);
        if (!validation.isValid) {
            errorMessage.value = 'Title must be at least 3 characters long and contain only letters, numbers, and spaces';
            return;
        }
        errorMessage.value = '';
        title.value = validation.sanitized;
        createAutoSave(validation.sanitized, originalTitle.value, async (titleValue) => {
            await updatePostTitleWithParams({
                isAuthorized,
                blogId,
                postId,
                titleValue,
                showSaveSuccess,
                hasChanges,
                isSaving,
                originalTitle,
                errorMessage,
            });
        });
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

    const handleDeletePost = $(async () => {
        try {
            await deletePost(blogId, postId, lang, isAuthorized);
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Error deleting post';
        }
    });

    return (
        <div class="flex flex-wrap gap-4 justify-between px-4 py-3 text-sm">
            <div class="flex-1 flex flex-wrap gap-2">
                <a
                    href={`/${lang}/${blogId}`}
                    class="flex items-center px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-[--secondary] shadow-sm hover:shadow group transition-all duration-200"
                >
                    <span class="flex items-center justify-center w-5 h-5 mr-2 rounded bg-[--primary] text-white group-hover:scale-110 transition-all duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-layout-dashboard"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 3a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 12a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2zm10 -4a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2zm0 -8a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2v-2a2 2 0 0 1 2 -2z" /></svg>
                    </span>
                    <span class="font-medium text-[--secondary] group-hover:text-white transition-colors duration-200">{blogTitle}</span>
                </a>

                <span class="m-auto text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </span>

                <div class="flex-1 flex items-center relative">
                    <TitleInputBase
                        value={useSignal(title.value)}
                        onInput$={handleAutoSave}
                        onEnter$={() => updatePostTitleWithParams({
                            isAuthorized,
                            blogId,
                            postId,
                            titleValue: title.value,
                            showSaveSuccess,
                            hasChanges,
                            isSaving,
                            originalTitle,
                            errorMessage
                        })}
                        placeholder="Title of the post"
                    />
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
            </div>
            <button
                onClick$={onTogglePreview$}
                class="flex-shrink-0 flex items-center p-1.5 gap-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg transition-colors duration-200 mx-auto"
                title={isPreviewMode.value ? "Switch to Edit Mode" : "Switch to Preview Mode"}
            >
                <span dangerouslySetInnerHTML={isPreviewMode.value ? icons.edit : icons.preview} />
                <span class="text-xs font-medium">
                    {isPreviewMode.value ? "Edit" : "Preview"}
                </span>
            </button>
            {/* Menu de opções */}
            {canDelete.value && (
                <div class="relative grid">
                    <button
                        onClick$={() => showOptions.value = !showOptions.value}
                        class="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg focus:outline-none transition-colors duration-200"
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
                    <ConfirmDialog
                        id={`delete-post-dialog-${postId}`}
                        onConfirm$={handleDeletePost}
                        title="Delete Post"
                        message="Are you sure you want to delete this post? This action cannot be undone."
                    />
                </div>
            )}
            {errorMessage.value && (
                <div class="mt-2 text-red-500 dark:text-red-400 p-2 bg-red-50/50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-800/30">
                    {errorMessage.value}
                </div>
            )}
        </div>

    );
})

import { component$, type Signal, $, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type EditorJS from '@editorjs/editorjs';
import { icons } from './icons';
import { executeEditorCommand, updateBlogTitle, deleteBlog } from "@lib/utils";
import { TitleInputBase } from '@components/shared/TitleInputBase';
import { ConfirmDialog } from '@components/shared/ConfirmDialog';

interface EditorToolbarProps {
    title: Signal<string>;
    lang: string;
    editor: Signal<EditorJS | null>;
    isPreview?: boolean;
}

export const EditorToolbar = component$<EditorToolbarProps>(({ title, lang, editor }) => {
    const blogId = useSignal<string | null>(null);
    const isPreviewMode = useSignal(false);

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

    // Initialize blogId, icons, and preview mode
    useVisibleTask$(({ track }) => {
        if (typeof window === 'undefined') return;

        // Get blog ID from URL
        const params = new URLSearchParams(window.location.search);
        blogId.value = params.get('id');
        
        // Add preview and edit icons
        icons.preview = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        icons.edit = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

        // Set initial preview mode from URL
        const editing = params.get('editing');
        if (editing === 'false') {
            isPreviewMode.value = true;
            if (editor.value?.isReady) {
                editor.value.readOnly.toggle();
            }
            syncUrlWithMode();
        }

        // Listen for URL changes
        window.addEventListener('popstate', () => {
            const currentEditing = new URLSearchParams(window.location.search).get('editing');
            const shouldBePreview = currentEditing === 'false';
            if (shouldBePreview !== isPreviewMode.value) {
                togglePreviewMode();
            }
        });
    });

    const originalTitle = useSignal(title.value);
    const hasChanges = useSignal(false);
    const saveTimeout = useSignal<number | null>(null);
    const showSaveSuccess = useSignal(false);
    const isSaving = useSignal(false);
    const errorMessage = useSignal("");

    const executeCommand = $((command: string, params?: any) => {
        executeEditorCommand(editor.value, command, params);
    });

    const updateTitle = $(async () => {
        if (!blogId.value) {
            errorMessage.value = "Could not find blog ID";
            return;
        }

        await updateBlogTitle(title.value, blogId.value, {
            onSuccess: () => {
                // Show success feedback
                showSaveSuccess.value = true;
                setTimeout(() => {
                    showSaveSuccess.value = false;
                }, 2000);

                originalTitle.value = title.value;
                hasChanges.value = false;
                isSaving.value = false;
            },
            onError: () => {
                isSaving.value = false;
            }
        });
    });

    const autoSave = $((newTitle: string) => {
        if (saveTimeout.value) {
            clearTimeout(saveTimeout.value);
        }

        if (newTitle === originalTitle.value) {
            hasChanges.value = false;
            return;
        }

        hasChanges.value = true;
        isSaving.value = true;

        if (typeof window !== 'undefined') {
            saveTimeout.value = window.setTimeout(async () => {
                await updateTitle();
            }, 1500); // Reduced to 1.5 seconds
        }
    });

    const handleDelete = $(async () => {
        if (!blogId.value) {
            errorMessage.value = "Could not find blog ID";
            return;
        }
        
        await deleteBlog(blogId.value, {
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

    return (
        <div class="editor-toolbar border-2 border-[#cbcbcb] rounded-md bg-white">
            <div class="flex items-center p-1 border-b border-gray-300">
                <div class="flex items-center space-x-2 px-2 w-full">
                    <div class="flex items-center space-x-3 pr-4 border-r">
                        <a href={`/${lang}/`} class="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                            <span dangerouslySetInnerHTML={icons.back} />
                        </a>
                    </div>
                    <div class="flex-1 flex items-center space-x-2 relative">
                        {isPreviewMode.value ? (
                            <div class="flex-1 px-4 py-2 text-lg font-medium">
                                {title.value}
                            </div>
                        ) : (
                            <TitleInputBase
                                value={title}
                                onInput$={(newValue) => {
                                    title.value = newValue;
                                    hasChanges.value = title.value !== originalTitle.value;
                                    autoSave(newValue);
                                }}
                                onEnter$={updateTitle}
                                className="flex-1 px-4 py-2 text-lg font-medium border-2 border-transparent focus:outline-none focus:ring-0 rounded-md transition-colors hover:border-gray-300"
                                placeholder="Title of the blog"
                            />
                        )}
                        {hasChanges.value && isSaving.value && (
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                Saving...
                            </div>
                        )}
                        {showSaveSuccess.value && (
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center space-x-1">
                                <span>Saved</span>
                            </div>
                        )}
                    </div>
                    <div class="flex items-center space-x-3 pl-4 border-l">
                        <button
                            onClick$={() => {
                                if (typeof window !== 'undefined') {
                                    const dialog = document.getElementById('delete-blog-dialog') as HTMLDialogElement;
                                    dialog?.showModal();
                                }
                            }}
                            class="text-red-500 hover:text-red-700 p-2 transition-colors"
                            title="Delete blog"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button
                            onClick$={togglePreviewMode}
                            class="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                            title={isPreviewMode.value ? "Back to editing" : "Preview mode"}
                        >
                            <span dangerouslySetInnerHTML={isPreviewMode.value ? icons.edit : icons.preview} />
                            <span class="text-sm font-medium">
                                {isPreviewMode.value ? "Edit" : "Preview"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex items-center p-2 space-x-4" style={{ display: isPreviewMode.value ? 'none' : 'flex' }}>
                {/* Editor toolbar only shown in edit mode */}
                <div class="flex items-center space-x-1">
                    <select
                        class="bg-transparent text-sm p-1 border rounded"
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
                <div class="flex items-center space-x-1 border-l pl-4">
                    <button
                        class="p-1.5 hover:bg-gray-200 rounded"
                        onClick$={() => executeCommand('style', 'bold')}
                        dangerouslySetInnerHTML={icons.bold}
                    />
                    <button
                        class="p-1.5 hover:bg-gray-200 rounded"
                        onClick$={() => executeCommand('style', 'italic')}
                        dangerouslySetInnerHTML={icons.italic}
                    />
                    <button
                        class="p-1.5 hover:bg-gray-200 rounded"
                        onClick$={() => executeCommand('style', 'underline')}
                        dangerouslySetInnerHTML={icons.underline}
                    />
                </div>
            </div>
            <ConfirmDialog
                id="delete-blog-dialog"
                onConfirm$={handleDelete}
                title="Delete Blog"
                message="Are you sure you want to delete this blog? This action cannot be undone."
            />
            {errorMessage.value && (
                <div class="mt-2 text-red-500 p-2">
                    {errorMessage.value}
                </div>
            )}
        </div>
    );
});

import { component$, type Signal, $, useSignal } from '@builder.io/qwik';
import type EditorJS from '@editorjs/editorjs';
import { icons } from './icons';
import { blogDB } from "@services/indexedDB";
import { sanitizeString } from "@lib/utils";

interface EditorToolbarProps {
    title: Signal<string>;
    lang: string;
    editor: Signal<EditorJS | undefined>;
}

export const EditorToolbar = component$<EditorToolbarProps>(({ title, lang, editor }) => {
    const originalTitle = useSignal(title.value);
    const hasChanges = useSignal(false);
    const saveTimeout = useSignal<number | null>(null);
    const showSaveSuccess = useSignal(false);
    const isSaving = useSignal(false);

    const executeCommand = $((command: string, params?: any) => {
        if (!editor.value?.isReady) {
            console.warn('Editor not ready');
            return;
        }

        switch (command) {
            case 'header':
                editor.value.blocks.insert('header', {
                    level: params || 2,
                    text: 'New Heading'
                });
                break;
            case 'paragraph':
                editor.value.blocks.insert('paragraph', {
                    text: 'New paragraph'
                });
                break;
            case 'style':
                const selection = window.getSelection();
                if (!selection?.toString()) return;

                switch (params) {
                    case 'bold':
                        document.execCommand('bold', false);
                        break;
                    case 'italic':
                        document.execCommand('italic', false);
                        break;
                    case 'underline':
                        document.execCommand('underline', false);
                        break;
                }
                break;
        }
    });

    const updateTitleAndURL = $(async () => {
        const newTitle = title.value.trim();
        if (!newTitle) return;

        try {
            // Update URL
            const currentUrl = new URL(window.location.href);
            const sanitizedTitle = sanitizeString(newTitle);
            currentUrl.searchParams.set('id', sanitizedTitle);
            window.history.replaceState({}, '', currentUrl.toString());

            // Update IndexedDB
            const tempBlog = await blogDB.getTempBlog();
            if (tempBlog) {
                const updatedBlog = {
                    ...tempBlog,
                    data: {
                        ...tempBlog.data,
                        title: newTitle,
                        lastUpdated: new Date().toISOString()
                    }
                };
                await blogDB.saveTempBlog(updatedBlog);
                try {
                    await blogDB.updateBlog(updatedBlog);
                } catch (err) {
                    console.warn('Failed to update main blog, but temp blog was saved:', err);
                }
            }

            // Show success feedback
            showSaveSuccess.value = true;
            setTimeout(() => {
                showSaveSuccess.value = false;
            }, 2000);

            originalTitle.value = title.value;
            hasChanges.value = false;
            isSaving.value = false;
        } catch (err) {
            console.error('Error updating title:', err);
            isSaving.value = false;
        }
    });

    const autoSave = $(() => {
        if (saveTimeout.value) {
            clearTimeout(saveTimeout.value);
        }
        isSaving.value = true;
        saveTimeout.value = window.setTimeout(async () => {
            await updateTitleAndURL();
        }, 2000);
    });

    return (
        <div class="editor-toolbar border-2 border-[#cbcbcb] rounded-md bg-white">
            <div class="flex items-center p-1 border-b border-gray-300">
                <div class="flex items-center space-x-2 px-2 w-full">
                    <div class="flex items-center space-x-3 pr-4 border-r">
                        <a href={`/${lang}/`} class="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                            <span dangerouslySetInnerHTML={icons.back} />
                        </a>
                        <a href="." class="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                            <span dangerouslySetInnerHTML={icons.blogs} />
                            <span class="text-sm font-medium">Blogs</span>
                        </a>
                    </div>
                    <div class="flex-1 flex items-center space-x-2 relative">
                        <input
                            type="text"
                            value={title.value}
                            title='Title of the blog'
                            onChange$={(e) => {
                                title.value = (e.target as HTMLInputElement).value;
                                hasChanges.value = title.value !== originalTitle.value;
                                autoSave();
                            }}
                            class="flex-1 px-4 py-2 text-lg font-medium border-2 border-transparent focus:outline-none focus:ring-0 rounded-md transition-colors"
                            placeholder="Title of the blog"
                        />
                        {hasChanges.value && isSaving.value && (
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                Saving...
                            </div>
                        )}
                        {showSaveSuccess.value && (
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center space-x-1">
                                <span>Saved</span>
                                <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div class="flex items-center p-2 space-x-4">
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
                        <option value="">Text style</option>
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
        </div>
    );
});

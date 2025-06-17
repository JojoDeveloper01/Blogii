import { component$, $, useSignal } from '@builder.io/qwik';
import { TitleInputBase } from '@components/shared/TitleInputBase';
import { updateBlogTitle, useAutoSave } from './editorConfig';

interface BlogTitleEditorProps {
    blogId: string;
    initialTitle: string;
}

export const BlogTitleEditor = component$<BlogTitleEditorProps>(({ initialTitle, blogId }) => {
    const title = useSignal(initialTitle);
    const originalTitle = useSignal(title.value);
    const { hasChanges, isSaving, createAutoSave } = useAutoSave();
    const showSaveSuccess = useSignal(false);
    const errorMessage = useSignal("");

    const handleInput = $((newValue: string) => {
        createAutoSave(newValue, originalTitle.value, async (titleValue) => {
            await updateBlogTitle({
                titleValue,
                blogId,
                showSaveSuccess,
                hasChanges,
                isSaving,
                errorMessage,
                originalTitle
            });
        });
    });

    return (
        <div class="flex-1 flex items-center space-x-2 relative">
            <TitleInputBase
                value={title}
                onInput$={handleInput}
                onEnter$={() => updateBlogTitle({
                    titleValue: title.value,
                    blogId,
                    showSaveSuccess,
                    hasChanges,
                    isSaving,
                    errorMessage,
                    originalTitle
                })}
                placeholder="Blog Title"
            />
            {isSaving.value && !showSaveSuccess.value && (
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    Saving...
                </div>
            )}
            {showSaveSuccess.value && (
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center space-x-1">
                    <span>Saved</span>
                </div>
            )}
            {errorMessage.value && (
                <div class="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                    {errorMessage.value}
                </div>
            )}
        </div>
    );
});

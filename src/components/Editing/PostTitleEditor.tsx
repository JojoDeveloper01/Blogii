import { validateTitle } from "@/lib/utils";
import { TitleInputBase } from "../shared/TitleInputBase"
import { updatePostTitleWithParams, useAutoSave } from "./editorConfig"
import { component$, useSignal, $, type Signal } from '@builder.io/qwik';

interface PostTitleEditorProps {
    blogId: string;
    postId: string;
    initialTitle: string;
    isAuthorized: boolean;
}

export const PostTitleEditor = component$(({ blogId, postId, initialTitle, isAuthorized }: PostTitleEditorProps) => {
    const errorMessage = useSignal("");
    const showSaveSuccess = useSignal(false);
    const title = useSignal(initialTitle);
    const originalTitle = useSignal(title.value);

    const { hasChanges, isSaving, createAutoSave } = useAutoSave();

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

    return (
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
            {
                hasChanges.value && isSaving.value && (
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 animate-pulse">
                        Saving...
                    </div>
                )
            }
            {
                showSaveSuccess.value && (
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 dark:text-green-400 flex items-center space-x-1 animate-fade-in">
                        <span>Saved</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                )
            }
        </div>
    )
})
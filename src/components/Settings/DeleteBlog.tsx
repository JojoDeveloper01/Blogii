import { ConfirmDialog } from "../shared/ConfirmDialog";
import { component$, $, useSignal } from "@builder.io/qwik";
import { deleteBlog } from "@lib/utils";

interface DeleteBlogProps {
    blogId: string;
    lang: string;
}

export const DeleteBlog = component$(({blogId, lang}: DeleteBlogProps) => {
    const errorMessage = useSignal("");
    const isDeleting = useSignal(false);

    const handleDeleteBlog = $(async () => {
        if (!blogId) {
            errorMessage.value = "Could not find blog ID";
            return;
        }
        
        try {
            isDeleting.value = true;
            await deleteBlog(blogId, {
                onSuccess: () => {
                    if (typeof window !== 'undefined') {
                        window.location.href = `/${lang}/`;
                    }
                },
                onError: (error) => {
                    errorMessage.value = error;
                    isDeleting.value = false;
                }
            });
        } catch (error) {
            errorMessage.value = "An unexpected error occurred";
            isDeleting.value = false;
        }
    });

    return (
        <>
            <ConfirmDialog
                id="delete-blog-dialog"
                onConfirm$={handleDeleteBlog}
                title="Delete Blog"
                message="Are you sure you want to delete this blog? All posts and data will be permanently removed. This action cannot be undone."
            />
            {errorMessage.value && (
                <div class="mt-4 p-4 rounded-lg bg-gradient-to-r from-red-700/10 to-red-600/10 border border-red-900/20 text-red-300 flex items-center gap-2 animate-fadeIn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errorMessage.value}
                </div>
            )}
            {isDeleting.value && (
                <div class="fixed inset-0 bg-[--noir-core]/80 backdrop-blur-sm flex items-center justify-center z-50">
                    <div class="bg-[--noir-core] p-6 rounded-xl border border-[--primary]/30 shadow-lg flex flex-col items-center">
                        <div class="w-12 h-12 border-4 border-[--primary]/30 border-t-[--primary] rounded-full animate-spin mb-4"></div>
                        <p class="text-[--blanc-core]">Deleting blog...</p>
                    </div>
                </div>
            )}
        </>
    );
});

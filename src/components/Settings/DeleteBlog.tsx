import { ConfirmDialog } from "../shared/ConfirmDialog";
import { component$, $, useSignal } from "@builder.io/qwik";
import { deleteBlog } from "@lib/utils";

interface DeleteBlogProps {
    blogId: string;
    lang: string;
}

export const DeleteBlog = component$(({blogId, lang}: DeleteBlogProps) => {
    const errorMessage = useSignal("");

    const handleDeleteBlog = $(async () => {
        if (!blogId) {
            errorMessage.value = "Could not find blog ID";
            return;
        }
        await deleteBlog(blogId, {
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
        <>
            <ConfirmDialog
                id="delete-blog-dialog"
                onConfirm$={handleDeleteBlog}
                title="Delete Blog"
                message="Are you sure you want to delete this blog? This action cannot be undone."
            />
            {errorMessage.value && (
                <div class="mt-2 text-red-500 p-2">{errorMessage.value}</div>
            )}
        </>
    );
});

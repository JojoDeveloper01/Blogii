import { component$, useSignal, useVisibleTask$, useOnWindow, $ } from "@builder.io/qwik";
import type { BlogData } from "@lib/types";
import { sanitizeString, deleteBlog } from "@lib/utils";
import { ConfirmDialog } from "./shared/ConfirmDialog";
import { blogDB } from "@services/indexedDB";

export const DynamicBlogList = component$<{ isAuthorized: boolean }>(({ isAuthorized }) => {
    const blogsData = useSignal<BlogData[]>([]);
    const isLoading = useSignal(true);
    const isMounted = useSignal(true);
    const showDeleteConfirm = useSignal(false);
    const errorMessage = useSignal("");

    const hasBlogs = useSignal(false);

    // Carregar blogs
    useVisibleTask$(async ({ cleanup }) => {
        if (!isMounted.value) return;

        try {
            const tempBlog = await blogDB.getTempBlog();
            if (tempBlog && isMounted.value) {
                blogsData.value = [tempBlog];
                hasBlogs.value = true;
            }
        } catch (err) {
            console.error("Erro ao carregar blog:", err);
        } finally {
            if (isMounted.value) {
                isLoading.value = false;
            }
        }

        cleanup(() => {
            isMounted.value = false;
        });
    });

    // Atualizar na navegação
    useOnWindow('navigation-update', $(async () => {
        if (!isMounted.value) return;

        try {
            const tempBlog = await blogDB.getTempBlog();
            if (tempBlog && isMounted.value) {
                blogsData.value = [tempBlog];
            }
        } catch (err) {
            console.error("Erro ao recarregar blog:", err);
        }
    }));

    const handleDelete = $(async () => {
        await deleteBlog({
            onSuccess: () => {
                blogsData.value = [];
                showDeleteConfirm.value = false;
            },
            onError: (error) => {
                errorMessage.value = error;
                showDeleteConfirm.value = false;
            }
        });
    });

    return (
        <div class="relative w-full flex justify-center">
            {hasBlogs.value && (
                <div id="blogsCreated"
                    class="w-full md:w-[90%] lg:w-[80%] xl:w-[70%] p-6 
                           bg-white dark:bg-[var(--gray)] rounded-lg shadow-lg 
                           min-h-[200px] max-h-[500px] overflow-y-auto"
                >
                    <h3 class="mb-6 text-2xl font-bold text-orange-500">
                        {isLoading.value ? 'Carregando blogs...' : 'Blogs Criados:'}
                    </h3>
                    {!isLoading.value && (
                        <ul class="space-y-4">
                            {blogsData.value.map((blog) => {
                                const dialogId = `dialog-${sanitizeString(blog.data.title, 1)}`;
                                return (
                                    <li key={blog.data.title}
                                        class="flex items-center justify-between p-3 rounded-lg transition-colors"
                                    >
                                        <div class="flex items-center space-x-3 flex-1">
                                            <span class="text-orange-400 text-xl">&rarr;</span>
                                            <a href={`blog${isAuthorized ? "" : "/temp"}?id=${sanitizeString(blog.data.title, 1)}&editing=true`}
                                                class="text-lg text-gray-900 hover:text-orange-300 transition-colors duration-200">
                                                {sanitizeString(blog.data.title)}
                                            </a>
                                        </div>
                                        <button
                                            onClick$={() => {
                                                const dialog = document.getElementById(dialogId) as HTMLDialogElement;
                                                dialog?.showModal();
                                            }}
                                            class="text-red-500 hover:text-red-700 p-2"
                                        >
                                            ✕
                                        </button>
                                        <ConfirmDialog
                                            id={dialogId}
                                            onConfirm$={handleDelete}
                                            title="Delete Blog"
                                            message="Are you sure you want to delete this blog? This action cannot be undone."
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {errorMessage.value && (
                <div class="mt-2 text-red-500">
                    {errorMessage.value}
                </div>
            )}
        </div>
    );
});

import { component$, useSignal, useVisibleTask$, useOnWindow, $ } from "@builder.io/qwik";
import type { BlogData } from "@lib/types";
import { sanitizeString } from "@lib/utils";
import { blogDB } from "@services/indexedDB";

export const DynamicBlogList = component$<{ isAuthorized: boolean }>(({ isAuthorized }) => {
    const blogsData = useSignal<BlogData[]>([]);
    const isLoading = useSignal(true);
    const isMounted = useSignal(true);

    // Carregar blogs
    useVisibleTask$(async ({ cleanup }) => {
        if (!isMounted.value) return;

        try {
            const tempBlog = await blogDB.getTempBlog();
            if (tempBlog && isMounted.value) {
                blogsData.value = [tempBlog];
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

    return (
        <div
            id="blogsCreated"
            class="w-3/4 p-4 bg-white dark:bg-[var(--gray)] rounded-lg shadow-lg max-h-64 overflow-y-auto"
            style={{ display: blogsData.value.length > 0 || isLoading.value ? 'block' : 'none' }}
        >
            <h3 class="mb-4 text-lg font-bold text-orange-500">
                {isLoading.value ? 'Carregando blogs...' : 'Blogs Criados:'}
            </h3>
            {!isLoading.value ? (
                <ul class="space-y-2">
                    {blogsData.value.map((blog) => (
                        <li class="flex items-center justify-center space-x-2">
                            <span class="text-orange-400">&rarr;</span>
                            <a
                                href={`blog${isAuthorized ? "" : "/temp"}?id=${sanitizeString(blog.data.title, 1)}&editing=true`}
                                class="text-white dark:text-gray-900 hover:text-orange-300 transition-colors duration-200"
                            >
                                {sanitizeString(blog.data.title)}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <div class="flex justify-center">
                    <div class="animate-pulse w-full h-8 bg-gray-200 rounded"></div>
                </div>
            )}
        </div>
    );
});

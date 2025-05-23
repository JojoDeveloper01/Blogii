import { component$, useSignal, useVisibleTask$, useOnWindow, $ } from "@builder.io/qwik";
import type { BlogData } from "@lib/types";
import { sanitizeString } from "@lib/utils";
import { blogDB } from "@services/indexedDB";

interface DynamicBlogListProps {
    isAuthorized: boolean;
}

export const DynamicBlogList = component$<DynamicBlogListProps>(({ isAuthorized }) => {
    const blogsData = useSignal<BlogData[]>([]);
    const isLoading = useSignal(true);

    useVisibleTask$(async ({ cleanup }) => {
        const controller = new AbortController();
        try {
            const tempBlog = await blogDB.getTempBlog();
            if (tempBlog && !controller.signal.aborted) {
                blogsData.value = [tempBlog];
            }
        } finally {
            isLoading.value = false;
        }
        cleanup(() => controller.abort());
    });

    useOnWindow('navigation-update', $(async () => {
        if (!isLoading.value) {
            const tempBlog = await blogDB.getTempBlog();
            if (tempBlog) blogsData.value = [tempBlog];
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

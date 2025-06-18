import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import type { BlogData, PostData } from "@/lib/types";

interface PostNavigatorProps {
    blogId: string;
    postId: string;
    lang: string;
    blogPosts: BlogData[];
    isPreviewMode: Signal<boolean>;
    isMobile?: boolean;
}

export const PostNavigator = component$<PostNavigatorProps>(({ blogId, postId, lang, blogPosts, isPreviewMode, isMobile = false }) => {
    const isOpen = useSignal(false);
    
    // Use useTask$ to set the initial state based on isMobile
    useTask$(({ track }) => {
        track(() => isMobile);
        if (isMobile) {
            isOpen.value = true;
        }
    });

    return (
        <div class={`relative ${isPreviewMode.value ? 'hidden' : ''} ${isMobile ? 'w-full' : ''}`}>
            {/* Hidden checkbox for toggle - only shown on desktop */}
            {!isMobile && (
                <input
                    type="checkbox"
                    id="sidebar-toggle"
                    class="hidden"
                    checked={isOpen.value}
                    onChange$={(e) => isOpen.value = (e.target as HTMLInputElement).checked}
                />
            )}

            {/* Toggle button - only shown on desktop */}
            {!isMobile && (
                <label
                    for="sidebar-toggle"
                    class="absolute -left-3 top-0 w-7 h-7 bg-white/80 dark:bg-zinc-800/80 shadow-md border border-gray-100/50 dark:border-gray-200/30 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50/90 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 z-10 text-gray-700 dark:text-gray-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class={`transition-transform duration-300 ${isOpen.value ? 'rotate-180' : ''}`}
                    >
                        <polyline points="9 6 15 12 9 18"></polyline>
                    </svg>
                </label>
            )}

            {/* Sidebar/Header content - different styling for mobile vs desktop */}
            <aside class={`
                overflow-hidden transition-all duration-300 rounded-lg shadow-md 
                ${isMobile
                    ? 'w-full opacity-100 border border-gray-100/50 dark:border-gray-800/50 bg-[--blanc-core] dark:bg-[--noir-core]'
                    : isOpen.value
                        ? 'w-64 opacity-100 border border-gray-100/50 dark:border-gray-800/50 bg-[--blanc-core] dark:bg-[--noir-core]'
                        : 'w-0 opacity-0 border-0'
                }
            `}>
                <div class={`p-4 transition-opacity duration-300 ${isOpen.value || isMobile ? 'opacity-100 delay-100' : 'opacity-0'}`}>
                    <div class="flex items-center justify-between ml-3 my-3">
                        <h3 class="text-2xl font-bold text-white m-0">Posts</h3>
                        <a
                            href={`/${lang}/${blogId}/new`}
                            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-md border border-gray-100/20 dark:border-white/10 hover:bg-[--primary] font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>New</span>
                        </a>
                    </div>
                    <div class="space-y-1 border-t border-gray-200/30 dark:border-gray-200/30 pt-3">
                        {/* Current post - displayed first and highlighted */}
                        {blogPosts
                            .flatMap((blogPost: BlogData) => blogPost?.posts || [])
                            .filter((post): post is PostData => post !== null && post !== undefined && post.id === postId)
                            .map((post: PostData) => (
                                <a
                                    key={post?.id}
                                    href={`/${lang}/${blogId}/${post?.id}`}
                                    class="interactive-link block px-3 py-2 text-sm bg-primary-500/20 dark:bg-primary-700/30 text-primary-800 dark:text-gray-300 font-medium shadow-sm transition-colors relative group"
                                >
                                    <div class="flex items-center">
                                        <span class="gradient-underline-active mr-2">{post?.title || 'Untitled Post'}</span>
                                    </div>
                                </a>
                            ))
                        }

                        {/* Other posts */}
                        {blogPosts
                            .flatMap((blogPost: BlogData) => blogPost?.posts || [])
                            .filter((post): post is PostData => post !== null && post !== undefined && post.id !== postId)
                            .map((post: PostData) => (
                                <a
                                    key={post?.id}
                                    href={`/${lang}/${blogId}/${post?.id}`}
                                    class="interactive-link block px-3 py-2 text-sm text-gray-300 relative group"
                                >
                                    <span class="gradient-underline-text">{post?.title || 'Untitled Post'}</span>
                                </a>
                            ))
                        }
                    </div>
                </div>
            </aside>
        </div>
    );
});

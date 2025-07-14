import { component$ } from "@builder.io/qwik";
import type { BlogData, PostData } from "@/lib/types";
import { icons } from "./icons";
import { CreatePostButton } from "@/components/Posts/CreatePostButton";

interface PostNavigatorProps {
    blogId: string;
    postId: string;
    lang: string;
    blogPosts: BlogData[];
    isMobile?: boolean;
    checkPostLimit: string;
}

export const PostNavigator = component$<PostNavigatorProps>(({ blogId, postId, lang, blogPosts, isMobile = false, checkPostLimit }) => {
    return (
        <div class={`relative ${isMobile ? 'w-full' : 'group'}`}>
            {/* Hidden checkbox for toggle - only shown on desktop */}
            {!isMobile && (
                <input
                    type="checkbox"
                    id="sidebar-toggle"
                    class="peer hidden"
                />
            )}

            {/* Toggle button - only shown on desktop */}
            {!isMobile && (
                <label
                    for="sidebar-toggle"
                    class="absolute -left-9 top-2 size-7 bg-white/80 dark:bg-zinc-800/80 shadow-md border border-gray-100/50 dark:border-gray-200/30 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50/90 dark:hover:bg-gray-700/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 z-10 text-gray-700 dark:text-gray-300"
                >
                    <span class="transition-transform duration-300 peer-checked:rotate-180" dangerouslySetInnerHTML={icons.mobileMenu} />
                </label>
            )}

            {/* Sidebar/Header content - different styling for mobile vs desktop */}
            <aside class={`
                overflow-hidden transition-all duration-300 rounded-lg shadow-md 
                ${isMobile
                    ? 'w-full border border-gray-100/50 dark:border-gray-800/50 bg-[--blanc-core] dark:bg-[--noir-core]'
                    : 'peer-checked:w-64 peer-checked:border peer-checked:border-gray-100/50 dark:peer-checked:border-gray-800/50 peer-checked:bg-[--blanc-core] dark:peer-checked:bg-[--noir-core] w-0 border-0'
                }
            `}>
                <div class="p-4">
                    <div class="flex items-center justify-between ml-3 my-3">
                        <h3 class="text-2xl font-bold text-white m-0">Posts</h3>
                        <CreatePostButton blogId={blogId} lang={lang} checkPostLimit={checkPostLimit} />
                    </div>
                    <div class="space-y-1 border-t border-gray-200/30 dark:border-gray-200/30 pt-3">
                        {/* Current post - displayed first and highlighted */}
                        {blogPosts
                            .flatMap((blogPost: BlogData) => blogPost?.posts || [])
                            .filter((post): post is PostData => post !== null && post !== undefined && post.id === postId)
                            .map((post: PostData) => (
                                <a
                                    key={post?.id}
                                    href={`/${lang}/dashboard/${blogId}/${post?.id}`}
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
                                    href={`/${lang}/dashboard/${blogId}/${post?.id}`}
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

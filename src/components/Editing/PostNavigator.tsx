import { component$ } from "@builder.io/qwik";
import type { Signal } from "@builder.io/qwik";
import type { BlogCookieItem } from "@lib/types";

interface PostNavigatorProps {
    blogId: string;
    postId: string;
    lang: string;
    blogPosts: BlogCookieItem[];
    isPreviewMode: Signal<boolean>;
}

export const PostNavigator = component$<PostNavigatorProps>(({ blogId, postId, lang, blogPosts, isPreviewMode }) => {
    return (
        <div class={`relative ${isPreviewMode.value ? 'hidden' : ''}`}>
            {/* Hidden checkbox for toggle */}
            <input type="checkbox" id="sidebar-toggle" class="hidden peer" />
            
            {/* Toggle button */}
            <label 
                for="sidebar-toggle"
                class="absolute -left-3 top-0 w-6 h-6 bg-white shadow rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 peer-checked:rotate-180 transition-transform duration-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </label>

            {/* Sidebar content */}
            <aside class="w-64 bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 peer-checked:w-8 peer-checked:opacity-0">
                <div class="p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-medium text-gray-900">Posts</h3>
                        <a 
                            href={`/${lang}/${blogId}/new`}
                            class="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            title="Create new post"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>New</span>
                        </a>
                    </div>
                    <div class="space-y-1 border-t pt-3">
                        {blogPosts.flatMap((blogPost: { posts: { id: string; title: string }[] }) => blogPost.posts)
                            .sort((a, b) => {
                                if (a.id === postId) return -1;
                                if (b.id === postId) return 1;
                                return 0;
                            })
                            .map((post: { id: string; title: string }) => (
                                <a 
                                    key={post.id}
                                    href={`/${lang}/${blogId}/${post.id}`}
                                    class={`block px-3 py-2 text-sm rounded-md hover:bg-gray-100 ${
                                        post.id === postId ? 'bg-gray-200 font-medium' : ''
                                    }`}
                                >
                                    {post.title || 'Untitled Post'}
                                </a>
                            ))
                        }
                    </div>
                </div>
            </aside>
        </div>
    );
});

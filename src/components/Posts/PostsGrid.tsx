import { component$, $, type Signal } from '@builder.io/qwik';
import type { PostData } from '@/lib/types';
import { DateDisplay } from '../DateDisplay';
import { extractTextFromEditorJS } from '@/lib/editorjs';

interface PostsGridProps {
  posts: PostData[];
  lang: string;
  blogId: string;
  selector?: boolean;
  isAuthorized?: boolean;
  selectedPosts?: Signal<Set<string>>;
}

export const PostsGrid = component$<PostsGridProps>(({ posts, lang, blogId, selector, isAuthorized, selectedPosts }) => {
  const togglePostSelection$ = $(async (postId: string) => {
    const newSelection = new Set(selectedPosts?.value);
    if (newSelection.has(postId)) {
      newSelection.delete(postId);
    } else {
      newSelection.add(postId);
    }
    if (selectedPosts) {
      selectedPosts.value = newSelection;
    }
  });

  return (
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            class={`group relative bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden transition-all duration-200 hover:opacity-90 cursor-pointer`}
          >
            {selector && (
              <div class="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <input
                  type="checkbox"
                  name="selected-posts"
                  value={post.id}
                  checked={selectedPosts?.value.has(post.id)}
                  onChange$={(e) => {
                    e.preventDefault();
                    togglePostSelection$(post.id);
                  }}
                  class="w-4 h-4 text-blue-500 bg-gray-50 border-gray-200 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-colors"
                />
              </div>
            )}
            <div class="p-4">
              <a
                href={`/${lang}/dashboard/${blogId}/${post.id}`}
                class="block w-full"
              >
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {post.created_at && <DateDisplay date={post.created_at} />}
                  </span>
                  <span class={`px-2 py-1 text-xs rounded-full font-medium ${post.status === 'published'
                    ? 'bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400'
                    : 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                    {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {post.title}
                </h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {post.description || extractTextFromEditorJS(post.content || '').slice(0, 100)}...
                </p>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

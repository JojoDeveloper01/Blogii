import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { PostData } from '@/lib/types';

interface PostsActionBarProps {
  blogId: string;
  posts: PostData[];
  lang: string;
  isAuthorized: boolean;
}

export const PostsActionBar = component$<PostsActionBarProps>(({ blogId, posts, lang, isAuthorized }) => {
  const selectedCount = useSignal(0);

  // Escutar eventos de seleção de posts
  useVisibleTask$(() => {
    const handlePostsSelected = (e: CustomEvent) => {
      selectedCount.value = e.detail.count;
    };

    document.addEventListener('postsSelected', handlePostsSelected as EventListener);
    return () => {
      document.removeEventListener('postsSelected', handlePostsSelected as EventListener);
    };
  });

  return (
    <div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-300">
          {selectedCount.value} posts selected
        </span>
        
        <div class="flex gap-2">
          {isAuthorized && (
            <>
              <button
                class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
                onClick$={() => {
                  // Implementar lógica de exclusão em lote
                  console.log('Delete selected posts');
                }}
              >
                Delete Selected
              </button>
              <button
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 rounded-lg transition-colors duration-200"
                onClick$={() => {
                  // Implementar lógica de exportação em lote
                  console.log('Export selected posts');
                }}
              >
                Export Selected
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

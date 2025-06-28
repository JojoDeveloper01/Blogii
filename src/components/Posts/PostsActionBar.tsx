import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import type { Signal } from '@builder.io/qwik';
import type { PostData } from '@/lib/types';
import { actions } from 'astro:actions';

interface PostsActionBarProps {
  blogId: string;
  posts: PostData[];
  lang: string;
  isAuthorized: boolean;
  selectedPosts: Signal<Set<string>>;
}

export const PostsActionBar = component$<PostsActionBarProps>(({ posts, blogId, lang, isAuthorized, selectedPosts }) => {
  const selectedCount = selectedPosts.value.size;

  const handleDelete$ = $(async (blogId: string, postIds: string[]) => {
    if (!confirm('Tem certeza que deseja apagar os posts selecionados?')) {
      return;
    }

    try {
      const result = await actions.post.delete({
        blogId,
        postIds: Array.from(selectedPosts.value)
      });

      if (result?.data?.success) {
        selectedPosts.value.clear();
        window.location.reload();
        return true;
      }

      throw new Error('Erro ao apagar posts');
    } catch (error) {
      console.error('Falha ao apagar posts:', error);
      alert('Erro ao apagar posts. Por favor, tente novamente.');
      return false;
    }
  });

  return (
    <div class="flex justify-between items-center p-2 rounded-lg shadow-md">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {selectedCount} {selectedCount === 1 ? 'item' : 'itens'} selecionados
          </span>
          <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          onClick$={() => handleDelete$(blogId, Array.from(selectedPosts.value))}
          class="px-6 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          <span class="flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </span>
        </button>
      </div>
    </div>
  );
});

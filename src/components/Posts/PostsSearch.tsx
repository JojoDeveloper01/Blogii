import { component$, useSignal, useTask$ } from '@builder.io/qwik';
import { icons } from '../Editing/icons';
import type { PostData } from '@/lib/types';

interface PostsSearchProps {
  posts: PostData[];
  onSearch$: (filteredPosts: PostData[]) => void;
}

export const PostsSearch = component$<PostsSearchProps>(({ posts, onSearch$ }) => {
  const searchTerm = useSignal('');
  const statusFilter = useSignal('all');
  const sortBy = useSignal('newest');

  // Filtrar e ordenar posts quando os filtros mudarem
  useTask$(({ track }) => {
    // Track changes in search inputs
    track(() => searchTerm.value);
    track(() => statusFilter.value);
    track(() => sortBy.value);

    // Create a new array to avoid proxy issues
    const postsCopy = [...posts];

    // Se não houver termo de busca, usa todos os posts
    const search = searchTerm.value.toLowerCase().trim();
    let filtered = search
      ? postsCopy.filter(post => post.title.toLowerCase().includes(search))
      : [...postsCopy]; // Cria uma nova cópia para evitar problemas com proxy

    // Depois filtra por status se necessário
    if (statusFilter.value !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter.value);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy.value) {
        case 'oldest':
          return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
        case 'updated':
          return new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime();
        case 'newest':
        default:
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
    });

    onSearch$(filtered);
  });

  return (
    <div class="flex flex-col sm:flex-row gap-4">
      {/* Barra de pesquisa */}
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span 
            class="text-gray-500 dark:text-gray-400" 
            dangerouslySetInnerHTML={icons.search}
          />
        </div>
        <input
          type="search"
          value={searchTerm.value}
          onInput$={(e) => searchTerm.value = (e.target as HTMLInputElement).value}
          class="block w-full pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/20 dark:border-gray-700/20 focus:ring-2 focus:ring-[--primary]/20 focus:border-[--primary]/30 transition-all duration-200"
          placeholder="Search posts..."
        />
      </div>

      {/* Filtros */}
      <div class="flex gap-2">
        {/* Status */}
        <select
          value={statusFilter.value}
          onChange$={(e) => statusFilter.value = (e.target as HTMLSelectElement).value}
          class="px-3 py-2 text-sm text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/20 dark:border-gray-700/20 focus:ring-2 focus:ring-[--primary]/20 focus:border-[--primary]/30 transition-all duration-200"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        {/* Data */}
        <select
          value={sortBy.value}
          onChange$={(e) => sortBy.value = (e.target as HTMLSelectElement).value}
          class="px-3 py-2 text-sm text-gray-900 dark:text-white bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200/20 dark:border-gray-700/20 focus:ring-2 focus:ring-[--primary]/20 focus:border-[--primary]/30 transition-all duration-200"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="updated">Last Updated</option>
        </select>
      </div>
    </div>
  );
});

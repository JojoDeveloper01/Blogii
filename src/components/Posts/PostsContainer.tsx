import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { PostsSearch } from './PostsSearch';
import { PostsGrid } from './PostsGrid';
import { PostsActionBar } from './PostsActionBar';
import type { PostData } from '@/lib/types';

interface PostsContainerProps {
  posts: PostData[];
  lang: string;
  blogId: string;
  selector?: boolean;
  isAuthorized?: boolean;
}

export const PostsContainer = component$<PostsContainerProps>(({ posts: initialPosts, lang, blogId, selector, isAuthorized = false }) => {
  // Store compartilhado entre PostsSearch e PostsGrid
  const allPosts = useSignal<PostData[]>([...initialPosts]);
  const filteredPosts = useSignal<PostData[]>([...initialPosts]);
  const containerRef = useSignal<Element>();
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

  // Configurar observador para ajustar posição da barra de ações
  useVisibleTask$(() => {
    if (!containerRef.value) return;

    const observer = new ResizeObserver(() => {
      if (!containerRef.value) return;
      const rect = containerRef.value.getBoundingClientRect();
      const actionBar = containerRef.value.querySelector('.action-bar') as HTMLElement;
      if (actionBar) {
        actionBar.style.width = `${rect.width}px`;
      }
    });

    observer.observe(containerRef.value);
    return () => observer.disconnect();
  });

  return (
    <div class="relative" ref={containerRef}>
      <div class="flex flex-col gap-4 mt-4 pb-16"> {/* Espaço para a barra de ações */}
        <PostsSearch 
          posts={allPosts.value} 
          onSearch$={(filtered) => {
            filteredPosts.value = filtered;
          }}
        />
        
        <PostsGrid
          posts={filteredPosts.value}
          lang={lang}
          blogId={blogId}
          selector={selector}
        />
      </div>

      {/* Barra de ações com posição sticky */}
      <div 
        class={`action-bar sticky bottom-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/20 dark:border-gray-700/20 px-4 py-2 mt-4 transition-all duration-300 ${selectedCount.value === 0 ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}
      >
        <PostsActionBar
          blogId={blogId}
          posts={allPosts.value}
          lang={lang}
          isAuthorized={isAuthorized}
        />
      </div>
    </div>
  );
});

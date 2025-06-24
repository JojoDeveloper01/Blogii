import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import type { PostData } from '@/lib/types';
import { DateDisplay } from '../DateDisplay';
import { extractTextFromEditorJS } from '@/lib/editorjs';

interface PostsGridProps {
  posts: PostData[];
  lang: string;
  blogId: string;
  selector?: boolean;
}

export const PostsGrid = component$<PostsGridProps>(({ posts, lang, blogId, selector }) => {
  const selectedPosts = useSignal<Set<string>>(new Set());

  // Gerenciar seleção de posts
  const togglePostSelection$ = $((postId: string) => {
    const newSet = new Set(selectedPosts.value);
    if (newSet.has(postId)) {
      newSet.delete(postId);
    } else {
      newSet.add(postId);
    }
    selectedPosts.value = newSet;

    // Disparar evento para atualizar a barra de ações
    const event = new CustomEvent('postsSelected', {
      detail: { count: selectedPosts.value.size }
    });
    document.dispatchEvent(event);
  });

  return (
    <div class="flex flex-wrap gap-4">
      {posts.map((post) => (
        <div 
          key={post.id}
          class="group relative w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] min-w-[280px] max-w-[17rem]"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
          
          <article class="h-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-200/10 dark:border-gray-700/10 overflow-hidden hover:border-[--primary]/30 transition-all duration-200">
            {selector && (
              <label class="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div class="relative inline-block">
                  <input
                    type="checkbox"
                    name="selected-posts"
                    value={post.id}
                    checked={selectedPosts.value.has(post.id)}
                    onChange$={() => togglePostSelection$(post.id)}
                    class="peer sr-only"
                  />
                  <div class="w-5 h-5 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-2 border-gray-300/50 dark:border-gray-600/50 rounded transition-all duration-200 peer-checked:bg-[--primary] peer-checked:border-[--primary] peer-hover:border-[--primary]/50">
                    <svg
                      class="w-full h-full text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </label>
            )}
            
            <a href={`/${lang}/dashboard/${blogId}/${post.id}`} class="block p-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {post.title || "Untitled Post"}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {extractTextFromEditorJS(post.content || '')}
              </p>
              <div class="mt-3">
                {post.created_at && (
                  <DateDisplay date={post.created_at} />
                )}
              </div>
            </a>
          </article>
        </div>
      ))}
    </div>
  );
});

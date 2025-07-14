import { component$, $, useComputed$, useSignal, type Signal } from '@builder.io/qwik';
import type { PostData } from '@/lib/types';
import { actions } from 'astro:actions';
import { icons } from '@/components/Editing/icons';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface PostsActionBarProps {
  blogId: string;
  lang: string;
  selectedPosts: Signal<Set<string>>;
  posts: PostData[];
  blogStatus?: string;
}

export const PostsActionBar = component$<PostsActionBarProps>(({ blogId, lang, selectedPosts, posts, blogStatus }) => {
  const showPublishConfirm = useSignal(false);
  const selectedCount = selectedPosts.value.size;

  // Compute status counts of selected posts
  const statusInfo = useComputed$(() => {
    const selectedPostsData = posts.filter(post => selectedPosts.value.has(post.id));
    const draftCount = selectedPostsData.filter(post => post.status === 'draft').length;
    const publicCount = selectedPostsData.filter(post => post.status === 'published').length;

    // If all selected posts are draft, show 'published' as next action
    // If all selected posts are published, show 'draft' as next action
    // If mixed, show the action that will affect more posts
    const nextAction = draftCount >= publicCount ? 'published' : 'draft';

    return {
      draftCount,
      publicCount,
      nextAction,
      actionLabel: nextAction === 'published' ? 'Publish' : 'Unpublish'
    };
  });

  const handleDelete$ = $(async (blogId: string) => {
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

  const handlePublishBlog$ = $(async (blogId: string) => {
    try {
      const result = await actions.blog.updateStatus({
        blogId,
        status: 'published',
        lang,
        postsIds: []
      });

      if (result?.data?.success) {
        return true;
      }
      throw new Error('Failed to publish blog');
    } catch (error) {
      console.error('Failed to publish blog:', error);
      return false;
    }
  });

  const handleSwitchStatus$ = $(async (blogId: string, status: string) => {
    try {
      const result = await actions.post.updateStatus({
        blogId,
        postIds: Array.from(selectedPosts.value),
        status,
        lang
      });

      if (result?.data?.success) {
        selectedPosts.value.clear();
        window.location.reload();
        return true;
      }

      throw new Error('Erro ao mudar o status dos posts');
    } catch (error) {
      console.error('Falha ao mudar o status dos posts:', error);
      alert('Erro ao mudar o status dos posts. Por favor, tente novamente.');
      return false;
    }
  });

  const handlePostStatusToggle$ = $(() => {
    // Only update posts that need to change
    const postsToUpdate = posts
      .filter(post => selectedPosts.value.has(post.id))
      .filter(post => {
        // Se o próximo status é 'published', filtra posts que não são published
        // Se o próximo status é 'draft', filtra posts que não são draft
        if (statusInfo.value.nextAction === 'published') {
          return post.status !== 'published';
        } else {
          return post.status !== 'draft';
        }
      })
      .map(post => post.id);

    if (postsToUpdate.length > 0) {
      // Se estamos tentando publicar posts e o blog não está publicado
      if (statusInfo.value.nextAction === 'published' && blogStatus !== 'published') {
        showPublishConfirm.value = true;
        const dialog = document.getElementById('publish-confirm-dialog') as HTMLDialogElement;
        if (dialog) dialog.showModal();
      } else {
        // Blog já está publicado ou estamos despublicando posts
        handleSwitchStatus$(blogId, statusInfo.value.nextAction);
      }
    }
  });

  const handlePublishConfirmation$ = $(async () => {
    const blogPublished = await handlePublishBlog$(blogId);
    if (blogPublished) {
      await handleSwitchStatus$(blogId, statusInfo.value.nextAction);
    } else {
      console.error("Failed to publish blog. Please try again.");
    }
    showPublishConfirm.value = false;
    (document.getElementById('publish-confirm-dialog') as HTMLDialogElement)?.close();
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
          onClick$={handlePostStatusToggle$}
          class="px-3 py-2 text-sm font-medium text-white bg-[--primary] hover:bg-[--primary]/80 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          title={`${statusInfo.value.draftCount} drafts, ${statusInfo.value.publicCount} published`}>
          <span class="flex items-center gap-2">
            <span dangerouslySetInnerHTML={icons.refresh} />
            <span>{statusInfo.value.actionLabel}</span>
          </span>
        </button>
        <button
          onClick$={() => handleDelete$(blogId)}
          class="px-6 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
        >
          <span class="flex items-center gap-2">
            <span dangerouslySetInnerHTML={icons.delete} />
            Delete
          </span>
        </button>
      </div>

      <ConfirmDialog
        id="publish-confirm-dialog"
        title="Publish Blog"
        message="This blog is not published yet. Would you like to publish the blog and these posts?"
        avaliableIcon={true}
      >
        <button
          onClick$={handlePublishConfirmation$}
          class="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          Yes, publish
        </button>
      </ConfirmDialog>
    </div>
  );
});

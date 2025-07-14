import { component$, useSignal, useVisibleTask$, $, useTask$, useOnDocument } from "@builder.io/qwik";
import EditorJS from "@editorjs/editorjs";
import { EditorContent } from "./EditorContent";
import { PostNavigator } from "./PostNavigator";
import { createNewPost } from "./editorConfig";
import type { BlogData } from "@/lib/types";
import { localBlogDB } from "@/services/indexedDB";
import { actions } from "astro:actions";

interface EditorProps {
    isNewPost: boolean;
    blog: BlogData;
    blogPosts: BlogData[];
    editing: string;
    lang: string;
    isAuthorized: boolean;
    checkPostLimit: string;
}

export const Editor = component$<EditorProps>(({ isNewPost, blog, blogPosts, lang, isAuthorized, checkPostLimit }) => {

    const showSaveSuccess = useSignal(false);
    const post = blog.posts?.[0];

    // Create a fetch function that knows which blog to fetch
    const fetchBlog = $(async () => {
        if (isAuthorized) {
            try {
                const { data } = await actions.blog.get({ blogId: blog.id });
                if (data) return data;
            } catch (error) {
                console.warn('Falha ao buscar do DB:', error);
            }
        }
        const blogData = await localBlogDB.getBlog(blog.id);
        if (!blogData) throw new Error("Blog não encontrado");
        return blogData;
    });

    useVisibleTask$(async () => {
        // If this is a new post, initialize it in IndexedDB
        if (isNewPost && blog.id && post?.id) {
            await createNewPost(
                blog.id,
                post.id,
                post.title
            );
        }
    });

    useOnDocument('keydown', $((event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            handleSave();
        }
    }));

    const handleSave = $(async () => {
        showSaveSuccess.value = true;
        setTimeout(() => {
            showSaveSuccess.value = false;
        }, 2000);
    });

    return (
        <div class="flex flex-col gap-2">
            {/* Breadcrumb path */}

            {/* <EditorToolbar editor={editor} /> */}

            {/* Área de conteúdo principal */}
            <div class="flex flex-col gap-4 bg-[--bg-color] rounded-lg">
                {/* Mobile layout - PostNavigator acima do editor */}
                <div class="block md:hidden mb-4">
                    <PostNavigator
                        blogId={blog?.id}
                        postId={String(post?.id)}
                        lang={lang}
                        blogPosts={blogPosts}
                        isMobile={true}
                        checkPostLimit={checkPostLimit}
                    />
                </div>

                {/* Desktop layout - Editor e PostNavigator lado a lado */}
                <div class="flex gap-4 flex-col md:flex-row">
                    {/* Editor principal */}
                    <div class="flex-1">
                        <div class="p-4">
                            <EditorContent
                                blog={blog}
                                fetchBlog={fetchBlog}
                                onSave={handleSave}
                                isAuthorized={isAuthorized}
                            />
                        </div>
                    </div>

                    {/* Navegador de posts lateral (apenas desktop) */}
                    <div class="w-auto hidden md:block">
                        <div class="sticky top-4">
                            <PostNavigator
                                blogId={blog.id}
                                postId={String(post?.id)}
                                lang={lang}
                                blogPosts={blogPosts}
                                isMobile={false}
                                checkPostLimit={checkPostLimit}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

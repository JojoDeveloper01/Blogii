import { defineAction } from "astro:actions";
import { z } from "astro:schema";
/* import { createBlog } from "@/lib/utils";
import * as path from 'path';
import * as fs from 'fs/promises';
*/
import { supabase } from "@/lib/supabase";
import { checkUserHasBlogs, createBlogFromTemp } from "@/lib/utilsDB";
import { updateBlogTitleInDB, updatePostTitleInDB, getBlogWithPosts, deletePostFromDB, deleteBlogByUserId, updatePostContentInDB, createBlog } from "@/lib/utilsDB";
import type { Provider } from '@supabase/supabase-js';

class ActionError extends Error {
    constructor(public message: string, public code?: string) {
        super(message);
    }
}

export const server = {
    post: {
        updateTitle: defineAction({
            input: z.object({
                blogId: z.string(),
                postId: z.string(),
                title: z.string(),
            }),
            handler: async ({ blogId, postId, title }) => {
                const result = await updatePostTitleInDB(blogId, postId, title);
                if (!result.success) {
                    throw new ActionError(
                        `Falha ao atualizar título: ${result.error || 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }
                return result;
            },
        }),
        updateContent: defineAction({
            input: z.object({
                blogId: z.string(),
                postId: z.string(),
                content: z.string(),
            }),
            handler: async ({ blogId, postId, content }) => {
                const result = await updatePostContentInDB(blogId, postId, content);
                if (!result.success) {
                    throw new ActionError(
                        `Falha ao atualizar conteúdo: ${result.error || 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }
                return result;
            },
        }),
        delete: defineAction({
            input: z.object({
                blogId: z.string(),
                postId: z.string(),
            }),
            handler: async ({ blogId, postId }) => {
                const result = await deletePostFromDB(blogId, postId);
                if (!result.success) {
                    throw new ActionError(
                        `Falha ao apagar post: ${result.error || 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }
                return result;
            },
        }),
    },

    blog: {
        create: defineAction({
            input: z.object({
                blogData: z.object({
                    id: z.string(),
                    title: z.string(),
                    user_id: z.string().optional(),
                    created_at: z.string().transform((str) => new Date(str)),
                    posts: z.array(z.object({
                        id: z.string(),
                        title: z.string(),
                        blog_id: z.string(),
                        content: z.string(),
                        created_at: z.string().transform((str) => new Date(str))
                    }))
                })
            }),
            handler: async ({ blogData }) => {
                try {
                    const result = await createBlog(blogData);
                    if (!result.success) {
                        throw new ActionError(
                            `Falha ao criar blog: ${result.error || 'Erro desconhecido'}`,
                            'DATABASE_ERROR'
                        );
                    }
                    return { success: true, data: result.data };
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        throw new ActionError(error.errors[0].message, "BAD_REQUEST");
                    }
                    throw new ActionError(error instanceof Error ? error.message : "Unknown error occurred", "INTERNAL_SERVER_ERROR");
                }
            }
        }),
        updateTitle: defineAction({
            input: z.object({
                blogId: z.string(),
                title: z.string(),
            }),
            handler: async ({ blogId, title }) => {
                try {
                    // Use the utility function to update the blog title in the database
                    const { success, error } = await updateBlogTitleInDB(blogId, title);

                    if (!success) {
                        console.error('[ACTION] Erro ao atualizar título do blog:', error);
                        throw new ActionError(`Falha ao atualizar título: ${error || 'Erro desconhecido'}`, 'DATABASE_ERROR');
                    }

                    return { success: true };
                } catch (error: any) {
                    console.error('[ACTION] Erro ao atualizar título do blog:', error);
                    throw new ActionError(
                        error instanceof Error ? error.message : 'Erro desconhecido ao atualizar título',
                        'INTERNAL_SERVER_ERROR'
                    );
                }
            }
        }),
        get: defineAction({
            input: z.object({
                blogId: z.string(),
            }),
            handler: async ({ blogId }) => {
                try {
                    const data = await getBlogWithPosts(blogId);

                    if (!data) {
                        throw new ActionError('Blog não encontrado', 'DATABASE_ERROR');
                    }

                    return data;
                } catch (error: any) {
                    throw new ActionError(
                        error instanceof Error ? error.message : 'Erro desconhecido ao buscar blog',
                        'INTERNAL_SERVER_ERROR'
                    );
                }
            }
        }),
        delete: defineAction({
            input: z.object({
                blogId: z.string(),
                userId: z.string(),
            }),
            handler: async ({ blogId, userId }) => {
                console.log(blogId, userId);
                const result = await deleteBlogByUserId(blogId, userId);
                console.log(result);
                if (!result.success) {
                    throw new ActionError(
                        `Falha ao apagar blog: ${result.error || 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }
                return result;
            },
        }),
    },

    auth: {
        signInWithOAuth: defineAction({
            input: z.object({
                provider: z.enum(['google', 'facebook', 'azure']) as z.ZodType<Provider>,
            }),
            handler: async ({ provider }) => {
                try {
                    // Iniciar o fluxo de autenticação OAuth
                    const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
                        provider,
                        options: {
                            redirectTo: `${import.meta.env.SITE_URL}/api/auth/callback`,
                        }
                    });

                    if (authError) {
                        console.error('[ACTION] Erro no login OAuth:', authError);
                        throw authError;
                    }

                    return { success: true, url: authData.url };
                } catch (error: any) {
                    console.error('[ACTION] Falha no login:', error);
                    throw new ActionError(`Falha no login: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                }
            }
        }),

        signOut: defineAction({
            handler: async () => {
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                    return { success: true, redirectTo: '/' };
                } catch (error: any) {
                    console.error('Failed to sign out:', error);
                    throw new ActionError('Failed to sign out');
                }
            }
        })
    },

    /*
    sendBlogData: defineAction({
            input: baseBlogData,
            handler: async (input) => {
                try {
                    await createBlog(input, path, fs);
                    return { success: true };
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        throw new ActionError(error.errors[0].message, "BAD_REQUEST");
                    }
                    throw new ActionError(error instanceof Error ? error.message : "Unknown error occurred", "INTERNAL_SERVER_ERROR");
                }
            }
        }),
    */

    cleanCache: defineAction({
        input: z.object({
            collection: z.literal("blog").optional()
        }),
        handler: async ({ collection }) => {
            try {
                /* const blogs = await getCollection(collection || "blog");
                return { success: true, blogs }; */
            } catch (error: any) {
                throw new ActionError(error.message, "INTERNAL_SERVER_ERROR");
            }
        }
    })
}
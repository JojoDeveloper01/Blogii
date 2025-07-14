import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { supabase } from "@/lib/supabase";
import { checkUserHasBlogs, createBlogFromTemp, updateBlogDescription, updateBlogTitleInDB, updatePostTitleInDB, getBlogWithPosts, deletePostFromDB, deleteBlogByUserId, updatePostContentInDB, createBlog, updateBlogStatus, updateBlogTheme, updateUser, checkEmailExists, deleteUser, updatePostStatus, getUserPlan, getUserBlogsCount, getBlogPostsCount } from "@/lib/utilsDB";
import type { Provider } from '@supabase/supabase-js';
import { sanitizeString } from "@/lib/utils";
import type { UserInfo } from "@/lib/types";

/* import { createBlog } from "@/lib/utils";
import * as path from 'path';
import * as fs from 'fs/promises';
*/
class ActionError extends Error {
    constructor(public message: string, public code?: string) {
        super(message);
    }
}
const userInfoSchema = z.object({
    id: z.string(),
    email: z.string().email({ message: "Must be a valid email address" }).optional(),
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }).max(30, { message: "Name must be no longer than 30 characters" }).optional(),
    avatar_url: z.string().url({ message: "Must be a valid URL" }).optional(),
    bio: z.string().max(100, { message: "Bio must be no longer than 100 characters" }).optional(),
    website: z.string().url({ message: "Must be a valid URL" }).optional(),
    social_links: z.record(z.string(), z.string().url({ message: "Must be a valid URL" })).optional(),
    location: z.string().min(3, { message: "Location must be at least 3 characters long" }).max(30, { message: "Location must be no longer than 30 characters" }).optional(),
    skills: z.array(z.string().min(2, { message: "Skills must be at least 2 characters long" }).max(20, { message: "Skills must be no longer than 20 characters" })).optional(),
});

export const server = {
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

    user: {
        validateUserField: defineAction({
            input: z.object({
                value: z.any().optional(),
                field: z.enum(["name", "email", "avatar_url", "bio", "website", "social_links", "location", "skills"]),
            }),
            handler: async ({ field, value }) => {
                try {
                    //console.log("field, value: ", field, value)

                    // Valida o valor com base no campo específico
                    const validationSchemas: Record<string, z.ZodSchema> = {
                        name: userInfoSchema.shape.name,
                        email: userInfoSchema.shape.email,
                        avatar_url: userInfoSchema.shape.avatar_url,
                        bio: userInfoSchema.shape.bio,
                        website: userInfoSchema.shape.website,
                        social_links: userInfoSchema.shape.social_links,
                        location: userInfoSchema.shape.location,
                        skills: userInfoSchema.shape.skills,
                    };

                    if (!validationSchemas.hasOwnProperty(field)) {
                        throw new ActionError(
                            `Field "${field}" is not supported for validation.`,
                            'BAD_REQUEST'
                        );
                    }

                    // Executa a validação
                    validationSchemas[field].parse(value);

                    return { valid: true };
                } catch (error) {
                    if (error instanceof z.ZodError) {
                        return {
                            valid: false,
                            message: error.errors[0].message,
                        };
                    }
                    throw error;
                }
            },
        }),
        updateUser: defineAction({
            input: userInfoSchema,
            handler: async (input) => {

                try {
                    const updates: UserInfo = input;
                    if (input.name) updates.name = input.name;
                    if (input.avatar_url) updates.avatar_url = input.avatar_url;
                    if (input.bio) updates.bio = input.bio;
                    if (input.website) updates.website = input.website;
                    if (input.social_links) updates.social_links = input.social_links;
                    if (input.location) updates.location = input.location;
                    if (input.skills) updates.skills = input.skills;

                    // Verificar se o email já existe
                    if (input.email && input.email !== updates.email) {
                        const emailExists = await checkEmailExists(input.email);
                        if (emailExists) {
                            throw new ActionError('Email already exists');
                        }
                    }

                    // Atualizar o usuário
                    const { error: updateError } = await updateUser({
                        id: input.id,
                        email: input.email,
                        name: input.name,
                        avatar_url: input.avatar_url,
                        bio: input.bio,
                        website: input.website,
                        social_links: input.social_links,
                        location: input.location,
                        skills: input.skills,
                    });

                    if (updateError) {
                        throw new ActionError(
                            "An unexpected error occurred.",
                            'INTERNAL_SERVER_ERROR'
                        );
                    }
                } catch (error: any) {
                    throw new ActionError(
                        "An unexpected error occurred.",
                        'INTERNAL_SERVER_ERROR'
                    );
                }
            },
        }),
        deleteUser: defineAction({
            input: z.object({
                id: z.string(),
            }),
            handler: async ({ id }) => {
                try {
                    const { error } = await deleteUser(id);
                    if (error) throw error;
                    return { success: true };
                } catch (error: any) {
                    console.error('Failed to delete user:', error);
                    throw new ActionError('Failed to delete user');
                }
            },
        }),
        getUserPlan: defineAction({
            input: z.object({
                userId: z.string(),
            }),
            handler: async ({ userId }) => {
                try {
                    const plan = await getUserPlan(userId);
                    return plan;
                } catch (error) {
                    console.error('Failed to get user plan:', error);
                    throw new ActionError('Failed to get user plan');
                }
            },
        }),
        getUserBlogsCount: defineAction({
            input: z.object({
                userId: z.string(),
            }),
            handler: async ({ userId }) => {
                try {
                    const count = await getUserBlogsCount(userId);
                    return count;
                } catch (error) {
                    console.error('Failed to get user blogs count:', error);
                    throw new ActionError('Failed to get user blogs count');
                }
            },
        }),
        getBlogPostsCount: defineAction({
            input: z.object({
                blogId: z.string(),
            }),
            handler: async ({ blogId }) => {
                try {
                    const count = await getBlogPostsCount(blogId);
                    return count;
                } catch (error) {
                    console.error('Failed to get blog posts count:', error);
                    throw new ActionError('Failed to get blog posts count');
                }
            },
        }),
    },

    theme: {
        update: defineAction({
            input: z.object({
                blogId: z.string(),
                theme: z.string(),
            }),
            handler: async ({ blogId, theme }) => {
                try {
                    await updateBlogTheme(blogId, theme);
                    return { success: true };
                } catch (error) {
                    throw new ActionError(
                        `Falha ao atualizar tema: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }
            },
        }),
    },

    blog: {
        create: defineAction({
            input: z.object({
                blogData: z.object({
                    id: z.string(),
                    title: z.string(),
                    title_sanitized: z.string(),
                    user_id: z.string().optional(),
                    created_at: z.string().transform((str) => new Date(str)),
                    posts: z.array(z.object({
                        id: z.string(),
                        title: z.string(),
                        title_sanitized: z.string(),
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
        updateTitle: defineAction({
            input: z.object({
                blogId: z.string(),
                title: z.string(),
                title_sanitized: z.string(),
            }),
            handler: async ({ blogId, title, title_sanitized }) => {
                try {
                    // Use the utility function to update the blog title in the database
                    const { success, error } = await updateBlogTitleInDB(blogId, title, title_sanitized);

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
        updateDescription: defineAction({
            input: z.object({
                blogId: z.string(),
                description: z.string(),
            }),
            handler: async ({ blogId, description }) => {
                try {
                    await updateBlogDescription(blogId, description);
                    return { success: true };
                } catch (error) {
                    throw new ActionError(
                        `Falha ao atualizar descrição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }
            },
        }),
        updateStatus: defineAction({
            input: z.object({
                blogId: z.string(),
                postsIds: z.array(z.string()).optional(),
                status: z.string(),
                lang: z.string().optional(),
            }),
            handler: async ({ blogId, postsIds, status, lang }) => {

                const result = await updateBlogStatus(blogId, status, postsIds);
                if (!result.success) {
                    throw new ActionError(
                        `Falha ao publicar blog: ${result.error || 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }

                const blog = await getBlogWithPosts(blogId);

                return lang ?
                    { success: true, redirectTo: `/${lang}/${blog.title_sanitized}` }
                    :
                    { success: true };
            },
        }),
        delete: defineAction({
            input: z.object({
                blogId: z.string(),
                userId: z.string(),
            }),
            handler: async ({ blogId, userId }) => {
                const result = await deleteBlogByUserId(blogId, userId);
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

    post: {
        updateTitle: defineAction({
            input: z.object({
                blogId: z.string(),
                postId: z.string(),
                title: z.string(),
                title_sanitized: z.string(),
            }),
            handler: async ({ blogId, postId, title, title_sanitized }) => {
                const result = await updatePostTitleInDB(blogId, postId, title, title_sanitized);
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

        updateStatus: defineAction({
            input: z.object({
                blogId: z.string(),
                postIds: z.array(z.string()),
                status: z.string(),
                lang: z.string(),
            }),
            handler: async ({ blogId, postIds, status, lang }) => {
                const result = await updatePostStatus(blogId, status, postIds);
                if (!result.success) {
                    throw new ActionError(
                        `Falha ao publicar blog: ${result.error || 'Erro desconhecido'}`,
                        'DATABASE_ERROR'
                    );
                }

                return { success: true };
            },
        }),

        delete: defineAction({
            input: z.object({
                blogId: z.string(),
                postIds: z.array(z.string()),
            }),
            handler: async ({ blogId, postIds }) => {
                const results = await Promise.all(
                    postIds.map(postId => deletePostFromDB(blogId, postId))
                );

                // Check for any failures
                const failed = results.some(result => !result.success);
                if (failed) {
                    throw new ActionError(
                        'Falha ao apagar alguns posts',
                        'DATABASE_ERROR'
                    );
                }

                return { success: true, message: 'Posts apagados com sucesso' };
            },
        }),
    },
}
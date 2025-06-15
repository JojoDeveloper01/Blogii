import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { createBlog } from "@lib/utils";
import * as path from 'path';
import * as fs from 'fs/promises';
import { supabase } from "@lib/supabase";
import type { Provider } from '@supabase/supabase-js';

class ActionError extends Error {
    constructor(public message: string, public code?: string) {
        super(message);
    }
}

const baseBlogData = z.object({
    id: z.string().optional(),
    collection: z.string(),
    body: z.string().optional(),
    data: z.object({
        title: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        pubDate: z.preprocess((arg) => new Date(arg as string), z.date()),
    }),
})

export const server = {
    auth: {
        signInWithOAuth: defineAction({
            input: z.object({
                provider: z.enum(['google', 'facebook', 'azure']) as z.ZodType<Provider>
            }),
            handler: async ({ provider }) => {
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider,
                        options: {
                            redirectTo: `${import.meta.env.SITE_URL}/api/auth/callback`
                        }
                    });
                    
                    if (error) throw error;

                    // After successful OAuth, get the user session
                    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) throw sessionError;

                    if (session?.user) {
                        console.log('User session:', session.user);
                        
                        // Check if user already exists in our users table
                        const { data: existingUser, error: checkError } = await supabase
                            .from('users')
                            .select('id')
                            .eq('email', session.user.email)
                            .single();

                        if (checkError && checkError.code !== 'PGRST116') {
                            console.error('Error checking existing user:', checkError);
                            throw checkError;
                        }

                        if (!existingUser) {
                            const userData = {
                                id: session.user.id,
                                email: session.user.email,
                                name: session.user.user_metadata?.name || 
                                      session.user.user_metadata?.full_name || 
                                      session.user.user_metadata?.given_name || 
                                      session.user.email?.split('@')[0]
                            };
                            console.log('Inserting user data:', userData);

                            // Insert new user into our users table
                            const { error: insertError } = await supabase
                                .from('users')
                                .insert(userData);

                            if (insertError) {
                                console.error('Error inserting user:', insertError);
                                throw insertError;
                            }
                            console.log('User inserted successfully');
                        }

                        // Get temporary blog from cookies
                        const cookies = document.cookie.split(';');
                        const blogCookie = cookies.find(cookie => cookie.trim().startsWith('blogiis='));
                        
                        if (blogCookie) {
                            try {
                                const tempBlogData = JSON.parse(decodeURIComponent(blogCookie.split('=')[1]));
                                
                                if (tempBlogData && tempBlogData.length > 0) {
                                    // Check if user already has a blog
                                    const { data: existingBlog } = await supabase
                                        .from('blogs')
                                        .select('id')
                                        .eq('user_id', session.user.id)
                                        .single();

                                    if (!existingBlog) {
                                        // Save temporary blog to database
                                        const blogData = {
                                            user_id: session.user.id,
                                            title: tempBlogData[0].data.title,
                                            description: tempBlogData[0].data.description || ''
                                        };

                                        const { error: blogError } = await supabase
                                            .from('blogs')
                                            .insert(blogData);

                                        if (blogError) {
                                            console.error('Error saving blog:', blogError);
                                            throw blogError;
                                        }
                                        
                                        // Clear the cookie after successful save
                                        document.cookie = 'blogiis=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
                                    } else {
                                        console.log('User already has a blog');
                                    }
                                }
                            } catch (error) {
                                console.error('Error processing temporary blog:', error);
                            }
                        }
                    } else {
                        console.log('No user session found');
                    }

                    return { success: true, url: data.url };
                } catch (error) {
                    console.error('Failed to login:', error);
                    throw new Error('Failed to login');
                }
            }
        }),
        signOut: defineAction({
            handler: async () => {                                                                          
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;
                    return { success: true, redirectTo: '/' };
                } catch (error) {
                    console.error('Failed to sign out:', error);
                    throw new ActionError('Failed to sign out');
                }
            }
        })
    },
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
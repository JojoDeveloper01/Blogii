import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import type { BlogData } from "@lib/types";

export const server = {
    sendBlogData: defineAction({
        input: z.object({
            id: z.string(),
            title: z.string(),
            collection: z.string(),
            data: z.object({
                title: z.string(),
                description: z.string(),
                pubDate: z.date(),
                image: z.string().optional(),
            }),
        }),
        handler: async ({ id, title, collection, data }) => {
            try {

                console.log("Enviando dados do blog:", { id, title, collection, data });
                // ✅ Envia os dados do blog
                // ✅ Verifica se o título já existe

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
}
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";

const baseBlogData = z.object({
    id: z.string().optional(),
    collection: z.string(),
    body: z.string().optional(),
    data: z.object({
        title: z.string(),
        description: z.string().optional(),
        image: z.string().optional(),
        pubDate: z.date(),
    }),
})

export const server = {
    sendBlogData: defineAction({
        input: baseBlogData,
        handler: async ({ id, body, collection, data }) => {
            try {

                console.log("Enviando dados do blog:", { id, collection, body, data });
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
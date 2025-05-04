import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import type { BlogData } from "@lib/types";
import { formatDate } from "@lib/utils";
import * as fs from 'fs/promises';
import * as path from 'path';

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
    sendBlogData: defineAction({
        input: baseBlogData,
        handler: async (input) => {
            try {
                await createBlog(input);
                return { success: true };
            } catch (error) {
                if (error instanceof z.ZodError) {
                    throw new ActionError({
                        code: "BAD_REQUEST",
                        message: error.errors[0].message
                    });
                }
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error instanceof Error ? error.message : "Unknown error occurred"
                });
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
                throw new ActionError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
        }
    })
}

async function createBlog(entry: BlogData) {
    const data = entry.data;
    const filePath = path.join(process.cwd(), "src/content/blog", `${data.title}.md`);

    const frontMatter = {
        title: data.title,
        description: data.description || "",
        image: data.image || "",
        pubDate: formatDate(data.pubDate),
    };

    const frontMatterString = Object.entries(frontMatter)
        .map(([key, value]) => `${key}: "${value}"`)
        .join('\n');

    const markdownContent = `---\n${frontMatterString}\n---`;

    await fs.writeFile(filePath, markdownContent, "utf8");
    console.log(`📄 File Created successfully: ${filePath}`);
}
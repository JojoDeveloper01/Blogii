import { getCollection } from "astro:content";
import type { BlogData } from "@lib/types";
import { formatDate } from "@lib/utils";
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import * as fs from 'fs/promises';
import * as path from 'path';
import { cp } from "fs";

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

                await createBLog(input)

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
    cleanCache: defineAction({
        input: z.object({
            a: z.any(),
        }),
        handler: async (input) => {
            console.log("Cleaning cache for collection:", input);
            try {
                const blogs = await getCollection("blog");
                console.log("Cache cleaned for collection:", blogs);
                return { blogs };
            } catch (error: any) {
                throw new ActionError(error.message);
            }
        }
    }),
}
async function createBLog(entry: BlogData) {

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

    console.log(`📄 File Created succesfully: ${filePath}`);
}
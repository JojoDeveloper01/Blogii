/* import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({ */
//loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
/*   schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      image: z.string().optional(),
  }),
});

export const collections = { blog }; */

import { defineCollection, z } from 'astro:content';

const postSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string().optional(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date().optional(),
});

const blog = defineCollection({
    schema: z.object({
        collection: z.string().optional(),
        id: z.string(),
        user_id: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        body: z.string().optional(),
        image: z.string().optional(),
        posts: z.array(postSchema).optional(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
    }),
});

export const collections = { blog };


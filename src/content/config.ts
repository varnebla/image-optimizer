import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string(),
    date: z.coerce.date(),
    thumbnail: z.string(),
    description: z.string(),
  }),
});

export const collections = {
  blog: blogCollection,
};

import { z } from "zod";

const categoryEnum = z.enum([
  "onboarding-kit",
  "survival-food",
  "club-directory",
  "career-wins",
  "local-travel",
  "amenities",
]);

export const articleEditSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  excerpt: z.string().max(1000).optional(),
  status: z.enum(["draft", "pending_review", "published", "rejected"]),
  rejection_reason: z.string().optional(),
  featured: z.boolean(),
  category: categoryEnum,
  subcategory: z.string().optional(),
  subcategory_other: z.string().optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.array(z.string()).optional(),
  topic: z.string().optional(),
  cover_image: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type ArticleEditFormValues = z.infer<typeof articleEditSchema>;

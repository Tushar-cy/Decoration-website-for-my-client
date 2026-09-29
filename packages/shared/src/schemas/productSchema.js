const { z } = require("zod");

const productCatalogQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["featured", "price_asc", "price_desc", "rating", "newest"]).optional().default("featured"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const productVariantOptionSchema = z.object({
  label: z.string().min(1),
  priceDeltaPaise: z.number().int().default(0),
  colorCode: z.string().optional(),
});

const productVariantSchema = z.object({
  name: z.string().min(1),
  options: z.array(productVariantOptionSchema).min(1),
});

const productMutationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).optional(),
  categoryId: z.string().min(1, "Category is required"),
  shortDescription: z.string().max(500).optional().default(""),
  description: z.string().optional().default(""),
  basePricePaise: z.number().int().min(0, "Base price must be a non-negative integer"),
  compareAtPricePaise: z.number().int().min(0).optional().default(0),
  images: z.array(
    z.object({
      url: z.string().url("Valid image URL is required"),
      publicId: z.string().optional().default(""),
      alt: z.string().optional().default(""),
    })
  ).default([]),
  variants: z.array(productVariantSchema).optional().default([]),
  includedItems: z.array(z.string()).optional().default([]),
  addOnIds: z.array(z.string()).optional().default([]),
  setupMinutes: z.number().int().min(0).default(60),
  minLeadHours: z.number().int().min(0).default(4),
  badge: z.string().max(50).optional().default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  tags: z.array(z.string()).default([]),
  seo: z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
  }).optional().default({}),
});

module.exports = {
  productCatalogQuerySchema,
  productVariantOptionSchema,
  productVariantSchema,
  productMutationSchema,
};

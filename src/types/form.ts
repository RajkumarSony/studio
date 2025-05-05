// src/types/form.ts
import { z } from 'zod';

// Define the base Zod schema for the form (without translations)
// This ensures consistency between client-side validation and server-side usage.
export const baseFormSchema = z.object({
  ingredients: z.string().min(3),
  dietaryRestrictions: z.string().optional(),
  preferences: z.string().optional(),
  quickMode: z.boolean().optional(),
  servingSize: z.number().int().min(1).optional(),
  cuisineType: z.string().optional(),
  cookingMethod: z.string().optional(),
  includeDetails: z.boolean().optional(),
  category: z.string().optional().default('All'),
});

// Infer the TypeScript type from the base schema
export type FormValues = z.infer<typeof baseFormSchema>;

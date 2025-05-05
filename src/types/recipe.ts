// src/types/recipe.ts
import type { ObjectId } from 'mongodb';
import type { LanguageCode } from '@/lib/translations';

/**
 * Represents a single recipe item, potentially including database ID and generation context.
 */
export interface RecipeItem {
  _id?: string | ObjectId; // Optional database ID (string after serialization)
  recipeName: string;
  ingredients: string;
  instructions: string;
  estimatedTime: string;
  difficulty: string;
  imagePrompt?: string;
  imageUrl?: string;
  nutritionFacts?: string;
  dietPlanSuitability?: string;
  // Fields added during storage/retrieval
  language?: LanguageCode; // Language context when stored/retrieved
  imageOmitted?: boolean; // Flag if large image data URI was omitted
  createdAt?: Date | string; // Creation timestamp (string after serialization)
}

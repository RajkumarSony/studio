// src/ai/flows/suggest-recipe.ts
'use server';

/**
 * @fileOverview Recipe suggestion flow based on user-provided ingredients and preferences.
 *
 * - suggestRecipes - A function that suggests recipes based on provided ingredients and optional preferences.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - RecipeItem - The type for a single suggested recipe item.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestRecipesInputSchema = z.object({
  ingredients: z
    .string()
    .min(3, 'Please provide at least a few ingredients.')
    .describe('A comma-separated list of ingredients the user has available.'),
  dietaryRestrictions: z
    .string()
    .optional()
    .describe('Optional dietary restrictions (e.g., vegetarian, gluten-free, vegan).'),
  preferences: z
    .string()
    .optional()
    .describe('Optional user preferences (e.g., spicy, quick meal, specific cuisine like Italian).'),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

const RecipeItemSchema = z.object({
  recipeName: z.string().describe('The name of the suggested recipe.'),
  ingredients: z.string().describe('A list of ingredients required for the recipe (including quantities if possible).'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
  estimatedTime: z.string().describe('Estimated cooking time (e.g., "30 minutes", "1 hour").'),
  difficulty: z.string().describe('Estimated difficulty level (e.g., "Easy", "Medium", "Hard").'),
});
export type RecipeItem = z.infer<typeof RecipeItemSchema>;

// The output is an array of recipe items
const SuggestRecipesOutputSchema = z.array(RecipeItemSchema);

/**
 * Suggests up to 3 recipes based on the provided input.
 * @param input The ingredients and optional preferences.
 * @returns A promise that resolves to an array of suggested recipes.
 */
export async function suggestRecipes(input: SuggestRecipesInput): Promise<RecipeItem[]> {
  // Validate input using Zod schema before calling the flow
  const validatedInput = SuggestRecipesInputSchema.parse(input);
  return suggestRecipeFlow(validatedInput);
}

const suggestRecipePrompt = ai.definePrompt({
  name: 'suggestRecipePrompt',
  input: {
    schema: SuggestRecipesInputSchema,
  },
  output: {
    // Expecting an array of recipes
    schema: SuggestRecipesOutputSchema,
  },
  prompt: `Given the following ingredients: {{{ingredients}}}.
{{#if dietaryRestrictions}}
Also consider these dietary restrictions: {{{dietaryRestrictions}}}.
{{/if}}
{{#if preferences}}
Also consider these preferences: {{{preferences}}}.
{{/if}}

Suggest up to 3 recipes that can be made primarily using these ingredients. For each recipe, provide:
1.  Recipe Name
2.  Ingredients list (including quantities if possible)
3.  Step-by-step instructions
4.  Estimated cooking time (e.g., "30 minutes")
5.  Difficulty level (e.g., "Easy", "Medium", "Hard")

Return the result as a JSON array, where each object in the array represents a recipe and matches the output schema.`,
});

const suggestRecipeFlow = ai.defineFlow<
  typeof SuggestRecipesInputSchema,
  typeof SuggestRecipesOutputSchema // Output is an array of RecipeItem
>(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipesOutputSchema, // Flow outputs an array
  },
  async input => {
    const {output} = await suggestRecipePrompt(input);
    // Output should already be an array based on the schema and prompt.
    // Ensure we return an empty array if output is null/undefined, although Genkit should handle this.
    return output ?? [];
  }
);

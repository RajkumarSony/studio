// src/ai/flows/suggest-recipe.ts
'use server';

/**
 * @fileOverview Recipe suggestion flow based on user-provided ingredients.
 *
 * - suggestRecipe - A function that suggests a recipe based on provided ingredients.
 * - SuggestRecipeInput - The input type for the suggestRecipe function.
 * - SuggestRecipeOutput - The return type for the suggestRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients the user has available.'),
});
export type SuggestRecipeInput = z.infer<typeof SuggestRecipeInputSchema>;

const SuggestRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the suggested recipe.'),
  ingredients: z.string().describe('A list of ingredients required for the recipe.'),
  instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
});
export type SuggestRecipeOutput = z.infer<typeof SuggestRecipeOutputSchema>;

export async function suggestRecipe(input: SuggestRecipeInput): Promise<SuggestRecipeOutput> {
  return suggestRecipeFlow(input);
}

const suggestRecipePrompt = ai.definePrompt({
  name: 'suggestRecipePrompt',
  input: {
    schema: z.object({
      ingredients: z
        .string()
        .describe('A comma-separated list of ingredients the user has available.'),
    }),
  },
  output: {
    schema: z.object({
      recipeName: z.string().describe('The name of the suggested recipe.'),
      ingredients: z.string().describe('A list of ingredients required for the recipe.'),
      instructions: z.string().describe('Step-by-step instructions for preparing the recipe.'),
    }),
  },
  prompt: `Given the following ingredients: {{{ingredients}}}, suggest a recipe that can be made using these ingredients. Provide the recipe name, a list of ingredients, and step-by-step instructions.`, 
});

const suggestRecipeFlow = ai.defineFlow<
  typeof SuggestRecipeInputSchema,
  typeof SuggestRecipeOutputSchema
>(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipeInputSchema,
    outputSchema: SuggestRecipeOutputSchema,
  },
  async input => {
    const {output} = await suggestRecipePrompt(input);
    return output!;
  }
);

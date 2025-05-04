// src/ai/flows/suggest-recipe.ts
'use server';

/**
 * @fileOverview Recipe suggestion flow based on user-provided ingredients and preferences.
 *               Includes image generation for each suggested recipe.
 *
 * - suggestRecipes - A function that suggests recipes based on provided ingredients and optional preferences, including generated images.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - RecipeItem - The type for a single suggested recipe item, including an optional image URL.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'zod';
import type {GenerateRequest} from 'genkit'; // Import GenerateRequest type if needed for options object, otherwise remove

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
  ingredients: z
    .string()
    .describe(
      'A list of ingredients required for the recipe (including quantities if possible).'
    ),
  instructions: z
    .string()
    .describe('Step-by-step instructions for preparing the recipe.'),
  estimatedTime: z
    .string()
    .describe('Estimated cooking time (e.g., "30 minutes", "1 hour").'),
  difficulty: z
    .string()
    .describe('Estimated difficulty level (e.g., "Easy", "Medium", "Hard").'),
  imagePrompt: z
    .string()
    .optional()
    .describe(
      'A detailed prompt suitable for an image generation model based on the recipe name and visual description.'
    ),
  imageUrl: z
    .string()
    .optional()
    .describe(
      "A data URI (base64 encoded) of the generated image for the recipe. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecipeItem = z.infer<typeof RecipeItemSchema>;

// The output is an array of recipe items
const SuggestRecipesOutputSchema = z.array(RecipeItemSchema);

/**
 * Suggests up to 3 recipes based on the provided input, including generating images.
 * @param input The ingredients and optional preferences.
 * @returns A promise that resolves to an array of suggested recipes with image URLs.
 */
export async function suggestRecipes(
  input: SuggestRecipesInput
): Promise<RecipeItem[]> {
  // Validate input using Zod schema before calling the flow
  const validatedInput = SuggestRecipesInputSchema.parse(input);
  return suggestRecipeFlow(validatedInput);
}

// Define schema for the prompt output *before* image generation
const RecipeTextOutputSchema = z.array(
  RecipeItemSchema.omit({imageUrl: true}) // Omit imageUrl initially
);

const suggestRecipePrompt = ai.definePrompt({
  name: 'suggestRecipePrompt',
  input: {
    schema: SuggestRecipesInputSchema,
  },
  output: {
    // Expecting an array of recipes *without* the final imageUrl yet
    schema: RecipeTextOutputSchema,
  },
  // This prompt uses the default model specified in ai-instance.ts
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
6.  A detailed, visually descriptive prompt suitable for an image generation model to create an appetizing photo of the finished dish. Focus on presentation, textures, colors, and garnishes. Example: "A close-up shot of a vibrant chicken stir-fry in a wok, showcasing glossy sauce-coated chicken pieces, bright green broccoli florets, red bell pepper strips, and fluffy white rice. Steam gently rises from the dish." Store this in the 'imagePrompt' field.

Return the result as a JSON array, where each object in the array represents a recipe and matches the output schema (excluding the final imageUrl).`,
});

const suggestRecipeFlow = ai.defineFlow<
  typeof SuggestRecipesInputSchema,
  typeof SuggestRecipesOutputSchema // Final output includes imageUrl
>(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipesOutputSchema, // Flow outputs the full schema
  },
  async input => {
    // 1. Get recipe details and image prompts
    const {output: recipeTexts} = await suggestRecipePrompt(input);

    if (!recipeTexts || recipeTexts.length === 0) {
      return [];
    }

    // 2. Generate images for each recipe
    const recipesWithImages = await Promise.all(
      recipeTexts.map(async recipe => {
        let imageUrl: string | undefined = undefined;
        if (recipe.imagePrompt) {
          try {
            console.log(
              `Generating image for: ${recipe.recipeName} with prompt: ${recipe.imagePrompt}`
            );
            // Use ai.generate and pass the specific options
            const generateOptions: GenerateRequest = {
              // Use the specific image-capable model here
              model: 'googleai/gemini-2.0-flash-exp',
              prompt: recipe.imagePrompt,
              config: {
                // Request both text and image modalities
                responseModalities: ['TEXT', 'IMAGE'],
              },
            };

            // Call ai.generate directly with the options object
            const {media} = await ai.generate(generateOptions);

            if (media && media.url) {
              console.log(`Image generated successfully for ${recipe.recipeName}`);
              imageUrl = media.url; // This should be the data URI
            } else {
               console.warn(`Image generation did not return a valid media URL for ${recipe.recipeName}`);
            }
          } catch (error) {
            console.error(
              `Error generating image for recipe "${recipe.recipeName}":`,
              error
            );
            // Optionally: Log the specific prompt that failed
             console.error(`Failed prompt: ${recipe.imagePrompt}`);
            // Keep imageUrl as undefined, handled by frontend
          }
        } else {
           console.log(`No image prompt provided for ${recipe.recipeName}, skipping image generation.`);
        }

        // Combine original recipe data with the generated image URL
        return {
          ...recipe,
          imageUrl: imageUrl, // Add the generated URL (or undefined)
        };
      })
    );

    return recipesWithImages;
  }
);

// Remove GenerateRequest import if not used explicitly elsewhere for types
// Example: Remove if the 'generateOptions' type annotation is removed or inferred correctly
// import type { GenerateRequest } from 'genkit';

// src/ai/flows/suggest-recipe.ts
'use server';

/**
 * @fileOverview Recipe suggestion flow based on user-provided ingredients and preferences.
 *               Includes image generation for each suggested recipe and supports multiple languages.
 *
 * - suggestRecipes - A function that suggests recipes based on provided ingredients, optional preferences, and language, including generated images.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - RecipeItem - The type for a single suggested recipe item, including an optional image URL.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'zod';
import type {GenerateRequest} from 'genkit'; // Import GenerateRequest type

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
  language: z
    .string()
    .optional()
    .default('en') // Default to English if not provided
    .describe(
      'The language for the recipe suggestions (e.g., en, hi, es, fr).'
    ),
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
      'A detailed prompt suitable for an image generation model based on the recipe name and visual description (should remain in English for the image model).'
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
 * @param input The ingredients, optional preferences, and language.
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
  // Explicitly define the model for text generation
  model: 'googleai/gemini-2.0-flash',
  prompt: `Given the following ingredients: {{{ingredients}}}.
{{#if dietaryRestrictions}}
Also consider these dietary restrictions: {{{dietaryRestrictions}}}.
{{/if}}
{{#if preferences}}
Also consider these preferences: {{{preferences}}}.
{{/if}}

Suggest up to 3 recipes that can be made primarily using these ingredients.

**Important:** Generate the response (Recipe Name, Ingredients, Instructions, Estimated Time, Difficulty) in the language specified by the language code: '{{{language}}}'. If the language code is 'en', use English.

For each recipe, provide:
1.  Recipe Name (in '{{{language}}}')
2.  Ingredients list (including quantities if possible, in '{{{language}}}')
3.  Step-by-step instructions (in '{{{language}}}')
4.  Estimated cooking time (e.g., "30 minutes", translated to '{{{language}}}')
5.  Difficulty level (e.g., "Easy", "Medium", "Hard", translated to '{{{language}}}')
6.  A detailed, visually descriptive prompt suitable for an image generation model to create an appetizing photo of the finished dish. **This image prompt MUST remain in English**, regardless of the requested language. Focus on presentation, textures, colors, and garnishes. Example: "A close-up shot of a vibrant chicken stir-fry in a wok, showcasing glossy sauce-coated chicken pieces, bright green broccoli florets, red bell pepper strips, and fluffy white rice. Steam gently rises from the dish." Store this in the 'imagePrompt' field.

Return the result as a JSON array, where each object in the array represents a recipe and matches the output schema (excluding the final imageUrl). Ensure the JSON is valid.`,
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
    // 1. Get recipe details (potentially translated) and image prompts (always English)
    const {output: recipeTexts} = await suggestRecipePrompt(input);

    if (!recipeTexts || recipeTexts.length === 0) {
      console.log('No recipe text suggestions received from the prompt.');
      return [];
    }
    console.log(
      `Received ${recipeTexts.length} recipe suggestion(s) in language: ${input.language}.`
    );

    // 2. Generate images for each recipe (using English image prompts)
    const recipesWithImages = await Promise.all(
      recipeTexts.map(async recipe => {
        let imageUrl: string | undefined = undefined;
        if (recipe.imagePrompt) {
          try {
            console.log(
              `Generating image for: ${recipe.recipeName} with English prompt: ${recipe.imagePrompt}`
            );
            // Use ai.generate and pass the specific options
            const generateOptions: GenerateRequest = {
              // IMPORTANT: ONLY the googleai/gemini-2.0-flash-exp model is able to generate images. You MUST use exactly this model to generate images.
              model: 'googleai/gemini-2.0-flash-exp',
              prompt: recipe.imagePrompt, // English prompt for image generation
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
              console.warn(
                `Image generation did not return a valid media URL for ${recipe.recipeName}`
              );
            }
          } catch (error) {
            console.error(
              `Error generating image for recipe "${recipe.recipeName}":`,
              error
            );
            // Optionally: Log the specific prompt that failed
            console.error(`Failed image prompt: ${recipe.imagePrompt}`);
            // Keep imageUrl as undefined, handled by frontend
          }
        } else {
          console.log(
            `No image prompt provided for ${recipe.recipeName}, skipping image generation.`
          );
        }

        // Combine original recipe data (possibly translated) with the generated image URL
        return {
          ...recipe,
          imageUrl: imageUrl, // Add the generated URL (or undefined)
        };
      })
    );
    console.log('Finished processing all recipes with image generation.');
    return recipesWithImages;
  }
);

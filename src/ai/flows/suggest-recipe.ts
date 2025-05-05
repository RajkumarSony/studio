// src/ai/flows/suggest-recipe.ts
'use server';

/**
 * @fileOverview Recipe suggestion flow based on user-provided ingredients and preferences.
 *               Includes image generation, optional nutrition facts, and diet plan suitability.
 *
 * - suggestRecipes - A function that suggests recipes based on provided input, including generated images and optional details.
 * - SuggestRecipesInput - The input type for the suggestRecipes function.
 * - RecipeItem - The type for a single suggested recipe item, including optional details.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'zod';
import type {GenerateRequest} from 'genkit'; // Import GenerateRequest type
import type { RecipeItem } from '@/types/recipe'; // Import the dedicated RecipeItem type

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
    .describe('Optional user preferences (e.g., spicy, quick meal, specific cuisine like Italian, healthy, specific cooking method).'),
  language: z
    .string()
    .optional()
    .default('en') // Default to English if not provided
    .describe(
      'The language for the recipe suggestions (e.g., en, hi, es, fr).'
    ),
  includeDetails: z
     .boolean()
     .optional()
     .default(false) // Default to not include detailed info
     .describe('Whether to include estimated nutrition facts and diet plan suitability.'),
});
export type SuggestRecipesInput = z.infer<typeof SuggestRecipesInputSchema>;

// Use the imported RecipeItem type for schema definition
// Omit fields that are added later (like _id, language, imageOmitted, createdAt)
const BaseRecipeItemSchema = z.object({
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
   nutritionFacts: z
     .string()
     .optional()
     .describe('Estimated nutrition facts (calories, protein, carbs, fat) for one serving. Include only if requested.'),
   dietPlanSuitability: z
     .string()
     .optional()
     .describe('Brief assessment of how the recipe fits into common diet plans (e.g., balanced, keto-friendly, high-protein). Include only if requested.'),
});

// The output is an array of recipe items based on the base schema
const SuggestRecipesOutputSchema = z.array(BaseRecipeItemSchema);

/**
 * Suggests up to 3 recipes based on the provided input, including generating images and optionally details.
 * @param input The ingredients, optional preferences, language, and detail flag.
 * @returns A promise that resolves to an array of suggested recipes with image URLs and optional details.
 */
export async function suggestRecipes(
  input: SuggestRecipesInput
): Promise<RecipeItem[]> { // Return type uses the imported RecipeItem
  // Validate input using Zod schema before calling the flow
  const validatedInput = SuggestRecipesInputSchema.parse(input);
  // The flow will return the base structure, DB/Redis actions add other fields
  const baseRecipes = await suggestRecipeFlow(validatedInput);
  // Cast the result to the full RecipeItem type, knowing other fields might be added later
  return baseRecipes as RecipeItem[];
}

// Define schema for the prompt output *before* image generation
// This should match the BaseRecipeItemSchema structure
const RecipeTextOutputSchema = z.array(
  BaseRecipeItemSchema.omit({imageUrl: true}) // Omit imageUrl initially
);


const suggestRecipePrompt = ai.definePrompt({
  name: 'suggestRecipePrompt',
  input: {
    schema: SuggestRecipesInputSchema,
  },
  output: {
    // Expecting an array of recipes matching the BaseRecipeItemSchema (excluding imageUrl)
    schema: RecipeTextOutputSchema,
  },
  model: 'googleai/gemini-2.0-flash', // Use specified model
  prompt: `You are an expert culinary assistant. Given the following ingredients: {{{ingredients}}}.
{{#if dietaryRestrictions}}
Consider these dietary restrictions: {{{dietaryRestrictions}}}.
{{/if}}
{{#if preferences}}
Consider these preferences: {{{preferences}}}.
{{/if}}

Suggest up to 3 distinct recipes that can be made primarily using these ingredients.

**Important:** Generate the main response (Recipe Name, Ingredients, Instructions, Estimated Time, Difficulty) in the language specified by the language code: '{{{language}}}'. If the language code is 'en', use English.

For each recipe, provide:
1.  **Recipe Name** (in '{{{language}}}')
2.  **Ingredients list** (including quantities if possible, in '{{{language}}}')
3.  **Step-by-step instructions** (in '{{{language}}}')
4.  **Estimated cooking time** (e.g., "30 minutes", translated to '{{{language}}}')
5.  **Difficulty level** (e.g., "Easy", "Medium", "Hard", translated to '{{{language}}}')
6.  **Image Prompt:** A detailed, visually descriptive prompt (max 50 words) suitable for an image generation model to create an appetizing photo of the finished dish. **This image prompt MUST remain in English**, regardless of the requested language. Focus on presentation, textures, colors, and garnishes. Store this in the 'imagePrompt' field.

{{#if includeDetails}}
7.  **Nutrition Facts (Estimated):** Provide estimated nutritional information per serving (Calories, Protein, Carbohydrates, Fat). Keep it concise. Calculate based on standard ingredient values. (in '{{{language}}}'). Store this in the 'nutritionFacts' field.
8.  **Diet Plan Suitability:** Briefly assess how the recipe might fit into general dietary approaches (e.g., "Balanced", "Good source of protein", "Potentially keto-friendly with modifications", "Vegan option"). Keep it concise. (in '{{{language}}}'). Store this in the 'dietPlanSuitability' field.
{{/if}}

Return the result as a JSON array, where each object in the array represents a recipe and matches the output schema (excluding the final imageUrl, and including nutrition/diet fields only if includeDetails was true). Ensure the JSON is valid. Format ingredients and instructions clearly, potentially using markdown lists or numbered steps within the string.`,
});

const suggestRecipeFlow = ai.defineFlow<
  typeof SuggestRecipesInputSchema,
  typeof SuggestRecipesOutputSchema // Flow output schema matches the array of base recipes
>(
  {
    name: 'suggestRecipeFlow',
    inputSchema: SuggestRecipesInputSchema,
    outputSchema: SuggestRecipesOutputSchema, // Flow outputs the array of base schema items
  },
  async input => {
    // 1. Get recipe details (potentially translated, maybe with nutrition/diet) and image prompts (always English)
    const {output: recipeTexts} = await suggestRecipePrompt(input);

    if (!recipeTexts || recipeTexts.length === 0) {
      console.log('No recipe text suggestions received from the prompt.');
      return [];
    }
    console.log(
      `Received ${recipeTexts.length} recipe suggestion(s) in language: ${input.language}. Include details: ${input.includeDetails}`
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
              model: 'googleai/gemini-2.0-flash-exp', // EXPERIMENTAL image model
              prompt: recipe.imagePrompt, // English prompt for image generation
              config: {
                 // Request both text and image modalities
                responseModalities: ['TEXT', 'IMAGE'], // MUST provide both
              },
               // Explicitly specify output format for clarity, though media should handle it
               output: { format: "media" }
            };

            // Call ai.generate directly with the options object
             const result = await ai.generate(generateOptions);
             // Access the generated media correctly from the result
             const media = result.media;


            if (media && media.url) {
              console.log(`Image generated successfully for ${recipe.recipeName}`);
              imageUrl = media.url; // This should be the data URI
            } else {
              console.warn(
                `Image generation did not return a valid media URL for ${recipe.recipeName}. Media object:`, media
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

        // Combine original recipe data with the generated image URL
        // This still matches the BaseRecipeItemSchema structure
        return {
          ...recipe, // Includes name, ingredients, instructions, time, difficulty, and potentially nutrition/diet
          imageUrl: imageUrl, // Add the generated URL (or undefined)
        };
      })
    );
    console.log('Finished processing all recipes with image generation.');
    return recipesWithImages; // Returns array matching SuggestRecipesOutputSchema
  }
);

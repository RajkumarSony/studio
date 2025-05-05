'use server';

import redisClient from '@/lib/redis/client';
import type { FormValues } from '@/types/form'; // Use shared type
import type { RecipeItem } from '@/ai/flows/suggest-recipe';
import type { LanguageCode } from '@/lib/translations';

const FORM_STATE_KEY = 'recipeSageFormState';
const RECIPE_RESULTS_KEY = 'recipeSageResults';

/**
 * Checks if the Redis client is connected and ready.
 */
export async function checkRedisAvailability(): Promise<boolean> {
  if (!redisClient) {
    console.warn("Redis client not initialized.");
    return false;
  }
  try {
    // Ping Redis to check connection
    const pong = await redisClient.ping();
    const isAvailable = pong === 'PONG';
    if (!isAvailable) {
        console.warn("Redis ping failed or returned unexpected response:", pong);
    }
    return isAvailable;
  } catch (error) {
    console.error('Redis availability check failed:', error);
    return false;
  }
}

/**
 * Gets the stored form state and recipe results from Redis.
 */
export async function getStoredState(): Promise<{ formState: FormValues | null; results: RecipeItem[] | null }> {
  if (!redisClient) {
    console.warn('Redis not available for getStoredState');
    return { formState: null, results: null };
  }
  try {
    const [storedFormState, storedResults] = await Promise.all([
      redisClient.get(FORM_STATE_KEY),
      redisClient.get(RECIPE_RESULTS_KEY),
    ]);

    const formState = storedFormState ? (JSON.parse(storedFormState) as FormValues) : null;
    const results = storedResults ? (JSON.parse(storedResults) as RecipeItem[]) : null;

    console.log(`Retrieved state from Redis: Form state ${formState ? 'found' : 'not found'}, Results ${results ? 'found ('+results.length+')' : 'not found'}`);
    return { formState, results };
  } catch (error) {
    console.error('Failed to get stored state from Redis:', error);
    // Attempt to clear potentially corrupted keys as a safety measure
    try {
        console.warn("Attempting to clear potentially corrupted Redis keys due to retrieval error.");
        await redisClient.del(FORM_STATE_KEY, RECIPE_RESULTS_KEY);
    } catch (delError) {
        console.error('Failed to clear potentially corrupted Redis keys:', delError);
    }
    return { formState: null, results: null };
  }
}

/**
 * Sets the form state and recipe results in Redis with expiry.
 */
export async function setStoredState(formState: FormValues, results: RecipeItem[], language: LanguageCode): Promise<boolean> {
  if (!redisClient) {
    console.warn('Redis not available for setStoredState');
    return false;
  }
  try {
      // Prepare data for storage (omit large images)
     const recipesForStorage = results.map(r => ({
       ...r,
       language: language, // Store language context
       // Keep image URL if it's a regular URL, otherwise omit data URIs
       imageUrl: r.imageUrl?.startsWith('data:') ? undefined : r.imageUrl,
       imageOmitted: !!(r.imageUrl?.startsWith('data:')), // Mark if image was omitted
     }));

    const serializedResults = JSON.stringify(recipesForStorage);
    const serializedFormState = JSON.stringify(formState);

    // Set keys in Redis with an expiry (e.g., 1 hour = 3600 seconds)
    const resultsPromise = redisClient.set(RECIPE_RESULTS_KEY, serializedResults, 'EX', 3600);
    const formStatePromise = redisClient.set(FORM_STATE_KEY, serializedFormState, 'EX', 3600);

    const [resultsStatus, formStateStatus] = await Promise.all([resultsPromise, formStatePromise]);

    if (resultsStatus === 'OK' && formStateStatus === 'OK') {
        console.log(`Stored ${results.length} results and form state in Redis.`);
        return true;
    } else {
        console.error('Failed to store state in Redis. Status:', { resultsStatus, formStateStatus });
        return false;
    }
  } catch (error) {
    console.error('Error storing state in Redis:', error);
    return false;
  }
}

/**
 * Deletes the form state and recipe results keys from Redis.
 */
export async function deleteStoredState(): Promise<boolean> {
  if (!redisClient) {
    console.warn('Redis not available for deleteStoredState');
    return true; // Considered successful as there's nothing to delete
  }
  try {
    const deletedCount = await redisClient.del(FORM_STATE_KEY, RECIPE_RESULTS_KEY);
    console.log(`Deleted ${deletedCount} state keys from Redis.`);
    return true;
  } catch (error) {
    console.error('Error deleting state from Redis:', error);
    return false;
  }
}


/**
 * Stores recipe details temporarily in Redis for navigation.
 * Expires after 5 minutes.
 */
export async function storeRecipeForNavigation(slug: string, recipe: RecipeItem, language: LanguageCode): Promise<string | null> {
     if (!redisClient) {
       console.warn('Redis not available for storeRecipeForNavigation');
       return null;
     }
     const redisKey = `recipeDetail-${slug}`;
      try {
         // Prepare data to store (include language, omit large image data URIs)
         const dataToStore: RecipeItem & { language?: LanguageCode; imageOmitted?: boolean } = {
             ...recipe,
             language: language,
             imageUrl: recipe.imageUrl?.startsWith('data:') ? undefined : recipe.imageUrl,
             imageOmitted: !!(recipe.imageUrl?.startsWith('data:')),
         };

         const serializedRecipe = JSON.stringify(dataToStore);
         // Expire after 300 seconds (5 minutes)
         const result = await redisClient.set(redisKey, serializedRecipe, 'EX', 300);

         if (result === 'OK') {
             console.log("Recipe detail data successfully stored in Redis with key:", redisKey);
             return redisKey;
         } else {
             console.error("Redis SET command did not return OK for key:", redisKey);
             return null;
         }
     } catch (error) {
         console.error(`Error storing recipe details in Redis for key "${redisKey}":`, error);
         return null;
     }
 }

 /**
  * Retrieves recipe details stored temporarily in Redis for navigation.
  */
 export async function getRecipeFromNavigationStore(redisKey: string): Promise<(RecipeItem & { language?: LanguageCode }) | null> {
     if (!redisClient) {
         console.warn('Redis not available for getRecipeFromNavigationStore');
         return null;
     }
     try {
         const storedData = await redisClient.get(redisKey);
         if (storedData) {
             console.log("Retrieved recipe detail data from Redis for key:", redisKey);
             const parsedData = JSON.parse(storedData) as RecipeItem & { language?: LanguageCode };
             // Optionally delete the key after retrieval if it's single-use
             // await redisClient.del(redisKey);
             return parsedData;
         } else {
             console.warn("Recipe detail data not found or expired in Redis for key:", redisKey);
             return null;
         }
     } catch (error) {
         console.error(`Error retrieving or parsing recipe details from Redis for key "${redisKey}":`, error);
         return null;
     }
 }
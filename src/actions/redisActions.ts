
'use server';

import redisClient from '@/lib/redis/client';
import type { FormValues } from '@/types/form'; // Use shared type
import type { RecipeItem } from '@/types/recipe'; // Use the dedicated RecipeItem type
import type { LanguageCode } from '@/lib/translations';
import { ObjectId } from 'mongodb'; // Import ObjectId for type checking

const FORM_STATE_KEY = 'recipeSageFormState';
const RECIPE_RESULTS_KEY = 'recipeSageResults';

// Helper function to ensure data is plain serializable JSON
// Converts ObjectId and Date to strings - simplified for clarity
const ensureSerializable = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert ObjectId to string during stringification
    if (value && typeof value === 'object' && value instanceof ObjectId) {
      return value.toString();
    }
    // Dates are handled automatically by JSON.stringify into ISO strings
    return value;
  }));
};


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
    // console.log(`Redis availability check: ${isAvailable ? 'Available' : 'Unavailable'}`); // Optional: reduce logging noise
    return isAvailable;
  } catch (error) {
    console.error('Redis availability check failed:', error);
    return false;
  }
}

/**
 * Gets the stored form state and recipe results from Redis.
 * Ensures returned data is JSON serializable.
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
    // Use ensureSerializable AFTER parsing to handle potential non-serializable fields like Dates from JSON
    const results = storedResults ? (ensureSerializable(JSON.parse(storedResults)) as RecipeItem[]) : null;

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

    // Ensure the entire structure is serializable before stringifying
    const serializableResults = ensureSerializable(recipesForStorage);
    const serializableFormState = ensureSerializable(formState);

    const serializedResults = JSON.stringify(serializableResults);
    const serializedFormState = JSON.stringify(serializableFormState);


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
 * Ensures data is JSON serializable.
 * Expires after 5 minutes.
 */
export async function storeRecipeForNavigation(slug: string, recipe: RecipeItem, language: LanguageCode): Promise<string | null> {
     if (!redisClient) {
       console.warn('Redis not available for storeRecipeForNavigation');
       return null;
     }
     const redisKey = `recipeDetail-${slug}`;
      console.log(`Attempting to store recipe details in Redis with key: ${redisKey}`); // Added logging
      try {
         // Prepare data to store (include language, omit large image data URIs)
         const dataToStore: RecipeItem & { language?: LanguageCode; imageOmitted?: boolean } = {
             ...recipe,
             language: language,
             imageUrl: recipe.imageUrl?.startsWith('data:') ? undefined : recipe.imageUrl,
             imageOmitted: !!(recipe.imageUrl?.startsWith('data:')),
             // Ensure _id is handled by ensureSerializable if present
         };

         // Ensure serializable before stringifying
         const serializableRecipe = ensureSerializable(dataToStore);
         const serializedRecipe = JSON.stringify(serializableRecipe);

         console.log(`Serialized data for key ${redisKey}:`, serializedRecipe.substring(0, 200) + '...'); // Log snippet of data

         // Expire after 300 seconds (5 minutes)
         const result = await redisClient.set(redisKey, serializedRecipe, 'EX', 300);

         if (result === 'OK') {
             console.log("✅ Recipe detail data successfully stored in Redis with key:", redisKey);
             return redisKey;
         } else {
             console.error("❌ Redis SET command did not return OK for key:", redisKey);
             return null;
         }
     } catch (error) {
         console.error(`❌ Error storing recipe details in Redis for key "${redisKey}":`, error);
         return null;
     }
 }

 /**
  * Retrieves recipe details stored temporarily in Redis for navigation.
  * Ensures returned data is JSON serializable.
  */
 export async function getRecipeFromNavigationStore(redisKey: string): Promise<(RecipeItem & { language?: LanguageCode }) | null> {
     if (!redisClient) {
         console.warn('Redis not available for getRecipeFromNavigationStore');
         return null;
     }
      console.log(`Attempting to retrieve recipe details from Redis with key: ${redisKey}`); // Added logging
     try {
         const storedData = await redisClient.get(redisKey);
         if (storedData) {
             console.log("✅ Retrieved raw data from Redis for key:", redisKey, storedData.substring(0, 200) + '...'); // Log snippet
             const parsedData = JSON.parse(storedData);
              // Use ensureSerializable AFTER parsing to handle potential non-serializable fields like Dates from JSON
             const serializableData = ensureSerializable(parsedData) as (RecipeItem & { language?: LanguageCode });
             console.log("✅ Parsed and serialized recipe data:", serializableData);
             // Optionally delete the key after retrieval if it's single-use
             // await redisClient.del(redisKey);
             return serializableData;
         } else {
             console.warn(`❌ Recipe detail data not found or expired in Redis for key: ${redisKey}`);
             return null;
         }
     } catch (error) {
         console.error(`❌ Error retrieving or parsing recipe details from Redis for key "${redisKey}":`, error);
         return null;
     }
 }

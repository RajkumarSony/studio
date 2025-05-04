// src/lib/db/recipes.ts
'use server'; // Can be called from server components/actions

import { Collection, Db, MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';
import type { RecipeItem } from '@/ai/flows/suggest-recipe';

interface UserDocument {
  _id: string; // Firebase Auth UID
  savedRecipes?: RecipeItem[]; // Embed saved recipes
}

// Helper function to get the MongoDB database and collection
async function getDbAndCollection(): Promise<{ db: Db; collection: Collection<UserDocument>; client: MongoClient }> {
  const client = await clientPromise;
  const db = client.db(); // Use default database from connection string
  const collection = db.collection<UserDocument>('users');
  return { db, collection, client };
}

/**
 * Saves a recipe to a user's document in MongoDB.
 * Creates the user document if it doesn't exist.
 * Uses recipeName as the unique identifier within the savedRecipes array.
 * @param userId The ID of the user (Firebase Auth UID).
 * @param recipe The recipe object to save.
 * @returns A promise that resolves when the recipe is saved.
 */
export async function saveRecipeToMongoDB(userId: string, recipe: RecipeItem): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save a recipe.');
  }
  if (!recipe || !recipe.recipeName) {
    throw new Error('Invalid recipe data provided.');
  }

  const { collection } = await getDbAndCollection();

  try {
    // Use upsert to create the user document if it doesn't exist,
    // and $addToSet to add the recipe only if it's not already present (based on recipeName).
    const result = await collection.updateOne(
      { _id: userId },
      {
        $addToSet: { savedRecipes: recipe } // Add the whole recipe object
      },
      { upsert: true } // Create user doc if it doesn't exist
    );

    if (result.upsertedCount > 0) {
        console.log(`Created user document and saved recipe "${recipe.recipeName}" for user ${userId}`);
    } else if (result.modifiedCount > 0) {
        console.log(`Recipe "${recipe.recipeName}" added to saved list for user ${userId}`);
    } else {
        // Check if the recipe was already present
        const userDoc = await collection.findOne({ _id: userId, 'savedRecipes.recipeName': recipe.recipeName });
        if (userDoc) {
            console.log(`Recipe "${recipe.recipeName}" was already saved for user ${userId}`);
        } else {
             console.warn(`Recipe "${recipe.recipeName}" may not have been saved for user ${userId}, but no error occurred.`);
        }
    }
  } catch (error) {
    console.error(`Error saving recipe "${recipe.recipeName}" for user ${userId} in MongoDB:`, error);
    throw new Error('Failed to save recipe.'); // Re-throw for handling in the calling function
  }
}

/**
 * Checks if a specific recipe is saved by a user in MongoDB.
 * @param userId The ID of the user.
 * @param recipeName The name of the recipe to check.
 * @returns A promise that resolves to true if the recipe is saved, false otherwise.
 */
export async function isRecipeSavedInMongoDB(userId: string, recipeName: string): Promise<boolean> {
   if (!userId || !recipeName) {
     return false;
   }
   const { collection } = await getDbAndCollection();
   try {
     // Check if a document exists with the userId and the specific recipeName within the savedRecipes array
     const userDoc = await collection.findOne({ _id: userId, 'savedRecipes.recipeName': recipeName });
     return !!userDoc; // Return true if the document is found (recipe exists in array)
   } catch (error) {
     console.error(`Error checking if recipe "${recipeName}" is saved for user ${userId} in MongoDB:`, error);
     return false; // Assume not saved on error
   }
}

/**
 * Retrieves all saved recipes for a user from MongoDB.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of saved RecipeItem objects.
 */
export async function getSavedRecipesFromMongoDB(userId: string): Promise<RecipeItem[]> {
  if (!userId) {
    console.warn('User ID is required to fetch saved recipes.');
    return [];
  }

  const { collection } = await getDbAndCollection();

  try {
    const userDoc = await collection.findOne({ _id: userId });
    if (userDoc && userDoc.savedRecipes) {
      console.log(`Fetched ${userDoc.savedRecipes.length} saved recipes for user ${userId}`);
      // Basic validation can be added here if needed, though $addToSet should prevent duplicates by name
      return userDoc.savedRecipes;
    }
    console.log(`No saved recipes found for user ${userId}`);
    return []; // User document exists but no saved recipes, or user doc doesn't exist
  } catch (error) {
    console.error(`Error fetching saved recipes for user ${userId} from MongoDB:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Removes a saved recipe from a user's document in MongoDB.
 * @param userId The ID of the user.
 * @param recipeName The name of the recipe to remove.
 * @returns A promise that resolves when the recipe is removed.
 */
export async function removeRecipeFromMongoDB(userId: string, recipeName: string): Promise<void> {
   if (!userId || !recipeName) {
     throw new Error('User ID and recipe name are required to remove a recipe.');
   }
   const { collection } = await getDbAndCollection();
   try {
     // Use $pull to remove the recipe from the savedRecipes array based on recipeName
     const result = await collection.updateOne(
       { _id: userId },
       { $pull: { savedRecipes: { recipeName: recipeName } } }
     );

     if (result.modifiedCount > 0) {
       console.log(`Recipe "${recipeName}" removed for user ${userId}`);
     } else {
       console.log(`Recipe "${recipeName}" not found in saved list for user ${userId}, or user not found.`);
     }
   } catch (error) {
     console.error(`Error removing recipe "${recipeName}" for user ${userId} from MongoDB:`, error);
     throw new Error('Failed to remove recipe.');
   }
}

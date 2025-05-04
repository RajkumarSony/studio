// src/lib/db/recipes.ts
'use server'; // Can be called from server components/actions

import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';
import type { RecipeItem, SuggestRecipesInput } from '@/ai/flows/suggest-recipe';

// Define interfaces for database documents
interface UserDocument {
  _id: ObjectId; // MongoDB default ObjectId
  // Add other user fields if needed (e.g., name, email from NextAuth)
  // These might be populated by the NextAuth adapter automatically
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  savedRecipes?: RecipeItem[]; // Embed saved recipes
}

interface RecipeDocument extends RecipeItem {
  _id: ObjectId; // MongoDB default ObjectId for the recipe itself
  // Optional: Add fields like createdBy (userId), createdAt, etc.
  createdBy?: ObjectId;
  createdAt?: Date;
}

interface HistoryDocument {
    _id: ObjectId;
    userId: ObjectId; // Reference to the user who made the search
    timestamp: Date;
    searchInput: SuggestRecipesInput; // Store the input used for the search
    // Store summary of results (e.g., names or count) instead of full results to save space
    resultsSummary: string[]; // Array of recipe names suggested
    resultCount: number;
}


// Helper function to get the MongoDB database and collections
async function getDbCollections(): Promise<{
  db: Db;
  usersCollection: Collection<UserDocument>;
  recipesCollection: Collection<RecipeDocument>;
  historyCollection: Collection<HistoryDocument>;
  client: MongoClient;
}> {
  const client = await clientPromise;
  const db = client.db('cooking'); // Use the 'cooking' database
  const usersCollection = db.collection<UserDocument>('users');
  const recipesCollection = db.collection<RecipeDocument>('recipes');
  const historyCollection = db.collection<HistoryDocument>('history');
  return { db, usersCollection, recipesCollection, historyCollection, client };
}

/**
 * Saves a recipe to a user's 'savedRecipes' array in MongoDB.
 * It finds the user based on the string ID provided by NextAuth session, converting it to ObjectId.
 * @param userIdString The ID of the user (NextAuth session user.id as string).
 * @param recipe The recipe object to save.
 * @returns A promise that resolves when the recipe is saved.
 */
export async function saveRecipeToMongoDB(userIdString: string, recipe: RecipeItem): Promise<void> {
  if (!userIdString) {
    throw new Error('User ID is required to save a recipe.');
  }
  if (!recipe || !recipe.recipeName) {
    throw new Error('Invalid recipe data provided.');
  }

  let userObjectId: ObjectId;
  try {
    userObjectId = new ObjectId(userIdString);
  } catch (error) {
    console.error("Invalid user ID format:", userIdString);
    throw new Error('Invalid user ID format.');
  }

  const { usersCollection } = await getDbCollections();

  try {
    // Find user by ObjectId and add recipe to the savedRecipes array if not present
    const result = await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $addToSet: { savedRecipes: recipe } // Add the whole recipe object
      }
      // Note: We assume the user document is created/managed by the NextAuth MongoDB adapter.
      // If not, you might need { upsert: true } here, but it's generally better handled by the adapter.
    );

    if (result.matchedCount === 0) {
        console.warn(`User document not found for ID: ${userIdString}. Recipe "${recipe.recipeName}" not saved.`);
        // Optionally throw an error or handle as needed
        // throw new Error('User not found.');
    } else if (result.modifiedCount > 0) {
        console.log(`Recipe "${recipe.recipeName}" added to saved list for user ${userIdString}`);
    } else {
        // Check if the recipe was already present (matchedCount > 0 but modifiedCount === 0)
        const userDoc = await usersCollection.findOne({ _id: userObjectId, 'savedRecipes.recipeName': recipe.recipeName });
        if (userDoc) {
            console.log(`Recipe "${recipe.recipeName}" was already saved for user ${userIdString}`);
        } else {
             // This case should ideally not happen if matchedCount > 0
             console.warn(`Recipe "${recipe.recipeName}" may not have been saved for user ${userIdString}, check logic.`);
        }
    }

    // Optionally, save the recipe details to the 'recipes' collection as well
    // This creates redundancy but allows querying recipes independently of users
    // Consider if this is necessary for your use case.
    // await saveRecipeDetails(recipe, userObjectId);

  } catch (error) {
    console.error(`Error saving recipe "${recipe.recipeName}" for user ${userIdString} in MongoDB:`, error);
    throw new Error('Failed to save recipe.'); // Re-throw for handling in the calling function
  }
}

/**
 * Checks if a specific recipe is saved by a user in MongoDB.
 * @param userIdString The ID of the user (NextAuth session user.id as string).
 * @param recipeName The name of the recipe to check.
 * @returns A promise that resolves to true if the recipe is saved, false otherwise.
 */
export async function isRecipeSavedInMongoDB(userIdString: string, recipeName: string): Promise<boolean> {
   if (!userIdString || !recipeName) {
     return false;
   }
    let userObjectId: ObjectId;
    try {
        userObjectId = new ObjectId(userIdString);
    } catch (error) {
        console.error("Invalid user ID format for checking saved recipe:", userIdString);
        return false;
    }

   const { usersCollection } = await getDbCollections();
   try {
     // Check if a document exists with the userId and the specific recipeName within the savedRecipes array
     const userDoc = await usersCollection.findOne(
         { _id: userObjectId, 'savedRecipes.recipeName': recipeName },
         { projection: { _id: 1 } } // Only need to know if it exists
     );
     return !!userDoc; // Return true if the document is found (recipe exists in array)
   } catch (error) {
     console.error(`Error checking if recipe "${recipeName}" is saved for user ${userIdString} in MongoDB:`, error);
     return false; // Assume not saved on error
   }
}

/**
 * Retrieves all saved recipes for a user from MongoDB.
 * @param userIdString The ID of the user (NextAuth session user.id as string).
 * @returns A promise that resolves to an array of saved RecipeItem objects.
 */
export async function getSavedRecipesFromMongoDB(userIdString: string): Promise<RecipeItem[]> {
  if (!userIdString) {
    console.warn('User ID is required to fetch saved recipes.');
    return [];
  }

  let userObjectId: ObjectId;
  try {
    userObjectId = new ObjectId(userIdString);
  } catch (error) {
    console.error("Invalid user ID format for fetching saved recipes:", userIdString);
    return [];
  }

  const { usersCollection } = await getDbCollections();

  try {
    const userDoc = await usersCollection.findOne(
        { _id: userObjectId },
        { projection: { savedRecipes: 1 } } // Project only the savedRecipes field
    );

    if (userDoc && userDoc.savedRecipes) {
      console.log(`Fetched ${userDoc.savedRecipes.length} saved recipes for user ${userIdString}`);
      return userDoc.savedRecipes;
    }
    console.log(`No saved recipes found for user ${userIdString}`);
    return []; // User document exists but no saved recipes, or user doc doesn't exist
  } catch (error) {
    console.error(`Error fetching saved recipes for user ${userIdString} from MongoDB:`, error);
    return []; // Return empty array on error
  }
}

/**
 * Removes a saved recipe from a user's document in MongoDB.
 * @param userIdString The ID of the user (NextAuth session user.id as string).
 * @param recipeName The name of the recipe to remove.
 * @returns A promise that resolves when the recipe is removed.
 */
export async function removeRecipeFromMongoDB(userIdString: string, recipeName: string): Promise<void> {
   if (!userIdString || !recipeName) {
     throw new Error('User ID and recipe name are required to remove a recipe.');
   }
    let userObjectId: ObjectId;
    try {
        userObjectId = new ObjectId(userIdString);
    } catch (error) {
        console.error("Invalid user ID format for removing recipe:", userIdString);
        throw new Error('Invalid user ID format.');
    }

   const { usersCollection } = await getDbCollections();
   try {
     // Use $pull to remove the recipe from the savedRecipes array based on recipeName
     const result = await usersCollection.updateOne(
       { _id: userObjectId },
       { $pull: { savedRecipes: { recipeName: recipeName } } }
     );

     if (result.modifiedCount > 0) {
       console.log(`Recipe "${recipeName}" removed for user ${userIdString}`);
     } else {
       console.log(`Recipe "${recipeName}" not found in saved list for user ${userIdString}, or user not found.`);
     }
   } catch (error) {
     console.error(`Error removing recipe "${recipeName}" for user ${userIdString} from MongoDB:`, error);
     throw new Error('Failed to remove recipe.');
   }
}


/**
 * Saves a recipe search event to the history collection.
 * @param historyData The data for the history entry.
 * @returns A promise that resolves when the history entry is saved.
 */
export async function saveRecipeHistory(historyData: Omit<HistoryDocument, '_id'>): Promise<void> {
    if (!historyData.userId) {
        throw new Error("User ID is required to save history.");
    }

    const { historyCollection } = await getDbCollections();
    const entryWithTimestamp: Omit<HistoryDocument, '_id'> & { timestamp: Date } = {
        ...historyData,
        timestamp: historyData.timestamp || new Date(), // Ensure timestamp exists
    };

    try {
        const result = await historyCollection.insertOne(entryWithTimestamp as HistoryDocument);
        if (result.insertedId) {
             console.log(`History entry saved with ID: ${result.insertedId} for user ${historyData.userId}`);
        } else {
             console.warn("History entry may not have been saved.");
        }
    } catch (error) {
        console.error(`Error saving history entry for user ${historyData.userId}:`, error);
        // Decide whether to throw or just log
        // throw new Error('Failed to save search history.');
    }
}

// --- Optional: Function to save recipe details to 'recipes' collection ---
/**
 * Saves the details of a recipe to the main 'recipes' collection.
 * Uses recipeName as a potential unique key (consider making it unique index in MongoDB).
 * @param recipe The recipe object to save.
 * @param userId The ObjectId of the user saving/generating the recipe.
 * @returns A promise resolving to the ObjectId of the inserted/updated recipe.
 */
async function saveRecipeDetails(recipe: RecipeItem, userId?: ObjectId): Promise<ObjectId | null> {
    if (!recipe || !recipe.recipeName) {
        console.warn("Attempted to save invalid recipe details.");
        return null;
    }
    const { recipesCollection } = await getDbCollections();

    const recipeDoc: Omit<RecipeDocument, '_id'> = {
        ...recipe,
        createdBy: userId,
        createdAt: new Date(),
    };

    try {
        // Use updateOne with upsert: if a recipe with the same name exists, update it (optional),
        // otherwise insert a new one.
        const result = await recipesCollection.updateOne(
            { recipeName: recipe.recipeName }, // Find based on name
            {
                $set: recipeDoc, // Set all fields
                $setOnInsert: { createdAt: new Date() } // Only set createdAt on insert
            },
            { upsert: true }
        );

        if (result.upsertedId) {
            console.log(`Recipe "${recipe.recipeName}" inserted into recipes collection with ID: ${result.upsertedId}`);
            return result.upsertedId;
        } else if (result.modifiedCount > 0) {
            console.log(`Recipe "${recipe.recipeName}" updated in recipes collection.`);
            // If updated, we need to find the document to return its ID
            const existingRecipe = await recipesCollection.findOne({ recipeName: recipe.recipeName });
            return existingRecipe?._id || null;
        } else {
             console.log(`Recipe "${recipe.recipeName}" already exists and was not modified.`);
              const existingRecipe = await recipesCollection.findOne({ recipeName: recipe.recipeName });
              return existingRecipe?._id || null;
        }
    } catch (error) {
        console.error(`Error saving recipe details for "${recipe.recipeName}" to recipes collection:`, error);
        return null; // Return null or throw error as needed
    }
}

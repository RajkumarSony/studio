// src/lib/db/recipes.ts
'use server'; // Can be called from server components/actions

import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';
import type { RecipeItem, SuggestRecipesInput } from '@/ai/flows/suggest-recipe';

// Define interfaces for database documents
interface RecipeDocument extends Omit<RecipeItem, '_id'> { // Use Omit to avoid conflict if RecipeItem somehow has _id
  _id: ObjectId;
  createdAt?: Date;
  // Add any other DB-specific fields here
}

interface HistoryDocument {
    _id: ObjectId;
    timestamp: Date;
    searchInput: SuggestRecipesInput;
    resultsSummary: string[];
    resultCount: number;
}

// Helper function to ensure data is plain serializable JSON
// Converts ObjectId and Date to strings
const ensureSerializable = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (data instanceof ObjectId) {
    return data.toString();
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(ensureSerializable);
  }

  // For plain objects, iterate over keys
  const sanitizedObj: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
       sanitizedObj[key] = ensureSerializable(data[key]);
    }
  }
  return sanitizedObj;
};


// Helper function to get the MongoDB database and collections
async function getDbCollections(): Promise<{
  db: Db;
  recipesCollection: Collection<RecipeDocument>;
  historyCollection: Collection<HistoryDocument>;
  client: MongoClient;
}> {
  const client = await clientPromise;
  const db = client.db('cooking');
  const recipesCollection = db.collection<RecipeDocument>('recipes');
  const historyCollection = db.collection<HistoryDocument>('history');
  return { db, recipesCollection, historyCollection, client };
}

/**
 * Saves a recipe search event to the history collection (anonymously).
 * @param historyData The data for the history entry (without userId).
 * @returns A promise that resolves when the history entry is saved.
 */
export async function saveRecipeHistory(historyData: { searchInput: SuggestRecipesInput; resultsSummary: string[]; resultCount: number; timestamp?: Date }): Promise<void> {
    let client: MongoClient | null = null; // Keep track of the client
    try {
        const collections = await getDbCollections();
        client = collections.client; // Store the client
        const historyCollection = collections.historyCollection;

        // Construct the document to insert
        const entryToInsert: Omit<HistoryDocument, '_id'> & { _id?: ObjectId } = { // Make _id optional here for insertion
            // _id: new ObjectId(), // Let MongoDB generate the ID
            timestamp: historyData.timestamp || new Date(),
            searchInput: historyData.searchInput,
            resultsSummary: historyData.resultsSummary,
            resultCount: historyData.resultCount,
        };

        const result = await historyCollection.insertOne(entryToInsert as HistoryDocument); // Cast back for insertion
        if (result.insertedId) {
             console.log(`Anonymous history entry saved with ID: ${result.insertedId}`);
        } else {
             console.warn("History entry may not have been saved.");
        }
    } catch (error) {
        console.error(`Error saving anonymous history entry:`, error);
        // Decide whether to throw or just log
        // throw new Error('Failed to save search history.');
    } finally {
       // No need to close the client here if using the singleton pattern from clientPromise
    }
}

/**
 * Saves the details of a generated recipe to the main 'recipes' collection.
 * Uses recipeName as a potential unique key (consider making it unique index in MongoDB).
 * @param recipe The recipe object to save.
 * @returns A promise resolving to the ObjectId (as string) of the inserted/updated recipe, or null on failure.
 */
export async function saveGeneratedRecipeDetails(recipe: RecipeItem): Promise<string | null> {
    if (!recipe || !recipe.recipeName) {
        console.warn("Attempted to save invalid recipe details.");
        return null;
    }
    let client: MongoClient | null = null;
    try {
        const { recipesCollection } = await getDbCollections();
        client = (await clientPromise); // Get client instance

        // Explicitly remove _id if it exists from the input to avoid conflicts during upsert matching
        const { _id, ...recipeData } = recipe as any;

        // Create the document, ensuring createdAt is only set on insert
        const recipeDoc: Omit<RecipeDocument, '_id' | 'createdAt'> & { createdAt?: Date } = {
            ...recipeData,
        };

        const result = await recipesCollection.updateOne(
            { recipeName: recipe.recipeName }, // Find based on name
            {
                $set: recipeDoc, // Set all fields from recipeData
                $setOnInsert: { createdAt: new Date() } // Only set createdAt on initial insert
            },
            { upsert: true } // Insert if not found, update if found
        );

        let savedId: ObjectId | null = null;
        if (result.upsertedId) {
            console.log(`Recipe "${recipe.recipeName}" inserted into recipes collection with ID: ${result.upsertedId}`);
            savedId = result.upsertedId;
        } else if (result.modifiedCount > 0) {
            console.log(`Recipe "${recipe.recipeName}" updated in recipes collection.`);
            // If updated, we need to find the document to return its ID
            const existingRecipe = await recipesCollection.findOne({ recipeName: recipe.recipeName });
            savedId = existingRecipe?._id || null;
        } else if (result.matchedCount > 0) {
            console.log(`Recipe "${recipe.recipeName}" already exists and was not modified.`);
            const existingRecipe = await recipesCollection.findOne({ recipeName: recipe.recipeName });
            savedId = existingRecipe?._id || null;
        } else {
            console.warn(`Upsert operation for "${recipe.recipeName}" resulted in unexpected state.`);
            return null; // Indicate failure or unexpected outcome
        }

        return savedId ? savedId.toString() : null; // Return ID as string

    } catch (error) {
        console.error(`Error saving recipe details for "${recipe.recipeName}" to recipes collection:`, error);
        return null; // Return null or throw error as needed
    } finally {
       // No need to close the client here
    }
}

/**
 * Fetches all saved recipe details from the 'recipes' collection.
 * Ensures returned data is JSON serializable.
 * @returns A promise resolving to an array of RecipeItem objects (with ID as string), or null on error.
 */
export async function getAllSavedRecipes(): Promise<(RecipeItem & { _id: string })[] | null> {
    let client: MongoClient | null = null;
    try {
        const { recipesCollection } = await getDbCollections();
        client = (await clientPromise);

        const recipesCursor = recipesCollection.find({}); // Find all documents
        const recipesArray = await recipesCursor.toArray();

        // Convert to RecipeItem format and ensure serializability
        const serializableRecipes = recipesArray.map(doc => ensureSerializable({
            ...doc,
            _id: doc._id.toString(), // Ensure _id is a string
        }) as RecipeItem & { _id: string });

        console.log(`Retrieved ${serializableRecipes.length} saved recipes from DB.`);
        return serializableRecipes;

    } catch (error) {
        console.error('Error fetching saved recipes from MongoDB:', error);
        return null;
    } finally {
        // No need to close client
    }
}


/**
 * Deletes a recipe from the 'recipes' collection by its ID.
 * @param recipeId The ObjectId (as a string) of the recipe to delete.
 * @returns A promise resolving to true if deletion was successful, false otherwise.
 */
export async function deleteRecipeById(recipeId: string): Promise<boolean> {
    if (!ObjectId.isValid(recipeId)) {
        console.error(`Invalid recipe ID provided for deletion: ${recipeId}`);
        return false;
    }
    let client: MongoClient | null = null;
    try {
        const { recipesCollection } = await getDbCollections();
        client = (await clientPromise);

        const result = await recipesCollection.deleteOne({ _id: new ObjectId(recipeId) });

        if (result.deletedCount === 1) {
            console.log(`Recipe with ID ${recipeId} deleted successfully.`);
            return true;
        } else {
            console.warn(`Recipe with ID ${recipeId} not found for deletion.`);
            return false;
        }
    } catch (error) {
        console.error(`Error deleting recipe with ID ${recipeId}:`, error);
        return false;
    } finally {
       // No need to close client
    }
}

// src/lib/db/recipes.ts
'use server'; // Can be called from server components/actions

import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb/client';
import type { RecipeItem, SuggestRecipesInput } from '@/ai/flows/suggest-recipe';

// Define interfaces for database documents
// UserDocument is removed as authentication is removed

interface RecipeDocument extends RecipeItem {
  _id: ObjectId; // MongoDB default ObjectId for the recipe itself
  // Optional: Add fields like createdAt, etc. if needed for general recipes
  createdAt?: Date;
}

interface HistoryDocument {
    _id: ObjectId;
    // Removed userId
    timestamp: Date;
    searchInput: SuggestRecipesInput; // Store the input used for the search
    // Store summary of results (e.g., names or count) instead of full results to save space
    resultsSummary: string[]; // Array of recipe names suggested
    resultCount: number;
}


// Helper function to get the MongoDB database and collections
async function getDbCollections(): Promise<{
  db: Db;
  // usersCollection removed
  recipesCollection: Collection<RecipeDocument>;
  historyCollection: Collection<HistoryDocument>;
  client: MongoClient;
}> {
  const client = await clientPromise;
  const db = client.db('cooking'); // Use the 'cooking' database
  // const usersCollection = db.collection<UserDocument>('users'); // Removed
  const recipesCollection = db.collection<RecipeDocument>('recipes'); // Collection for storing recipe details
  const historyCollection = db.collection<HistoryDocument>('history'); // Collection for search history
  return { db, /*usersCollection,*/ recipesCollection, historyCollection, client };
}

// --- User-specific functions removed as there's no user context ---
// saveRecipeToMongoDB removed
// isRecipeSavedInMongoDB removed
// getSavedRecipesFromMongoDB removed
// removeRecipeFromMongoDB removed

/**
 * Saves a recipe search event to the history collection (anonymously).
 * @param historyData The data for the history entry (without userId).
 * @returns A promise that resolves when the history entry is saved.
 */
export async function saveRecipeHistory(historyData: { searchInput: SuggestRecipesInput; resultsSummary: string[]; resultCount: number; timestamp?: Date }): Promise<void> {
    const { historyCollection } = await getDbCollections();
    // Construct the document to insert
    const entryToInsert: HistoryDocument = {
        _id: new ObjectId(), // Generate a new ObjectId for the history entry
        // userId is removed
        timestamp: historyData.timestamp || new Date(),
        searchInput: historyData.searchInput,
        resultsSummary: historyData.resultsSummary,
        resultCount: historyData.resultCount,
    };

    try {
        const result = await historyCollection.insertOne(entryToInsert);
        if (result.insertedId) {
             console.log(`Anonymous history entry saved with ID: ${result.insertedId}`);
        } else {
             console.warn("History entry may not have been saved.");
        }
    } catch (error) {
        console.error(`Error saving anonymous history entry:`, error);
        // Decide whether to throw or just log
        // throw new Error('Failed to save search history.');
    }
}

// --- Function to save recipe details to the general 'recipes' collection ---
/**
 * Saves the details of a generated recipe to the main 'recipes' collection.
 * Useful for keeping a record of all generated recipes, independent of user saving.
 * Uses recipeName as a potential unique key (consider making it unique index in MongoDB).
 * @param recipe The recipe object to save.
 * @returns A promise resolving to the ObjectId of the inserted/updated recipe.
 */
export async function saveGeneratedRecipeDetails(recipe: RecipeItem): Promise<ObjectId | null> {
    if (!recipe || !recipe.recipeName) {
        console.warn("Attempted to save invalid recipe details.");
        return null;
    }
    const { recipesCollection } = await getDbCollections();

    // Remove potentially user-specific fields if they exist from previous structures
    // Although user context is removed, keep this for robustness in case `recipe` object changes
    const { createdBy, ...recipeData } = recipe as any; // Use 'any' temporarily if type mismatch

    const recipeDoc: Omit<RecipeDocument, '_id' | 'createdAt'> & { createdAt?: Date } = {
        ...recipeData,
        // createdBy is removed
    };

    try {
        // Use updateOne with upsert: if a recipe with the same name exists, update it (optional),
        // otherwise insert a new one.
        const result = await recipesCollection.updateOne(
            { recipeName: recipe.recipeName }, // Find based on name
            {
                $set: recipeDoc, // Set all fields (overwrites existing except _id)
                $setOnInsert: { createdAt: new Date() } // Only set createdAt on insert
            },
            { upsert: true }
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
        } else {
             console.log(`Recipe "${recipe.recipeName}" already exists and was not modified.`);
              const existingRecipe = await recipesCollection.findOne({ recipeName: recipe.recipeName });
              savedId = existingRecipe?._id || null;
        }
        return savedId;
    } catch (error) {
        console.error(`Error saving recipe details for "${recipe.recipeName}" to recipes collection:`, error);
        return null; // Return null or throw error as needed
    }
}

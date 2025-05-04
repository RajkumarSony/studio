// src/lib/firebase/firestore.ts
'use server'; // Indicate this runs on the server or can be called from server components/actions

import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './config'; // Import the initialized Firestore instance
import type { RecipeItem } from '@/ai/flows/suggest-recipe';

/**
 * Saves a recipe to a user's savedRecipes subcollection in Firestore.
 * Creates the user document if it doesn't exist.
 * @param userId The ID of the user (Firebase Auth UID).
 * @param recipe The recipe object to save.
 * @returns A promise that resolves when the recipe is saved.
 */
export async function saveRecipeToFirestore(userId: string, recipe: RecipeItem): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save a recipe.');
  }
  if (!recipe || !recipe.recipeName) {
    throw new Error('Invalid recipe data provided.');
  }

  try {
    // Use recipeName as the document ID (or generate a unique one if names can collide)
    // Sanitize recipeName to be a valid Firestore document ID if necessary
    const recipeDocId = recipe.recipeName.replace(/[/ *]/g, '_'); // Basic sanitization
    const recipeRef = doc(db, 'users', userId, 'savedRecipes', recipeDocId);

    // Omit fields that might be problematic or very large if needed (e.g., large data URIs)
    // const dataToSave = { ...recipe, imageUrl: recipe.imageUrl?.startsWith('http') ? recipe.imageUrl : undefined };
    // For now, save the full recipe item
    const dataToSave = recipe;


    // Using setDoc will create or overwrite the document
    await setDoc(recipeRef, dataToSave);
    console.log(`Recipe "${recipe.recipeName}" saved for user ${userId}`);
  } catch (error) {
    console.error(`Error saving recipe "${recipe.recipeName}" for user ${userId}:`, error);
    throw new Error('Failed to save recipe.'); // Re-throw for handling in the calling function
  }
}

/**
 * Checks if a specific recipe is saved by a user.
 * @param userId The ID of the user.
 * @param recipeName The name of the recipe to check.
 * @returns A promise that resolves to true if the recipe is saved, false otherwise.
 */
export async function isRecipeSaved(userId: string, recipeName: string): Promise<boolean> {
   if (!userId || !recipeName) {
     return false;
   }
   try {
     const recipeDocId = recipeName.replace(/[/ *]/g, '_'); // Ensure consistent ID format
     const recipeRef = doc(db, 'users', userId, 'savedRecipes', recipeDocId);
     const docSnap = await getDoc(recipeRef);
     return docSnap.exists();
   } catch (error) {
     console.error(`Error checking if recipe "${recipeName}" is saved for user ${userId}:`, error);
     return false; // Assume not saved on error
   }
}

/**
 * Retrieves all saved recipes for a user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of saved RecipeItem objects.
 */
export async function getSavedRecipesFromFirestore(userId: string): Promise<RecipeItem[]> {
  if (!userId) {
    console.warn('User ID is required to fetch saved recipes.');
    return [];
  }

  try {
    const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
    const querySnapshot = await getDocs(savedRecipesRef);
    const savedRecipes: RecipeItem[] = [];
    querySnapshot.forEach((doc) => {
      // Ensure the data matches the RecipeItem structure, handle potential discrepancies
      const data = doc.data();
      if (data.recipeName && data.ingredients && data.instructions) { // Basic validation
         savedRecipes.push(data as RecipeItem);
      } else {
          console.warn(`Invalid recipe data found in Firestore for user ${userId}, doc ID ${doc.id}:`, data);
      }
    });
    console.log(`Fetched ${savedRecipes.length} saved recipes for user ${userId}`);
    return savedRecipes;
  } catch (error) {
    console.error(`Error fetching saved recipes for user ${userId}:`, error);
    // Consider returning an error state or throwing
    return []; // Return empty array on error for now
  }
}

/**
 * Removes a saved recipe from a user's collection.
 * @param userId The ID of the user.
 * @param recipeName The name of the recipe to remove.
 * @returns A promise that resolves when the recipe is removed.
 */
export async function removeRecipeFromFirestore(userId: string, recipeName: string): Promise<void> {
   if (!userId || !recipeName) {
     throw new Error('User ID and recipe name are required to remove a recipe.');
   }
   try {
     const recipeDocId = recipeName.replace(/[/ *]/g, '_'); // Ensure consistent ID format
     const recipeRef = doc(db, 'users', userId, 'savedRecipes', recipeDocId);
     await deleteDoc(recipeRef);
     console.log(`Recipe "${recipeName}" removed for user ${userId}`);
   } catch (error) {
     console.error(`Error removing recipe "${recipeName}" for user ${userId}:`, error);
     throw new Error('Failed to remove recipe.');
   }
}

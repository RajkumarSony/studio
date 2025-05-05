// src/app/page.tsx
'use client';

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {
  Loader2,
  ChefHat,
  Moon,
  Sun,
  Clock,
  BarChart,
  ImageOff, // Import fallback icon
  Languages, // Icon for language selector
  Sparkles, // Icon for AI features
  Palette, // Icon for theme switching
  Info, // Icon for additional info/tips
  Scale, // Example: Icon for difficulty/serving size?
  Soup, // Example: Icon for recipe type?
  Heart, // Icon for saving/favoriting? Filled Heart when saved
  HeartCrack, // Icon for unsave
  BookOpen, // For Ingredients/Instructions titles
  AlertTriangle, // For Warnings
  ArrowRight, // Icon for navigation
  FileText, // Icon for including details
  RotateCcw, // Icon for reset button
  CloudOff, // Icon for network error
  Save, // Icon for Saved Recipes button
  Printer // Icon for Print button (added to recipe detail page, but maybe useful elsewhere)
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {useTheme} from 'next-themes';
import type {SuggestRecipesInput, RecipeItem} from '@/ai/flows/suggest-recipe';
import {suggestRecipes} from '@/ai/flows/suggest-recipe';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils';
import {motion, AnimatePresence} from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import { translations, type LanguageCode } from '@/lib/translations'; // Import translations
import Link from 'next/link'; // Import Link for navigation
import { useRouter } from 'next/navigation'; // Import useRouter
// DB functions related to user accounts removed or adapted
// import { saveRecipeToMongoDB, saveRecipeHistory } from '@/lib/db/recipes'; // Keep save functions if needed for guest history/saving - Removed DB interaction for now
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import SavedRecipesDialog from '@/components/SavedRecipesDialog'; // Import SavedRecipesDialog

// Constants for sessionStorage keys
const FORM_STATE_KEY = 'recipeSageFormState';
const RECIPE_RESULTS_KEY = 'recipeSageResults';
const SAVED_RECIPES_KEY = 'recipeSageSavedRecipes'; // Key for localStorage
const MAX_STORAGE_IMAGE_SIZE = 500000; // 500KB limit for image data URIs in storage


// Define supported languages and their corresponding CSS font variables
const supportedLanguages: { value: LanguageCode; label: string; fontVariable: string }[] = [
  { value: 'en', label: 'English', fontVariable: 'var(--font-noto-sans)' },
  { value: 'hi', label: 'हिन्दी (Hindi)', fontVariable: 'var(--font-noto-sans-devanagari)' },
  { value: 'bn', label: 'বাংলা (Bengali)', fontVariable: 'var(--font-noto-sans-bengali)' },
  { value: 'mr', label: 'मराठी (Marathi)', fontVariable: 'var(--font-noto-sans-devanagari)' }, // Uses Devanagari
  { value: 'ta', label: 'தமிழ் (Tamil)', fontVariable: 'var(--font-noto-sans-tamil)' },
  { value: 'te', label: 'తెలుగు (Telugu)', fontVariable: 'var(--font-noto-sans-telugu)' },
  { value: 'or', label: 'ଓଡ଼ିଆ (Odia)', fontVariable: 'var(--font-noto-sans-oriya)' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', fontVariable: 'var(--font-noto-sans-gurmukhi)' },
  { value: 'ja', label: '日本語 (Japanese)', fontVariable: 'var(--font-noto-sans-jp)' },
  { value: 'es', label: 'Español (Spanish)', fontVariable: 'var(--font-noto-sans)' }, // Assuming default Noto Sans covers Spanish well
  { value: 'fr', label: 'Français (French)', fontVariable: 'var(--font-noto-sans)' }, // Assuming default Noto Sans covers French well
];


// Define form schema using Zod
const formSchema = (t: (key: keyof typeof translations.en.form) => string) => z.object({
  ingredients: z.string().min(3, {
    message: t('ingredientsError'), // Use translation key
  }),
  dietaryRestrictions: z.string().optional(),
  preferences: z.string().optional(),
  quickMode: z.boolean().optional(),
  servingSize: z.number().int().min(1).optional(),
  cuisineType: z.string().optional(), // Added cuisine type
  cookingMethod: z.string().optional(), // Added cooking method
  includeDetails: z.boolean().optional(), // Added field for nutrition/diet details
});

// Type for form values
type FormValues = z.infer<ReturnType<typeof formSchema>>;

export default function Home() {
  const {setTheme} = useTheme();
  const router = useRouter();

  const [recipes, setRecipes] = useState<RecipeItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isClient, setIsClient] = useState(false);
  const [savedRecipeNames, setSavedRecipeNames] = useState<Set<string>>(new Set()); // State for saved recipes (using names as identifiers)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track if initial load from storage is done
  const [error, setError] = useState<string | null>(null); // State for holding error messages
  const [isSavedRecipesDialogOpen, setIsSavedRecipesDialogOpen] = useState(false);


   // Translation function
   const t = useCallback(
     (key: string, options?: { [key: string]: string | number }) => {
       // Determine the translation object based on selectedLanguage, fallback to 'en'
       const messages = translations[selectedLanguage] || translations.en;

       // Split key for nested access, e.g., "form.ingredientsLabel"
       const keys = key.split('.');
       let result: any = messages;

       for (const k of keys) {
         result = result?.[k];
         if (result === undefined) {
           // Fallback to English if key not found in selected language
           let fallbackResult: any = translations.en;
           for (const fk of keys) {
             fallbackResult = fallbackResult?.[fk];
             if (fallbackResult === undefined) {
               console.warn(`Translation key "${key}" not found in language "${selectedLanguage}" or fallback "en".`);
               return key; // Return key itself if not found anywhere
             }
           }
           result = fallbackResult || key;
           break; // Stop searching once found in fallback
         }
       }

       // Replace placeholders like {count} or {recipeName}
       if (typeof result === 'string' && options) {
         Object.keys(options).forEach((placeholder) => {
           result = result.replace(`{${placeholder}}`, String(options[placeholder]));
         });
       }

       return typeof result === 'string' ? result : key; // Ensure we return a string
     },
     [selectedLanguage] // Recreate `t` only when selectedLanguage changes
   );

  // Memoize the form schema generation based on the translation function `t`
  const currentFormSchema = React.useMemo(() => formSchema(t as any), [t]);


  // Initialize form with the dynamic schema
  const form = useForm<FormValues>({
      resolver: zodResolver(currentFormSchema),
      defaultValues: {
        ingredients: '',
        dietaryRestrictions: '',
        preferences: '',
        quickMode: false,
        servingSize: undefined,
        cuisineType: '',
        cookingMethod: '',
        includeDetails: false, // Default to false
      },
      // Re-validate on language change might be needed if error messages depend on language
      // mode: "onChange", // Or "onBlur"
    });

  // Update form resolver and reset validation state when language changes
  useEffect(() => {
      form.reset(form.getValues(), { // Keep current values
          keepErrors: false, // Clear previous validation errors
          keepDirty: true,
          keepTouched: false,
          keepIsValid: false, // Force revalidation with new schema/translations
          keepSubmitCount: false,
      });
  }, [currentFormSchema, form]);


  // Update CSS variable for dynamic font switching when language changes
  useEffect(() => {
    const selectedLangData = supportedLanguages.find(lang => lang.value === selectedLanguage);
    const fontVariable = selectedLangData ? selectedLangData.fontVariable : 'var(--font-noto-sans)'; // Default fallback
    document.documentElement.style.setProperty('--font-dynamic', fontVariable);
    document.documentElement.lang = selectedLanguage;
    // Persist language choice to localStorage only on client
    if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }
  }, [selectedLanguage]);


  // Load state from storage on initial client mount
  useEffect(() => {
    setIsClient(true); // Indicate client-side rendering

    // Load selected language from localStorage
    const storedLanguage = localStorage.getItem('selectedLanguage');
    if (storedLanguage && supportedLanguages.some(l => l.value === storedLanguage)) {
      setSelectedLanguage(storedLanguage as LanguageCode);
    }

    // Load saved recipe names from localStorage
    try {
       const storedSavedRecipes = localStorage.getItem(SAVED_RECIPES_KEY);
       if (storedSavedRecipes) {
           const parsedSavedRecipes: RecipeItem[] = JSON.parse(storedSavedRecipes);
           setSavedRecipeNames(new Set(parsedSavedRecipes.map(r => r.recipeName)));
           console.log(`Restored ${parsedSavedRecipes.length} saved recipe names from localStorage.`);
       } else {
           console.log("No saved recipes found in localStorage.");
           setSavedRecipeNames(new Set());
       }
     } catch (err) {
       console.warn("Could not restore saved recipes from localStorage:", err);
       localStorage.removeItem(SAVED_RECIPES_KEY); // Clear potentially corrupted data
       setSavedRecipeNames(new Set());
     }


    // Load previous form state and results from sessionStorage
    try {
      const storedFormState = sessionStorage.getItem(FORM_STATE_KEY);
      const storedResults = sessionStorage.getItem(RECIPE_RESULTS_KEY);

      if (storedFormState) {
        const parsedFormState: FormValues = JSON.parse(storedFormState);
        form.reset(parsedFormState); // Restore form values
        console.log("Restored form state from sessionStorage.");
      }

      if (storedResults) {
        const parsedResults: RecipeItem[] & { imageOmitted?: boolean }[] = JSON.parse(storedResults);
         // Rehydrate potentially omitted large image URLs from the full recipes state if it exists
         // This assumes `recipes` state might still hold the full data from the last API call
         // or if the `recipes` state was also persisted elsewhere (which it isn't currently).
         // A more robust approach might involve storing image URLs separately if they are too large.
         const rehydratedResults = parsedResults.map(storedRecipe => {
             // Find the full recipe data if it's still in the main 'recipes' state
             const fullRecipe = recipes?.find(r => r.recipeName === storedRecipe.recipeName);

             if (storedRecipe.imageOmitted && fullRecipe?.imageUrl) {
                 console.log(`Rehydrating omitted image URL for ${storedRecipe.recipeName}`);
                 // Merge the stored data (which might have language) with the full image URL
                 return { ...storedRecipe, imageUrl: fullRecipe.imageUrl, imageOmitted: false };
             } else if (storedRecipe.imageOmitted) {
                 // Ensure imageUrl is undefined if image was omitted
                 return { ...storedRecipe, imageUrl: undefined };
             }
             return storedRecipe; // Return as is if not omitted or no full recipe found
         });

         setRecipes(rehydratedResults as RecipeItem[]); // Restore previous results
         console.log(`Restored ${rehydratedResults.length} recipe results from sessionStorage.`);
      } else {
         console.log("No previous results found in sessionStorage.");
         setRecipes(null); // Explicitly set to null if nothing found
      }
    } catch (error) {
      console.warn("Could not restore state from sessionStorage:", error);
      // Optionally clear potentially corrupted storage
      sessionStorage.removeItem(FORM_STATE_KEY);
      sessionStorage.removeItem(RECIPE_RESULTS_KEY);
      setRecipes(null); // Set to null on error
      form.reset(); // Reset form on error
    } finally {
        setInitialLoadComplete(true); // Mark initial load as complete
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount


   // Handle form reset
   const handleReset = () => {
    form.reset(); // Resets to defaultValues defined in useForm
    setRecipes(null);
    setIsLoading(false);
    setError(null); // Clear any previous errors
     // Clear sessionStorage
     try {
        sessionStorage.removeItem(FORM_STATE_KEY);
        sessionStorage.removeItem(RECIPE_RESULTS_KEY);
        console.log("Cleared form state and results from sessionStorage.");
      } catch (err) {
        console.warn("Could not clear sessionStorage:", err);
          if (err instanceof Error) {
             setError(`${t('toast.storageErrorTitle')}: ${err.message}`); // Use t()
           } else {
             setError(t('toast.storageErrorDesc')); // Use t()
           }
      }
    // Log instead of toast
    console.log(t('toast.formClearedTitle'), t('toast.formClearedDesc'));
  };

  // Handle saving/unsaving a recipe using localStorage
  const handleToggleSaveRecipe = (recipe: RecipeItem) => {
    if (!recipe || !recipe.recipeName) return;

    try {
      const savedRecipes = localStorage.getItem(SAVED_RECIPES_KEY);
      let currentSaved: RecipeItem[] = savedRecipes ? JSON.parse(savedRecipes) : [];
      const recipeIndex = currentSaved.findIndex(r => r.recipeName === recipe.recipeName);

      let updatedSavedRecipes: RecipeItem[];
      let newSavedNames = new Set(savedRecipeNames);

      if (recipeIndex > -1) {
        // Recipe exists, unsave it
        updatedSavedRecipes = currentSaved.filter((_, index) => index !== recipeIndex);
        newSavedNames.delete(recipe.recipeName);
        console.log(t('toast.recipeRemovedTitle'), t('toast.recipeRemovedDesc', { recipeName: recipe.recipeName }));
      } else {
        // Recipe doesn't exist, save it
        // Prepare recipe for storage (omit large image)
        const recipeToSave: RecipeItem & { imageOmitted?: boolean } = {
          ...recipe,
          imageUrl: (recipe.imageUrl && recipe.imageUrl.startsWith('data:') && recipe.imageUrl.length >= MAX_STORAGE_IMAGE_SIZE)
            ? undefined // Omit large data URI
            : recipe.imageUrl,
          imageOmitted: !!(recipe.imageUrl && recipe.imageUrl.startsWith('data:') && recipe.imageUrl.length >= MAX_STORAGE_IMAGE_SIZE),
          language: selectedLanguage, // Optionally store language context
        };
        updatedSavedRecipes = [...currentSaved, recipeToSave];
        newSavedNames.add(recipe.recipeName);
        console.log(t('toast.recipeSavedTitle'), t('toast.recipeSavedDesc', { recipeName: recipe.recipeName }));
      }

      // Save updated list to localStorage
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedSavedRecipes));
      setSavedRecipeNames(newSavedNames); // Update the state for UI feedback

    } catch (err) {
      console.error("Error saving/unsaving recipe to localStorage:", err);
       if (err instanceof DOMException && err.name === 'QuotaExceededError') {
            console.error(t('toast.storageQuotaExceededTitle'), t('toast.storageQuotaExceededDesc'));
            setError(t('toast.storageQuotaExceededDesc'));
       } else {
           console.error(t('toast.saveErrorTitle'), t('toast.saveErrorDesc'));
           setError(t('toast.saveErrorDesc'));
       }
    }
  };


 // Function to navigate to recipe detail page
  const handleViewRecipe = (recipe: RecipeItem) => {
    setError(null); // Clear error before navigation
    console.log(`Initiating navigation for recipe: "${recipe.recipeName}"`);
    try {
      const queryParams = new URLSearchParams();
      const addParam = (key: string, value: string | undefined | null | number | boolean) => {
          if (value !== undefined && value !== null && value !== '') { // Ensure empty strings are not added
              // Convert boolean/number to string explicitly for query params
              queryParams.set(key, String(value));
          }
      };

      // Create a slug from the recipe name (more robust sanitization)
       const slug = recipe.recipeName
           .toLowerCase()
           .replace(/\s+/g, '-') // Replace spaces with hyphens
           .replace(/[^\w-]+/g, '') // Remove non-word characters (except hyphens)
           .replace(/--+/g, '-') // Replace multiple hyphens with single
           .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
           .substring(0, 100); // Limit slug length

      // Add essential parameters to the query string
      addParam('name', recipe.recipeName); // Pass the name for identification
      addParam('time', recipe.estimatedTime);
      addParam('difficulty', recipe.difficulty);
      addParam('lang', selectedLanguage);
      // Only include nutrition/diet if they exist
      addParam('nutrition', recipe.nutritionFacts);
      addParam('diet', recipe.dietPlanSuitability);

      // Prepare data for sessionStorage (exclude large image URI by default)
      // Add language used to generate this specific recipe
      const dataToStore: Partial<RecipeItem> & { imageOmitted?: boolean; language?: LanguageCode } = {
        recipeName: recipe.recipeName, // Keep name for matching
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        estimatedTime: recipe.estimatedTime,
        difficulty: recipe.difficulty,
        imagePrompt: recipe.imagePrompt,
        nutritionFacts: recipe.nutritionFacts,
        dietPlanSuitability: recipe.dietPlanSuitability,
        language: selectedLanguage, // Include the language context for this recipe
        // Omit imageUrl initially
        imageUrl: undefined,
        imageOmitted: false,
      };

      // Handle image URL storage conditionally
      const isDataUri = recipe.imageUrl?.startsWith('data:');
      const MAX_URL_LENGTH = 1500; // Max length for query param

      if (recipe.imageUrl) {
          if (!isDataUri && recipe.imageUrl.length < MAX_URL_LENGTH) {
              addParam('imageUrl', recipe.imageUrl); // Pass short URLs in query
              dataToStore.imageUrl = recipe.imageUrl; // Also store it for consistency
              console.log("Passing short image URL in query params.");
          } else if (isDataUri && recipe.imageUrl.length < MAX_STORAGE_IMAGE_SIZE) {
              dataToStore.imageUrl = recipe.imageUrl; // Store manageable data URIs
              addParam('imageStored', 'true'); // Indicate image is in storage
              console.log("Storing manageable image data URI in sessionStorage.");
          } else if (isDataUri) {
               // Image is too large for both query and storage
               console.warn(`Image data URI for ${recipe.recipeName} is too large (${recipe.imageUrl.length} bytes) to store or pass in URL. Omitting.`);
               dataToStore.imageOmitted = true; // Mark as omitted in storage
               addParam('imageUnavailable', 'true'); // Indicate no image available via URL
          } else {
              // Long HTTP URL - pass via storage
              dataToStore.imageUrl = recipe.imageUrl; // Store long URLs
              addParam('imageStored', 'true');
              console.log("Storing long image HTTP URL in sessionStorage.");
          }
       } else {
         console.log(`No image URL provided for ${recipe.recipeName}.`);
          addParam('imageUnavailable', 'true'); // Explicitly state no image
       }


      // Store potentially large/complex data in sessionStorage
      // Generate a unique key for this recipe's data
      const storageKey = `recipeDetail-${slug}`; // Use slug for a predictable key
      let storageSuccess = false;
      try {
          const serializedRecipe = JSON.stringify(dataToStore);
          // Check size before attempting to store
          if (serializedRecipe.length > MAX_STORAGE_IMAGE_SIZE * 1.5) { // Add some buffer, adjust as needed
             console.warn(`Serialized recipe data for ${recipe.recipeName} is too large (${serializedRecipe.length} bytes) for sessionStorage. Omitting image if possible.`);
             // Attempt to store without image data URI if it's the large part
             if(dataToStore.imageUrl?.startsWith('data:')) {
                 const dataWithoutImage = {...dataToStore, imageUrl: undefined, imageOmitted: true };
                 const smallerSerializedRecipe = JSON.stringify(dataWithoutImage);
                 // Retry storing the smaller version
                  try {
                      sessionStorage.setItem(storageKey, smallerSerializedRecipe);
                      const writtenData = sessionStorage.getItem(storageKey);
                      if (writtenData === smallerSerializedRecipe) {
                         storageSuccess = true;
                         addParam('storageKey', storageKey); // Pass the key to retrieve data
                         addParam('imageUnavailable', 'true'); // Indicate image was omitted
                         console.log("Recipe detail data (without large image) successfully stored and verified in sessionStorage with key:", storageKey);
                      } else {
                         console.error("SessionStorage write verification failed after omitting image for key:", storageKey);
                         setError(t('toast.storageErrorDesc'));
                      }
                  } catch (retryStorageError) {
                      console.error("Error saving recipe details (without image) to sessionStorage for key", storageKey, ":", retryStorageError);
                      setError(t('toast.storageErrorDesc')); // Generic storage error
                      // Ensure potentially corrupted item is removed
                      try { sessionStorage.removeItem(storageKey); } catch (_) { /* Ignore cleanup error */ }
                  }
             } else {
                 // If the large size isn't from a data URI image, storage will likely fail
                 setError(t('toast.storageQuotaExceededDesc'));
             }
          } else {
             // Proceed with storing the original serialized data if size is acceptable
             sessionStorage.setItem(storageKey, serializedRecipe);
             // **Verification Step:** Immediately read back to confirm write
             const writtenData = sessionStorage.getItem(storageKey);
             if (writtenData === serializedRecipe) {
                 storageSuccess = true;
                 addParam('storageKey', storageKey); // Pass the key to retrieve data
                 console.log("Recipe detail data successfully stored and verified in sessionStorage with key:", storageKey);
             } else {
                 // This should ideally not happen if setItem doesn't throw
                 console.error("SessionStorage write verification failed! Data mismatch after write for key:", storageKey);
                 setError(t('toast.storageErrorDesc'));
             }
          }
      } catch (storageError) {
          console.error("Error saving recipe details to sessionStorage for key", storageKey, ":", storageError);
          if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
              console.error(t('toast.storageQuotaExceededTitle'), t('toast.storageQuotaExceededDesc'));
               setError(t('toast.storageQuotaExceededDesc')); // Use t()
          } else {
               console.error(t('toast.storageErrorTitle'), t('toast.storageErrorDesc'));
               if (storageError instanceof Error) {
                  setError(`${t('toast.storageErrorTitle')}: ${storageError.message}`); // Use t()
                } else {
                  setError(t('toast.storageErrorDesc')); // Use t()
                }
          }
          // Ensure potentially corrupted item is removed
          try { sessionStorage.removeItem(storageKey); } catch (_) { /* Ignore cleanup error */ }
          // Do not add storageKey or imageStored params if storage failed
          queryParams.delete('storageKey');
          queryParams.delete('imageStored');
      }

      // Only navigate if storage was successful (or if no storage was needed/attempted)
      if (storageSuccess || !queryParams.has('storageKey')) {
           // Construct the final URL and navigate
           const url = `/recipe/${slug}?${queryParams.toString()}`;
           console.log("Navigating to URL:", url); // Log the final URL
           router.push(url);
       } else {
           console.error(`Navigation aborted for "${recipe.recipeName}" due to sessionStorage write failure.`);
           // Error state should already be set from the catch block
       }


    } catch (err) {
      console.error(`Error preparing recipe details for viewing "${recipe.recipeName}":`, err);
       if (err instanceof Error) {
         setError(`Navigation Error: ${err.message}`);
       } else {
         setError("An unknown error occurred while preparing recipe details.");
       }
    }
  };


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setRecipes(null); // Clear previous results immediately
    setError(null); // Clear previous errors

    // Clear previous results from sessionStorage immediately
    try {
      sessionStorage.removeItem(RECIPE_RESULTS_KEY);
      sessionStorage.removeItem(FORM_STATE_KEY);
      console.log("Cleared previous state from sessionStorage before new search.");
    } catch (err) {
      console.warn("Could not clear sessionStorage before search:", err);
       if (err instanceof Error) {
         // Don't necessarily show this to the user, just log it
          console.error(`Error clearing session before search: ${err.message}`);
       }
    }

    try {
      // Enhance preferences based on new inputs
      let enhancedPreferences = values.preferences || '';
      if (values.quickMode) {
        enhancedPreferences += (enhancedPreferences ? ', ' : '') + t('form.quickModePreference'); // Use translation
      }
      if (values.servingSize) {
         enhancedPreferences += (enhancedPreferences ? ', ' : '') + t('form.servingSizePreference', { count: values.servingSize }); // Use translation with placeholder
      }
      if (values.cuisineType) {
          enhancedPreferences += (enhancedPreferences ? ', ' : '') + `${t('form.cuisineTypeLabel')}: ${values.cuisineType}`;
      }
       if (values.cookingMethod) {
          enhancedPreferences += (enhancedPreferences ? ', ' : '') + `${t('form.cookingMethodLabel')}: ${values.cookingMethod}`;
      }


      const input: SuggestRecipesInput = {
        ingredients: values.ingredients,
        dietaryRestrictions: values.dietaryRestrictions || undefined,
        preferences: enhancedPreferences || undefined, // Use enhanced preferences
        language: selectedLanguage,
        includeDetails: values.includeDetails, // Pass the switch value
      };

      console.log("Submitting to AI with input:", input); // Log input sent to AI

      const result = await suggestRecipes(input);
      console.log("Received recipes from AI:", result); // Log result from AI

      // Ensure results are always an array, even if API returns null/undefined unexpectedly
      const recipesArray = Array.isArray(result) ? result : [];
      setRecipes(recipesArray);

       // --- Store results and form state in sessionStorage ---
       if (recipesArray.length > 0) {
           try {
              // Prepare data for storage, omitting large image URLs
               const recipesForStorage = recipesArray.map(r => {
                   const { imageUrl, ...rest } = r;
                   const isDataUri = imageUrl?.startsWith('data:');
                   const imageOmitted = !!(imageUrl && isDataUri && imageUrl.length >= MAX_STORAGE_IMAGE_SIZE);

                   return {
                       ...rest,
                       // Only include imageUrl if it's not a data URI or if it's small enough
                       imageUrl: imageOmitted ? undefined : imageUrl,
                       imageOmitted: imageOmitted, // Flag if large image was omitted
                       language: selectedLanguage, // Store language context
                   };
               });

               // Attempt to store results and form state
               const serializedResults = JSON.stringify(recipesForStorage);
               const serializedFormState = JSON.stringify(values);

                // Check combined size before storing
                if (serializedResults.length + serializedFormState.length > 5 * 1024 * 1024 * 0.9) { // Check against ~90% of 5MB limit
                     console.warn("SessionStorage quota likely exceeded. Attempting to store minimal data.");
                     setError(t('toast.storageQuotaWarningDesc'));
                      // Try storing only form state and results WITHOUT images/instructions
                      const minimalRecipes = recipesArray.map(({ imageUrl, imageOmitted, instructions, ingredients, ...rest }) => ({
                           ...rest,
                           language: selectedLanguage,
                           imageOmitted: true,
                           // Omit large text fields too
                           ingredients: ingredients.substring(0, 100) + '...', // Truncate
                           instructions: instructions.substring(0, 100) + '...' // Truncate
                        }));
                     try {
                         sessionStorage.setItem(RECIPE_RESULTS_KEY, JSON.stringify(minimalRecipes));
                         sessionStorage.setItem(FORM_STATE_KEY, serializedFormState);
                         console.log("Stored minimal results and form state due to size constraints.");
                     } catch (minimalError) {
                         console.error("Failed to save even minimal state to sessionStorage:", minimalError);
                         setError(t('toast.storageErrorDesc')); // Generic storage error
                          // Clear storage if even minimal save fails
                          sessionStorage.removeItem(RECIPE_RESULTS_KEY);
                          sessionStorage.removeItem(FORM_STATE_KEY);
                     }
                } else {
                     // Store full data if size is acceptable
                     sessionStorage.setItem(RECIPE_RESULTS_KEY, serializedResults);
                     sessionStorage.setItem(FORM_STATE_KEY, serializedFormState);
                     console.log(`Stored ${recipesForStorage.length} results and form state in sessionStorage.`);
                }

           } catch (storageError) {
               console.error("Error storing results in sessionStorage:", storageError);
                if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
                   console.warn("SessionStorage quota exceeded. Clearing previous results/state and trying again with minimal data.");
                   setError(t('toast.storageQuotaWarningDesc')); // Inform user results might not persist
                    // Attempt to clear and retry storing only form state and results WITHOUT images/large text
                   try {
                       sessionStorage.removeItem(RECIPE_RESULTS_KEY);
                       sessionStorage.removeItem(FORM_STATE_KEY);
                        const minimalRecipes = recipesArray.map(({ imageUrl, imageOmitted, instructions, ingredients, ...rest }) => ({
                           ...rest,
                           language: selectedLanguage,
                           imageOmitted: true,
                           ingredients: ingredients.substring(0, 100) + '...',
                           instructions: instructions.substring(0, 100) + '...'
                        }));
                        sessionStorage.setItem(RECIPE_RESULTS_KEY, JSON.stringify(minimalRecipes));
                       sessionStorage.setItem(FORM_STATE_KEY, JSON.stringify(values));
                       console.warn("Stored minimal data after clearing due to quota exceeded error.");
                   } catch (retryError) {
                        console.error("Failed to save even minimal state to sessionStorage after clearing:", retryError);
                        setError(t('toast.storageErrorDesc')); // Generic storage error
                   }
                } else {
                   console.error(t('toast.storageErrorTitle'), t('toast.storageErrorDesc'));
                    if (storageError instanceof Error) {
                      setError(`${t('toast.storageErrorTitle')}: ${storageError.message}`); // Use t()
                    } else {
                      setError(t('toast.storageErrorDesc')); // Use t()
                    }
                }
           }
       } else {
           // If no recipes found, clear previous storage
           sessionStorage.removeItem(RECIPE_RESULTS_KEY);
           sessionStorage.removeItem(FORM_STATE_KEY);
           console.log("No recipes found, cleared previous state from sessionStorage.");
       }

       // --- Save search to history in MongoDB ---
       // REMOVED History saving related to DB


      if (recipesArray.length === 0) {
         console.log(t('toast.noRecipesTitle'), t('toast.noRecipesDesc'));
      } else {
         console.log(t('toast.recipesFoundTitle'), t('toast.recipesFoundDesc', {
              count: recipesArray.length,
              s: recipesArray.length > 1 ? 's' : '' // Basic pluralization
            }));
      }
    } catch (err) {
      console.error('Error suggesting recipes:', err);
      // Try to get a more specific error message
      let errorMessage = t('toast.genericError');
      let errorTitle = t('toast.errorTitle'); // Default error title

      if (err instanceof z.ZodError) {
          errorMessage = t('toast.validationError') || 'Input validation failed. Please check your entries.';
          // Optionally log specific validation errors: console.error("Validation Errors:", err.errors);
      } else if (err instanceof Error) {
           // Check for network errors (customize based on how errors are thrown)
          if (err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('failed to fetch')) {
               errorTitle = t('toast.networkErrorTitle');
               errorMessage = t('toast.networkErrorDesc');
          } else {
               errorMessage = err.message; // Use message from standard Error
          }
           // Check for specific Genkit errors if possible (needs inspection of error object)
           // Example: Check if it's a GenkitError and handle specific codes
           // if (err.name === 'GenkitError') {
           //     if (err.code === 'UNAVAILABLE') { // Example code
           //         errorMessage = t('toast.aiServiceUnavailable');
           //     } else if (err.code === 'PERMISSION_DENIED') {
           //         errorMessage = t('toast.apiKeyError'); // If API key is invalid
           //     }
           // }
      }
       console.error(`${errorTitle}: ${errorMessage}`);
       setError(`${errorTitle}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Animation Variants
  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Slightly faster stagger
        delayChildren: 0.1,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } } // Exit animation
  };

  const itemVariants = {
    hidden: {y: 15, opacity: 0}, // Smaller Y offset
    visible: {
      y: 0,
      opacity: 1,
      transition: {type: 'spring', stiffness: 120, damping: 15}, // Adjusted spring
    },
    exit: {y: -15, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }, // Faster exit upwards
  };

    const cardHoverEffect = {
      rest: { scale: 1, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", y: 0 },
      hover: { scale: 1.03, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)", y: -5 } // Enhanced shadow + slight lift
    };

   const buttonHoverEffect = {
     rest: { scale: 1 },
     hover: { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 15 } },
     tap: { scale: 0.95 }
   };


  const LoadingSkeleton = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-10 space-y-4"
    >
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="text-lg text-muted-foreground">
        {t('loadingMessage')}
      </span>
      {/* Add skeleton card placeholders */}
      <div className="w-full max-w-3xl space-y-6 mt-6">
        {[...Array(2)].map((_, i) => (
            <Card key={i} className="w-full shadow-md border border-border/30 overflow-hidden bg-card/50">
              <div className="h-48 bg-muted/30"></div> {/* Slightly taller image area */}
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-3/4 bg-muted/40 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-muted/40 rounded-full"></div>
                  <div className="h-5 w-24 bg-muted/40 rounded-full"></div>
                </div>
                 <div className="space-y-2 pt-2">
                   <div className="h-4 w-full bg-muted/40 rounded"></div>
                   <div className="h-4 w-5/6 bg-muted/40 rounded"></div>
                 </div>
               </CardContent>
                <CardFooter className="p-6 pt-0">
                   <div className="h-9 w-full bg-muted/40 rounded-md"></div> {/* Button placeholder */}
                </CardFooter>
            </Card>
        ))}
       </div>
    </motion.div>
  );

   // Render only after client-side mount and initial load is complete
   if (!isClient || !initialLoadComplete) {
        // Optionally show a basic loading state or null during initial setup
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }


  return (
    <>
      {/* Outer container for the entire page */}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/10 to-background dark:from-background dark:via-black/5 dark:to-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container flex h-16 items-center px-4 md:px-6">
            {/* Logo/Title */}
            <motion.div
              initial={{x: -20, opacity: 0}}
              animate={{x: 0, opacity: 1}}
              transition={{duration: 0.5, delay: 0.1, ease: "easeOut"}}
              className="mr-auto flex items-center flex-shrink-0"
            >
             <Link href="/" className="flex items-center gap-2 group" aria-label="Homepage">
               <ChefHat className="h-7 w-7 text-primary drop-shadow-sm transition-transform duration-300 group-hover:rotate-[-15deg]" />
               <span className="text-xl font-bold tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary/80 dark:to-primary/60">
                  {t('appTitle')}
               </span>
              </Link>
            </motion.div>

             {/* Controls: Language, Theme, Saved Recipes */}
             <motion.div
               initial={{ y: -20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
               className="flex items-center space-x-2 md:space-x-3"
              >
              <TooltipProvider delayDuration={100}>
                  {/* Language Selector */}
                   <Select
                     value={selectedLanguage}
                     onValueChange={(value) => {
                       const newLang = value as LanguageCode;
                       setSelectedLanguage(newLang);
                       // Store in localStorage only on the client
                       if (typeof window !== 'undefined') {
                           localStorage.setItem('selectedLanguage', newLang);
                       }
                     }}
                    >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectTrigger
                          className="w-auto h-9 px-2.5 gap-1.5 border-none shadow-none bg-transparent hover:bg-accent focus:ring-1 focus:ring-primary/50 transition-colors group"
                          aria-label={t('languageSelector.ariaLabel')}
                        >
                          <Languages className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground transition-colors" />
                          {/* Use placeholder and render selected language directly */}
                           <SelectValue placeholder={t('languageSelector.placeholder')}>
                             {isClient ? selectedLanguage.toUpperCase() : 'EN'}
                           </SelectValue>
                        </SelectTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('languageSelector.tooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <SelectContent className="max-h-60 overflow-y-auto backdrop-blur-md bg-popover/95 border border-border/50 shadow-lg">
                      {supportedLanguages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label} {/* Show full label in dropdown */}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                {/* Theme Toggle */}
                <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 focus:ring-1 focus:ring-primary/50 rounded-full" // Make it round
                              aria-label={t('themeSelector.ariaLabel')}
                            >
                              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                              <span className="sr-only">{t('themeSelector.ariaLabel')}</span>
                            </Button>
                           </motion.div>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{t('themeSelector.tooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  <DropdownMenuContent
                    align="end"
                    className="animate-in fade-in zoom-in-95 backdrop-blur-md bg-popover/95 border border-border/50 shadow-lg"
                  >
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="mr-2 h-4 w-4" /> {t('themeSelector.light')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon className="mr-2 h-4 w-4" /> {t('themeSelector.dark')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Palette className="mr-2 h-4 w-4" /> {t('themeSelector.system')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                 {/* Saved Recipes Button */}
                <Tooltip>
                   <TooltipTrigger asChild>
                     <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-9 w-9 focus:ring-1 focus:ring-primary/50 rounded-full relative"
                         onClick={() => setIsSavedRecipesDialogOpen(true)}
                         aria-label={t('savedRecipes.dialogOpenButtonAriaLabel')}
                       >
                         <Save className="h-[1.2rem] w-[1.2rem]" />
                         {/* Badge for saved count */}
                          {savedRecipeNames.size > 0 && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {savedRecipeNames.size}
                              </span>
                           )}
                         <span className="sr-only">{t('savedRecipes.dialogOpenButtonAriaLabel')}</span>
                       </Button>
                     </motion.div>
                   </TooltipTrigger>
                   <TooltipContent side="bottom">
                     <p>{t('savedRecipes.dialogOpenButtonTooltip')}</p>
                   </TooltipContent>
                 </Tooltip>

              </TooltipProvider>
            </motion.div>
          </div>
        </header>

        <main className="flex-1 container py-10 md:py-16 px-4 md:px-6">
          {/* Global Error Display */}
           {error && (
             <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6"
              >
                 <Alert variant="destructive">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle>{t('toast.errorTitle')}</AlertTitle>
                   <AlertDescription>{error}</AlertDescription>
                 </Alert>
             </motion.div>
           )}

          {/* Hero Section */}
          <motion.section
            initial={{opacity: 0, y: -20}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.6, delay: 0.2, ease: "easeOut"}}
            className="mb-12 text-center"
          >
             {/* Animated Gradient Title */}
             <motion.h1
                 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-teal-500 to-emerald-500 py-2 leading-tight"
                 style={{ backgroundSize: "200% 200%" }}
                 animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                 transition={{ duration: 4, ease: "linear", repeat: Infinity }}
             >
                 {t('hero.title')}
             </motion.h1>

            <motion.p
                className="text-muted-foreground mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
              {t('hero.subtitle')}
            </motion.p>
          </motion.section>

          {/* Form Card */}
          <motion.div
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            transition={{duration: 0.5, delay: 0.4, ease: "easeOut"}}
          >
            <Card className="w-full max-w-2xl mx-auto mb-12 shadow-lg border border-border/60 hover:shadow-xl transition-shadow duration-300 bg-card/90 backdrop-blur-sm overflow-hidden rounded-xl"> {/* Slightly more rounded */}
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
                <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 animate-pulse duration-1500" /> {/* Subtle pulse */}
                  {t('form.title')}
                </CardTitle>
                <CardDescription>
                  {t('form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                   {/* Use container variant for form fields */}
                   <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    {/* Ingredients Field */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="ingredients"
                        render={({field}) => (
                          <FormItem>
                            <FormLabel className="font-medium text-foreground/90 flex items-center gap-1.5">
                             <Soup size={16}/> {t('form.ingredientsLabel')} <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('form.ingredientsPlaceholder')}
                                {...field}
                                rows={4}
                                className="resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 rounded-md"
                                aria-required="true"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {/* Dietary Restrictions Field */}
                       <motion.div variants={itemVariants}>
                         <FormField
                           control={form.control}
                           name="dietaryRestrictions"
                           render={({field}) => (
                             <FormItem>
                               <FormLabel className="font-medium text-foreground/90">
                                 {t('form.dietaryRestrictionsLabel')}
                               </FormLabel>
                               <FormControl>
                                 <Input
                                   placeholder={t('form.dietaryRestrictionsPlaceholder')}
                                   {...field}
                                  className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 rounded-md"
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                       </motion.div>
                       {/* Preferences Field */}
                       <motion.div variants={itemVariants}>
                         <FormField
                           control={form.control}
                           name="preferences"
                           render={({field}) => (
                             <FormItem>
                               <FormLabel className="font-medium text-foreground/90">
                                 {t('form.preferencesLabel')}
                               </FormLabel>
                               <FormControl>
                                 <Input
                                   placeholder={t('form.preferencesPlaceholder')}
                                   {...field}
                                   className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 rounded-md"
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                       </motion.div>
                      {/* Cuisine Type Field */}
                      <motion.div variants={itemVariants}>
                         <FormField
                           control={form.control}
                           name="cuisineType"
                           render={({field}) => (
                             <FormItem>
                               <FormLabel className="font-medium text-foreground/90">
                                 {t('form.cuisineTypeLabel')}
                               </FormLabel>
                               <FormControl>
                                 <Input
                                   placeholder={t('form.cuisineTypePlaceholder')}
                                   {...field}
                                  className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 rounded-md"
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                       </motion.div>
                       {/* Cooking Method Field */}
                       <motion.div variants={itemVariants}>
                         <FormField
                           control={form.control}
                           name="cookingMethod"
                           render={({field}) => (
                             <FormItem>
                               <FormLabel className="font-medium text-foreground/90">
                                 {t('form.cookingMethodLabel')}
                               </FormLabel>
                               <FormControl>
                                 <Input
                                   placeholder={t('form.cookingMethodPlaceholder')}
                                   {...field}
                                   className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 rounded-md"
                                 />
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )}
                         />
                       </motion.div>
                    </div>

                    {/* Switches & Serving Size */}
                     <motion.div variants={itemVariants} className="space-y-4 pt-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 flex-wrap">
                             {/* Quick Mode Switch */}
                             <FormField
                               control={form.control}
                               name="quickMode"
                               render={({ field }) => (
                                 <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <FormControl>
                                     <Switch
                                       checked={field.value}
                                       onCheckedChange={field.onChange}
                                       id="quick-mode"
                                       aria-label={t('form.quickModeAriaLabel')}
                                     />
                                   </FormControl>
                                   <Label htmlFor="quick-mode" className="font-medium text-foreground/90 cursor-pointer text-sm">
                                     {t('form.quickModeLabel')} <span className="text-xs text-muted-foreground">({t('form.quickModeHint')})</span>
                                   </Label>
                                 </FormItem>
                               )}
                             />
                             {/* Include Details Switch */}
                              <FormField
                                control={form.control}
                                name="includeDetails"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                     <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="include-details"
                                        aria-label={t('form.includeDetailsAriaLabel')}
                                      />
                                    </FormControl>
                                    <Label htmlFor="include-details" className="font-medium text-foreground/90 cursor-pointer flex items-center gap-1.5 text-sm">
                                     <FileText size={14}/> {t('form.includeDetailsLabel')} <span className="text-xs text-muted-foreground">({t('form.includeDetailsHint')})</span>
                                    </Label>
                                  </FormItem>
                                )}
                              />
                         </div>

                        {/* Serving Size Input */}
                        <FormField
                          control={form.control}
                          name="servingSize"
                          render={({ field }) => (
                            <FormItem className="max-w-[200px]"> {/* Limit width */}
                              <FormLabel className="font-medium text-foreground/90 flex items-center gap-1.5 text-sm">
                               <Scale size={14} /> {t('form.servingSizeLabel')}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1" // Ensure integer steps
                                  placeholder={t('form.servingSizePlaceholder')}
                                  {...field}
                                  // Ensure value is handled correctly for number input
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow empty input or valid positive integers
                                    if (val === '' || /^[1-9]\d*$/.test(val)) {
                                        field.onChange(val === '' ? undefined : parseInt(val, 10));
                                    }
                                  }}
                                   className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 rounded-md w-full"
                                 />
                               </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                     </motion.div>


                    {/* Submit & Reset Buttons */}
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 pt-4">
                      <motion.div {...buttonHoverEffect} className="flex-1">
                        <Button
                          type="submit"
                          className="w-full py-3 text-base font-semibold transition-all duration-300 ease-out bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-[0.98] rounded-md" // Standard rounding
                          disabled={isLoading} // Disable only if recipe loading
                          aria-live="polite"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              {t('form.submitButtonLoading')}
                            </>
                          ) : (
                             <>
                              <Sparkles className="mr-2 h-5 w-5"/> {t('form.submitButton')}
                             </>
                          )}
                        </Button>
                      </motion.div>
                       <motion.div {...buttonHoverEffect}>
                         <Button
                          type="button"
                          variant="outline"
                          onClick={handleReset}
                          className="w-full sm:w-auto transition-colors duration-200 hover:bg-muted/80 dark:hover:bg-muted/20 border-border/70 rounded-md" // Standard rounding
                          disabled={isLoading}
                        >
                           <RotateCcw className="mr-2 h-4 w-4"/> {t('form.resetButton')}
                         </Button>
                       </motion.div>
                    </motion.div>
                   </motion.div> {/* End of form fields container */}
                  </form>
                </Form>
              </CardContent>
               {/* Card Footer with Info */}
              <CardFooter className="p-4 bg-muted/30 dark:bg-background/30 rounded-b-xl border-t border-border/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0" /> {t('form.footerNote')}
                </p>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {isLoading && isClient && (
                <motion.div key="loading">
                    <LoadingSkeleton />
                </motion.div>
            )}

            {/* Recipe Results Section */}
            {recipes && recipes.length > 0 && !isLoading && (
              <motion.section
                key="recipe-list"
                aria-labelledby="results-heading"
                className="mt-16"
               >
                 <motion.h2
                   id="results-heading"
                   className="text-3xl font-semibold text-center border-b pb-4 mb-8 text-foreground/90 dark:text-foreground/80"
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1, duration: 0.4 }}
                  >
                   {t('results.title')}
                 </motion.h2>
                 <motion.div
                   variants={containerVariants}
                   initial="hidden"
                   animate="visible"
                   exit="exit"
                   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" // Use grid layout
                 >
                  {recipes.map((recipe, index) => {
                      // Check if recipe is saved using the state
                      const isSaved = savedRecipeNames.has(recipe.recipeName);
                      return (
                        <motion.div
                            key={recipe.recipeName + index}
                            variants={itemVariants}
                             // Add lift-on-hover effect directly here
                             whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                          <motion.div whileHover="hover" initial="rest" animate="rest" variants={cardHoverEffect}>
                           <Card
                             className={cn(
                                'w-full h-full flex flex-col shadow-md border border-border/50 overflow-hidden transition-all duration-300 group bg-card backdrop-blur-sm rounded-xl' // More rounded
                              )}
                           >
                            {/* Recipe Image Header */}
                            <CardHeader className="p-0 relative aspect-[16/10] overflow-hidden group"> {/* Slightly taller aspect ratio */}
                               <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/40 dark:from-background/40 dark:to-background/20 flex items-center justify-center">
                                  {recipe.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={recipe.imageUrl}
                                      alt={t('results.imageAlt', { recipeName: recipe.recipeName })}
                                      width={400}
                                      height={250} // Adjust height for 16:10
                                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                      loading="lazy"
                                      // Optional: Add error handling for image loading
                                      // onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide broken image */ }}
                                    />
                                  ) : (
                                    <ImageOff className="h-12 w-12 text-muted-foreground/40" />
                                  )}
                               </div>
                              {/* Gradient overlay for text contrast */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none"></div>
                              {/* Title positioned at the bottom */}
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <CardTitle className="text-lg font-bold text-white drop-shadow-md line-clamp-2 leading-snug">
                                  {recipe.recipeName}
                                </CardTitle>
                              </div>
                               {/* Save/Unsave Button */}
                               <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-primary hover:text-primary-foreground transition-all opacity-80 group-hover:opacity-100 backdrop-blur-sm focus:ring-1 focus:ring-primary/50",
                                             isSaved && "bg-primary text-primary-foreground hover:bg-destructive hover:text-destructive-foreground" // Style when saved
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent card click if clicking the button
                                            handleToggleSaveRecipe(recipe)
                                         }}
                                        aria-label={isSaved ? t('results.unsaveButtonAriaLabel') : t('results.saveButtonAriaLabel')}
                                      >
                                         {isSaved ? <HeartCrack className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                                      </Button>
                                      </motion.div>
                                    </TooltipTrigger>
                                     <TooltipContent side="left">
                                        <p>{isSaved ? t('results.unsaveButtonTooltip') : t('results.saveButtonTooltip')}</p>
                                      </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                            </CardHeader>
                            {/* Recipe Details Content */}
                            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                              <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.1 }}
                                  className="flex flex-wrap gap-2 items-center">
                                 {/* Time Badge */}
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 border-primary/70 text-primary bg-primary/10 backdrop-blur-sm py-0.5 px-2 text-xs font-medium rounded-full" // Rounded pill shape
                                >
                                  <Clock className="h-3 w-3" />
                                  {recipe.estimatedTime}
                                </Badge>
                                {/* Difficulty Badge */}
                                <Badge
                                   variant="outline"
                                   className="flex items-center gap-1 border-secondary-foreground/40 text-secondary-foreground bg-secondary/50 dark:bg-secondary/20 backdrop-blur-sm py-0.5 px-2 text-xs font-medium rounded-full" // Rounded pill shape
                                >
                                  <BarChart className="h-3 w-3 -rotate-90" />
                                  {recipe.difficulty}
                                </Badge>
                              </motion.div>

                             {/* Short description/preview */}
                             <motion.p
                                 initial={{ opacity: 0, y: 5 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ duration: 0.3, delay: 0.2 }}
                                 className="text-sm text-muted-foreground line-clamp-3 leading-snug flex-grow" // Use flex-grow
                              >
                                 {/* Display first part of instructions or a default text */}
                                 {recipe.instructions?.split('\n')[0]?.replace(/^\s*(\d+\.|-)\s*/, '').trim() || t('results.defaultDescription')}
                               </motion.p>

                            </CardContent>
                             {/* View Recipe Button */}
                             <CardFooter className="p-4 pt-0">
                               <motion.div {...buttonHoverEffect} className="w-full">
                                 <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary border-border/70 rounded-md" // Standard rounding
                                    onClick={() => handleViewRecipe(recipe)}
                                  >
                                    {t('results.viewRecipeButton')}
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                  </Button>
                                </motion.div>
                              </CardFooter>
                          </Card>
                         </motion.div>
                        </motion.div>
                      );
                  })}
                </motion.div>
              </motion.section>
            )}

            {/* No Recipes Found Card */}
            {recipes !== null && recipes.length === 0 && !isLoading && (
              <motion.div
                key="no-recipes"
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -20}}
                transition={{duration: 0.4, ease: 'easeInOut'}}
                className="mt-16"
              >
                <Card className="w-full max-w-xl mx-auto text-center p-8 sm:p-10 shadow-sm border border-border/50 bg-card rounded-xl">
                   {/* Gentle pulse/scale animation for the icon */}
                  <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                   >
                     <ChefHat className="h-14 w-14 mx-auto text-muted-foreground/70 mb-5" />
                   </motion.div>
                  <p className="text-xl font-medium text-muted-foreground">
                    {t('results.noRecipesFoundTitle')}
                  </p>
                  <p className="text-base text-muted-foreground/80 mt-3">
                    {t('results.noRecipesFoundSuggestion')}
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

         {/* Footer */}
        <motion.footer
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.5, delay: 0.8 }} // Adjusted delay
          className="py-6 md:px-8 border-t border-border/40 mt-16 sm:mt-20 bg-muted/40 dark:bg-background/20"
        >
          <div className="container flex flex-col items-center justify-center gap-2 text-center md:flex-row md:justify-between">
            <p className="text-sm text-muted-foreground">
               {t('footer.builtWith')}
              <motion.a
                href="https://developers.google.com/studio"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
                 whileHover={{ color: "hsl(var(--primary))" }} // Example hover effect
              >
                Firebase Studio
              </motion.a>
               . {t('footer.poweredBy')}
            </p>
             <p className="text-xs text-muted-foreground/80">
               {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </motion.footer>
      </div>
      {/* Saved Recipes Dialog */}
       <SavedRecipesDialog
         isOpen={isSavedRecipesDialogOpen}
         onClose={() => setIsSavedRecipesDialogOpen(false)}
         onViewRecipe={handleViewRecipe} // Pass view function
         onRemoveRecipe={handleToggleSaveRecipe} // Pass remove function (same as toggle)
         language={selectedLanguage} // Pass current language
       />
    </>
  );
}

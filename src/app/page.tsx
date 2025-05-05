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
  CloudOff, // Icon for network error / Redis error
  Save, // Icon for Saved Recipes button
  Printer, // Icon for Print button (moved to detail page)
  RefreshCw, // Icon for retry button
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
import type {SuggestRecipesInput} from '@/ai/flows/suggest-recipe';
import {suggestRecipes} from '@/ai/flows/suggest-recipe';
import type { RecipeItem } from '@/types/recipe'; // Import the dedicated RecipeItem type
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
// Import MongoDB functions including getAllSavedRecipes
import { saveGeneratedRecipeDetails, saveRecipeHistory, deleteRecipeById, getAllSavedRecipes } from '@/lib/db/recipes';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import SavedRecipesDialog from '@/components/SavedRecipesDialog'; // Import SavedRecipesDialog
// Import server actions for Redis
import { checkRedisAvailability, getStoredState, setStoredState, deleteStoredState, storeRecipeForNavigation } from '@/actions/redisActions';
import type { FormValues } from '@/types/form'; // Import shared FormValues type
import { ObjectId } from 'mongodb'; // Needed for ObjectId checks if necessary, but prefer strings

// Constants for storage keys
const SELECTED_LANGUAGE_KEY = 'selectedLanguage'; // localStorage key for language

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
  category: z.string().optional().default('All'), // Category field
});


export default function Home() {
  const {setTheme} = useTheme();
  const router = useRouter();

  const [recipes, setRecipes] = useState<RecipeItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isClient, setIsClient] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track if initial load from storage is done
  const [error, setError] = useState<string | null>(null); // State for holding general error messages
  const [redisError, setRedisError] = useState<string | null>(null); // State for Redis specific errors
  const [isRedisAvailable, setIsRedisAvailable] = useState<boolean | null>(null); // Track Redis availability
  const [isSavedRecipesDialogOpen, setIsSavedRecipesDialogOpen] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set()); // Store saved recipe IDs (strings)


   // Translation function
   const t = useCallback(
     (key: string, options?: { [key: string]: string | number }) => {
       const messages = translations[selectedLanguage] || translations.en;
       const keys = key.split('.');
       let result: any = messages;

       for (const k of keys) {
         result = result?.[k];
         if (result === undefined) {
           let fallbackResult: any = translations.en;
           for (const fk of keys) {
             fallbackResult = fallbackResult?.[fk];
             if (fallbackResult === undefined) {
               console.warn(`Translation key "${key}" not found in language "${selectedLanguage}" or fallback "en".`);
               return key;
             }
           }
           result = fallbackResult || key;
           break;
         }
       }

       if (typeof result === 'string' && options) {
         Object.keys(options).forEach((placeholder) => {
           result = result.replace(`{${placeholder}}`, String(options[placeholder]));
         });
       }

       return typeof result === 'string' ? result : key;
     },
     [selectedLanguage]
   );

  const currentFormSchema = React.useMemo(() => formSchema(t as any), [t]);

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
        includeDetails: false,
        category: 'All',
      },
    });

  // Update form resolver when schema changes due to language change
  useEffect(() => {
      form.reset(form.getValues(), {
          keepErrors: false,
          keepDirty: true,
          keepTouched: false,
          keepIsValid: false,
          keepSubmitCount: false,
      });
  }, [currentFormSchema, form]);

  // Apply dynamic font and language settings
  useEffect(() => {
    const selectedLangData = supportedLanguages.find(lang => lang.value === selectedLanguage);
    const fontVariable = selectedLangData ? selectedLangData.fontVariable : 'var(--font-dynamic)';
    document.documentElement.style.setProperty('--font-dynamic', fontVariable);
    document.documentElement.lang = selectedLanguage;
    // Save language preference to localStorage client-side
    if (typeof window !== 'undefined') {
        localStorage.setItem(SELECTED_LANGUAGE_KEY, selectedLanguage);
    }
  }, [selectedLanguage]);


   // Function to fetch saved recipe IDs on mount
   const fetchSavedIds = useCallback(async () => {
     // Only fetch if needed (e.g., on initial load or after an action)
     try {
       const savedRecipes = await getAllSavedRecipes(); // Assuming this returns recipes with string IDs
       if (savedRecipes) {
         setSavedRecipeIds(new Set(savedRecipes.map(r => r._id)));
         console.log(`Fetched ${savedRecipes.length} saved recipe IDs.`);
       } else {
         console.warn("Could not fetch saved recipe IDs.");
         setSavedRecipeIds(new Set()); // Reset on error
       }
     } catch (err) {
       console.error("Error fetching saved recipe IDs:", err);
       setSavedRecipeIds(new Set());
     }
   }, []);


  // Load initial state on client mount
  useEffect(() => {
    setIsClient(true);
    setRedisError(null); // Reset Redis error on mount

    // Load language from localStorage
    const storedLanguage = localStorage.getItem(SELECTED_LANGUAGE_KEY);
    if (storedLanguage && supportedLanguages.some(l => l.value === storedLanguage)) {
      setSelectedLanguage(storedLanguage as LanguageCode);
    }

    // Fetch saved recipe IDs initially
    fetchSavedIds();


    // Check Redis availability and load state from Redis using server action
    const initializeState = async () => {
        try {
            const available = await checkRedisAvailability();
            setIsRedisAvailable(available);
            console.log(`Redis availability: ${available}`);

            if (available) {
                const { formState, results } = await getStoredState();
                if (formState) {
                    form.reset(formState);
                    console.log("Restored form state from Redis.");
                }
                if (results) {
                    setRecipes(results);
                    // Ensure savedRecipeIds are updated based on restored results
                     const restoredIds = new Set<string>();
                     results.forEach(recipe => {
                        if (recipe._id && typeof recipe._id === 'string') {
                           restoredIds.add(recipe._id);
                         }
                     });
                     // Combine with already fetched IDs (if any)
                     setSavedRecipeIds(prev => new Set([...prev, ...restoredIds]));
                    console.log(`Restored ${results.length} recipe results from Redis.`);
                } else {
                    setRecipes(null); // Set to null if nothing found
                    console.log("No previous results found in Redis.");
                }
            } else {
                console.warn("Redis is not available. Skipping state restoration from Redis.");
                setRecipes(null); // Ensure recipes are null if Redis isn't available
                // Don't reset form here, let localStorage values persist if any
                // form.reset(); // Reset form if no state could be loaded - Reconsider this
            }
        } catch (err: any) {
            console.error("Error during state initialization:", err);
            setRedisError(`${t('toast.storageErrorTitle')}: ${err.message || 'Failed to connect or retrieve state'}`);
            setIsRedisAvailable(false); // Assume not available on error
            setRecipes(null);
            // Don't reset form here either
            // form.reset();
        } finally {
            setInitialLoadComplete(true); // Mark load complete
        }
    };

    initializeState();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, fetchSavedIds]); // Include fetchSavedIds in dependencies

   // Handle form reset
   const handleReset = async () => {
     form.reset();
     setRecipes(null);
     setIsLoading(false);
     setError(null);
     setRedisError(null); // Clear Redis-specific error UI state

     // Clear Redis state using server action
     if (isRedisAvailable) {
         try {
             const success = await deleteStoredState();
             if (success) {
                 console.log("Cleared form state and results from Redis via server action.");
             } else {
                 console.warn("Server action reported failure clearing Redis state.");
                  setRedisError(t('toast.storageErrorDesc') + ' (Clear Failed)');
             }
         } catch (err: any) {
             console.error("Error calling deleteStoredState action:", err);
             setRedisError(`${t('toast.storageErrorTitle')}: ${err.message || 'Failed to clear Redis data'}`);
         }
     } else {
         console.log("Redis not available, state was not stored in Redis.");
     }
     console.log("Form reset complete.");
   };

  // Handle saving/unsaving a recipe using DB actions
  const handleToggleSaveRecipe = async (recipe: RecipeItem & { _id?: string | ObjectId }) => {
     if (!recipe || !recipe.recipeName) return;
     setError(null); // Clear previous errors

     // Ensure ID is a string for consistency
     const recipeId = typeof recipe._id === 'string' ? recipe._id : recipe._id?.toString();
     const isCurrentlySaved = !!(recipeId && savedRecipeIds.has(recipeId));

     if (isCurrentlySaved && recipeId) {
         // --- Unsave (Delete from DB) ---
         try {
             const success = await deleteRecipeById(recipeId);
             if (success) {
                 console.log(t('toast.recipeRemovedDesc', { recipeName: recipe.recipeName }));
                 // Update local state of saved IDs
                 setSavedRecipeIds(prev => {
                     const newSet = new Set(prev);
                     newSet.delete(recipeId);
                     return newSet;
                 });
             } else {
                 console.error(`Failed to delete recipe "${recipe.recipeName}" (ID: ${recipeId}) from MongoDB.`);
                 setError(t('toast.saveErrorDesc') + ' (DB Delete)');
             }
         } catch (dbError) {
             console.error(`Error deleting recipe "${recipe.recipeName}" from MongoDB:`, dbError);
             setError(t('toast.saveErrorDesc') + ' (DB Delete)');
         }

     } else {
         // --- Save (Save to DB) ---
         try {
            // Ensure we pass the full RecipeItem structure
             const savedId = await saveGeneratedRecipeDetails(recipe as RecipeItem); // Cast might be needed if _id is ObjectId
             if (savedId) {
                 console.log(t('toast.recipeSavedDesc', { recipeName: recipe.recipeName }));
                  // Update local state of saved IDs
                 setSavedRecipeIds(prev => new Set(prev).add(savedId));
                 // Update the recipe object in the current `recipes` state with the new ID
                 setRecipes(prevRecipes => {
                    if (!prevRecipes) return null;
                    // Find the recipe by name (since ID might have just been created)
                    // and update its _id field
                    return prevRecipes.map(r =>
                        r.recipeName === recipe.recipeName ? { ...r, _id: savedId } : r
                    );
                 });

             } else {
                 console.error(`Failed to save recipe "${recipe.recipeName}" to MongoDB.`);
                 setError(t('toast.saveErrorDesc') + ' (DB Save)');
             }
         } catch (dbError) {
             console.error(`Error saving recipe "${recipe.recipeName}" to MongoDB:`, dbError);
             setError(t('toast.saveErrorDesc') + ' (DB Save)');
         }
     }
   };


 // Function to navigate to recipe detail page
 // Use Redis via server action for temporary storage
 const handleViewRecipe = async (recipe: RecipeItem) => {
    setError(null);
    setRedisError(null);
    console.log(`Initiating navigation for recipe: "${recipe.recipeName}"`);

    // Check Redis availability locally first for a quicker feedback loop
    if (!isRedisAvailable) {
        console.error("Redis is not available. Cannot store recipe details for navigation.");
        setRedisError("Storage unavailable: Cannot view recipe details.");
        return;
    }

    try {
        // Create a slug from the recipe name
        const slug = recipe.recipeName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100); // Limit slug length

        // Store data in Redis using server action
        const redisKey = await storeRecipeForNavigation(slug, recipe, selectedLanguage);

        if (redisKey) {
            // Navigate using the returned Redis key
            const url = `/recipe/${slug}?redisKey=${encodeURIComponent(redisKey)}`;
            console.log("Navigating to URL:", url);
            router.push(url);
        } else {
            console.error(`Navigation aborted for "${recipe.recipeName}" due to Redis storage failure reported by server action.`);
            setRedisError(t('toast.storageErrorDesc') + ' (Navigation)');
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
    setRedisError(null); // Clear previous Redis errors

    // Clear previous results from Redis using server action
    if (isRedisAvailable) {
        try {
            await deleteStoredState();
            console.log("Cleared previous state from Redis via server action before new search.");
        } catch (err: any) {
            // Log but don't necessarily block the user
            console.warn("Could not clear Redis state before search (server action error):", err);
            // Optionally inform the user non-blockingly
            // setRedisError(t('toast.storageErrorDesc') + ' (Clear Failed)');
        }
    }


    try {
      let enhancedPreferences = values.preferences || '';
      if (values.quickMode) {
        enhancedPreferences += (enhancedPreferences ? ', ' : '') + t('form.quickModePreference');
      }
      if (values.servingSize) {
         enhancedPreferences += (enhancedPreferences ? ', ' : '') + t('form.servingSizePreference', { count: values.servingSize });
      }
      if (values.cuisineType) {
          enhancedPreferences += (enhancedPreferences ? ', ' : '') + `${t('form.cuisineTypeLabel')}: ${values.cuisineType}`;
      }
       if (values.cookingMethod) {
          enhancedPreferences += (enhancedPreferences ? ', ' : '') + `${t('form.cookingMethodLabel')}: ${values.cookingMethod}`;
      }
      // Add category to preferences if not 'All'
      if (values.category && values.category !== 'All') {
          enhancedPreferences += (enhancedPreferences ? ', ' : '') + `Category: ${values.category}`;
      }


      const input: SuggestRecipesInput = {
        ingredients: values.ingredients,
        dietaryRestrictions: values.dietaryRestrictions || undefined,
        preferences: enhancedPreferences || undefined,
        language: selectedLanguage,
        includeDetails: values.includeDetails,
      };

      console.log("Submitting to AI with input:", input);

      const result = await suggestRecipes(input);
      console.log("Received recipes from AI:", result);

      // Map results to ensure they fit the RecipeItem structure expected by the state
      // Assign temporary IDs or leave _id undefined for now
      const recipesArray: RecipeItem[] = (Array.isArray(result) ? result : []).map((recipe, index) => ({
          ...recipe,
          // _id: `temp-${Date.now()}-${index}` // Assign temporary unique ID if needed immediately
          // Or just rely on the database to assign the ID upon saving
       }));


      setRecipes(recipesArray);

       // --- Store results and form state in Redis via Server Action ---
       if (recipesArray.length > 0 && isRedisAvailable) {
           try {
               const success = await setStoredState(values, recipesArray, selectedLanguage);
               if (success) {
                  console.log("Stored form state and results in Redis.");
               } else {
                   console.error("Server action reported failure storing state in Redis.");
                   setRedisError(t('toast.storageErrorDesc') + ' (Save Failed)');
               }
           } catch (err: any) {
               console.error("Error calling setStoredState action:", err);
               setRedisError(`${t('toast.storageErrorTitle')}: ${err.message || 'Failed to save to Redis'}`);
           }
       } else if (recipesArray.length > 0 && !isRedisAvailable) {
           console.warn("Redis not available. Search results will not persist across sessions.");
           // Don't set error state here, it's just a persistence warning
           // setError("Storage unavailable: Results won't be saved."); // Inform user
       } else if (recipesArray.length === 0 && isRedisAvailable) {
           // If no recipes found, ensure previous Redis state is cleared
           try {
              await deleteStoredState();
              console.log("No recipes found, cleared previous state from Redis (if applicable).");
           } catch (err: any) {
                console.warn("Could not clear Redis state after finding no recipes (server action error):", err);
           }
       }

       // --- Save search to history in MongoDB (already uses server action) ---
       try {
           await saveRecipeHistory({
               searchInput: input,
               resultsSummary: recipesArray.map(r => r.recipeName),
               resultCount: recipesArray.length,
           });
           console.log("Saved search history to MongoDB.");
       } catch (dbError) {
           console.error("Error saving history to MongoDB:", dbError);
           // Don't necessarily block the user, but log the error
       }

       // --- Save each generated recipe detail to the general 'recipes' collection ---
       // This should happen *after* setting state so the user sees results quickly.
       // We also need the IDs generated by the save operation to update the state correctly.
      if (recipesArray.length > 0) {
          console.log(`Attempting to save details for ${recipesArray.length} generated recipes to MongoDB...`);
          const savedIdsMap = new Map<string, string>(); // Map recipeName to saved ID

          await Promise.all(recipesArray.map(async (recipe) => {
              try {
                  // Use the specific save function which handles upsert
                  const savedId = await saveGeneratedRecipeDetails(recipe);
                  if(savedId) {
                     savedIdsMap.set(recipe.recipeName, savedId); // Store the mapping
                  }
              } catch (saveError) {
                  console.error(`Error saving generated recipe detail "${recipe.recipeName}" to MongoDB:`, saveError);
                  // Don't necessarily show error to user for background saving failure
              }
          }));

          // Now update the component state with the real IDs
          setRecipes(prevRecipes => {
              if (!prevRecipes) return null;
              return prevRecipes.map(p => {
                  const savedId = savedIdsMap.get(p.recipeName);
                  return savedId ? { ...p, _id: savedId } : p;
              });
          });

          // Update the savedRecipeIds set as well
          setSavedRecipeIds(prev => new Set([...prev, ...Array.from(savedIdsMap.values())]));

          console.log("Finished attempting to save generated recipe details and updated state with IDs.");
      }


      if (recipesArray.length === 0) {
         console.log(t('toast.noRecipesDesc'));
      } else {
         console.log(t('toast.recipesFoundDesc', {
              count: recipesArray.length,
              s: recipesArray.length > 1 ? 's' : '' // Basic pluralization
            }));
      }
    } catch (err) {
      console.error('Error suggesting recipes:', err);
      let errorMessage = t('toast.genericError');
      let errorTitle = t('toast.errorTitle');

      if (err instanceof z.ZodError) {
          errorMessage = t('toast.validationError') || 'Input validation failed. Please check your entries.';
      } else if (err instanceof Error) {
          if (err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('failed to fetch')) {
               errorTitle = t('toast.networkErrorTitle');
               errorMessage = t('toast.networkErrorDesc');
          }
           else {
               errorMessage = err.message;
           }
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
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: {y: 15, opacity: 0},
    visible: {
      y: 0,
      opacity: 1,
      transition: {type: 'spring', stiffness: 120, damping: 15},
    },
    exit: {y: -15, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
  };

    const cardHoverEffect = {
      rest: { scale: 1, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", y: 0 },
      hover: { scale: 1.03, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)", y: -5 }
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
      <div className="w-full max-w-3xl space-y-6 mt-6">
        {[...Array(2)].map((_, i) => (
            <Card key={i} className="w-full shadow-md border border-border/30 overflow-hidden bg-card/50">
              <div className="h-48 bg-muted/30"></div>
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
                   <div className="h-9 w-full bg-muted/40 rounded-md"></div>
                </CardFooter>
            </Card>
        ))}
       </div>
    </motion.div>
  );

   if (!isClient || !initialLoadComplete) {
        // Display a basic loader until client-side hydration and initial data load are complete
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
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
                        // Store preference client-side in localStorage
                        if (typeof window !== 'undefined') {
                            localStorage.setItem(SELECTED_LANGUAGE_KEY, newLang);
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
                           {lang.label}
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
                               className="h-9 w-9 focus:ring-1 focus:ring-primary/50 rounded-full"
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
                           {/* Display count based on fetched IDs */}
                           {savedRecipeIds.size > 0 && (
                               <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                 {savedRecipeIds.size}
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
            {(error || redisError) && (
              <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className="mb-6"
               >
                  <Alert variant="destructive">
                    {redisError ? <CloudOff className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertTitle>{redisError ? t('toast.storageErrorTitle') : t('toast.errorTitle')}</AlertTitle>
                    <AlertDescription>{redisError || error}</AlertDescription>
                    {/* Optional: Add retry button for Redis errors (maybe retry checking availability?) */}
                     {redisError && !isLoading && (
                         <Button
                             variant="outline"
                             size="sm"
                             onClick={async () => {
                                 setRedisError(null); // Clear error
                                 setInitialLoadComplete(false); // Trigger re-load
                                 // Re-run initialization logic from useEffect
                                 try {
                                     const available = await checkRedisAvailability();
                                     setIsRedisAvailable(available);
                                     if (available) {
                                         const { formState, results } = await getStoredState();
                                         if (formState) form.reset(formState);
                                         if (results) setRecipes(results); else setRecipes(null);
                                     } else {
                                         setRecipes(null); form.reset();
                                     }
                                 } catch (err: any) {
                                     setRedisError(`${t('toast.storageErrorTitle')}: ${err.message || 'Retry failed'}`);
                                 } finally {
                                     setInitialLoadComplete(true);
                                 }
                             }}
                             className="mt-2"
                         >
                             <RefreshCw className="mr-2 h-4 w-4" />
                             Retry
                         </Button>
                     )}
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
             <Card className="w-full max-w-2xl mx-auto mb-12 shadow-lg border border-border/60 hover:shadow-xl transition-shadow duration-300 bg-card/90 backdrop-blur-sm overflow-hidden rounded-xl">
               <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
                 <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                   <Sparkles className="h-5 w-5 animate-pulse duration-1500" />
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
                        {/* Category Field (Select) */}
                        <motion.div variants={itemVariants} className="col-span-1 sm:col-span-2">
                           <FormField
                             control={form.control}
                             name="category"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel className="font-medium text-foreground/90">{t('form.categoryLabel')}</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                   <FormControl>
                                     <SelectTrigger className="focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 rounded-md">
                                       <SelectValue placeholder={t('form.categoryPlaceholder')} />
                                     </SelectTrigger>
                                   </FormControl>
                                   <SelectContent>
                                     {/* Add category options - Use translations */}
                                     {[
                                        'All',
                                        'Breakfast',
                                        'Lunch',
                                        'Dinner',
                                        'Dessert',
                                        'Snack',
                                        'Appetizer',
                                        'Side Dish',
                                        'Beverage',
                                     ].map((category) => (
                                        <SelectItem key={category} value={category}>
                                           {t(`categories.${category.toLowerCase().replace(' ', '')}` as any, {}, category)}
                                         </SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                        </motion.div>
                     </div>

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

                         <FormField
                           control={form.control}
                           name="servingSize"
                           render={({ field }) => (
                             <FormItem className="max-w-[200px]">
                               <FormLabel className="font-medium text-foreground/90 flex items-center gap-1.5 text-sm">
                                <Scale size={14} /> {t('form.servingSizeLabel')}
                               </FormLabel>
                               <FormControl>
                                 <Input
                                   type="number"
                                   min="1"
                                   step="1"
                                   placeholder={t('form.servingSizePlaceholder')}
                                   {...field}
                                   value={field.value ?? ''}
                                   onChange={(e) => {
                                     const val = e.target.value;
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


                     <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 pt-4">
                       <motion.div {...buttonHoverEffect} className="flex-1">
                         <Button
                           type="submit"
                           className="w-full py-3 text-base font-semibold transition-all duration-300 ease-out bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-[0.98] rounded-md"
                           disabled={isLoading || !!redisError} // Disable if Redis error or loading
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
                           className="w-full sm:w-auto transition-colors duration-200 hover:bg-muted/80 dark:hover:bg-muted/20 border-border/70 rounded-md"
                           disabled={isLoading}
                         >
                            <RotateCcw className="mr-2 h-4 w-4"/> {t('form.resetButton')}
                          </Button>
                        </motion.div>
                     </motion.div>
                    </motion.div>
                   </form>
                 </Form>
               </CardContent>
               <CardFooter className="p-4 bg-muted/30 dark:bg-background/30 rounded-b-xl border-t border-border/30">
                 <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                   <Info className="h-3.5 w-3.5 shrink-0" /> {t('form.footerNote')}
                 </p>
               </CardFooter>
             </Card>
           </motion.div>

           {/* Results Area */}
           <AnimatePresence mode="wait">
             {isLoading && isClient && (
                 <motion.div key="loading">
                     <LoadingSkeleton />
                 </motion.div>
             )}

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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                  >
                   {recipes.map((recipe, index) => {
                       // Check if recipe is saved based on fetched IDs
                        const recipeId = typeof recipe._id === 'string' ? recipe._id : recipe._id?.toString();
                        const isSaved = !!(recipeId && savedRecipeIds.has(recipeId));
                       return (
                         <motion.div
                             key={recipeId || `recipe-${index}`} // Use ID if available, otherwise fallback
                             variants={itemVariants}
                              whileHover={{ y: -5, transition: { duration: 0.2 } }}
                         >
                           <motion.div whileHover="hover" initial="rest" animate="rest" variants={cardHoverEffect}>
                            <Card
                              className={cn(
                                 'w-full h-full flex flex-col shadow-md border border-border/50 overflow-hidden transition-all duration-300 group bg-card backdrop-blur-sm rounded-xl'
                               )}
                            >
                             <CardHeader className="p-0 relative aspect-[16/10] overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/40 dark:from-background/40 dark:to-background/20 flex items-center justify-center">
                                   {recipe.imageUrl && !recipe.imageOmitted ? (
                                     // eslint-disable-next-line @next/next/no-img-element
                                     <img
                                       src={recipe.imageUrl}
                                       alt={t('results.imageAlt', { recipeName: recipe.recipeName })}
                                       width={400}
                                       height={250}
                                       className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                       loading="lazy"
                                     />
                                   ) : (
                                     <ImageOff className="h-12 w-12 text-muted-foreground/40" />
                                   )}
                                </div>
                               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none"></div>
                               <div className="absolute bottom-0 left-0 right-0 p-4">
                                 <CardTitle className="text-lg font-bold text-white drop-shadow-md line-clamp-2 leading-snug">
                                   {recipe.recipeName}
                                 </CardTitle>
                               </div>
                                <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                       <Button
                                         variant="ghost"
                                         size="icon"
                                         className={cn(
                                             "absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-primary hover:text-primary-foreground transition-all opacity-80 group-hover:opacity-100 backdrop-blur-sm focus:ring-1 focus:ring-primary/50",
                                              isSaved && "bg-primary text-primary-foreground hover:bg-destructive hover:text-destructive-foreground"
                                         )}
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             handleToggleSaveRecipe(recipe) // Pass the whole recipe object
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
                             <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                               <motion.div
                                   initial={{ opacity: 0, y: 5 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ duration: 0.3, delay: 0.1 }}
                                   className="flex flex-wrap gap-2 items-center">
                                 <Badge
                                   variant="outline"
                                   className="flex items-center gap-1 border-primary/70 text-primary bg-primary/10 backdrop-blur-sm py-0.5 px-2 text-xs font-medium rounded-full"
                                 >
                                   <Clock className="h-3 w-3" />
                                   {recipe.estimatedTime}
                                 </Badge>
                                 <Badge
                                    variant="outline"
                                    className="flex items-center gap-1 border-secondary-foreground/40 text-secondary-foreground bg-secondary/50 dark:bg-secondary/20 backdrop-blur-sm py-0.5 px-2 text-xs font-medium rounded-full"
                                 >
                                   <BarChart className="h-3 w-3 -rotate-90" />
                                   {recipe.difficulty}
                                 </Badge>
                               </motion.div>

                              <motion.p
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.2 }}
                                  className="text-sm text-muted-foreground line-clamp-3 leading-snug flex-grow"
                               >
                                  {recipe.instructions?.split('\n')[0]?.replace(/^\s*(\d+\.|-)\s*/, '').trim() || t('results.defaultDescription')}
                                </motion.p>

                             </CardContent>
                              <CardFooter className="p-4 pt-0">
                                <motion.div {...buttonHoverEffect} className="w-full">
                                  <Button
                                     variant="outline"
                                     size="sm"
                                     className="w-full transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary border-border/70 rounded-md"
                                     onClick={() => handleViewRecipe(recipe)}
                                     disabled={!isRedisAvailable} // Disable if Redis isn't available for navigation store
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

         <motion.footer
           initial={{opacity: 0}}
           animate={{opacity: 1}}
           transition={{duration: 0.5, delay: 0.8 }}
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
                  whileHover={{ color: "hsl(var(--primary))" }}
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
        <SavedRecipesDialog
          isOpen={isSavedRecipesDialogOpen}
          onClose={() => setIsSavedRecipesDialogOpen(false)}
          onViewRecipe={handleViewRecipe}
          language={selectedLanguage}
          isRedisAvailable={!!isRedisAvailable} // Pass Redis availability
        />
     </>
    );
 }

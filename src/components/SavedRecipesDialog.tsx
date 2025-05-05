// src/components/SavedRecipesDialog.tsx
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RecipeItem } from '@/ai/flows/suggest-recipe';
import { translations, type LanguageCode } from '@/lib/translations';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BarChart, Trash2, Eye, ImageOff, AlertTriangle, CloudOff, Loader2, RefreshCw } from 'lucide-react'; // Added Loader2, RefreshCw
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getAllSavedRecipes, deleteRecipeById } from '@/lib/db/recipes'; // Import DB actions

interface SavedRecipesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRecipe: (recipe: RecipeItem) => void; // Function to handle viewing a recipe
  language: LanguageCode; // Pass current language for translations
  isRedisAvailable: boolean; // Pass Redis availability status
}

// Define the type for recipes fetched from DB (includes string _id)
type SavedRecipeItem = RecipeItem & { _id: string };

const SavedRecipesDialog: React.FC<SavedRecipesDialogProps> = ({
  isOpen,
  onClose,
  onViewRecipe,
  language,
  isRedisAvailable,
}) => {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State for loading recipes
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition(); // For delete operation

  // Translation function specific to this component
   const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
      const messages = translations[language] || translations.en;
       const keys = key.split('.');
       let result: any = messages;
       for (const k of keys) {
         result = result?.[k];
         if (result === undefined) {
           let fallbackResult: any = translations.en;
           for (const fk of keys) {
               fallbackResult = fallbackResult?.[fk];
               if (fallbackResult === undefined) {
                   console.warn(`Translation key "${key}" not found in language "${language}" or fallback "en".`);
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
    }, [language]);

  // Function to fetch saved recipes from the database
  const fetchRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const recipesFromDb = await getAllSavedRecipes();
      if (recipesFromDb) {
        setSavedRecipes(recipesFromDb);
      } else {
        setError(t('toast.storageErrorDesc') + ' (DB Fetch)'); // Use translation for DB error
        setSavedRecipes([]);
      }
    } catch (err) {
      console.error("Error fetching saved recipes from DB:", err);
      setError(t('toast.storageErrorDesc') + ' (DB Fetch)'); // Use translation
      setSavedRecipes([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]); // Depend on translation function

  useEffect(() => {
    setIsClient(true);
    if (isOpen) {
      fetchRecipes(); // Fetch recipes when the dialog opens
    }
  }, [isOpen, fetchRecipes]);

  // Handler for deleting a recipe using Server Action
  const handleRemove = (recipeId: string, recipeName: string) => {
    startTransition(async () => {
      setError(null); // Clear previous errors
      try {
        const success = await deleteRecipeById(recipeId);
        if (success) {
          // Remove the recipe from the local state optimistically or refetch
          setSavedRecipes(prev => prev.filter(r => r._id !== recipeId));
          console.log(t('toast.recipeRemovedTitle'), t('toast.recipeRemovedDesc', { recipeName: recipeName }));
        } else {
          console.error(`Failed to delete recipe ${recipeId} via server action.`);
          setError(t('toast.saveErrorDesc') + ' (DB Delete)');
        }
      } catch (err) {
        console.error("Error calling deleteRecipeById action:", err);
        setError(t('toast.saveErrorDesc') + ' (DB Delete)');
      }
    });
   };

   const handleView = (recipe: SavedRecipeItem) => {
       if (!isRedisAvailable) {
           console.warn("Cannot view recipe, Redis is not available.");
           setError("Storage unavailable: Cannot view recipe details.");
           return;
       }
       setError(null); // Clear error if view is possible
       // Pass the recipe (excluding the DB-specific _id if necessary, though RecipeItem shouldn't have it)
       const { _id, ...recipeToView } = recipe;
       onViewRecipe(recipeToView as RecipeItem); // Cast back to RecipeItem
       onClose(); // Close the dialog after initiating view
   };

  if (!isClient) {
    return null; // Don't render on server
  }

  return (
   <TooltipProvider>
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0">
         <DialogHeader className="p-6 pb-4 border-b">
           <DialogTitle>{t('savedRecipes.dialogTitle')}</DialogTitle>
         </DialogHeader>

         <ScrollArea className="flex-1 overflow-y-auto p-6 pt-0">
           {isLoading && (
               <div className="flex justify-center items-center py-10">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
           )}
           {error && !isLoading && (
              <div className="text-center py-4 text-destructive flex flex-col items-center gap-2">
                 <div className="flex items-center gap-2">
                     {error.includes('Storage unavailable') ? <CloudOff size={18} /> : <AlertTriangle size={18} />}
                     <span>{error}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchRecipes} className="mt-2">
                       <RefreshCw className="mr-2 h-4 w-4"/> Retry
                   </Button>
               </div>
            )}
           {!isLoading && !error && savedRecipes.length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
               {t('savedRecipes.noSavedRecipes')}
             </div>
           )}
           {!isLoading && !error && savedRecipes.length > 0 && (
             <div className="grid grid-cols-1 gap-4">
               {savedRecipes.map((recipe) => (
                 <Card key={recipe._id} className="flex flex-col sm:flex-row overflow-hidden border border-border/40 shadow-sm bg-card/80">
                    <CardHeader className="p-0 w-full sm:w-1/3 relative aspect-video sm:aspect-auto">
                        {recipe.imageUrl && !recipe.imageOmitted ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img
                               src={recipe.imageUrl}
                               alt={t('results.imageAlt', { recipeName: recipe.recipeName })}
                               className="w-full h-full object-cover"
                               loading="lazy"
                             />
                         ) : (
                            <div className="flex items-center justify-center h-full bg-muted/30">
                                <ImageOff className="h-10 w-10 text-muted-foreground/40" />
                                {recipe.imageOmitted && <p className="absolute bottom-1 text-[10px] text-muted-foreground/60">Image omitted</p>}
                             </div>
                         )}
                    </CardHeader>
                   <div className="flex flex-col justify-between flex-1">
                     <CardContent className="p-4 pb-2">
                       <CardTitle className="text-base font-semibold mb-2 line-clamp-2">
                         {recipe.recipeName}
                       </CardTitle>
                       <div className="flex flex-wrap gap-2 items-center mb-2">
                         <Badge variant="outline" className="text-xs gap-1"><Clock size={12}/>{recipe.estimatedTime || 'N/A'}</Badge>
                         <Badge variant="outline" className="text-xs gap-1"><BarChart size={12} className="-rotate-90"/>{recipe.difficulty || 'N/A'}</Badge>
                       </div>
                       <p className="text-xs text-muted-foreground line-clamp-2">
                         {recipe.ingredients?.split(',').slice(0, 5).join(', ') + (recipe.ingredients?.split(',').length > 5 ? '...' : '')}
                       </p>
                     </CardContent>
                     <CardFooter className="p-4 pt-2 flex justify-end gap-2">
                        <Tooltip>
                           <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleView(recipe)} disabled={!isRedisAvailable}>
                                 <Eye size={16} className="mr-1"/> {t('savedRecipes.viewButton')}
                               </Button>
                            </TooltipTrigger>
                             <TooltipContent>
                                 {isRedisAvailable ? <p>{t('results.viewRecipeButton')}</p> : <p>Storage unavailable</p>}
                             </TooltipContent>
                         </Tooltip>
                         <Tooltip>
                           <TooltipTrigger asChild>
                               <Button variant="destructive" size="icon" onClick={() => handleRemove(recipe._id, recipe.recipeName)} disabled={isPending} aria-label={t('savedRecipes.removeButtonAriaLabel', {recipeName: recipe.recipeName})}>
                                 {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={16} />}
                               </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('savedRecipes.removeButtonTooltip')}</p></TooltipContent>
                         </Tooltip>
                     </CardFooter>
                   </div>
                 </Card>
               ))}
             </div>
           )}
         </ScrollArea>
         <DialogFooter className="p-6 pt-4 border-t">
           <DialogClose asChild>
             <Button type="button" variant="secondary">
               {t('savedRecipes.closeButton')}
             </Button>
           </DialogClose>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   </TooltipProvider>
  );
};

export default SavedRecipesDialog;

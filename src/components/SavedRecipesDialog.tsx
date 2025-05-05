// src/components/SavedRecipesDialog.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Clock, BarChart, Trash2, Eye, ImageOff, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from './ui/separator';

interface SavedRecipesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRecipe: (recipe: RecipeItem) => void; // Function to handle viewing a recipe
  onRemoveRecipe: (recipe: RecipeItem) => void; // Function to handle removing a recipe
  language: LanguageCode; // Pass current language for translations
}

const SAVED_RECIPES_KEY = 'recipeSageSavedRecipes';

const SavedRecipesDialog: React.FC<SavedRecipesDialogProps> = ({
  isOpen,
  onClose,
  onViewRecipe,
  onRemoveRecipe,
  language,
}) => {
  const [savedRecipes, setSavedRecipes] = useState<RecipeItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    setIsClient(true);
    if (isOpen && typeof window !== 'undefined') {
      try {
        const storedData = localStorage.getItem(SAVED_RECIPES_KEY);
        if (storedData) {
          setSavedRecipes(JSON.parse(storedData));
          setError(null);
        } else {
          setSavedRecipes([]);
        }
      } catch (err) {
        console.error("Error loading saved recipes from localStorage:", err);
        setError(t('toast.storageErrorDesc')); // Use translation
        setSavedRecipes([]);
         // Optionally clear corrupted storage
         localStorage.removeItem(SAVED_RECIPES_KEY);
      }
    }
  }, [isOpen, t]); // Reload when dialog opens or translation function changes

  const handleRemove = (recipe: RecipeItem) => {
     try {
      const updatedRecipes = savedRecipes.filter(r => r.recipeName !== recipe.recipeName);
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedRecipes));
      setSavedRecipes(updatedRecipes);
      // Also trigger the main page's remove function to update its state
      onRemoveRecipe(recipe);
       console.log(t('toast.recipeRemovedTitle'), t('toast.recipeRemovedDesc', { recipeName: recipe.recipeName }));
     } catch (err) {
        console.error("Error removing recipe from localStorage:", err);
        setError(t('toast.saveErrorDesc')); // Use translation
     }
   };

   const handleView = (recipe: RecipeItem) => {
       onViewRecipe(recipe); // Call the function passed from the parent
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
           {error && (
              <div className="text-center py-4 text-destructive flex items-center justify-center gap-2">
                  <AlertTriangle size={18} /> {error}
               </div>
            )}
           {savedRecipes.length === 0 && !error ? (
             <div className="text-center py-10 text-muted-foreground">
               {t('savedRecipes.noSavedRecipes')}
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-4">
               {savedRecipes.map((recipe) => (
                 <Card key={recipe.recipeName} className="flex flex-col sm:flex-row overflow-hidden border border-border/40 shadow-sm bg-card/80">
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
                              <Button variant="outline" size="sm" onClick={() => handleView(recipe)}>
                                 <Eye size={16} className="mr-1"/> {t('savedRecipes.viewButton')}
                               </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{t('results.viewRecipeButton')}</p></TooltipContent>
                         </Tooltip>
                         <Tooltip>
                           <TooltipTrigger asChild>
                               <Button variant="destructive" size="icon" onClick={() => handleRemove(recipe)} aria-label={t('savedRecipes.removeButtonAriaLabel', {recipeName: recipe.recipeName})}>
                                 <Trash2 size={16} />
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

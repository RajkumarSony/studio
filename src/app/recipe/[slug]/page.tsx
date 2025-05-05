{// src/app/recipe/[slug]/page.tsx
'use client';

import React, { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, notFound } from 'next/navigation'; // Import notFound
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  BarChart,
  BookOpen,
  ChefHat,
  ImageOff,
  ArrowLeft,
  UtensilsCrossed, // Icon for Nutrition/Diet
  AlertTriangle, // Icon for error
  Printer, // Icon for Print button
  Loader2, // Import Loader for Suspense fallback & loading state
  RefreshCw, // Icon for retry button
  CloudOff, // Icon for Redis error
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { translations, type LanguageCode } from '@/lib/translations'; // Import translations
import { cn } from '@/lib/utils';
import type { RecipeItem } from '@/ai/flows/suggest-recipe'; // Import RecipeItem type
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// Remove direct Redis client import
// import redisClient, { isRedisAvailable } from '@/lib/redis/client';
import { getRecipeFromNavigationStore } from '@/actions/redisActions'; // Import server action

// Helper function to get the translation messages object for a language
const getTranslationMessages = (lang: LanguageCode) => translations[lang] || translations.en;

// Enhanced Loading Skeleton
function RecipeDetailLoading() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl animate-pulse">
       <div className="h-8 w-24 bg-muted/50 rounded mb-6"></div>
       <Card className="overflow-hidden shadow-lg border border-border/40 bg-card">
          {/* Image Placeholder */}
          <div className="aspect-[16/8] sm:aspect-[16/7] bg-muted/40"></div>
          <div className="p-6 sm:p-8 space-y-8">
             {/* Title Placeholder */}
             <div className="h-8 w-3/4 bg-muted/50 rounded mb-2"></div>
             {/* Badges Placeholder */}
             <div className="flex gap-2">
                 <div className="h-6 w-20 bg-muted/50 rounded-full"></div>
                 <div className="h-6 w-24 bg-muted/50 rounded-full"></div>
             </div>

             {/* Ingredients Section Placeholder */}
             <div className="space-y-4 mt-6">
                <div className="h-6 w-1/3 bg-muted/50 rounded mb-4"></div>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                    <div className="h-4 w-full bg-muted/40 rounded"></div>
                    <div className="h-4 w-5/6 bg-muted/40 rounded"></div>
                    <div className="h-4 w-3/4 bg-muted/40 rounded"></div>
                </div>
              </div>

              <Separator className="my-8 bg-border/30" />

              {/* Instructions Section Placeholder */}
              <div className="space-y-5">
                <div className="h-6 w-1/3 bg-muted/50 rounded mb-4"></div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full bg-muted/40 rounded"></div>
                      <div className="h-4 w-11/12 bg-muted/40 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

             {/* Optional Details Placeholder */}
             {(
               <Separator className="my-8 bg-border/30" />
             )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div>
                     <div className="h-5 w-1/2 bg-muted/50 rounded mb-3"></div>
                     <div className="h-24 bg-muted/30 rounded p-4">
                         <div className="h-4 w-full bg-muted/40 rounded mb-2"></div>
                         <div className="h-4 w-3/4 bg-muted/40 rounded"></div>
                     </div>
                 </div>
                  <div>
                     <div className="h-5 w-1/2 bg-muted/50 rounded mb-3"></div>
                     <div className="h-24 bg-muted/30 rounded p-4">
                         <div className="h-4 w-full bg-muted/40 rounded mb-2"></div>
                         <div className="h-4 w-2/3 bg-muted/40 rounded"></div>
                     </div>
                 </div>
              </div>
           </div>
        </Card>
     </div>
  );
}


function RecipeDetailContent() {
  const searchParams = useSearchParams();
  const [recipeData, setRecipeData] = useState<(RecipeItem & { language?: LanguageCode }) | null>(null); // Include language in state
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for errors
  // Language is now derived from recipeData, no separate state needed unless for fallback
  // const [language, setLanguage] = useState<LanguageCode>('en'); // State for language


  // Get Redis key from query params
  const redisKey = useMemo(() => searchParams.get('redisKey'), [searchParams]);

  // Define the translation function 't' using useCallback
  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    // Determine language from loaded data or fallback to 'en'
    const currentLanguage = recipeData?.language || 'en';
    const messages = getTranslationMessages(currentLanguage);
    const keys = key.split('.');
    let result: any = messages;

    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        let fallbackResult: any = translations.en;
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if (fallbackResult === undefined) {
                 console.warn(`Translation key "${key}" not found in language "${currentLanguage}" or fallback "en".`);
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
  }, [recipeData]); // Depend on recipeData to get the correct language


  useEffect(() => {
    setIsClient(true); // Mark as client-side rendered
    setError(null);
    setIsLoading(true); // Start loading

    if (!redisKey) {
        console.error("Redis key not found in query parameters.");
        setError(t('recipeDetail.errorLoadingMessage') + " (Missing key)"); // Use t here with default 'en' initially
        setIsLoading(false);
        return;
    }

    // Fetch data from Redis using Server Action
    const loadFromRedisAction = async () => {
        try {
            const data = await getRecipeFromNavigationStore(redisKey);

            if (data) {
                console.log("Data retrieved from Redis via server action:", data);
                 // Restore full image URL if it was omitted and a prompt exists (or handle placeholder)
                 if (data.imageOmitted && data.imagePrompt) {
                    // Ideally, you'd regenerate or have a placeholder URL mechanism.
                    // For now, we'll leave imageUrl as undefined if omitted.
                    console.warn(`Image was omitted for ${data.recipeName}. Displaying fallback.`);
                    data.imageUrl = undefined; // Ensure it's undefined
                 }
                setRecipeData(data);
                setError(null); // Clear any previous errors
            } else {
                console.warn("Recipe data not found or expired in Redis for key (via server action):", redisKey);
                setError(t('recipeDetail.errorLoadingMessage') + " (Data expired or not found)"); // Use t again, language might be set now if data was found before
                setRecipeData(null);
            }
        } catch (err: any) {
            console.error(`Error calling getRecipeFromNavigationStore action for key "${redisKey}":`, err);
            setError(`${t('toast.storageErrorTitle')}: ${err.message || 'Failed to retrieve data'}`); // Use t
            setRecipeData(null);
        } finally {
            setIsLoading(false); // Finish loading
        }
    };

    loadFromRedisAction();

  }, [redisKey, t]); // Add t to dependency array

  // Set language on HTML tag when data loads
  useEffect(() => {
      if (recipeData?.language) {
         document.documentElement.lang = recipeData.language;
      }
  }, [recipeData]);


  // Function to safely render text with line breaks
  const renderMultilineText = (text: string | null | undefined) => {
    if (!text) return null;
    // Handle both literal '\n' and actual newlines
    const processedText = text.replace(/\\n/g, '\n');
    return processedText.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null; // Skip empty lines
      // Basic check for list markers, render as plain text for now
      const content = trimmedLine.replace(/^(\s*(\d+\.|-|\*)\s*)/, '');
      return <React.Fragment key={index}>{content}<br /></React.Fragment>;
    });
  };

   // Function to render instructions with steps
   const renderInstructions = (text: string | null | undefined) => {
     if (!text) return <p>{t('recipeDetail.instructionsPlaceholder')}</p>;
     const processedText = text.replace(/\\n/g, '\n');
     // Split into potential steps, filter out empty lines
     const steps = processedText.split('\n').map(step => step.trim()).filter(Boolean);

     return steps.map((step, idx) => (
       <motion.div
          key={idx}
          className="flex items-start gap-3 mb-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + idx * 0.05, duration: 0.4 }}
        >
          {/* Optional: Add step number indicator */}
          {/* <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{idx + 1}</span> */}
          <p className="flex-1 leading-relaxed text-foreground/80 dark:text-foreground/75">
             {step.replace(/^(\s*(\d+\.|-|\*)\s*)/, '')} {/* Remove potential list markers */}
          </p>
        </motion.div>
     ));
   };

   // Function to render ingredients list
    const renderIngredientsList = (text: string | null | undefined) => {
      if (!text) return <li>{t('recipeDetail.ingredientsPlaceholder')}</li>;
      const processedText = text.replace(/\\n/g, '\n');
      const items = processedText.split('\n').map(item => item.trim()).filter(Boolean);

      return items.map((item, idx) => (
        <motion.li
           key={idx}
           className="mb-1.5"
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.3 + idx * 0.05, duration: 0.4 }}
         >
           {item.replace(/^- \s*/, '')} {/* Remove leading dash */}
         </motion.li>
       ));
    };

    // Handle Print Action
     const handlePrint = () => {
       if (typeof window !== 'undefined') {
         window.print(); // Trigger browser's print dialog
       }
     };

   // Render loading state
   if (isLoading || !isClient) {
       return <RecipeDetailLoading />;
   }

   // Handle case where recipe data couldn't be loaded or Redis key was missing
   if (error || !recipeData) {
       return (
           <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                   <Button asChild variant="outline" size="sm" className="mb-6 group transition-all hover:bg-accent hover:shadow-sm">
                     <Link href="/">
                       <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                       {t('recipeDetail.backButton')}
                     </Link>
                   </Button>
                    <Card className="p-8 bg-card border border-destructive/50 shadow-lg">
                       <div className="flex justify-center mb-4">
                         {error?.includes('Redis') || error?.includes('Storage') ? <CloudOff className="h-12 w-12 text-destructive" /> : <AlertTriangle className="h-12 w-12 text-destructive" />}
                       </div>
                        <CardTitle className="text-destructive text-xl mb-2">{t('recipeDetail.errorLoadingTitle')}</CardTitle>
                        <p className="text-muted-foreground">{error || t('recipeDetail.errorLoadingMessage')}</p>
                        {/* Optional: Add retry for Redis errors */}
                        {(error?.includes('Redis') || error?.includes('Storage') || error?.includes('retrieve data')) && (
                             <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => window.location.reload()} // Simple reload might work if key exists
                                 className="mt-4"
                             >
                                 <RefreshCw className="mr-2 h-4 w-4" />
                                 Retry
                             </Button>
                         )}
                    </Card>
                </motion.div>
           </div>
       );
   }

  // Destructure loaded recipe data
  const {
      recipeName,
      ingredients,
      instructions,
      estimatedTime,
      difficulty,
      imageUrl, // This might be undefined if omitted during storage
      imagePrompt, // Keep prompt even if image was omitted
      nutritionFacts,
      dietPlanSuitability,
      imageOmitted // Use this flag
  } = recipeData;

  return (
   <TooltipProvider>
     <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-4xl print:py-4 print:px-0">
       {/* Language is now set via useEffect */}
       {/* <style>{`:root { lang: ${language}; }`}</style> */}

       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, ease: 'easeOut' }}
         className="flex justify-between items-center mb-6 print:hidden" // Hide buttons on print
       >
         <Button asChild variant="outline" size="sm" className="group transition-all hover:bg-accent hover:shadow-sm">
           <Link href="/">
             <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
             {t('recipeDetail.backButton')}
           </Link>
         </Button>
          {/* Print Button */}
          <Tooltip>
             <TooltipTrigger asChild>
               <Button variant="outline" size="icon" onClick={handlePrint} className="h-9 w-9">
                 <Printer className="h-4 w-4" />
                 <span className="sr-only">{t('recipeDetail.printButtonAriaLabel')}</span>
               </Button>
             </TooltipTrigger>
             <TooltipContent side="bottom">
                <p>{t('recipeDetail.printButtonTooltip')}</p>
              </TooltipContent>
            </Tooltip>
       </motion.div>

       <Card className="overflow-hidden shadow-xl border border-border/60 bg-card rounded-xl print:shadow-none print:border-none print:rounded-none">
         <CardHeader className="p-0 relative aspect-[16/8] sm:aspect-[16/7] overflow-hidden group print:aspect-auto print:max-h-[300px]">
            {imageUrl ? ( // Only render if imageUrl exists
                 imageUrl.startsWith('http') ? ( // Check if it's a regular URL
                    <Image
                        src={imageUrl}
                         alt={t('results.imageAlt', { recipeName })}
                         width={1000}
                         height={562}
                         className={cn(
                           "w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 print:object-contain",
                           "print:max-h-[300px]" // Apply max-height only for print
                         )}
                         priority
                         unoptimized={false} // Allow Next.js optimization for external URLs
                     />
                 ) : ( // Assume data URI (though we try to avoid storing these)
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                          src={imageUrl}
                          alt={t('results.imageAlt', { recipeName })}
                          width={1000}
                          height={562}
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 print:object-contain",
                            "print:max-h-[300px]" // Apply max-height only for print
                          )}
                          loading="lazy"
                      />
                 )
             ) : ( // Fallback if imageUrl is undefined or omitted
               <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/40 dark:from-background/40 dark:to-background/20 print:static print:bg-muted/20 print:py-10">
                 <ImageOff className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/40" />
                  {imageOmitted && <p className="absolute bottom-2 text-xs text-muted-foreground/60 print:hidden">Image omitted</p>}
               </div>
             )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none print:hidden"></div>
           <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/70 to-transparent print:static print:bg-none print:p-0 print:pt-4">
             <motion.div
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
             >
               <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2 leading-tight print:text-foreground print:text-center print:drop-shadow-none">
                 {recipeName}
               </CardTitle>
               <div className="flex flex-wrap gap-2 items-center justify-center mt-1 print:justify-center">
                 <Badge
                   variant="secondary"
                   className="flex items-center gap-1 bg-white/90 text-foreground backdrop-blur-sm py-0.5 px-2.5 text-xs sm:text-sm font-medium shadow-sm border border-black/10 rounded-full print:bg-secondary print:text-secondary-foreground print:shadow-none"
                 >
                   <Clock className="h-3.5 w-3.5 text-primary" />
                   {estimatedTime || 'N/A'}
                 </Badge>
                 <Badge
                   variant="secondary"
                   className="flex items-center gap-1 bg-white/90 text-foreground backdrop-blur-sm py-0.5 px-2.5 text-xs sm:text-sm font-medium shadow-sm border border-black/10 rounded-full print:bg-secondary print:text-secondary-foreground print:shadow-none"
                 >
                   <BarChart className="h-3.5 w-3.5 -rotate-90 text-primary" />
                   {difficulty || 'N/A'}
                 </Badge>
               </div>
             </motion.div>
           </div>
         </CardHeader>

         <CardContent className="p-5 sm:p-6 md:p-8 space-y-6 md:space-y-8 print:p-0 print:pt-6">
            <motion.section
              aria-labelledby="ingredients-heading"
              initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 id="ingredients-heading" className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground/90 flex items-center gap-2 print:text-lg">
                <BookOpen size={20} className="text-primary"/> {t('results.ingredientsTitle')}
              </h2>
              <Card className="bg-muted/30 dark:bg-background/20 border border-border/40 p-4 sm:p-5 rounded-lg shadow-inner print:border-none print:bg-transparent print:p-0 print:shadow-none">
                <ul className="list-disc list-outside pl-5 space-y-1 text-sm sm:text-base text-foreground/80 dark:text-foreground/75 marker:text-primary/80 marker:text-lg print:pl-0 print:list-none print:space-y-0.5 print:text-sm">
                   {renderIngredientsList(ingredients)}
                </ul>
              </Card>
            </motion.section>


           <Separator className="my-6 sm:my-8 bg-border/40 print:my-4" />

           <motion.section
               aria-labelledby="instructions-heading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.3, duration: 0.5 }}
           >
             <h2 id="instructions-heading" className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 text-foreground/90 flex items-center gap-2 print:text-lg">
               <ChefHat size={20} className="text-primary"/> {t('results.instructionsTitle')}
             </h2>
             <div className="space-y-4 text-sm sm:text-base print:text-sm">
                {renderInstructions(instructions)}
             </div>
           </motion.section>


            {(nutritionFacts || dietPlanSuitability) && (
                <>
                    <Separator className="my-6 sm:my-8 bg-border/40 print:my-4" />
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 print:grid-cols-1 print:gap-4"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.2, delayChildren: 0.5 }
                            }
                        }}
                    >
                        {nutritionFacts && (
                            <motion.section
                                aria-labelledby="nutrition-heading"
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            >
                                <h2 id="nutrition-heading" className="text-lg sm:text-xl font-semibold mb-3 text-foreground/90 flex items-center gap-2 print:text-base">
                                    <UtensilsCrossed size={18} className="text-primary"/> {t('recipeDetail.nutritionTitle')}
                                </h2>
                                <Card className="bg-muted/30 dark:bg-background/20 border border-border/50 rounded-lg shadow-inner overflow-hidden h-full print:border-none print:bg-transparent print:p-0 print:shadow-none">
                                    <CardContent className="p-4 text-sm text-muted-foreground leading-relaxed print:p-0 print:text-xs">
                                        {renderMultilineText(nutritionFacts) || <p>{t('recipeDetail.nutritionPlaceholder')}</p>}
                                    </CardContent>
                                </Card>
                            </motion.section>
                        )}

                        {dietPlanSuitability && (
                            <motion.section
                                aria-labelledby="diet-plan-heading"
                                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                            >
                                <h2 id="diet-plan-heading" className="text-lg sm:text-xl font-semibold mb-3 text-foreground/90 flex items-center gap-2 print:text-base">
                                    <UtensilsCrossed size={18} className="text-primary"/> {t('recipeDetail.dietPlanTitle')}
                                </h2>
                                <Card className="bg-muted/30 dark:bg-background/20 border border-border/50 rounded-lg shadow-inner overflow-hidden h-full print:border-none print:bg-transparent print:p-0 print:shadow-none">
                                    <CardContent className="p-4 text-sm text-muted-foreground leading-relaxed print:p-0 print:text-xs">
                                        {renderMultilineText(dietPlanSuitability) || <p>{t('recipeDetail.dietPlanPlaceholder')}</p>}
                                    </CardContent>
                                </Card>
                            </motion.section>
                        )}
                    </motion.div>
                </>
            )}


         </CardContent>

         {imagePrompt && (
             <CardFooter className="p-4 sm:p-5 bg-muted/40 dark:bg-background/30 border-t border-border/30 mt-4 rounded-b-xl print:hidden">
                <p className="text-xs text-muted-foreground italic text-center w-full">
                   <strong>{t('recipeDetail.imagePromptLabel')}:</strong> "{imagePrompt}"
                 </p>
              </CardFooter>
         )}
       </Card>
     </div>
    </TooltipProvider>
  );
}


export default function RecipeDetailPage() {
  // Wrap the component that uses useSearchParams in Suspense
  return (
    <Suspense fallback={<RecipeDetailLoading />}>
      <RecipeDetailContent />
    </Suspense>
  );
}

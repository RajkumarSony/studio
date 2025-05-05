// src/app/recipe/[slug]/page.tsx
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { translations, type LanguageCode } from '@/lib/translations'; // Import translations
import { cn } from '@/lib/utils';
import type { RecipeItem } from '@/ai/flows/suggest-recipe'; // Import RecipeItem type
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import redisClient, { isRedisAvailable } from '@/lib/redis/client'; // Import Redis client

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
  const [recipeData, setRecipeData] = useState<RecipeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for errors
  const [language, setLanguage] = useState<LanguageCode>('en'); // State for language


  // Get Redis key from query params
  const redisKey = useMemo(() => searchParams.get('redisKey'), [searchParams]);

  // Define the translation function 't' using useCallback
  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    const messages = getTranslationMessages(language); // Use state language
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
  }, [language]); // Depend on language state


  useEffect(() => {
    setIsClient(true);
    setError(null);
    setIsLoading(true); // Start loading

    if (!redisKey) {
        console.error("Redis key not found in query parameters.");
        setError(t('recipeDetail.errorLoadingMessage') + " (Missing key)");
        setIsLoading(false);
        return;
    }

    // Fetch data from Redis
    const loadFromRedis = async () => {
        if (!isRedisAvailable()) {
            console.error("Redis is not available.");
            setError(t('recipeDetail.errorLoadingMessage') + " (Storage unavailable)");
            setIsLoading(false);
            return;
        }

        try {
            const storedData = await redisClient?.get(redisKey);

            if (storedData) {
                console.log("Raw data retrieved from Redis:", storedData.substring(0, 100) + '...');
                const parsedData: RecipeItem & { language?: LanguageCode } = JSON.parse(storedData);
                console.log("Parsed data from Redis:", parsedData);

                if (!parsedData.recipeName) {
                    console.error("Critical error: Recipe name missing in stored data for key:", redisKey);
                    setError(t('recipeDetail.errorLoadingMessage') + " (Missing recipe name)");
                    setRecipeData(null);
                } else {
                    setRecipeData(parsedData);
                    // Set the language state based on the stored data or fallback
                    setLanguage(parsedData.language || 'en');
                    setError(null);
                }
            } else {
                console.warn("Recipe data not found in Redis for key (or expired):", redisKey);
                setError(t('recipeDetail.errorLoadingMessage') + " (Data expired or not found)");
                setRecipeData(null);
            }
        } catch (redisErr: any) {
            console.error(`Error processing Redis data for key "${redisKey}":`, redisErr);
            if (redisErr instanceof SyntaxError) {
                setError(t('recipeDetail.errorLoadingMessage') + " (Corrupted data)");
            } else {
                 setError(`${t('toast.storageErrorTitle')}: ${redisErr.message || 'Failed to connect to Redis'}`);
            }
            setRecipeData(null);
        } finally {
            setIsLoading(false); // Finish loading
        }
    };

    loadFromRedis();

  }, [redisKey, t]); // Add t to dependency array


  // Function to safely render text with line breaks
  const renderMultilineText = (text: string | null | undefined) => {
    if (!text) return null;
    const processedText = text.replace(/\\n/g, '\n');
    return processedText.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      const content = trimmedLine.replace(/^(\s*(\d+\.|-|\*)\s*)/, '');
      return <React.Fragment key={index}>{content}<br /></React.Fragment>;
    });
  };

   // Function to render instructions with steps
   const renderInstructions = (text: string | null | undefined) => {
     if (!text) return <p>{t('recipeDetail.instructionsPlaceholder') || 'No instructions available.'}</p>;
     const processedText = text.replace(/\\n/g, '\n');
     return processedText.split('\n').map((step, idx) => {
       const cleanedStep = step.trim();
       return cleanedStep ? (
          <motion.div
             key={idx}
             className="flex items-start gap-3 mb-4"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.4 + idx * 0.05, duration: 0.4 }}
           >
             <p className="flex-1 leading-relaxed text-foreground/80 dark:text-foreground/75">
                {cleanedStep}
             </p>
           </motion.div>
       ) : null;
     }).filter(Boolean);
   };

   // Function to render ingredients list
    const renderIngredientsList = (text: string | null | undefined) => {
      if (!text) return <li>{t('recipeDetail.ingredientsPlaceholder') || 'No ingredients listed.'}</li>;
      const processedText = text.replace(/\\n/g, '\n');
      return processedText.split('\n').map((item, idx) => {
        const cleanedItem = item.replace(/^- \s*/, '').trim();
        return cleanedItem ? (
           <motion.li
             key={idx}
             className="mb-1.5"
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.3 + idx * 0.05, duration: 0.4 }}
           >
             {cleanedItem}
           </motion.li>
         ) : null;
      }).filter(Boolean);
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
                         <AlertTriangle className="h-12 w-12 text-destructive" />
                       </div>
                        <CardTitle className="text-destructive text-xl mb-2">{t('recipeDetail.errorLoadingTitle')}</CardTitle>
                        <p className="text-muted-foreground">{error || t('recipeDetail.errorLoadingMessage')}</p>
                        {/* Optional: Add retry for Redis errors */}
                        {error?.includes('Redis') && (
                             <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => window.location.reload()}
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
      imageUrl,
      imagePrompt,
      nutritionFacts,
      dietPlanSuitability,
      imageOmitted
  } = recipeData;

  return (
   <TooltipProvider>
     <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-4xl print:py-4 print:px-0">
       {/* Set lang attribute dynamically */}
       <style>{`:root { lang: ${language}; }`}</style>

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
            {imageUrl && !imageOmitted ? (
                 imageUrl.startsWith('http') ? (
                    <Image
                        src={imageUrl}
                         alt={t('results.imageAlt', { recipeName })}
                         width={1000}
                         height={562}
                         className={cn(
                           "w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 print:object-contain",
                           "print:max-h-[300px]"
                         )}
                         priority
                         unoptimized={false}
                     />
                 ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                          src={imageUrl}
                          alt={t('results.imageAlt', { recipeName })}
                          width={1000}
                          height={562}
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 print:object-contain",
                            "print:max-h-[300px]"
                          )}
                          loading="lazy"
                      />
                 )
             ) : (
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
  const searchParams = useSearchParams();
  // Use Redis key if present, otherwise fallback to other params for key generation
   const suspenseKey = searchParams.get('redisKey') || searchParams.toString();

  return (
    <Suspense fallback={<RecipeDetailLoading />} key={suspenseKey}>
      <RecipeDetailContent />
    </Suspense>
  );
}

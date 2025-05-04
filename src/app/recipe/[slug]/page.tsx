// src/app/recipe/[slug]/page.tsx
'use client';

import React, { Suspense, useEffect } from 'react'; // Import useEffect
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { translations, type LanguageCode } from '@/lib/translations'; // Import translations
import { Loader2 } from 'lucide-react'; // Import Loader for Suspense fallback
import { cn } from '@/lib/utils';

// Helper function to get translations based on language code
const getTranslations = (lang: LanguageCode) => translations[lang] || translations.en;

function RecipeDetailContent() {
  const searchParams = useSearchParams();

  // Extract data from query parameters with fallbacks
  const recipeName = searchParams.get('name') ?? 'Recipe';
  const ingredients = searchParams.get('ingredients') ?? 'No ingredients provided.';
  const instructions = searchParams.get('instructions') ?? 'No instructions provided.';
  const estimatedTime = searchParams.get('estimatedTime') ?? 'N/A';
  const difficulty = searchParams.get('difficulty') ?? 'N/A';
  const imageUrl = searchParams.get('imageUrl'); // Will be null if not present
  const imagePrompt = searchParams.get('imagePrompt'); // Will be null if not present
  const lang = (searchParams.get('language') as LanguageCode) || 'en'; // Get language, default to 'en'
  const nutritionFacts = searchParams.get('nutritionFacts'); // Will be null if not present
  const dietPlanSuitability = searchParams.get('dietPlanSuitability'); // Will be null if not present

  const t = getTranslations(lang); // Get translation function for the current language

  // Log received parameters for debugging
  useEffect(() => {
    console.log("Recipe Detail Params Received:", {
      name: recipeName,
      ingredients: ingredients?.substring(0, 100) + '...', // Log prefix
      instructions: instructions?.substring(0, 100) + '...', // Log prefix
      estimatedTime,
      difficulty,
      imageUrl: imageUrl ? imageUrl.substring(0, 60) + '...' : null, // Log prefix of data URI
      imagePrompt,
      lang,
      nutritionFacts,
      dietPlanSuitability,
    });
  }, [recipeName, ingredients, instructions, estimatedTime, difficulty, imageUrl, imagePrompt, lang, nutritionFacts, dietPlanSuitability]); // Add dependencies

  // Function to safely render text with line breaks
  const renderMultilineText = (text: string | null | undefined) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null; // Skip empty lines
      // Remove leading list markers like "1.", "-", "*"
      const content = trimmedLine.replace(/^(\s*(\d+\.|-|\*)\s*)/, '');
      return <React.Fragment key={index}>{content}<br /></React.Fragment>;
    });
  };

   // Function to render instructions with steps
   const renderInstructions = (text: string | null | undefined) => {
     if (!text) return <p>{t('recipeDetail.instructionsPlaceholder') || 'No instructions available.'}</p>;
     return text.split('\n').map((step, idx) => {
       const cleanedStep = step.trim(); // Keep list markers if present
       return cleanedStep ? (
          <motion.div
             key={idx}
             className="flex items-start gap-3 mb-4"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.4 + idx * 0.05, duration: 0.4 }} // Stagger animation
           >
             {/* Optional: Add step number styling if needed */}
             {/* <span className="mt-1 font-semibold text-primary">{idx + 1}.</span> */}
             <p className="flex-1 leading-relaxed text-foreground/80 dark:text-foreground/75">
                {cleanedStep}
             </p>
           </motion.div>
       ) : null;
     }).filter(Boolean); // Filter out nulls from empty lines
   };

   // Function to render ingredients list
    const renderIngredientsList = (text: string | null | undefined) => {
      if (!text) return <li>{t('recipeDetail.ingredientsPlaceholder') || 'No ingredients listed.'}</li>;
      return text.split('\n').map((item, idx) => {
        const cleanedItem = item.replace(/^- \s*/, '').trim(); // Remove leading dash and trim
        return cleanedItem ? (
           <motion.li
             key={idx}
             className="mb-1.5"
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.3 + idx * 0.05, duration: 0.4 }} // Stagger animation
           >
             {cleanedItem}
           </motion.li>
         ) : null;
      }).filter(Boolean); // Filter out nulls from empty lines
    };


  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-4xl">
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

        <Card className="overflow-hidden shadow-lg border border-border/60 bg-card">
          <CardHeader className="p-0 relative aspect-[16/8] sm:aspect-[16/7] overflow-hidden group">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={t('results.imageAlt').replace('{recipeName}', recipeName)}
                width={1000}
                height={562} // Adjusted for aspect ratio
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                priority // Load image faster as it's the main content
                unoptimized={imageUrl.startsWith('data:image')} // Prevent optimization for data URIs if causing issues
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/40 dark:from-background/40 dark:to-background/20">
                <ImageOff className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/40" />
              </div>
            )}
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/70 to-transparent">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
              >
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2 leading-tight">
                  {recipeName}
                </CardTitle>
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-white/90 text-foreground backdrop-blur-sm py-0.5 px-2.5 text-xs sm:text-sm font-medium shadow-sm border border-black/10"
                  >
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    {estimatedTime}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-white/90 text-foreground backdrop-blur-sm py-0.5 px-2.5 text-xs sm:text-sm font-medium shadow-sm border border-black/10"
                  >
                    <BarChart className="h-3.5 w-3.5 -rotate-90 text-primary" />
                    {difficulty}
                  </Badge>
                </div>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 md:p-8 space-y-6 md:space-y-8">
            {/* Ingredients Section */}
             <motion.section
               aria-labelledby="ingredients-heading"
               initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
             >
               <h2 id="ingredients-heading" className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground/90 flex items-center gap-2">
                 <BookOpen size={20} className="text-primary"/> {t('results.ingredientsTitle')}
               </h2>
               <Card className="bg-muted/30 dark:bg-background/20 border border-border/40 p-4 rounded-lg shadow-inner">
                 <ul className="list-disc list-outside pl-5 space-y-1 text-sm sm:text-base text-foreground/80 dark:text-foreground/75 marker:text-primary/80 marker:text-lg">
                    {renderIngredientsList(ingredients)}
                 </ul>
               </Card>
             </motion.section>


            <Separator className="my-6 sm:my-8 bg-border/40" />

            {/* Instructions Section */}
            <motion.section
                aria-labelledby="instructions-heading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 id="instructions-heading" className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-5 text-foreground/90 flex items-center gap-2">
                <ChefHat size={20} className="text-primary"/> {t('results.instructionsTitle')}
              </h2>
              <div className="space-y-4 text-sm sm:text-base">
                 {renderInstructions(instructions)}
              </div>
            </motion.section>


             {/* Conditionally render Nutrition and Diet Plan sections */}
             {(nutritionFacts || dietPlanSuitability) && (
                 <>
                     <Separator className="my-6 sm:my-8 bg-border/40" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                         {/* Nutrition Facts Section */}
                         {nutritionFacts && (
                             <motion.section
                                 aria-labelledby="nutrition-heading"
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
                             >
                                 <h2 id="nutrition-heading" className="text-lg sm:text-xl font-semibold mb-3 text-foreground/90 flex items-center gap-2">
                                     <UtensilsCrossed size={18} className="text-primary"/> {t('recipeDetail.nutritionTitle')}
                                 </h2>
                                 <Card className="bg-muted/30 dark:bg-background/20 border-border/50 rounded-lg shadow-inner overflow-hidden">
                                     <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                         {renderMultilineText(nutritionFacts)}
                                     </CardContent>
                                 </Card>
                             </motion.section>
                         )}

                         {/* Diet Plan Suitability Section */}
                         {dietPlanSuitability && (
                             <motion.section
                                 aria-labelledby="diet-plan-heading"
                                 initial={{ opacity: 0, y: 20 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
                             >
                                 <h2 id="diet-plan-heading" className="text-lg sm:text-xl font-semibold mb-3 text-foreground/90 flex items-center gap-2">
                                     <UtensilsCrossed size={18} className="text-primary"/> {t('recipeDetail.dietPlanTitle')}
                                 </h2>
                                 <Card className="bg-muted/30 dark:bg-background/20 border-border/50 rounded-lg shadow-inner overflow-hidden">
                                     <CardContent className="p-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                         {renderMultilineText(dietPlanSuitability)}
                                     </CardContent>
                                 </Card>
                             </motion.section>
                         )}
                     </div>
                 </>
             )}


          </CardContent>

          {/* Optional Footer for Image Prompt */}
          {imagePrompt && (
              <CardFooter className="p-4 sm:p-5 bg-muted/40 dark:bg-background/30 border-t border-border/30 mt-4">
                 <p className="text-xs text-muted-foreground italic text-center w-full">
                    <strong>{t('recipeDetail.imagePromptLabel')}:</strong> "{imagePrompt}"
                  </p>
               </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}


export default function RecipeDetailPage() {
  // Wrap the component using searchParams with Suspense
  // The key forces remount when query params change, ensuring data refresh
  // Use Suspense key based on URL search params string for reliability
  const searchParamsString = typeof window !== 'undefined' ? window.location.search : '';

  return (
    <Suspense fallback={<RecipeDetailLoading />} key={searchParamsString}>
      <RecipeDetailContent />
    </Suspense>
  );
}

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
                    {/* <div className="h-6 w-6 bg-muted/50 rounded-full mt-0.5"></div> */}
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full bg-muted/40 rounded"></div>
                      <div className="h-4 w-11/12 bg-muted/40 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

             {/* Optional Details Placeholder */}
             <Separator className="my-8 bg-border/30" />
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

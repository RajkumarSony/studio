// src/app/recipe/[slug]/page.tsx
'use client';

import React, { Suspense } from 'react';
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


  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button asChild variant="outline" size="sm" className="mb-6 group">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            {t('recipeDetail.backButton')}
          </Link>
        </Button>

        <Card className="overflow-hidden shadow-lg border border-border/60">
          <CardHeader className="p-0 relative aspect-[16/8] overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={t('results.imageAlt').replace('{recipeName}', recipeName)}
                width={1000}
                height={500} // Adjust height for better aspect ratio
                className="w-full h-full object-cover"
                priority // Load image faster as it's the main content
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/40 dark:from-background/40 dark:to-background/20">
                <ImageOff className="h-20 w-20 text-muted-foreground/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <CardTitle className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
                  {recipeName}
                </CardTitle>
                <div className="flex flex-wrap gap-3 items-center">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 bg-white/80 text-black backdrop-blur-sm py-1 px-2.5 text-sm font-medium shadow-sm"
                  >
                    <Clock className="h-4 w-4 text-primary" />
                    {estimatedTime}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1.5 bg-white/80 text-black backdrop-blur-sm py-1 px-2.5 text-sm font-medium shadow-sm"
                  >
                    <BarChart className="h-4 w-4 -rotate-90 text-primary" />
                    {difficulty}
                  </Badge>
                </div>
              </motion.div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Ingredients Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                <BookOpen size={22} /> {t('results.ingredientsTitle')}
              </h2>
              <ul className="list-disc list-outside pl-6 space-y-2 text-foreground/80 dark:text-foreground/75 whitespace-pre-line marker:text-primary/80 marker:text-lg">
                {ingredients.split('\n').map((item, idx) => {
                  const cleanedItem = item.replace(/^- \s*/, '').trim();
                  return cleanedItem ? <li key={idx}>{cleanedItem}</li> : null;
                })}
              </ul>
            </motion.div>

            <Separator className="my-8 bg-border/40" />

            {/* Instructions Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold mb-5 text-foreground/90 flex items-center gap-2">
                <ChefHat size={22} /> {t('results.instructionsTitle')}
              </h2>
              <div className="space-y-6 text-foreground/80 dark:text-foreground/75 whitespace-pre-line">
                {instructions.split('\n').map((step, idx) => {
                  const cleanedStep = step.replace(/^\s*(\d+\.|-)\s*/, '').trim();
                  return cleanedStep ? (
                    <div key={idx} className="flex items-start">
                      <span className="mr-4 mt-0.5 font-bold text-primary text-lg leading-tight bg-primary/10 rounded-full h-7 w-7 flex items-center justify-center shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <p className="flex-1 leading-relaxed pt-0.5">
                        {cleanedStep}
                      </p>
                    </div>
                  ) : null;
                })}
              </div>
            </motion.div>

            {/* Conditionally render Nutrition and Diet Plan sections if data exists */}
             { (nutritionFacts || dietPlanSuitability) && <Separator className="my-8 bg-border/40" /> }

            {/* Nutrition Facts Section */}
            {nutritionFacts && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5, duration: 0.5 }}
                 >
                   <h2 className="text-2xl font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                      <UtensilsCrossed size={22} /> {t('recipeDetail.nutritionTitle')}
                   </h2>
                   <Card className="bg-muted/40 border-border/50">
                     <CardContent className="p-4 text-sm text-muted-foreground">
                        <p className="whitespace-pre-line">{nutritionFacts}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
            )}


            {/* Diet Plan Section */}
            {dietPlanSuitability && (
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                 >
                    <h2 className="text-2xl font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                      <UtensilsCrossed size={22} /> {t('recipeDetail.dietPlanTitle')}
                    </h2>
                    <Card className="bg-muted/40 border-border/50">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        <p className="whitespace-pre-line">{dietPlanSuitability}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
            )}


          </CardContent>

          {/* Optional Footer */}
          {imagePrompt && (
              <CardFooter className="p-4 bg-muted/30 dark:bg-background/30 border-t border-border/30">
                 <p className="text-xs text-muted-foreground italic">
                    {t('recipeDetail.imagePromptLabel')}: "{imagePrompt}"
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
  // The key={Date.now()} forces remount when query params change, ensuring data refresh
  return (
    <Suspense fallback={<RecipeDetailLoading />} key={Date.now()}>
      <RecipeDetailContent />
    </Suspense>
  );
}

// Basic loading state component
function RecipeDetailLoading() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl animate-pulse">
       <div className="h-8 w-24 bg-muted rounded mb-6"></div>
       <Card className="overflow-hidden shadow-lg border border-border/60">
          <div className="aspect-[16/8] bg-muted/30"></div>
          <CardContent className="p-6 md:p-8 space-y-8">
            <div className="space-y-4">
               <div className="h-6 w-1/2 bg-muted/40 rounded mb-4"></div>
               <div className="h-4 w-full bg-muted/40 rounded"></div>
               <div className="h-4 w-3/4 bg-muted/40 rounded"></div>
             </div>
             <Separator className="my-8 bg-border/40" />
             <div className="space-y-4">
               <div className="h-6 w-1/3 bg-muted/40 rounded mb-4"></div>
               <div className="flex items-start space-x-4 mb-4">
                 <div className="h-7 w-7 bg-muted/40 rounded-full"></div>
                 <div className="flex-1 space-y-2">
                   <div className="h-4 w-full bg-muted/40 rounded"></div>
                   <div className="h-4 w-5/6 bg-muted/40 rounded"></div>
                 </div>
               </div>
               <div className="flex items-start space-x-4">
                  <div className="h-7 w-7 bg-muted/40 rounded-full"></div>
                 <div className="flex-1 space-y-2">
                   <div className="h-4 w-full bg-muted/40 rounded"></div>
                 </div>
               </div>
             </div>
             <Separator className="my-8 bg-border/40" />
              <div className="space-y-4">
                 <div className="h-6 w-1/4 bg-muted/40 rounded mb-4"></div>
                 <div className="h-20 bg-muted/30 rounded p-4">
                     <div className="h-4 w-full bg-muted/40 rounded mb-2"></div>
                     <div className="h-4 w-3/4 bg-muted/40 rounded"></div>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="h-6 w-1/4 bg-muted/40 rounded mb-4"></div>
                 <div className="h-20 bg-muted/30 rounded p-4">
                     <div className="h-4 w-full bg-muted/40 rounded mb-2"></div>
                     <div className="h-4 w-2/3 bg-muted/40 rounded"></div>
                 </div>
               </div>
           </CardContent>
        </Card>
     </div>
  );
}

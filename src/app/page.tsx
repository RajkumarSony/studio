// src/app/page.tsx
'use client';

import React, {useState, useEffect, useCallback} from 'react';
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
  Heart, // Example: Icon for saving/favoriting?
  BookOpen, // For Ingredients/Instructions titles
  AlertTriangle, // For Warnings
  ArrowRight, // Icon for navigation
  FileText, // Icon for including details
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
import {useToast} from '@/hooks/use-toast';
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

// Define supported languages and their corresponding CSS font variables
// Moved this structure to translations.ts, import here if needed for UI logic
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

export default function Home() {
  const {setTheme} = useTheme();
  const {toast} = useToast();
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isClient, setIsClient] = useState(false);

  // Translation function
  const t = useCallback((key: string) => {
     // Split key for nested access, e.g., "form.ingredientsLabel"
    const keys = key.split('.');
    let result: any = translations[selectedLanguage] || translations.en; // Fallback to English

    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if key not found in selected language
        let fallbackResult: any = translations.en;
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if (fallbackResult === undefined) return key; // Return key itself if not found anywhere
        }
        return fallbackResult || key;
      }
    }
    return typeof result === 'string' ? result : key; // Ensure we return a string
  }, [selectedLanguage]);

  // Memoize the form schema generation based on the translation function `t`
  const currentFormSchema = React.useMemo(() => formSchema(t as any), [t]);


  // Initialize form with the dynamic schema
  const form = useForm<z.infer<ReturnType<typeof formSchema>>>({
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
    });

  // Update form resolver when language changes
  useEffect(() => {
    form.reset(undefined, { keepValues: true }); // Keep values but update resolver
  }, [currentFormSchema, form]);


  // Update CSS variable for dynamic font switching when language changes
  useEffect(() => {
    const selectedLangData = supportedLanguages.find(lang => lang.value === selectedLanguage);
    const fontVariable = selectedLangData ? selectedLangData.fontVariable : 'var(--font-noto-sans)'; // Default fallback
    document.documentElement.style.setProperty('--font-dynamic', fontVariable);
    document.documentElement.lang = selectedLanguage;
  }, [selectedLanguage]);


  useEffect(() => {
    setIsClient(true);
  }, []);


   // Handle form reset
   const handleReset = () => {
    form.reset();
    setRecipes(null);
    setIsLoading(false);
    toast({
      title: t('toast.formClearedTitle'),
      description: t('toast.formClearedDesc'),
      variant: 'default',
    });
  };

  // Handle saving a recipe (placeholder)
  const handleSaveRecipe = (recipe: RecipeItem) => {
    console.log('Saving recipe:', recipe.recipeName);
    // Implement actual saving logic here (e.g., localStorage, API call)
    toast({
      title: t('toast.recipeSavedTitle'),
      description: t('toast.recipeSavedDesc').replace('{recipeName}', recipe.recipeName),
      variant: 'default',
    });
  };

  // Function to navigate to recipe detail page
  const handleViewRecipe = (recipe: RecipeItem) => {
    const queryParams = new URLSearchParams({
        name: recipe.recipeName,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        estimatedTime: recipe.estimatedTime,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl ?? '', // Pass imageUrl if available
        imagePrompt: recipe.imagePrompt ?? '', // Pass imagePrompt
        language: selectedLanguage, // Pass current language
        // Add the nutrition/diet fields
        nutritionFacts: recipe.nutritionFacts ?? '',
        dietPlanSuitability: recipe.dietPlanSuitability ?? '',
    });

    // Encode recipe name for URL safety
    const encodedName = encodeURIComponent(recipe.recipeName.replace(/\s+/g, '-').toLowerCase());
    router.push(`/recipe/${encodedName}?${queryParams.toString()}`);
  };


  async function onSubmit(values: z.infer<ReturnType<typeof formSchema>>) {
    setIsLoading(true);
    setRecipes(null);
    try {
      // Enhance preferences based on new inputs
      let enhancedPreferences = values.preferences || '';
      if (values.quickMode) {
        enhancedPreferences += (enhancedPreferences ? ', ' : '') + t('quickModePreference'); // Use translation
      }
      if (values.servingSize) {
         enhancedPreferences += (enhancedPreferences ? ', ' : '') + t('servingSizePreference').replace('{count}', values.servingSize.toString()); // Use translation
      }
      if (values.cuisineType) {
          enhancedPreferences += (enhancedPreferences ? ', ' : '') + `cuisine type: ${values.cuisineType}`;
      }
       if (values.cookingMethod) {
          enhancedPreferences += (enhancedPreferences ? ', ' : '') + `preferred cooking method: ${values.cookingMethod}`;
      }


      const input: SuggestRecipesInput = {
        ingredients: values.ingredients,
        dietaryRestrictions: values.dietaryRestrictions || undefined,
        preferences: enhancedPreferences || undefined, // Use enhanced preferences
        language: selectedLanguage,
        includeDetails: values.includeDetails, // Pass the switch value
      };

      const result = await suggestRecipes(input);
      setRecipes(result);
      if (result.length === 0) {
        toast({
          title: t('toast.noRecipesTitle'),
          description: t('toast.noRecipesDesc'),
          variant: 'default',
        });
      } else {
        toast({
          title: t('toast.recipesFoundTitle'),
          description: t('toast.recipesFoundDesc')
            .replace('{count}', result.length.toString())
            .replace('{s}', result.length > 1 ? 's' : ''), // Basic pluralization
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      const errorMessage = error instanceof Error ? error.message : t('toast.genericError');
       toast({
          title: t('toast.errorTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
    } finally {
      setIsLoading(false);
    }
  }

  const containerVariants = {
    hidden: {opacity: 0},
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Faster stagger
        delayChildren: 0.1, // Start sooner
      },
    },
  };

  const itemVariants = {
    hidden: {y: 20, opacity: 0}, // Reduced initial Y offset
    visible: {
      y: 0,
      opacity: 1,
      transition: {type: 'spring', stiffness: 100, damping: 12}, // Snappier spring
    },
    exit: {y: -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }, // Faster exit
  };

  const LoadingSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-10 animate-pulse space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <span className="text-lg text-muted-foreground">
        {t('loadingMessage')} {/* Use translation */}
      </span>
      {/* Add skeleton card placeholders */}
      <div className="w-full max-w-3xl space-y-6">
        {[...Array(2)].map((_, i) => (
            <Card key={i} className="w-full shadow-md border border-border/30 overflow-hidden">
              <div className="h-40 bg-muted/30"></div>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 w-3/4 bg-muted/40 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-muted/40 rounded-full"></div>
                  <div className="h-5 w-24 bg-muted/40 rounded-full"></div>
                </div>
                <div className="h-4 w-1/4 bg-muted/40 rounded"></div>
                 <div className="space-y-2">
                   <div className="h-4 w-full bg-muted/40 rounded"></div>
                   <div className="h-4 w-5/6 bg-muted/40 rounded"></div>
                 </div>
               </CardContent>
            </Card>
        ))}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/5 to-background dark:from-background dark:via-black/10 dark:to-background/90">
       {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <motion.div
            initial={{x: -20, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            transition={{duration: 0.5, delay: 0.1}}
            className="mr-auto flex items-center flex-shrink-0" // Use mr-auto to push others right
          >
            <ChefHat className="h-7 w-7 mr-2 text-primary drop-shadow-sm" />
            <span className="text-xl font-bold tracking-tight whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary/80 dark:to-primary/60">
              {t('appTitle')} {/* Use translation */}
            </span>
          </motion.div>
          <div className="flex items-center justify-end space-x-2 md:space-x-3">
            {/* Language Selector */}
            <TooltipProvider delayDuration={100}>
              <motion.div
                initial={{y: -20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.5, delay: 0.2}}
              >
                <Select
                  value={selectedLanguage}
                  onValueChange={(value) => setSelectedLanguage(value as LanguageCode)}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectTrigger
                        className="w-auto h-9 px-2.5 gap-1.5 border-none shadow-none bg-transparent hover:bg-accent focus:ring-1 focus:ring-primary/50 transition-colors"
                        aria-label={t('languageSelector.ariaLabel')} // Use translation
                      >
                        <Languages className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                        <SelectValue placeholder={t('languageSelector.placeholder')} /> {/* Use translation */}
                      </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{t('languageSelector.tooltip')}</p> {/* Use translation */}
                    </TooltipContent>
                  </Tooltip>
                  <SelectContent className="max-h-60 overflow-y-auto backdrop-blur-md bg-popover/90">
                    {supportedLanguages.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label} {/* Keep native label */}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Theme Toggle */}
              <motion.div
                initial={{y: -20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.5, delay: 0.3}}
              >
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 transition-transform hover:scale-110 focus:ring-1 focus:ring-primary/50"
                          aria-label={t('themeSelector.ariaLabel')} // Use translation
                        >
                          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                          <span className="sr-only">{t('themeSelector.ariaLabel')}</span> {/* Use translation */}
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{t('themeSelector.tooltip')}</p> {/* Use translation */}
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent
                    align="end"
                    className="animate-in fade-in zoom-in-95 backdrop-blur-md bg-popover/90"
                  >
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="mr-2 h-4 w-4" /> {t('themeSelector.light')} {/* Use translation */}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon className="mr-2 h-4 w-4" /> {t('themeSelector.dark')} {/* Use translation */}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Palette className="mr-2 h-4 w-4" /> {t('themeSelector.system')} {/* Use translation */}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            </TooltipProvider>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10 md:py-16 px-4 md:px-6">
        {/* Hero Section */}
        <motion.section
          initial={{opacity: 0, y: -20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.6, delay: 0.2}}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60 dark:from-primary/90 dark:via-primary/70 dark:to-primary/50 py-2">
             {t('hero.title')} {/* Use translation */}
          </h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')} {/* Use translation */}
          </p>
        </motion.section>

        {/* Form Card */}
        <motion.div
          initial={{opacity: 0, scale: 0.95}}
          animate={{opacity: 1, scale: 1}}
          transition={{duration: 0.5, delay: 0.4}}
        >
          <Card className="w-full max-w-2xl mx-auto mb-12 shadow-lg border border-border/60 hover:shadow-xl transition-shadow duration-300 bg-card/90 backdrop-blur-sm overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-t-lg border-b border-primary/10">
              <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                <Sparkles className="h-5 w-5" /> {t('form.title')} {/* Use translation */}
              </CardTitle>
              <CardDescription>
                {t('form.description')} {/* Use translation */}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Ingredients Field */}
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="ingredients"
                      render={({field}) => (
                        <FormItem>
                          <FormLabel className="font-medium text-foreground/90 flex items-center gap-1.5">
                           <Soup size={16}/> {t('form.ingredientsLabel')} * {/* Use translation */}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('form.ingredientsPlaceholder')} // Use translation
                              {...field}
                              rows={4}
                              className="resize-none focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70"
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
                               {t('form.dietaryRestrictionsLabel')} {/* Use translation */}
                             </FormLabel>
                             <FormControl>
                               <Input
                                 placeholder={t('form.dietaryRestrictionsPlaceholder')} // Use translation
                                 {...field}
                                className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70"
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
                               {t('form.preferencesLabel')} {/* Use translation */}
                             </FormLabel>
                             <FormControl>
                               <Input
                                 placeholder={t('form.preferencesPlaceholder')} // Use translation
                                 {...field}
                                 className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70"
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
                                className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70"
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
                                 className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70"
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     </motion.div>
                  </div>

                  {/* Quick Mode, Serving Size & Include Details */}
                  <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 flex-wrap">
                      {/* Quick Mode Switch */}
                      <FormField
                        control={form.control}
                        name="quickMode"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                             <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="quick-mode"
                                aria-label={t('form.quickModeAriaLabel')} // Use translation
                              />
                            </FormControl>
                            <Label htmlFor="quick-mode" className="font-medium text-foreground/90 cursor-pointer">
                              {t('form.quickModeLabel')} <span className="text-xs text-muted-foreground">{t('form.quickModeHint')}</span> {/* Use translation */}
                            </Label>
                          </FormItem>
                        )}
                      />

                     {/* Serving Size Input */}
                     <FormField
                       control={form.control}
                       name="servingSize"
                       render={({ field }) => (
                         <FormItem className="flex-1 min-w-[120px] max-w-[200px]">
                           <FormLabel className="font-medium text-foreground/90 flex items-center gap-1.5">
                            <Scale size={16} /> {t('form.servingSizeLabel')} {/* Use translation */}
                           </FormLabel>
                           <FormControl>
                             <Input
                               type="number"
                               min="1"
                               placeholder={t('form.servingSizePlaceholder')} // Use translation
                               {...field}
                               // Ensure value is handled correctly for number input
                               value={field.value ?? ''}
                               onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                               className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/40 hover:bg-muted/50 dark:bg-background/50 dark:hover:bg-background/60 border-border/70 w-full"
                              />
                            </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     {/* Include Details Switch */}
                      <FormField
                        control={form.control}
                        name="includeDetails"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                             <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="include-details"
                                aria-label={t('form.includeDetailsAriaLabel')} // Use translation
                              />
                            </FormControl>
                            <Label htmlFor="include-details" className="font-medium text-foreground/90 cursor-pointer flex items-center gap-1.5">
                             <FileText size={16}/> {t('form.includeDetailsLabel')} <span className="text-xs text-muted-foreground">{t('form.includeDetailsHint')}</span> {/* Use translation */}
                            </Label>
                          </FormItem>
                        )}
                      />
                  </motion.div>

                  {/* Submit & Reset Buttons */}
                  <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="submit"
                      className="w-full sm:flex-1 py-3 text-base font-semibold transition-all duration-300 ease-out bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-[0.98]"
                      disabled={isLoading}
                      aria-live="polite"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('form.submitButtonLoading')} {/* Use translation */}
                        </>
                      ) : (
                         <>
                          <Sparkles className="mr-2 h-5 w-5"/> {t('form.submitButton')} {/* Use translation */}
                         </>
                      )}
                    </Button>
                     <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="w-full sm:w-auto transition-colors duration-200 hover:bg-muted/80 dark:hover:bg-muted/20"
                      disabled={isLoading}
                    >
                      {t('form.resetButton')} {/* Use translation */}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
             {/* Card Footer with Info */}
            <CardFooter className="p-4 bg-muted/30 dark:bg-background/30 rounded-b-lg border-t border-border/30">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> {t('form.footerNote')} {/* Use translation */}
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Loading Skeleton */}
        {isLoading && isClient && <LoadingSkeleton />}

        {/* Recipe Results Section */}
        <AnimatePresence mode="wait">
          {recipes && recipes.length > 0 && !isLoading && (
            <motion.div
              key="recipe-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16" // Use grid layout
            >
              <h2 className="col-span-full text-3xl font-semibold text-center border-b pb-4 mb-4 text-foreground/90 dark:text-foreground/80"> {/* Adjust title span */}
                {t('results.title')} {/* Use translation */}
              </h2>
              {recipes.map((recipe, index) => (
                <motion.div key={recipe.recipeName + index} variants={itemVariants}>
                  <Card
                     className={cn(
                        'w-full h-full flex flex-col shadow-lg border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 group bg-card/95 backdrop-blur-sm'
                      )}
                  >
                    {/* Recipe Image Header */}
                    <CardHeader className="p-0 relative aspect-[16/9] overflow-hidden group">
                      {recipe.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={recipe.imageUrl}
                          alt={t('results.imageAlt').replace('{recipeName}', recipe.recipeName)} // Use translation
                          width={400}
                          height={225}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 to-muted/40 dark:from-background/40 dark:to-background/20">
                          <ImageOff className="h-12 w-12 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <CardTitle className="text-lg font-bold text-white drop-shadow-md line-clamp-2">
                          {recipe.recipeName} {/* Keep AI-generated name */}
                        </CardTitle>
                      </div>
                       {/* Save Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-primary hover:text-primary-foreground transition-all opacity-70 group-hover:opacity-100 backdrop-blur-sm"
                                onClick={() => handleSaveRecipe(recipe)}
                                aria-label={t('results.saveButtonAriaLabel')} // Use translation
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                             <TooltipContent side="left">
                                <p>{t('results.saveButtonTooltip')}</p> {/* Use translation */}
                              </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </CardHeader>
                    {/* Recipe Details Content */}
                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3"> {/* Adjust padding and layout */}
                      <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="flex flex-wrap gap-2 items-center">
                         {/* Time Badge */}
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 border-primary/70 text-primary bg-primary/10 backdrop-blur-sm py-0.5 px-2 text-xs font-medium"
                        >
                          <Clock className="h-3 w-3" />
                          {recipe.estimatedTime} {/* Keep AI-generated */}
                        </Badge>
                        {/* Difficulty Badge */}
                        <Badge
                           variant="outline"
                           className="flex items-center gap-1 border-secondary-foreground/40 bg-secondary/50 dark:bg-secondary/20 backdrop-blur-sm py-0.5 px-2 text-xs font-medium"
                        >
                          <BarChart className="h-3 w-3 -rotate-90" />
                          {recipe.difficulty} {/* Keep AI-generated */}
                        </Badge>
                      </motion.div>

                     {/* Short description/summary if available or first few lines of instructions */}
                     <motion.p
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ duration: 0.3, delay: 0.2 }}
                         className="text-sm text-muted-foreground line-clamp-3 leading-snug"
                      >
                         {/* Display first part of instructions as a preview */}
                         {recipe.instructions.split('\n')[0]?.replace(/^\s*(\d+\.|-)\s*/, '').trim() ?? t('results.defaultDescription')}
                       </motion.p>

                    </CardContent>
                     {/* View Recipe Button */}
                     <CardFooter className="p-4 pt-0">
                         <Button
                            variant="outline"
                            size="sm"
                            className="w-full transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                            onClick={() => handleViewRecipe(recipe)}
                          >
                            {t('results.viewRecipeButton')}
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </Button>
                      </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Recipes Found Card */}
        <AnimatePresence>
          {recipes !== null && recipes.length === 0 && !isLoading && (
            <motion.div
              key="no-recipes"
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -20}}
              transition={{duration: 0.4, ease: 'easeInOut'}}
            >
              <Card className="w-full max-w-xl mx-auto text-center p-10 shadow-sm border border-border/50 bg-card mt-16 rounded-lg">
                <ChefHat className="h-14 w-14 mx-auto text-muted-foreground/70 mb-5" />
                <p className="text-xl font-medium text-muted-foreground">
                  {t('results.noRecipesFoundTitle')} {/* Use translation */}
                </p>
                <p className="text-base text-muted-foreground/80 mt-3">
                  {t('results.noRecipesFoundSuggestion')} {/* Use translation */}
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
        transition={{duration: 0.5, delay: recipes ? 0.2 : 1.0 }} // Delay longer if no recipes initially
        className="py-6 md:px-8 border-t border-border/40 mt-20 bg-muted/40 dark:bg-background/20"
      >
        <div className="container flex flex-col items-center justify-center gap-2 text-center md:h-16 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
             {t('footer.builtWith')} {/* Use translation */}
            <a
              href="https://developers.google.com/studio"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Firebase Studio
            </a>
             . {t('footer.poweredBy')} {/* Use translation */}
          </p>
           <p className="text-xs text-muted-foreground/80">
             {t('footer.copyright').replace('{year}', new Date().getFullYear().toString())} {/* Use translation */}
          </p>
        </div>
      </motion.footer>
    </div>
  );
}

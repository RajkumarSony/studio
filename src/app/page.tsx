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
  RotateCcw, // Icon for reset button
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
  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
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
            if (fallbackResult === undefined) {
                 console.warn(`Translation key "${key}" not found in language "${selectedLanguage}" or fallback "en".`);
                 return key; // Return key itself if not found anywhere
            }
        }
         result = fallbackResult || key;
      }
    }
    // Replace placeholders like {count}
    if (typeof result === 'string' && options) {
       Object.keys(options).forEach((placeholder) => {
         result = result.replace(`{${placeholder}}`, String(options[placeholder]));
       });
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
    // Persist language choice to localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }
  }, [selectedLanguage]);


  useEffect(() => {
    // Load selected language from localStorage on client-side mount
    if (typeof window !== 'undefined') {
        const storedLanguage = localStorage.getItem('selectedLanguage');
        if (storedLanguage && supportedLanguages.some(l => l.value === storedLanguage)) {
            setSelectedLanguage(storedLanguage as LanguageCode);
        }
    }
    setIsClient(true);
  }, []);


   // Handle form reset
   const handleReset = () => {
    form.reset(); // Resets to defaultValues defined in useForm
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
      description: t('toast.recipeSavedDesc', { recipeName: recipe.recipeName }),
      variant: 'default',
    });
  };

 // Function to navigate to recipe detail page
  const handleViewRecipe = (recipe: RecipeItem) => {
    // Use session storage to pass data if it's too large for URL
    // Data URIs can be very long
    try {
      // Serialize the recipe object (excluding potentially huge image data if possible)
      const recipeDataToStore = {
        ...recipe,
        // Optionally remove or replace large data before storing
        // imageUrl: recipe.imageUrl ? 'image_data_omitted' : undefined,
        // We'll pass imageUrl separately in query params if not too big,
        // or rely on sessionStorage entirely
      };
      const serializedRecipe = JSON.stringify(recipeDataToStore);
      sessionStorage.setItem(`recipe-${recipe.recipeName}`, serializedRecipe);

      // Create URLSearchParams object for essential/smaller params
      const queryParams = new URLSearchParams();
      const addParam = (key: string, value: string | undefined | null) => {
          if (value !== undefined && value !== null) {
              queryParams.set(key, encodeURIComponent(value));
          }
      };

      // Add essential identifiers and language
      addParam('name', recipe.recipeName);
      addParam('lang', selectedLanguage);
      // Add image URL only if it's NOT a data URI or is reasonably short
      if (recipe.imageUrl && !recipe.imageUrl.startsWith('data:image')) {
         addParam('imageUrl', recipe.imageUrl);
      } else if (recipe.imageUrl && recipe.imageUrl.length < 1000) { // Example length limit
          addParam('imageUrl', recipe.imageUrl);
      } else {
          // Indicate that image data is in session storage if it's too large
           if (recipe.imageUrl) queryParams.set('imageStored', 'true');
      }


      // Encode recipe name for the path segment (slug)
      const encodedSlug = encodeURIComponent(recipe.recipeName.replace(/\s+/g, '-').toLowerCase())
        .replace(/%/g, '') // Remove percentage signs
        .replace(/\?/g, '') // Remove question marks
        .replace(/#/g, ''); // Remove hash symbols

      // Construct the final URL and navigate
      const url = `/recipe/${encodedSlug}?${queryParams.toString()}`;
      console.log("Navigating to URL:", url); // Log the final URL
      router.push(url);

    } catch (error) {
      console.error("Error saving recipe to session storage:", error);
      toast({
        title: "Navigation Error",
        description: "Could not prepare recipe details for viewing.",
        variant: "destructive",
      });
      // Fallback or alternative navigation if needed
    }
  };


  async function onSubmit(values: z.infer<ReturnType<typeof formSchema>>) {
    setIsLoading(true);
    setRecipes(null); // Clear previous results immediately
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

      if (recipesArray.length === 0) {
        toast({
          title: t('toast.noRecipesTitle'),
          description: t('toast.noRecipesDesc'),
          variant: 'default',
        });
      } else {
        toast({
          title: t('toast.recipesFoundTitle'),
          description: t('toast.recipesFoundDesc', {
              count: recipesArray.length,
              s: recipesArray.length > 1 ? 's' : '' // Basic pluralization, consider a library for complex cases
            }),
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      // Try to get a more specific error message
      let errorMessage = t('toast.genericError');
      if (error instanceof z.ZodError) {
          errorMessage = t('toast.validationError') || 'Input validation failed. Please check your entries.';
          // Optionally log specific validation errors: console.error("Validation Errors:", error.errors);
      } else if (error instanceof Error) {
          errorMessage = error.message; // Use message from standard Error
           // Check for specific Genkit errors if possible (needs inspection of error object)
           // if (error.name === 'GenkitError' && error.code === '...') { errorMessage = ... }
      }
      toast({
         title: t('toast.errorTitle'),
         description: errorMessage,
         variant: 'destructive',
       });
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
      rest: { scale: 1, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }, // Adjusted shadow
      hover: { scale: 1.03, boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)" } // Enhanced shadow
    };

   const buttonHoverEffect = {
     rest: { scale: 1 },
     hover: { scale: 1.05 },
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

  return (
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

           {/* Controls: Language and Theme */}
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
                        {/* Display short code for selected language */}
                         <SelectValue aria-label={`Selected language: ${selectedLanguage.toUpperCase()}`}>
                            {selectedLanguage.toUpperCase()}
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
            </TooltipProvider>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 container py-10 md:py-16 px-4 md:px-6">
        {/* Hero Section */}
        <motion.section
          initial={{opacity: 0, y: -20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.6, delay: 0.2, ease: "easeOut"}}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60 dark:from-primary/90 dark:via-primary/70 dark:to-primary/50 py-2 leading-tight">
             {t('hero.title')}
          </h1>
          <p className="text-muted-foreground mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
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
                <Sparkles className="h-5 w-5" /> {t('form.title')}
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
                        disabled={isLoading}
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
                {recipes.map((recipe, index) => (
                  <motion.div key={recipe.recipeName + index} variants={itemVariants}>
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
                         {/* Save Button */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-primary hover:text-primary-foreground transition-all opacity-80 group-hover:opacity-100 backdrop-blur-sm focus:ring-1 focus:ring-primary/50"
                                  onClick={() => handleSaveRecipe(recipe)}
                                  aria-label={t('results.saveButtonAriaLabel')}
                                >
                                  <Heart className="h-4 w-4" />
                                </Button>
                                </motion.div>
                              </TooltipTrigger>
                               <TooltipContent side="left">
                                  <p>{t('results.saveButtonTooltip')}</p>
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
                ))}
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
                <ChefHat className="h-14 w-14 mx-auto text-muted-foreground/70 mb-5" />
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
            <a
              href="https://developers.google.com/studio"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Firebase Studio
            </a>
             . {t('footer.poweredBy')}
          </p>
           <p className="text-xs text-muted-foreground/80">
             {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </motion.footer>
    </div>
  );
}

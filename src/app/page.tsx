// src/app/page.tsx
'use client';

import React, {useState, useEffect} from 'react';
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
} from '@/components/ui/select'; // Import Select components
import {useTheme} from 'next-themes';
import type {SuggestRecipesInput, RecipeItem} from '@/ai/flows/suggest-recipe'; // Import updated types
import {suggestRecipes} from '@/ai/flows/suggest-recipe';
import {useToast} from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils'; // Import cn utility
import {motion, AnimatePresence} from 'framer-motion'; // Import animation library
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip'; // Import Tooltip

// Define supported languages
const supportedLanguages = [
  {value: 'en', label: 'English'},
  {value: 'hi', label: 'हिन्दी (Hindi)'},
  {value: 'bn', label: 'বাংলা (Bengali)'},
  {value: 'mr', label: 'मराठी (Marathi)'},
  {value: 'ta', label: 'தமிழ் (Tamil)'},
  {value: 'te', label: 'తెలుగు (Telugu)'},
  {value: 'or', label: 'ଓଡ଼ିଆ (Odia)'},
  {value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)'},
  {value: 'ja', label: '日本語 (Japanese)'},
  {value: 'es', label: 'Español (Spanish)'},
  {value: 'fr', label: 'Français (French)'},
];

const formSchema = z.object({
  ingredients: z.string().min(3, {
    message: 'Please enter at least a few ingredients.',
  }),
  dietaryRestrictions: z.string().optional(),
  preferences: z.string().optional(),
});

export default function Home() {
  const {setTheme} = useTheme();
  const {toast} = useToast();
  const [recipes, setRecipes] = useState<RecipeItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en'); // Default language: English
  const [isClient, setIsClient] = useState(false); // State to track client-side mount

  useEffect(() => {
    // Component did mount, safe to use browser-specific APIs/state
    setIsClient(true);
  }, []);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      dietaryRestrictions: '',
      preferences: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecipes(null); // Clear previous recipes
    try {
      const input: SuggestRecipesInput = {
        ingredients: values.ingredients,
        dietaryRestrictions: values.dietaryRestrictions || undefined,
        preferences: values.preferences || undefined,
        language: selectedLanguage, // Pass selected language to the flow
      };
      const result = await suggestRecipes(input);
      setRecipes(result);
      if (result.length === 0) {
        toast({
          title: 'No Recipes Found',
          description:
            "Couldn't find any recipes with the given ingredients and preferences. Try adjusting your input.",
          variant: 'default',
        });
      } else {
         toast({
            title: 'Recipes Found!',
            description: `We found ${result.length} recipe suggestion${result.length > 1 ? 's' : ''} for you.`,
            variant: 'default',
          });
      }
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to suggest recipes. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

   // Animation variants
   const containerVariants = {
      hidden: {opacity: 0},
      visible: {
       opacity: 1,
       transition: {
         staggerChildren: 0.1,
         delayChildren: 0.3,
       },
     },
   };

   const itemVariants = {
     hidden: {y: 20, opacity: 0},
     visible: {
       y: 0,
       opacity: 1,
       transition: {type: 'spring', stiffness: 100},
     },
     exit: { y: -20, opacity: 0 },
   };

   // Render loading skeleton only on client to avoid hydration mismatch
   const LoadingSkeleton = () => (
    <div className="flex justify-center items-center py-10 animate-pulse">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <span className="ml-4 text-lg text-muted-foreground">
        Generating delicious ideas...
      </span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/10 dark:from-background dark:to-black/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <motion.div
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="mr-4 flex items-center flex-shrink-0">
            <ChefHat className="h-7 w-7 mr-2 text-primary" />
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">
              RecipeSage
            </span>
          </motion.div>
          <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
             <TooltipProvider>
               {/* Language Selector */}
               <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}>
               <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <SelectTrigger
                      className="w-auto h-9 px-2 gap-1 border-none shadow-none bg-transparent hover:bg-accent focus:ring-0"
                      aria-label="Select language"
                    >
                      <Languages className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                   </TooltipTrigger>
                   <TooltipContent>
                     <p>Select Language</p>
                   </TooltipContent>
                 </Tooltip>
                 <SelectContent className="max-h-60 overflow-y-auto">
                   {supportedLanguages.map(lang => (
                     <SelectItem key={lang.value} value={lang.value}>
                       {lang.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               </motion.div>

               {/* Theme Toggle */}
               <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}>
                <DropdownMenu>
                  <Tooltip>
                   <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 transition-transform hover:scale-110"
                          aria-label="Toggle theme"
                        >
                          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                          <span className="sr-only">Toggle theme</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                     <TooltipContent>
                       <p>Change Theme</p>
                     </TooltipContent>
                   </Tooltip>
                  <DropdownMenuContent
                    align="end"
                    className="animate-in fade-in zoom-in-95"
                  >
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun className="mr-2 h-4 w-4"/> Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                     <Moon className="mr-2 h-4 w-4"/> Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Palette className="mr-2 h-4 w-4"/> System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
               </motion.div>
            </TooltipProvider>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-10 md:py-16 px-4 md:px-6">
        <motion.section
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.2 }}
           className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary/80 dark:to-primary/60">
            Unlock Your Inner Chef!
          </h1>
          <p className="text-muted-foreground mt-3 text-base md:text-lg max-w-xl mx-auto">
            Enter ingredients you have, add preferences, and let RecipeSage find
            your next delicious meal, just for you.
          </p>
        </motion.section>

         <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, delay: 0.4 }}>
           <Card className="w-full max-w-2xl mx-auto mb-12 shadow-lg border border-border/60 hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
             <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent rounded-t-lg">
               <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5"/> Find Recipes
               </CardTitle>
               <CardDescription>
                 Tell us what you have and what you like. We'll handle the rest!
               </CardDescription>
             </CardHeader>
             <CardContent className="p-6">
               <Form {...form}>
                 <form
                   onSubmit={form.handleSubmit(onSubmit)}
                   className="space-y-6"
                 >
                   <motion.div variants={itemVariants}>
                     <FormField
                       control={form.control}
                       name="ingredients"
                       render={({field}) => (
                         <FormItem>
                           <FormLabel className="font-medium text-foreground/90">
                             Available Ingredients *
                           </FormLabel>
                           <FormControl>
                             <Textarea
                               placeholder="e.g., chicken breast, broccoli, soy sauce, rice, garlic..."
                               {...field}
                               rows={4}
                               className="resize-none focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/30 hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-background/50"
                               aria-required="true"
                             />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                    </motion.div>
                     <motion.div variants={itemVariants}>
                     <FormField
                       control={form.control}
                       name="dietaryRestrictions"
                       render={({field}) => (
                         <FormItem>
                           <FormLabel className="font-medium text-foreground/90">
                             Dietary Restrictions (Optional)
                           </FormLabel>
                           <FormControl>
                             <Input
                               placeholder="e.g., vegetarian, gluten-free, dairy-free"
                               {...field}
                               className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/30 hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-background/50"
                             />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     </motion.div>
                      <motion.div variants={itemVariants}>
                     <FormField
                       control={form.control}
                       name="preferences"
                       render={({field}) => (
                         <FormItem>
                           <FormLabel className="font-medium text-foreground/90">
                             Other Preferences (Optional)
                           </FormLabel>
                           <FormControl>
                             <Input
                               placeholder="e.g., spicy, quick (under 30 min), Italian"
                               {...field}
                               className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/30 hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-background/50"
                             />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     </motion.div>
                   <motion.div variants={itemVariants}>
                     <Button
                       type="submit"
                       className="w-full py-3 text-base font-semibold transition-all duration-200 ease-out bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-[0.98]"
                       disabled={isLoading}
                       aria-live="polite"
                     >
                       {isLoading ? (
                         <>
                           <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                           Finding Recipes...
                         </>
                       ) : (
                         'Get Recipe Suggestions'
                       )}
                     </Button>
                   </motion.div>
                 </form>
               </Form>
             </CardContent>
            <CardFooter className="p-4 bg-muted/20 dark:bg-background/20 rounded-b-lg border-t border-border/30">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                   <Info className="h-3.5 w-3.5"/> AI generates suggestions based on your input. Results may vary.
                </p>
            </CardFooter>
           </Card>
         </motion.div>

         {/* Loading Spinner (Client-side only) */}
        {isLoading && isClient && <LoadingSkeleton />}

         {/* Display multiple recipes */}
         <AnimatePresence mode="wait">
           {recipes && recipes.length > 0 && !isLoading && (
             <motion.div
               key="recipe-list" // Add key for AnimatePresence
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               className="space-y-10 mt-16"
             >
               <h2 className="text-2xl font-semibold text-center border-b pb-4 mb-10">
                 Suggested Recipes
               </h2>
               {recipes.map((recipe, index) => (
                 <motion.div key={recipe.recipeName + index} variants={itemVariants}>
                   <Card
                     className={cn(
                       'w-full max-w-3xl mx-auto shadow-lg border border-border/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 group bg-card'
                     )}
                     // Remove inline style for animation, handled by Framer Motion
                   >
                     <CardHeader className="bg-gradient-to-br from-muted/20 to-transparent dark:from-muted/10 dark:to-transparent p-0 relative aspect-[16/7] overflow-hidden">
                        {/* Display Image or Placeholder */}
                        {recipe.imageUrl ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img
                             src={recipe.imageUrl}
                             alt={`Generated image for ${recipe.recipeName}`}
                             width={800} // Provide width/height for layout stability
                             height={350} // Adjusted height for aspect ratio
                             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                             loading="lazy" // Lazy load images
                           />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/30 dark:from-background/30 dark:to-background/10">
                             <ImageOff className="h-16 w-16 text-muted-foreground/50" />
                          </div>
                        )}
                        {/* Title Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
                         <CardTitle className="text-xl font-bold text-white drop-shadow-md">
                            {recipe.recipeName}
                         </CardTitle>
                        </div>
                     </CardHeader>
                      <CardContent className="p-6 space-y-6">
                       <div className="flex flex-wrap gap-3 items-center">
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1.5 border-primary/70 text-primary bg-primary/10 backdrop-blur-sm py-1 px-2.5"
                           >
                             <Clock className="h-4 w-4" />
                             {recipe.estimatedTime}
                           </Badge>
                          <Badge
                             variant="outline"
                            className="flex items-center gap-1.5 border-secondary-foreground/40 bg-secondary/30 dark:bg-secondary/10 backdrop-blur-sm py-1 px-2.5"
                           >
                             <BarChart className="h-4 w-4 -rotate-90" />
                             {recipe.difficulty}
                           </Badge>
                        </div>

                       <div>
                         <h3 className="text-lg font-semibold mb-3 text-foreground/90">Ingredients</h3>
                         <ul className="list-disc list-outside pl-5 space-y-1.5 text-foreground/80 dark:text-foreground/70 whitespace-pre-line marker:text-primary/80">
                           {recipe.ingredients.split('\n').map((item, idx) => {
                             const cleanedItem = item.replace(/^- \s*/, '').trim();
                             return cleanedItem ? <li key={idx}>{cleanedItem}</li> : null;
                           })}
                         </ul>
                       </div>
                       <Separator className="my-6 bg-border/50" />
                       <div>
                         <h3 className="text-lg font-semibold mb-3 text-foreground/90">Instructions</h3>
                         <div className="space-y-4 text-foreground/80 dark:text-foreground/70 whitespace-pre-line">
                           {recipe.instructions.split('\n').map((step, idx) => {
                             const cleanedStep = step
                               .replace(/^\s*(\d+\.|-)\s*/, '')
                               .trim();
                             return cleanedStep ? (
                               <div key={idx} className="flex items-start">
                                 <span className="mr-3 mt-0.5 font-bold text-primary text-lg leading-tight">
                                   {idx + 1}.
                                 </span>
                                 <p className="flex-1 leading-relaxed">
                                   {cleanedStep}
                                 </p>
                               </div>
                             ) : null;
                           })}
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </motion.div>
               ))}
             </motion.div>
           )}
         </AnimatePresence>

         {/* No Recipes Found Message */}
         <AnimatePresence>
           {recipes !== null && recipes.length === 0 && !isLoading && (
             <motion.div
               key="no-recipes" // Add key for AnimatePresence
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
              >
                 <Card className="w-full max-w-xl mx-auto text-center p-8 shadow-sm border bg-card mt-16">
                   <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                   <p className="text-lg text-muted-foreground">
                     No recipes found matching your criteria.
                   </p>
                   <p className="text-sm text-muted-foreground/80 mt-2">
                     Try adjusting your ingredients or preferences.
                   </p>
                 </Card>
              </motion.div>
           )}
         </AnimatePresence>
       </main>
       <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="py-6 md:px-8 border-t border-border/40 mt-20 bg-muted/30 dark:bg-background/10">
         <div className="container flex flex-col items-center justify-center gap-2 md:h-16 md:flex-row">
           <p className="text-center text-sm text-muted-foreground md:text-left">
             Built by{' '}
             <a
               href="https://developers.google.com/studio" target="_blank" rel="noopener noreferrer"
               className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
             >
               Firebase Studio
             </a>
             . Powered by Gemini.
           </p>
         </div>
       </motion.footer>
     </div>
   );
 }
 
   
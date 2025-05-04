// src/app/page.tsx
'use client';

import React, {useState} from 'react';
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
import {useTheme} from 'next-themes';
import type {SuggestRecipesInput, RecipeItem} from '@/ai/flows/suggest-recipe'; // Import updated types
import {suggestRecipes} from '@/ai/flows/suggest-recipe';
import {useToast} from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Badge} from '@/components/ui/badge';
import {cn} from '@/lib/utils'; // Import cn utility
// Removed unused Image import

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
    setRecipes(null);
    try {
      const input: SuggestRecipesInput = {
        ingredients: values.ingredients,
        dietaryRestrictions: values.dietaryRestrictions || undefined,
        preferences: values.preferences || undefined,
      };
      const result = await suggestRecipes(input);
      setRecipes(result);
      if (result.length === 0) {
        toast({
          title: 'No Recipes Found',
          description:
            "Couldn't find any recipes with the given ingredients and preferences. Try adjusting your input.",
        });
      }
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to suggest recipes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/20">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex items-center">
            <ChefHat className="h-7 w-7 mr-2 text-primary animate-slide-in-from-top" />
            <span className="text-lg font-bold animate-slide-in-from-top delay-100">
              RecipeSage
            </span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-transform hover:scale-110"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="animate-in fade-in zoom-in-95"
              >
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-12 md:py-16">
        <section className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl mb-4 animate-slide-in-from-top duration-700">
            Unlock Your Inner Chef!
          </h1>
          <p className="text-muted-foreground mt-3 text-base md:text-lg max-w-xl mx-auto animate-slide-in-from-top duration-700 delay-200">
            Enter ingredients you have, add preferences, and let RecipeSage find
            your next delicious meal.
          </p>
        </section>

        <Card className="w-full max-w-2xl mx-auto mb-16 shadow-xl border animate-in fade-in zoom-in-95 duration-500 delay-300 hover:shadow-2xl transition-shadow">
          <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-transparent rounded-t-lg">
            <CardTitle className="text-xl font-semibold text-primary">
              Find Recipes
            </CardTitle>
            <CardDescription>
              Tell us what you have and what you like.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
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
                          className="resize-none focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/20 hover:bg-muted/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/20 hover:bg-muted/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          className="focus:ring-primary/50 focus:border-primary transition-all duration-200 shadow-inner bg-muted/20 hover:bg-muted/30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full py-3 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] duration-200 ease-out bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg"
                  disabled={isLoading}
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
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center items-center py-10 animate-in fade-in duration-300">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-4 text-lg text-muted-foreground">
              Loading suggestions...
            </span>
          </div>
        )}

        {/* Display multiple recipes */}
        {recipes && recipes.length > 0 && (
          <div className="space-y-10">
            <h2 className="text-2xl font-semibold text-center border-b pb-4 mb-10 animate-in fade-in duration-500">
              Suggested Recipes
            </h2>
            {recipes.map((recipe, index) => (
              <Card
                key={index}
                className={cn(
                  'w-full max-w-3xl mx-auto shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 group',
                  'animate-slide-in-from-bottom' // Use unified animation class
                )}
                style={{animationDelay: `${index * 150}ms`}} // Stagger animation more
              >
                <CardHeader className="bg-muted/30 p-5 relative overflow-hidden">
                   {/* Display Image or Placeholder */}
                   {recipe.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={recipe.imageUrl}
                        alt={`Generated image for ${recipe.recipeName}`}
                        width={800} // Provide width/height for layout stability
                        height={400}
                        className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                      />
                   ) : (
                     <div className="absolute inset-0 flex items-center justify-center bg-muted/50 opacity-50 group-hover:opacity-60 transition-opacity duration-300">
                        <ImageOff className="h-16 w-16 text-muted-foreground/50" />
                     </div>
                   )}
                  <div className="relative z-10">
                    <CardTitle className="text-xl font-bold text-foreground">
                      {recipe.recipeName}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 border-primary/50 text-primary bg-primary/10 backdrop-blur-sm"
                      >
                        <Clock className="h-4 w-4" />
                        {recipe.estimatedTime}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 border-secondary-foreground/30 bg-secondary/30 backdrop-blur-sm"
                      >
                        <BarChart className="h-4 w-4 -rotate-90" />
                        {recipe.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
                    <ul className="list-disc list-outside pl-5 space-y-1.5 text-foreground/90 whitespace-pre-line">
                      {recipe.ingredients.split('\n').map((item, idx) => {
                        const cleanedItem = item.replace(/^- \s*/, '').trim();
                        return cleanedItem ? <li key={idx}>{cleanedItem}</li> : null;
                      })}
                    </ul>
                  </div>
                  <Separator className="my-6" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                    <div className="space-y-3 text-foreground/90 whitespace-pre-line">
                      {recipe.instructions.split('\n').map((step, idx) => {
                        const cleanedStep = step
                          .replace(/^\s*(\d+\.|-)\s*/, '')
                          .trim();
                        return cleanedStep ? (
                          <div key={idx} className="flex items-start">
                            <span className="mr-2.5 mt-0.5 font-bold text-primary">
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
                 {/* Optional: Footer could go here if needed */}
                 {/* <CardFooter className="p-4 bg-muted/20 text-xs text-muted-foreground">
                    Generated by RecipeSage AI
                  </CardFooter> */}
              </Card>
            ))}
          </div>
        )}

        {/* No Recipes Found Message */}
        {recipes !== null && recipes.length === 0 && !isLoading && (
          <Card className="w-full max-w-xl mx-auto text-center p-8 shadow-sm border bg-card animate-in fade-in zoom-in-95 duration-300">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              No recipes found matching your criteria.
            </p>
            <p className="text-sm text-muted-foreground/80 mt-2">
              Try adjusting your ingredients or preferences.
            </p>
          </Card>
        )}
      </main>
      <footer className="py-6 md:px-8 border-t mt-20 bg-muted/50">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left animate-slide-in-from-bottom delay-500">
            Built by{' '}
            <a
              href="#"
              className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
            >
              Firebase Studio
            </a>
            . Powered by Gemini.
          </p>
        </div>
      </footer>
    </div>
  );
}

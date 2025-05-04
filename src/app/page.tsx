// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ChefHat, Moon, Sun, Clock, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import type { SuggestRecipesInput, RecipeItem } from '@/ai/flows/suggest-recipe'; // Updated import types
import { suggestRecipes } from '@/ai/flows/suggest-recipe'; // Updated import function
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge'; // Import Badge

const formSchema = z.object({
  ingredients: z.string().min(3, {
    message: 'Please enter at least a few ingredients.',
  }),
  dietaryRestrictions: z.string().optional(),
  preferences: z.string().optional(),
});

export default function Home() {
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<RecipeItem[] | null>(null); // State holds an array of recipes
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
      // Prepare input for the updated flow
      const input: SuggestRecipesInput = {
        ingredients: values.ingredients,
        dietaryRestrictions: values.dietaryRestrictions || undefined, // Send undefined if empty
        preferences: values.preferences || undefined, // Send undefined if empty
      };
      const result = await suggestRecipes(input); // Call the updated flow
      setRecipes(result);
       if (result.length === 0) {
         toast({
           title: "No Recipes Found",
           description: "Couldn't find any recipes with the given ingredients and preferences. Try adjusting your input.",
         })
       }
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      toast({
        title: "Error",
        description: "Failed to suggest recipes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <ChefHat className="h-6 w-6 mr-2" />
            <span className="font-bold">RecipeSage</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-8">
        <section className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Unlock Your Inner Chef!
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter ingredients you have, add preferences, and let RecipeSage find your next meal.
          </p>
        </section>

        <Card className="w-full max-w-2xl mx-auto mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Find Recipes</CardTitle>
            <CardDescription>Tell us what you have and what you like.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Ingredients *</FormLabel>
                      <FormControl>
                        <Textarea // Changed to Textarea for longer lists
                          placeholder="e.g., chicken breast, broccoli, soy sauce, rice, garlic, onion..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="dietaryRestrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dietary Restrictions (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., vegetarian, gluten-free, nut allergy"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="preferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Preferences (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., spicy, quick meal, Italian cuisine, low-carb"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

        {/* Display multiple recipes */}
        {recipes && recipes.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-center">Suggested Recipes</h2>
            {recipes.map((recipe, index) => (
              <Card key={index} className="w-full max-w-3xl mx-auto shadow-lg animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-2xl">{recipe.recipeName}</CardTitle>
                   <div className="flex flex-wrap gap-2 pt-2">
                     <Badge variant="secondary" className="flex items-center gap-1">
                       <Clock className="h-4 w-4" />
                       {recipe.estimatedTime}
                     </Badge>
                     <Badge variant="secondary" className="flex items-center gap-1">
                        <BarChart className="h-4 w-4"/>
                        {recipe.difficulty}
                     </Badge>
                   </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground whitespace-pre-line">
                      {/* Improved list formatting */}
                      {recipe.ingredients.split('\n').map((item, idx) => {
                         const cleanedItem = item.replace(/^- \s*/, '').trim();
                         return cleanedItem ? <li key={idx}>{cleanedItem}</li> : null;
                      })}
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                    <div className="space-y-2 text-muted-foreground whitespace-pre-line">
                      {/* Ensure proper step rendering */}
                      {recipe.instructions.split('\n').map((step, idx) => {
                        const cleanedStep = step.replace(/^\s*(\d+\.|-)\s*/, '').trim();
                        return cleanedStep ? <p key={idx}><span className="font-medium mr-1">{idx + 1}.</span>{cleanedStep}</p> : null;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
         {recipes !== null && recipes.length === 0 && !isLoading && (
             <p className="text-center text-muted-foreground mt-8">No recipes found matching your criteria. Try changing your ingredients or preferences.</p>
         )}
      </main>
       <footer className="py-6 md:px-8 md:py-0 border-t mt-12"> {/* Added margin-top */}
          <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by Firebase Studio. Powered by Gemini.
            </p>
          </div>
       </footer>
    </div>
  );
}

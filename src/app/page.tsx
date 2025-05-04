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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import type { SuggestRecipesInput, RecipeItem } from '@/ai/flows/suggest-recipe';
import { suggestRecipes } from '@/ai/flows/suggest-recipe';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

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
           title: "No Recipes Found",
           description: "Couldn't find any recipes with the given ingredients and preferences. Try adjusting your input.",
         });
       }
    } catch (error) {
      console.error('Error suggesting recipes:', error);
      toast({
        title: "Error",
        description: "Failed to suggest recipes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center"> {/* Increased height */}
          <div className="mr-4 flex items-center">
            <ChefHat className="h-7 w-7 mr-2 text-primary" /> {/* Slightly larger icon */}
            <span className="text-lg font-bold">RecipeSage</span> {/* Slightly larger text */}
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
      <main className="flex-1 container py-10 md:py-12"> {/* Increased padding */}
        <section className="mb-10 text-center"> {/* Increased margin */}
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"> {/* Responsive text size */}
            Unlock Your Inner Chef!
          </h1>
          <p className="text-muted-foreground mt-3 text-base md:text-lg max-w-xl mx-auto"> {/* Adjusted margin and text size */}
            Enter ingredients you have, add preferences, and let RecipeSage find your next delicious meal.
          </p>
        </section>

        <Card className="w-full max-w-2xl mx-auto mb-12 shadow-lg border"> {/* Increased margin, added border */}
          <CardHeader className="pb-4"> {/* Adjusted padding */}
            <CardTitle className="text-xl">Find Recipes</CardTitle> {/* Adjusted text size */}
            <CardDescription>Tell us what ingredients you have and any preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"> {/* Increased space */}
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Ingredients *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., chicken breast, broccoli, soy sauce, rice, garlic..."
                          {...field}
                          rows={4} // Slightly more rows
                          className="resize-none" // Prevent manual resize
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
                          placeholder="e.g., vegetarian, gluten-free, dairy-free"
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
                          placeholder="e.g., spicy, quick (under 30 min), Italian"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full py-3 text-base" disabled={isLoading}> {/* Larger button */}
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {/* Larger spinner */}
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
        {isLoading && (
           <div className="flex justify-center items-center py-10">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
               <span className="ml-3 text-muted-foreground">Loading suggestions...</span>
           </div>
        )}

        {recipes && recipes.length > 0 && (
          <div className="space-y-10"> {/* Increased space between cards */}
            <h2 className="text-2xl font-semibold text-center border-b pb-3 mb-8">Suggested Recipes</h2> {/* Added border and margin */}
            {recipes.map((recipe, index) => (
              <Card key={index} className="w-full max-w-3xl mx-auto shadow-md border overflow-hidden animate-in fade-in duration-500"> {/* Subtle shadow, added border */}
                <CardHeader className="bg-muted/30 p-4"> {/* Background for header, adjusted padding */}
                  <CardTitle className="text-xl">{recipe.recipeName}</CardTitle> {/* Adjusted size */}
                   <div className="flex flex-wrap gap-2 pt-2">
                     <Badge variant="outline" className="flex items-center gap-1 border-primary/50 text-primary"> {/* Outline badge */}
                       <Clock className="h-4 w-4" />
                       {recipe.estimatedTime}
                     </Badge>
                     <Badge variant="outline" className="flex items-center gap-1 border-secondary-foreground/30"> {/* Outline badge */}
                        <BarChart className="h-4 w-4 -rotate-90"/> {/* Rotated icon slightly */}
                        {recipe.difficulty}
                     </Badge>
                   </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6"> {/* Increased padding */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Ingredients</h3> {/* Increased margin */}
                    <ul className="list-disc list-outside pl-5 space-y-1.5 text-foreground/80 whitespace-pre-line"> {/* List outside, adjusted spacing/color */}
                      {recipe.ingredients.split('\n').map((item, idx) => {
                         const cleanedItem = item.replace(/^- \s*/, '').trim();
                         return cleanedItem ? <li key={idx}>{cleanedItem}</li> : null;
                      })}
                    </ul>
                  </div>
                  <Separator className="my-6" /> {/* Increased margin */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Instructions</h3> {/* Increased margin */}
                    <div className="space-y-3 text-foreground/80 whitespace-pre-line"> {/* Increased spacing, adjusted color */}
                      {recipe.instructions.split('\n').map((step, idx) => {
                        const cleanedStep = step.replace(/^\s*(\d+\.|-)\s*/, '').trim();
                        // Add step number visually
                        return cleanedStep ? (
                            <div key={idx} className="flex items-start">
                              <span className="mr-2 font-medium text-primary">{idx + 1}.</span>
                              <p className="flex-1">{cleanedStep}</p>
                            </div>
                          ) : null;
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
         {recipes !== null && recipes.length === 0 && !isLoading && (
             <Card className="w-full max-w-xl mx-auto text-center p-6 shadow-sm border"> {/* Added card styling */}
                <p className="text-muted-foreground">No recipes found matching your criteria. Try adjusting your ingredients or preferences.</p>
             </Card>
         )}
      </main>
       <footer className="py-6 md:px-8 border-t mt-16 bg-muted/50"> {/* Added margin-top, subtle bg */}
          <div className="container flex flex-col items-center justify-center gap-4 md:h-16 md:flex-row"> {/* Adjusted height */}
            <p className="text-center text-sm text-muted-foreground md:text-left">
              Built by <a href="#" className="font-medium underline underline-offset-4 hover:text-primary">Firebase Studio</a>. Powered by Gemini.
            </p>
          </div>
       </footer>
    </div>
  );
}

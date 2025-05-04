'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, ChefHat, Moon, Sun } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import type { SuggestRecipeInput, SuggestRecipeOutput } from '@/ai/flows/suggest-recipe';
import { suggestRecipe } from '@/ai/flows/suggest-recipe';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  ingredients: z.string().min(3, {
    message: 'Please enter at least a few ingredients.',
  }),
});

export default function Home() {
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<SuggestRecipeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setRecipe(null);
    try {
      const input: SuggestRecipeInput = { ingredients: values.ingredients };
      const result = await suggestRecipe(input);
      setRecipe(result);
    } catch (error) {
      console.error('Error suggesting recipe:', error);
      toast({
        title: "Error",
        description: "Failed to suggest recipe. Please try again.",
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
            Don't know what to cook?
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter the ingredients you have, and let RecipeSage suggest a delicious recipe for you!
          </p>
        </section>

        <Card className="w-full max-w-2xl mx-auto mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Suggest a Recipe</CardTitle>
            <CardDescription>Tell us what ingredients you have on hand.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingredients</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., chicken breast, broccoli, soy sauce, rice"
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
                      Suggesting...
                    </>
                  ) : (
                    'Get Recipe Suggestion'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {recipe && (
          <Card className="w-full max-w-3xl mx-auto shadow-lg animate-in fade-in duration-500">
            <CardHeader>
              <CardTitle className="text-2xl">{recipe.recipeName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground whitespace-pre-line">
                  {recipe.ingredients.split('\n').map((item, index) => (
                    <li key={index}>{item.replace(/^- /, '')}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <div className="space-y-2 text-muted-foreground whitespace-pre-line">
                 {recipe.instructions.split('\n').map((step, index) => {
                    // Remove leading numbers/dots/hyphens and trim whitespace
                    const cleanedStep = step.replace(/^\s*(\d+\.|-)\s*/, '').trim();
                    // Render only if the step has content after cleaning
                    return cleanedStep ? <p key={index}>{cleanedStep}</p> : null;
                 })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
       <footer className="py-6 md:px-8 md:py-0 border-t">
          <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by Firebase Studio. Powered by Gemini.
            </p>
          </div>
       </footer>
    </div>
  );
}

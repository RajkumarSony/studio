// src/components/AuthButton.tsx
'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react'; // Import NextAuth hooks
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

// Helper to get initials from display name
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};


const AuthButton: React.FC = () => {
  // Use NextAuth session hook
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const user = session?.user;

  const buttonHoverEffect = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 focus:ring-1 focus:ring-primary/50">
                <Avatar className="h-8 w-8">
                  {/* Use user.image and user.name from NextAuth session */}
                  <AvatarImage src={user.image || undefined} alt={user.name || 'User Avatar'} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            align="end"
            className="w-56 backdrop-blur-md bg-popover/95 border border-border/50 shadow-lg animate-in fade-in zoom-in-95"
         >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email || 'No email'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           {/* Add links to Saved Recipes or Profile here if needed */}
           {/* <DropdownMenuItem>
               <Link href="/saved-recipes">Saved Recipes</Link>
           </DropdownMenuItem>
          <DropdownMenuSeparator /> */}
          {/* Use NextAuth signOut function */}
          <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
     <motion.div {...buttonHoverEffect}>
      {/* Use NextAuth signIn function */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => signIn('google')} // Specify 'google' provider
        className="h-9 px-3 transition-colors duration-200 hover:bg-primary/10 dark:hover:bg-primary/20 border-border/70 rounded-md"
      >
        <LogIn className="mr-2 h-4 w-4" />
        Sign In
      </Button>
     </motion.div>
  );
};

export default AuthButton;

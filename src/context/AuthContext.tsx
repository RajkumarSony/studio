// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config'; // Import Firebase auth instance and provider
import { Loader2 } from 'lucide-react'; // Import Loader

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until auth state is determined
  const [isClient, setIsClient] = useState(false); // Track if component has mounted

  // Set isClient to true only on the client-side after mounting
  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    // Listen for Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Stop loading once state is known
      console.log('Auth state changed, user:', currentUser?.uid || 'null');
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign in with Google Popup
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Auth state listener will handle setting the user
      console.log('Google Sign-In successful');
    } catch (error) {
      console.error("Error signing in with Google:", error);
      // Handle specific errors (e.g., popup closed, network error) if needed
      setLoading(false); // Ensure loading stops on error
    }
    // setLoading(false); // Let the onAuthStateChanged handle this
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // Auth state listener will handle setting user to null
       console.log('Sign-Out successful');
    } catch (error) {
      console.error("Error signing out:", error);
       setLoading(false); // Ensure loading stops on error
    }
     // setLoading(false); // Let the onAuthStateChanged handle this
  };

  // Show loading indicator ONLY on the client and ONLY while loading
  if (loading && isClient) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
     );
   }

  // Render children when not loading, or during server-side render/pre-mount
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

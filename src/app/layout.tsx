// src/app/layout.tsx
import type { Metadata } from 'next';
import { Noto_Sans, Noto_Sans_JP, Noto_Sans_KR, Noto_Sans_SC, Noto_Sans_Bengali, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Noto_Sans_Gurmukhi, Noto_Sans_Kannada, Noto_Sans_Malayalam, Noto_Sans_Oriya, Noto_Sans_Tamil, Noto_Sans_Telugu } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import NextAuthProvider from '@/context/NextAuthProvider'; // Import NextAuth provider

// Load Noto Sans variants for different scripts
const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-noto-sans',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'], // Adjust weights as needed
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

// Add other Noto Sans variants as needed for supported languages
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-bengali',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({ // For Hindi, Marathi
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-devanagari',
  display: 'swap',
});

const notoSansGurmukhi = Noto_Sans_Gurmukhi({ // For Punjabi
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-gurmukhi',
  display: 'swap',
});

const notoSansOriya = Noto_Sans_Oriya({ // For Odia
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-oriya',
  display: 'swap',
});

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-tamil',
  display: 'swap',
});

const notoSansTelugu = Noto_Sans_Telugu({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-telugu',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'RecipeSage',
  description: 'AI-powered recipe suggestions by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply font variables to the html tag. The active font is controlled by --font-dynamic set in page.tsx useEffect
    <html lang="en"
          className={cn(
              notoSans.variable,
              notoSansJP.variable,
              notoSansBengali.variable,
              notoSansDevanagari.variable,
              notoSansGurmukhi.variable,
              notoSansOriya.variable,
              notoSansTamil.variable,
              notoSansTelugu.variable
          )}
          suppressHydrationWarning // Still needed for ThemeProvider and potentially SessionProvider client-side logic
    >
       {/* Body inherits font-family from html via globals.css */}
      <body suppressHydrationWarning> {/* Suppress warning on body too if needed */}
        <NextAuthProvider> {/* Wrap with NextAuth SessionProvider */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
             {/* Toaster removed */}
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}

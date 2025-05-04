// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb/client";
import type { NextAuthOptions } from 'next-auth';

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID environment variable');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_SECRET environment variable');
}
if (!process.env.MONGODB_URI) {
    // This check is already in mongodb/client.ts but added here for auth-specific clarity
    console.warn("MONGODB_URI is likely missing or invalid, which will cause adapter issues.");
}
if (!process.env.NEXTAUTH_SECRET) {
  console.warn("⚠️ Warning: NEXTAUTH_SECRET environment variable is not set. It's required for production and strongly recommended for development.");
  if (process.env.NODE_ENV === "production") {
      throw new Error("Missing NEXTAUTH_SECRET environment variable for production.");
  }
}
if (!process.env.NEXTAUTH_URL) {
  console.warn("⚠️ Warning: NEXTAUTH_URL environment variable is not set. This may cause issues with redirects and callbacks.");
}


export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!, // Add '!' for non-null assertion after check
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // Add '!' for non-null assertion after check
    }),
    // ...add more providers here
  ],
  // Use MongoDB adapter
  adapter: MongoDBAdapter(clientPromise, {
      databaseName: 'cooking' // Specify the database name explicitly
  }),
  // Add secret for JWT signing (essential for production)
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    // Use JSON Web Tokens for session instead of database sessions.
    strategy: "jwt",
  },
  callbacks: {
     // Include user.id on session object
     async session({ session, token }) {
       if (token?.sub && session.user) {
         session.user.id = token.sub; // Add the user ID (from token.sub) to the session.user object
       }
       return session;
     },
     // If needed: async jwt({ token, user }) { ... }
     // If needed: async redirect({ url, baseUrl }) { ... }
   },
  // Optional: Add custom pages for sign-in, sign-out, error, etc.
  // pages: {
  //   signIn: '/auth/signin',
  //   signOut: '/auth/signout',
  //   error: '/auth/error', // Error code passed in query string as ?error=
  //   verifyRequest: '/auth/verify-request', // (used for email/passwordless sign in)
  //   newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  // },
  // Optional: Add debug information in development
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

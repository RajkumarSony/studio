// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // Import necessary Auth modules

// Your web app's Firebase configuration
// Use environment variables for security and flexibility
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized yet
// Check if all required config keys are present
const requiredKeys: (keyof FirebaseOptions)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

let app;
if (missingKeys.length > 0) {
    console.warn(`Firebase config is missing keys: ${missingKeys.join(', ')}. Firebase features might not work correctly.`);
    // Decide if you want to throw an error or proceed with limited functionality
    // throw new Error(`Firebase config is missing keys: ${missingKeys.join(', ')}`);
    // Or initialize with potentially partial config (Auth might still work if authDomain is present)
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} else {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}


// Export Auth instances
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider(); // Export Google Auth Provider

export { app, auth, googleProvider };

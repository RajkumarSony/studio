
// src/lib/mongodb/client.ts
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("\n🛑 FATAL ERROR: MONGODB_URI environment variable is not defined.");
  console.error("   Please define the MONGODB_URI environment variable inside your .env file.");
  console.error("   Example: MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database_name>?retryWrites=true&w=majority\n");
  // Throwing error prevents the app from starting with an invalid config
  // Keep the check, but perhaps don't throw in production build if a fallback is possible?
  // For now, throwing ensures configuration is correct.
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Explicitly check the scheme before initializing the client
let isValidScheme = true;
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    isValidScheme = false;
    console.error("\n🛑 CONFIGURATION ERROR: Invalid MONGODB_URI scheme.");
    console.error(`   The provided MONGODB_URI was: "${uri}"`);
    console.error('   Expected connection string to start with "mongodb://" or "mongodb+srv://".');
    console.error("   Please check the MONGODB_URI value in your .env file.");
    console.error("   The application might not connect to the database correctly.\n");
    // Don't throw the error to allow the app to potentially continue, but log a severe warning.
    // throw new Error('Invalid MONGODB_URI scheme. Expected "mongodb://" or "mongodb+srv://".');
}


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (isValidScheme) {
    try {
        client = new MongoClient(uri, {
            // Consider removing strict: true if it causes issues with your specific MongoDB setup
            // strict: false can sometimes be more lenient but might hide potential problems.
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true, // Set to true to enforce Stable API behavior
                deprecationErrors: true, // Throw errors for deprecated features
            }
            // You can add other options here if needed, e.g., timeouts:
            // connectTimeoutMS: 5000, // 5 seconds
            // socketTimeoutMS: 30000, // 30 seconds
        });

        if (process.env.NODE_ENV === 'development') {
          // In development mode, use a global variable so that the value
          // is preserved across module reloads caused by HMR (Hot Module Replacement).
          // biome-ignore lint/suspicious/noExplicitAny: Necessary for global caching in dev
          let globalWithMongo = global as typeof globalThis & {
            _mongoClientPromise?: Promise<MongoClient>
          }

          if (!globalWithMongo._mongoClientPromise) {
            globalWithMongo._mongoClientPromise = client.connect();
            console.log("Attempting MongoDB connection (development)...");
          }
          clientPromise = globalWithMongo._mongoClientPromise;
        } else {
          // In production mode, it's best to not use a global variable.
          clientPromise = client.connect();
          console.log("Attempting MongoDB connection (production)...");
        }

        // Test connection early and log success/failure
        clientPromise.then(
            (connectedClient) => {
                // Perform a simple ping command to verify connection
                return connectedClient.db().command({ ping: 1 })
                  .then(() => {
                     console.log("✅ MongoDB client connected successfully and pinged the deployment.");
                  })
                  .catch(pingErr => {
                     console.error("❌ MongoDB client connected, but failed to ping deployment:", pingErr);
                     // Decide if this should be a fatal error depending on requirements
                  });
            },
            (err) => {
                console.error("❌ MongoDB client connection failed:", err);
                // Optionally re-throw or handle the connection error based on application needs
                // throw err; // Uncomment if connection failure should stop the app
            }
        );

    } catch (error) {
        console.error("❌ Error initializing MongoDB Client:", error);
        // Re-throw the error after logging to ensure the application fails fast if connection is impossible
        throw error;
    }
} else {
    // If scheme is invalid, set clientPromise to a rejected promise to prevent successful connections later
    clientPromise = Promise.reject(new Error("MongoDB connection not attempted due to invalid URI scheme."));
}


// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
// Ensure we export a Promise<MongoClient> or null if connection is impossible
export default clientPromise as Promise<MongoClient>;

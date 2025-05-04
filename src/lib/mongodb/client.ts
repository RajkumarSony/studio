// src/lib/mongodb/client.ts
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("\n🛑 FATAL ERROR: MONGODB_URI environment variable is not defined.");
  console.error("   Please define the MONGODB_URI environment variable inside your .env file.");
  console.error("   Example: MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database_name>?retryWrites=true&w=majority\n");
  // Throwing error prevents the app from starting with an invalid config
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

// Explicitly check the scheme before initializing the client
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error("\n🛑 FATAL ERROR: Invalid MONGODB_URI scheme.");
    console.error(`   The provided MONGODB_URI was: "${uri}"`);
    console.error('   Expected connection string to start with "mongodb://" or "mongodb+srv://".');
    console.error("   Please check the MONGODB_URI value in your .env file.\n");
    throw new Error('Invalid MONGODB_URI scheme. Expected "mongodb://" or "mongodb+srv://".');
}


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

try {
    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    if (process.env.NODE_ENV === 'development') {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Replacement).
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
        () => console.log("✅ MongoDB client connected successfully."),
        (err) => console.error("❌ MongoDB client connection failed:", err)
    );

} catch (error) {
    console.error("❌ Error initializing MongoDB Client:", error);
    // Re-throw the error after logging to ensure the application fails fast if connection is impossible
    throw error;
}


// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
```
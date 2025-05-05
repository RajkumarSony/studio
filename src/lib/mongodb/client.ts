
// src/lib/mongodb/client.ts
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let connectionError: Error | null = null;

if (!uri) {
  const errorMsg = "\n🛑 FATAL ERROR: MONGODB_URI environment variable is not defined.\n   Please define the MONGODB_URI environment variable inside your .env file.\n   Example: MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database_name>?retryWrites=true&w=majority\n";
  console.error(errorMsg);
  connectionError = new Error('Please define the MONGODB_URI environment variable inside .env');
  // Set clientPromise to a rejected promise to signal failure
  clientPromise = Promise.reject(connectionError);
  // Keep the check, but perhaps don't throw in production build if a fallback is possible?
  // For now, throwing ensures configuration is correct during development.
  // throw connectionError; // Commented out to prevent app crash
} else if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  const errorMsg = `\n🛑 CONFIGURATION ERROR: Invalid MONGODB_URI scheme.\n   The provided MONGODB_URI was: "${uri}"\n   Expected connection string to start with "mongodb://" or "mongodb+srv://".\n   Please check the MONGODB_URI value in your .env file.\n   The application will not connect to the database correctly.\n`;
  console.error(errorMsg);
  connectionError = new Error('Invalid MONGODB_URI scheme. Expected "mongodb://" or "mongodb+srv://".');
   // Set clientPromise to a rejected promise to signal failure
  clientPromise = Promise.reject(connectionError);
  // Don't throw the error to allow the app to potentially continue, but log a severe warning.
  // throw connectionError; // Commented out to prevent app crash
} else {
  // Scheme is valid, proceed with connection attempt
  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 5000, // 5 seconds
      socketTimeoutMS: 30000, // 30 seconds
    });

    if (process.env.NODE_ENV === 'development') {
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
      clientPromise = client.connect();
      console.log("Attempting MongoDB connection (production)...");
    }

    // Test connection early and log success/failure
    clientPromise.then(
      (connectedClient) => {
        return connectedClient.db().command({ ping: 1 })
          .then(() => {
            console.log("✅ MongoDB client connected successfully and pinged the deployment.");
          })
          .catch(pingErr => {
            console.error("❌ MongoDB client connected, but failed to ping deployment:", pingErr);
            connectionError = pingErr; // Store ping error
            // Don't reject clientPromise here, as the client is connected
          });
      },
      (err) => {
        console.error("❌ MongoDB client connection failed:", err);
        connectionError = err; // Store connection error
        // The promise is already rejected by the connect() call failure
      }
    );

  } catch (error: any) {
    console.error("❌ Error initializing MongoDB Client:", error);
    connectionError = error; // Store initialization error
    clientPromise = Promise.reject(connectionError); // Reject the promise
  }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
// It will be a rejected promise if initialization or connection failed.
export default clientPromise as Promise<MongoClient>; // Casting because TS might not infer rejection assignment correctly

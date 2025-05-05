{// src/lib/redis/client.ts
import Redis from 'ioredis';

// This file should only be imported on the server side.

const redisUrl = process.env.REDIS_URL;

let redisClient: Redis | null = null;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false, // Can be important for Vercel KV etc.
      // Add TLS config if needed for your provider, e.g., Redis Cloud
      // tls: {},
      // Keep connection attempts short to avoid blocking serverless functions
      connectTimeout: 5000, // 5 seconds
      // Prevent commands hanging indefinitely
      commandTimeout: 2000, // 2 seconds
      // Lazy connect to avoid connection attempts during build or cold starts if not immediately needed
      lazyConnect: true,
    });

    // Log connection events only when the client is actually used and connects
    redisClient.on('connect', () => console.log('✅ Redis client connected successfully.'));
    redisClient.on('error', (err) => console.error('❌ Redis client connection error:', err));
    redisClient.on('reconnecting', () => console.log('⏳ Redis client reconnecting...'));
    redisClient.on('close', () => console.log('🚪 Redis client connection closed.'));
    redisClient.on('end', () => console.log('🏁 Redis client connection ended.'));


    // Attempt an initial connection eagerly only in development to catch config errors early
    if (process.env.NODE_ENV === 'development') {
         redisClient.connect().catch(err => {
             console.error("❌ Initial Redis connection attempt failed in development:", err);
             // Optionally disable the client if connection fails catastrophically
             // redisClient = null;
         });
    }


  } catch (error) {
    console.error("❌ Failed to initialize Redis client:", error);
    redisClient = null; // Ensure client is null if initialization fails
  }

} else {
  console.warn("⚠️ Warning: REDIS_URL environment variable is not defined. Redis features will be disabled.");
}


// Export the Redis client instance. It might be null if the URL wasn't provided or init failed.
export default redisClient;

// Removed isRedisAvailable function - Check redisClient !== null directly in server actions.

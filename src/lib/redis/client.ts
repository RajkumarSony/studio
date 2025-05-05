// src/lib/redis/client.ts
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("⚠️ Warning: REDIS_URL environment variable is not defined. Redis features will be disabled.");
}

// Create a Redis instance.
// It will connect to the Redis server specified in the REDIS_URL env variable.
// If REDIS_URL is not set, it won't connect and operations will likely fail.
const redisClient = redisUrl ? new Redis(redisUrl, {
    // Optional: Add retry strategy or other options
    maxRetriesPerRequest: 3, // Example: Retry up to 3 times
     enableReadyCheck: false, // Important for some cloud providers like Vercel KV
     // tls: {}, // Uncomment and configure if using Redis Cloud with TLS
}) : null;

if (redisClient) {
    redisClient.on('connect', () => console.log('✅ Redis client connected successfully.'));
    redisClient.on('error', (err) => console.error('❌ Redis client connection error:', err));
} else {
    console.log("ℹ️ Redis client not initialized because REDIS_URL is not set.");
}


// Export the Redis client instance.
// If the URL wasn't provided, this will be null. Callers should check for null.
export default redisClient;

// Optional: Add a helper function to check if Redis is available
export const isRedisAvailable = (): boolean => !!redisClient;

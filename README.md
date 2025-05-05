# Firebase Studio - RecipeSage

This is a Next.js starter project for RecipeSage, an AI-powered recipe suggestion application, built within Firebase Studio.

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**

    *   Create a file named `.env` in the root of your project (if it doesn't exist).
    *   Add the following variables to your `.env` file, replacing the placeholder values:

        ```dotenv
        # Google Generative AI API Key
        # *** THIS IS REQUIRED for AI features ***
        # Get this from Google AI Studio: https://aistudio.google.com/app/apikey
        GOOGLE_GENAI_API_KEY=your_google_genai_api_key

        # MongoDB Connection String
        # *** THIS IS REQUIRED and MUST start with mongodb:// or mongodb+srv:// ***
        # Replace with your actual MongoDB connection string.
        # Ensure the IP address running the app is allowlisted in MongoDB Atlas.
        # Format examples:
        # Standard: mongodb://user:password@host:port/database_name
        # Atlas:    mongodb+srv://<user>:<password>@<cluster-url>/<database_name>?retryWrites=true&w=majority
        MONGODB_URI=your_mongodb_connection_string

        # Redis Connection URL (Optional, for session persistence)
        # *** Required if you want search results/form state to persist across browser sessions ***
        # Get this from your Redis provider (e.g., Vercel KV, Upstash, Redis Cloud)
        # Format: redis[s]://[[username][:password]@][host][:port][/db-number]
        # Example (Vercel KV): redis://default:password@fly-my-kv-app-db.upstash.io:6379
        # Example (Upstash): rediss://user:password@us1-shiny-slug-12345.upstash.io:31284
        # REDIS_URL=your_redis_connection_url
        ```

    *   **Replace the placeholder values** (`your_..._here`, `your_mongodb_connection_string`, `your_redis_connection_url`) with your actual credentials and keys. **The application will not run correctly without `MONGODB_URI` and `GOOGLE_GENAI_API_KEY`.**
    *   **CRITICAL: Ensure your `MONGODB_URI` starts with `mongodb://` or `mongodb+srv://`.** An incorrect format (e.g., missing the scheme or using `http://`) will cause a fatal "Invalid MONGODB_URI scheme" error on startup. Verify this carefully.
    *   **REDIS_URL is optional.** If not provided, recipe search results and form state will only persist within the current browser tab using session storage. If you provide a `REDIS_URL`, these details will be stored in Redis, allowing them to persist across sessions/tabs until they expire (typically 1 hour). Ensure the Redis instance is accessible from where your Next.js app is hosted.

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js application, typically on `http://localhost:9002`.

4.  **Run the Genkit Development Server (Optional but Recommended):**
    Genkit flows are used for AI interactions. Running the Genkit server locally allows for inspection and debugging.
    ```bash
    npm run genkit:watch
    ```
    This starts the Genkit development UI, usually accessible at `http://localhost:4000`.

5.  **Open the App:**
    Open [http://localhost:9002](http://localhost:9002) in your browser.

## Project Structure

*   `src/app/`: Contains the main application pages and layouts (using Next.js App Router).
    *   `page.tsx`: The main recipe suggestion form page.
    *   `recipe/[slug]/page.tsx`: The page to display details of a specific recipe.
    *   `layout.tsx`: The root layout for the application.
    *   `globals.css`: Global styles and Tailwind CSS setup, including theme variables.
*   `src/components/`: Reusable UI components.
    *   `ui/`: Components from shadcn/ui.
    *   `SavedRecipesDialog.tsx`: Dialog to show locally saved recipes.
*   `src/ai/`: Contains AI-related code using Genkit.
    *   `ai-instance.ts`: Initializes the Genkit instance.
    *   `flows/suggest-recipe.ts`: The Genkit flow for generating recipe suggestions and images.
*   `src/lib/`: Utility functions and library configurations.
    *   `utils.ts`: General utility functions (like `cn` for class names).
    *   `translations.ts`: Stores multi-language translation strings.
    *   `db/recipes.ts`: Functions for interacting with the MongoDB database (saving recipes/history).
    *   `mongodb/client.ts`: Configures the MongoDB client connection.
    *   `redis/client.ts`: Configures the Redis client connection (optional).
*   `public/`: Static assets.
*   `.env`: Environment variables (ignored by Git). **Important:** Contains sensitive keys.

## Key Features

*   **AI Recipe Suggestions:** Uses Google's Gemini models via Genkit to suggest recipes based on ingredients, dietary restrictions, and preferences.
*   **AI Image Generation:** Generates images for suggested recipes using an experimental Gemini model.
*   **Multi-Language Support:** UI text and recipe details can be displayed in multiple languages.
*   **Theme Switching:** Light and dark mode support using `next-themes`.
*   **Database Integration:** Uses MongoDB to:
    *   Save user-favorited recipes (currently stored in localStorage, but can be adapted for DB).
    *   Log recipe search history (anonymously).
*   **Session Persistence (Optional):** Uses Redis (if `REDIS_URL` is configured) to persist form state and search results across browser sessions. Falls back to session-only storage otherwise.
*   **Responsive Design:** Adapts to different screen sizes.
*   **Client-Side State Persistence:** Uses `localStorage` to maintain language preference and saved recipes.

## Environment Variables

**Crucially**, ensure all required environment variables are set in your `.env` file as described in the "Set Up Environment Variables" section. The application relies heavily on these variables for database connection and AI features.

*   **`GOOGLE_GENAI_API_KEY`:** Required for AI recipe suggestions and image generation.
*   **`MONGODB_URI`:** Required for saving search history and potentially saved recipes. **Pay special attention to the format and ensure it starts with `mongodb://` or `mongodb+srv://` to avoid connection errors.**
*   **`REDIS_URL` (Optional):** If you want search results and form state to persist across browser sessions/tabs, provide a valid Redis connection URL. Otherwise, this data will be lost when the browser tab is closed.

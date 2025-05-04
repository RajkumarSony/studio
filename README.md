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
        # Authentication (NextAuth)
        # IMPORTANT: Replace http://localhost:9002 with your actual app URL in development/production
        NEXTAUTH_URL=http://localhost:9002
        # Generate a strong secret: openssl rand -base64 32
        NEXTAUTH_SECRET=your_strong_random_secret_here

        # Google OAuth Credentials
        # Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
        # Ensure you enable the Google People API for NextAuth to fetch profile info.
        GOOGLE_CLIENT_ID=your_google_client_id
        GOOGLE_CLIENT_SECRET=your_google_client_secret

        # MongoDB Connection String
        # *** THIS IS REQUIRED and MUST start with mongodb:// or mongodb+srv:// ***
        # Replace with your actual MongoDB connection string.
        # Ensure the IP address running the app is allowlisted in MongoDB Atlas.
        # Format examples:
        # Standard: mongodb://user:password@host:port/database_name
        # Atlas:    mongodb+srv://<user>:<password>@<cluster-url>/<database_name>?retryWrites=true&w=majority
        MONGODB_URI=your_mongodb_connection_string

        # Google Generative AI API Key
        # *** THIS IS REQUIRED for AI features ***
        # Get this from Google AI Studio: https://aistudio.google.com/app/apikey
        GOOGLE_GENAI_API_KEY=your_google_genai_api_key
        ```

    *   **Replace the placeholder values** (`your_..._here`, `your_mongodb_connection_string`) with your actual credentials and keys. **The application will not run correctly without `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXTAUTH_SECRET`.**
    *   **CRITICAL: Ensure your `MONGODB_URI` starts with `mongodb://` or `mongodb+srv://`.** An incorrect format (e.g., missing the scheme or using `http://`) will cause a fatal "Invalid MONGODB_URI scheme" error on startup.
    *   For `NEXTAUTH_SECRET`, generate a strong random string. You can use the command `openssl rand -base64 32` in your terminal.
    *   Make sure the database specified in `MONGODB_URI` (e.g., `/cooking`) exists or MongoDB will create it on first connection. The adapter will automatically create `users`, `accounts`, `sessions`, and `verificationTokens` collections within that database.

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
    Open [http://localhost:9002](http://localhost:9002) (or your configured `NEXTAUTH_URL`) in your browser.

## Project Structure

*   `src/app/`: Contains the main application pages and layouts (using Next.js App Router).
    *   `page.tsx`: The main recipe suggestion form page.
    *   `recipe/[slug]/page.tsx`: The page to display details of a specific recipe.
    *   `layout.tsx`: The root layout for the application.
    *   `globals.css`: Global styles and Tailwind CSS setup, including theme variables.
    *   `api/auth/[...nextauth]/route.ts`: NextAuth API route handler for authentication.
*   `src/components/`: Reusable UI components.
    *   `ui/`: Components from shadcn/ui.
    *   `AuthButton.tsx`: Handles login/logout display.
*   `src/ai/`: Contains AI-related code using Genkit.
    *   `ai-instance.ts`: Initializes the Genkit instance.
    *   `flows/suggest-recipe.ts`: The Genkit flow for generating recipe suggestions and images.
*   `src/lib/`: Utility functions and library configurations.
    *   `utils.ts`: General utility functions (like `cn` for class names).
    *   `translations.ts`: Stores multi-language translation strings.
    *   `db/recipes.ts`: Functions for interacting with the MongoDB database (saving/fetching recipes, history).
    *   `mongodb/client.ts`: Configures the MongoDB client connection.
*   `src/context/`: React context providers.
    *   `NextAuthProvider.tsx`: Wraps the app with the NextAuth `SessionProvider`.
*   `public/`: Static assets.
*   `.env`: Environment variables (ignored by Git). **Important:** Contains sensitive keys.

## Key Features

*   **AI Recipe Suggestions:** Uses Google's Gemini models via Genkit to suggest recipes based on ingredients, dietary restrictions, and preferences.
*   **AI Image Generation:** Generates images for suggested recipes using an experimental Gemini model.
*   **Multi-Language Support:** UI text and recipe details can be displayed in multiple languages.
*   **Theme Switching:** Light and dark mode support using `next-themes`.
*   **User Authentication:** Google OAuth login via NextAuth.js.
*   **Database Integration:** Uses MongoDB to:
    *   Store user information (via NextAuth adapter).
    *   Save user-favorited recipes.
    *   Log recipe search history.
*   **Responsive Design:** Adapts to different screen sizes.
*   **Client-Side State Persistence:** Uses `sessionStorage` and `localStorage` to maintain form state, results, and language preference during a session or across sessions.

## Environment Variables

**Crucially**, ensure all required environment variables are set in your `.env` file as described in the "Set Up Environment Variables" section. The application relies heavily on these variables for database connection, authentication, and AI features. **Pay special attention to the `MONGODB_URI` format and ensure it starts with `mongodb://` or `mongodb+srv://` to avoid connection errors.**
```
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Use a standard text model as default. Image generation will specify its model.
  // Changed from gemini-1.5-pro-latest back to gemini-1.5-flash-latest to fix NOT_FOUND error
  model: 'googleai/gemini-1.5-flash-latest',
});

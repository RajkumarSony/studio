import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Use gemini-1.5-flash-latest as the default text model.
  // If "NOT_FOUND" errors persist, try changing back to 'googleai/gemini-pro'.
  model: 'googleai/gemini-1.5-flash-latest',
});

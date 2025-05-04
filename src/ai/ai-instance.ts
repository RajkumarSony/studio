import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Use gemini-pro as the default text model.
  // The specific prompt call failed looking for this model, even though
  // the previous default was gemini-2.0-flash-exp. Reverting to gemini-pro.
  model: 'googleai/gemini-pro',
});

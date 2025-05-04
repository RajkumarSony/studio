import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  // Use gemini-2.0-flash as the default text model.
  // This model is generally capable and supports function calling/tool use.
  // It might also handle multilingual prompts better than older models.
  model: process.env.GOOGLE_GENAI_MODEL,
});

  
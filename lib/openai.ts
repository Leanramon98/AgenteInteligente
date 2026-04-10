import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export function getOpenAIInstance() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // During build or if missing, we use a dummy key to avoid constructor crash
    // but we should only do this if we are not actually calling the API.
    // However, OpenAI constructor throws if apiKey is missing.
    openaiInstance = new OpenAI({
      apiKey: apiKey || "dummy-key-for-build",
    });
  }
  return openaiInstance;
}

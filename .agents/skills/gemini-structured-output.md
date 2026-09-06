# Gemini AI SDK Standards

You are integrating Google's Gemini LLM. You must follow the latest SDK standards.

1. **Use the Correct SDK:** You MUST use the new `@google/genai` package. Do not use the deprecated `@google/generative-ai` package.
2. **Enforce JSON Outputs:** When prompting Gemini to parse data, you must force it to return strict JSON.
3. **Configuration Syntax:** In your `generateContent` call, set `responseMimeType: "application/json"`. 
4. **Response Schema:** Define a strict `responseSchema` using the SDK's schema definition objects to guarantee the LLM returns the exact keys required by the database (e.g., `hangulName`, `cleanStoreName`, `category`, `isOnline`).
# Hono & TypeScript API Standards

You are building a high-performance backend using Hono and TypeScript. You MUST adhere to the following rules:

1. **Strict Payload Validation:** Never trust client data. You must use `zod` for all request validation.
2. **Use Zod Validator:** Route handlers must use `@hono/zod-validator` to parse and validate incoming `json`, `query`, or `param` payloads.
3. **Graceful Error Handling:** Never allow the server to crash on external API failures (e.g., Kakao, Gemini, Forex). Wrap external calls in `try/catch` blocks. Return standardized JSON error responses: `c.json({ error: "Contextual message", details: e.message }, 500)`.
4. **Separation of Concerns:** Do not put heavy business logic inside the route handler. Keep routes clean and delegate logic to dedicated service classes or functions.
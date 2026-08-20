# NEXA Server-Side AI Provider Setup

NEXA sends AI requests from the server only. Configure the following environment variables through the project’s secure secrets settings; do not use a `VITE_` prefix and do not place a real API key in the codebase.

| Variable | Required | Purpose | Example value |
|---|---:|---|---|
| `NEXA_AI_PROVIDER` | Yes | Selects the supported provider adapter. | `openai-compatible` |
| `NEXA_AI_PROVIDER_API_KEY` | Yes | Server-only API credential sent as a Bearer token upstream. | Provider-issued secret |
| `NEXA_AI_PROVIDER_BASE_URL` | No | Overrides the default OpenAI endpoint for another compatible provider. | `https://api.openai.com/v1` |
| `NEXA_AI_MODEL` | Yes | The chat-completions model identifier. | `gpt-4o-mini` |

When `NEXA_AI_PROVIDER_BASE_URL` is omitted, NEXA uses `https://api.openai.com/v1`. The provider requests `/chat/completions` with a strict JSON schema and validates every required output field before returning a result to the browser.

Text tools currently supported by this provider are AI Translator, AI Hashtag Generator, AI Description Generator, AI Stock Metadata Generator, and AI YouTube SEO Assistant. AI Subtitle Generator, AI Video Analyzer, and AI Video Clip Planner remain unavailable until NEXA has secure media upload, asynchronous processing, and media-aware inference support.

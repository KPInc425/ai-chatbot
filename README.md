<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

This template uses the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) to access multiple AI models through a unified interface. The default configuration includes [xAI](https://x.ai) models (`grok-2-vision-1212`, `grok-3-mini`) routed through the gateway.

### AI Gateway Authentication

**For Vercel deployments**: Authentication is handled automatically via OIDC tokens.

**For non-Vercel deployments**: You need to provide an AI Gateway API key by setting the `AI_GATEWAY_API_KEY` environment variable in your `.env.local` file.

With the [AI SDK](https://ai-sdk.dev/docs/introduction), you can also switch to direct LLM providers like [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://ai-sdk.dev/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/templates/next.js/nextjs-ai-chatbot)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).

## Using a different AI provider

This repo ships with the Vercel AI Gateway as the default provider. To use a different
provider (for example, Ollama running locally), set the `AI_PROVIDER` environment
variable and provide provider-specific configuration.

- Example: use Ollama running on http://localhost:11434

  - AI_PROVIDER=ollama
  - OLLAMA_URL=http://localhost:11434

The repository includes a small example adapter at `lib/ai/providers.ollama.ts` that
is loaded when `AI_PROVIDER=ollama`. This file is a minimal template — adapt it to
match your Ollama server's inference API and streaming behaviour.

If you want to add other providers (OpenAI, Gemini, Pollinations, etc.), create a
similar adapter file and update `lib/ai/providers.ts` to lazy-require it when the
corresponding `AI_PROVIDER` value is set. The code uses `customProvider({ languageModels })`
so the rest of the app doesn't need to change.

### Dynamic models with Ollama

If you run an Ollama server locally you can configure the app to automatically
discover models and populate the model dropdown:

- Set `AI_PROVIDER=ollama`
- Set `OLLAMA_URL` to your server (for example `http://localhost:11434`)

The app will call `OLLAMA_URL/api/models` to list models and populate the UI.
If Ollama supports streaming via `stream: true` to the infer endpoint, the
adapter will attempt to stream chunks. The adapter is a template and may need
adjustments depending on the Ollama version you run (see https://docs.ollama.com/api).

### Manually adding models (example: OpenAI GPT-5 Mini)

If you want to manually add a model for the default gateway provider (for
example OpenAI's gpt-5-mini), follow these steps:

1. Add a UI entry in `lib/ai/models.ts` with an id, name, and description.
2. Add the id to `lib/ai/entitlements.ts` for the user types that should see it.
3. Map the id to a concrete language model in `lib/ai/providers.ts` (for example
   `"openai-gpt-5-mini": gateway.languageModel("openai/gpt-5-mini")`).

This repo includes an example model `openai-gpt-5-mini` showing the manual
addition; you still need to verify the provider and model id you want to use.

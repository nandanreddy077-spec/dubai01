# AI Advisor Edge Function

Secure server-side AI chat functionality for the Glow Check beauty advisor.

## Features

- ✅ Secure OpenAI API calls (API key never exposed to client)
- ✅ Supports OpenAI function calling (tools)
- ✅ User authentication required
- ✅ Rate limiting ready
- ✅ Fallback to direct API if Edge Function fails

## Deployment

### Option 1: Supabase Dashboard

1. Go to Supabase Dashboard → Edge Functions
2. Click "Deploy a new function"
3. Name it: `ai-advisor`
4. Copy the entire contents of `supabase/functions/ai-advisor/index.ts`
5. Paste into the editor
6. Click "Deploy"

### Option 2: Supabase CLI

```bash
supabase functions deploy ai-advisor
```

## Required Secrets

Make sure these secrets are set in Supabase:

- `OPENAI_API_KEY` - Your OpenAI API key

## Usage

The function is called automatically when a user sends a message in the AI Advisor chat screen.

## Request Format

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful beauty advisor..."
    },
    {
      "role": "user",
      "content": "What's the best skincare routine?"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "recommendProducts",
        "description": "...",
        "parameters": {...}
      }
    }
  ],
  "userId": "user-uuid-here"
}
```

## Response Format

```json
{
  "content": "AI response text",
  "toolCalls": [
    {
      "id": "call_xxx",
      "type": "function",
      "function": {
        "name": "recommendProducts",
        "arguments": "{...}"
      }
    }
  ]
}
```



# AI Analysis Edge Function

This Supabase Edge Function handles AI-powered image analysis with:
- Rate limiting (10 requests per minute per user)
- Response caching (1 hour TTL)
- Secure authentication
- Error handling and retries

## Setup

1. Deploy the function:
```bash
supabase functions deploy ai-analyze
```

2. Set environment variables in Supabase Dashboard:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Usage

The function is called automatically by the `api-service.ts` when using `analyzeImageWithAI()`.

## Rate Limits

- 10 requests per minute per user
- Returns 429 status if exceeded

## Caching

- Responses are cached for 1 hour
- Cache key is based on userId, analysisType, and imageUri


















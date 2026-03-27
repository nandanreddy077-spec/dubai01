# Vision Analyze Edge Function

Secure Google Vision API integration via Supabase Edge Function.

## Setup

1. Set the `GOOGLE_VISION_API_KEY` environment variable in Supabase Dashboard:
   - Go to Project Settings → Edge Functions → Secrets
   - Add: `GOOGLE_VISION_API_KEY=your-api-key-here`

2. Deploy the function:
   ```bash
   supabase functions deploy vision-analyze
   ```

## Usage

```typescript
const { data, error } = await supabase.functions.invoke('vision-analyze', {
  body: {
    imageData: base64Image,
    features: [
      { type: 'FACE_DETECTION', maxResults: 10 },
      { type: 'LANDMARK_DETECTION', maxResults: 10 },
    ],
    userId: user.id,
  },
});
```

## Security

- API key is stored server-side only
- Requires authentication
- Rate limited: 20 requests/minute per user
- Validates user ID matches authenticated user




























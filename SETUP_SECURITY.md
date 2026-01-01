# Security Setup Guide

## Quick Setup (5 minutes)

### Step 1: Set Environment Variables in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add the following secrets:

```
GOOGLE_VISION_API_KEY=AIzaSyBFOUmZkW1F8pFFFlGs0S-gKGaej74VROg
OPENAI_API_KEY=your-openai-api-key-here
```

### Step 2: Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref pmroozitldbgnchainxv

# Deploy Vision Analyze function
supabase functions deploy vision-analyze

# Deploy AI Analyze function (if not already deployed)
supabase functions deploy ai-analyze
```

### Step 3: Verify Deployment

1. Go to Supabase Dashboard → **Edge Functions**
2. You should see both `vision-analyze` and `ai-analyze` functions
3. Test by calling the function from your app

## What Changed?

### Before (Insecure)
- ❌ Google Vision API key hardcoded in client code
- ❌ OpenAI API key exposed via `EXPO_PUBLIC_` prefix
- ❌ No image validation
- ❌ API keys visible in app bundle

### After (Secure)
- ✅ All API keys stored server-side only
- ✅ Edge Functions handle all external API calls
- ✅ Image validation before processing
- ✅ Rate limiting and authentication
- ✅ No API keys in client code

## Testing

### Test Vision Function
```typescript
import { analyzeImageWithVision } from '@/lib/vision-service';

const result = await analyzeImageWithVision(base64Image);
console.log(result);
```

### Test Image Validation
```typescript
import { validateImageFromBase64 } from '@/lib/image-validation';

const validation = await validateImageFromBase64(base64Image);
if (!validation.valid) {
  console.error(validation.error);
}
```

## Troubleshooting

### "Missing authorization header"
- Ensure user is logged in
- Check that `supabase.auth.getUser()` returns a valid user

### "Google Vision API key not configured"
- Verify the secret is set in Supabase Dashboard
- Check the secret name is exactly `GOOGLE_VISION_API_KEY`
- Redeploy the function after adding secrets

### "Rate limit exceeded"
- Wait 1 minute before trying again
- Current limit: 20 requests/minute per user

### Function not found
- Ensure function is deployed: `supabase functions deploy vision-analyze`
- Check function name matches exactly: `vision-analyze`

## Security Checklist

- [x] API keys moved to Edge Functions
- [x] Image validation implemented
- [x] Rate limiting enabled
- [x] Authentication required
- [x] `.env` files in `.gitignore`
- [ ] API usage monitoring (optional)
- [ ] Security audit (recommended before production)

## Next Steps

1. **Deploy Edge Functions** (required)
2. **Test the integration** (recommended)
3. **Monitor API usage** (optional)
4. **Set up alerts** (optional)

## Support

If you need help:
1. Check Supabase Edge Function logs
2. Verify environment variables
3. Test with a simple image first
4. Check rate limits haven't been exceeded


























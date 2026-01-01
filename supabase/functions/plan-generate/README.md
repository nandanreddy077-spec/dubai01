# Plan Generate Edge Function

Generates personalized 30-day skincare plans using OpenAI based on beauty analysis results.

## Deployment

1. Go to Supabase Dashboard → Edge Functions
2. Click "Deploy a new function"
3. Name it: `plan-generate`
4. Copy the contents of `index.ts` into the function
5. Save and deploy

## Required Secrets

Make sure these secrets are set in Supabase Dashboard → Edge Functions → Secrets:
- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## Usage

The function is called automatically when a user creates a custom skincare plan from the "Start Your Glow Journey" button.

## Request Format

```json
{
  "analysisResult": {
    "overallScore": 85,
    "skinType": "Normal",
    "skinTone": "Medium Warm",
    "skinQuality": "Very Good",
    "dermatologyInsights": {
      "acneRisk": "Low",
      "agingSigns": ["Fine lines"],
      "skinConcerns": ["Enlarged pores"],
      "recommendedTreatments": ["SPF 30+ daily"]
    },
    "detailedScores": {
      "jawlineSharpness": 80,
      "brightnessGlow": 85,
      "hydrationLevel": 82,
      "facialSymmetry": 90,
      "poreVisibility": 75,
      "skinTexture": 88,
      "evenness": 85,
      "elasticity": 80
    }
  },
  "customGoal": "Reduce pore visibility",
  "userId": "user-id-here"
}
```

## Response Format

Returns a JSON object with the skincare plan structure:
- `title`: Plan title
- `description`: Plan description
- `targetGoals`: Array of goals
- `weeklyPlans`: Array of 4 weekly plans
- `shoppingList`: Array of product categories and items






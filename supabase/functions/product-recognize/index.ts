/**
 * Supabase Edge Function for Product Recognition
 * Analyzes extracted text from product images to identify brand, name, and ingredients
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ProductRecognitionRequest {
  extractedText: string;
  userId?: string;
}

interface ProductRecognitionResponse {
  brand?: string;
  name?: string;
  ingredients?: string[];
  category?: string;
  confidence: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { extractedText, userId } = await req.json() as ProductRecognitionRequest;

    if (!extractedText || extractedText.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient text extracted from image',
          confidence: 0,
        } as ProductRecognitionResponse),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'AI service not configured',
          confidence: 0,
        } as ProductRecognitionResponse),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.log('🔍 Analyzing product text with AI...');
    console.log('Text length:', extractedText.length);
    console.log('Text preview:', extractedText.substring(0, 200));

    // Use OpenAI to analyze the extracted text
    const prompt = `You are a skincare product recognition expert. Analyze the following text extracted from a product image and identify:

1. **Brand Name**: The brand/manufacturer name (e.g., "CeraVe", "La Roche-Posay", "The Ordinary")
2. **Product Name**: The specific product name (e.g., "Daily Moisturizing Lotion", "Hydrating Cleanser")
3. **Ingredients**: Extract the ingredient list (comma-separated, INCI names preferred)
4. **Category**: Product category (cleansers, serums, moisturizers, sunscreens, treatments, etc.)

Extracted Text:
${extractedText.substring(0, 3000)} ${extractedText.length > 3000 ? '...[truncated]' : ''}

Instructions:
- Look for brand names at the beginning or in prominent positions
- Product names are usually near the brand name
- Ingredients are typically listed after "INGREDIENTS:" or "Ingredients:" or in a separate section
- If you can't find specific information, use your best judgment based on common product patterns
- Return ONLY valid JSON, no markdown formatting

Return a JSON object with this exact structure:
{
  "brand": "Brand name or null",
  "name": "Product name or null",
  "ingredients": ["Ingredient1", "Ingredient2", ...] or [],
  "category": "skincare category",
  "confidence": 0.0-1.0
}

Confidence should be:
- 0.9-1.0: Very clear brand, name, and ingredients found
- 0.7-0.9: Brand and name found, some ingredients
- 0.5-0.7: Partial information (brand or name found)
- 0.3-0.5: Minimal information, mostly inferred
- 0.0-0.3: Very uncertain`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at recognizing skincare products from text. Always return valid JSON without markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('✅ OpenAI response received');

    // Parse JSON response
    let recognized: ProductRecognitionResponse;
    try {
      recognized = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        recognized = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    // Validate and clean the response
    const result: ProductRecognitionResponse = {
      brand: recognized.brand?.trim() || undefined,
      name: recognized.name?.trim() || undefined,
      ingredients: Array.isArray(recognized.ingredients)
        ? recognized.ingredients
            .map((ing: any) => String(ing).trim())
            .filter((ing: string) => ing.length > 0)
            .slice(0, 30) // Limit to 30 ingredients
        : [],
      category: recognized.category?.toLowerCase() || 'skincare',
      confidence: typeof recognized.confidence === 'number'
        ? Math.max(0, Math.min(1, recognized.confidence))
        : 0.5,
    };

    console.log('✅ Product recognized:', {
      brand: result.brand,
      name: result.name,
      ingredientsCount: result.ingredients?.length || 0,
      confidence: result.confidence,
    });

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('❌ Product recognition error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
      } as ProductRecognitionResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});



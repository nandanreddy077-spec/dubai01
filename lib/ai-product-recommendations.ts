import { z } from 'zod';
import { AnalysisResult } from '@/contexts/AnalysisContext';
import { ALL_PRODUCTS, findProductsWithIngredients, getProductsByCategory } from '@/lib/products';
import { type GlobalProduct } from '@/lib/product-database-structure';
import { type LocationInfo } from '@/lib/location';
import { parseAIJSON } from './openai-service';

const AIRecommendationSchema = z.object({
  recommendations: z.array(z.object({
    category: z.string(),
    productName: z.string(),
    brandName: z.string(),
    personalReason: z.string().describe('A 1-2 sentence hyper-specific reason why THIS product is perfect for THIS user based on their exact skin data'),
    whyForYou: z.array(z.string()).describe('3 bullet points explaining specifically how this product addresses the user concerns'),
    skinTypeMatch: z.string().describe('How this product specifically works for the user skin type'),
    concernsAddressed: z.array(z.string()),
    avoidReason: z.string().optional().describe('If there is any concern for this user, explain it'),
    priorityOrder: z.number().describe('1 = most important for this user, higher = less critical'),
    usageTip: z.string().describe('A specific tip for how THIS user should use this product given their skin'),
  })),
});

export type AIRecommendation = z.infer<typeof AIRecommendationSchema>['recommendations'][number];

export interface PersonalizedProduct {
  globalProduct: GlobalProduct;
  aiInsight: AIRecommendation;
  matchScore: number;
}

function buildSkinProfilePrompt(result: AnalysisResult): string {
  const scores = result.detailedScores;
  const insights = result.dermatologyInsights;

  const weakAreas: string[] = [];
  const strongAreas: string[] = [];

  if (scores.hydrationLevel < 60) weakAreas.push(`low hydration (${scores.hydrationLevel}%)`);
  else if (scores.hydrationLevel >= 80) strongAreas.push(`good hydration (${scores.hydrationLevel}%)`);

  if (scores.brightnessGlow < 60) weakAreas.push(`dull/low brightness (${scores.brightnessGlow}%)`);
  else if (scores.brightnessGlow >= 80) strongAreas.push(`good brightness (${scores.brightnessGlow}%)`);

  if (scores.skinTexture < 60) weakAreas.push(`rough texture (${scores.skinTexture}%)`);
  else if (scores.skinTexture >= 80) strongAreas.push(`smooth texture (${scores.skinTexture}%)`);

  if (scores.poreVisibility > 60) weakAreas.push(`visible pores (${scores.poreVisibility}%)`);
  if (scores.evenness < 60) weakAreas.push(`uneven tone (${scores.evenness}%)`);
  else if (scores.evenness >= 80) strongAreas.push(`even skin tone (${scores.evenness}%)`);

  if (scores.elasticity < 60) weakAreas.push(`low elasticity (${scores.elasticity}%)`);
  if (scores.jawlineSharpness < 60) weakAreas.push(`soft jawline definition (${scores.jawlineSharpness}%)`);

  return `
EXACT SKIN PROFILE:
- Skin Type: ${result.skinType}
- Skin Quality: ${result.skinQuality}
- Skin Tone: ${result.skinTone}
- Glow Potential: ${result.skinPotential}
- Overall Score: ${result.overallScore}/100

DETAILED SCORES:
- Hydration: ${scores.hydrationLevel}%
- Brightness/Glow: ${scores.brightnessGlow}%
- Texture: ${scores.skinTexture}%
- Pore Visibility: ${scores.poreVisibility}%
- Evenness: ${scores.evenness}%
- Elasticity: ${scores.elasticity}%
- Jawline: ${scores.jawlineSharpness}%
- Symmetry: ${scores.facialSymmetry}%

DERMATOLOGY INSIGHTS:
- Acne Risk: ${insights.acneRisk}
- Skin Concerns: ${insights.skinConcerns.join(', ') || 'None identified'}
- Aging Signs: ${insights.agingSigns.join(', ') || 'None'}
- Recommended Treatments: ${insights.recommendedTreatments.join(', ') || 'None'}

PROBLEM AREAS: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None significant'}
STRENGTHS: ${strongAreas.length > 0 ? strongAreas.join(', ') : 'Average across the board'}
`;
}

function getAvailableProductNames(location: LocationInfo): string {
  const available = ALL_PRODUCTS.filter(p => {
    if (location.countryCode) {
      return p.regionalAvailability.some(
        a => a.countryCode === location.countryCode && a.available
      );
    }
    return true;
  });

  const byCategory: Record<string, string[]> = {};
  available.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(`${p.brand} - ${p.name}`);
  });

  return Object.entries(byCategory)
    .map(([cat, products]) => `${cat}: ${products.join('; ')}`)
    .join('\n');
}

export async function generatePersonalizedRecommendations(
  analysisResult: AnalysisResult,
  location: LocationInfo,
): Promise<PersonalizedProduct[]> {
  console.log('🧠 Generating AI-personalized product recommendations...');

  const skinProfile = buildSkinProfilePrompt(analysisResult);
  const availableProducts = getAvailableProductNames(location);

  const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  // If OpenAI API key is not configured, return empty array to trigger fallback
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.warn('⚠️ OpenAI API key not configured, skipping AI recommendations (will use rule-based fallback)');
    return [];
  }

  try {
    const prompt = `You are a board-certified dermatologist with 20 years of experience. Based on this patient's EXACT skin analysis data, recommend the most specific and personalized skincare products from the available database.

${skinProfile}

AVAILABLE PRODUCTS IN DATABASE (you MUST pick from these exact products):
${availableProducts}

RULES:
1. Pick EXACTLY the best product for each category based on THIS person's specific scores and concerns
2. Every recommendation must reference the user's ACTUAL scores and concerns - no generic advice
3. If their hydration is 45%, say "Your hydration score is 45% - this product's hyaluronic acid will target that specific deficit"
4. If they have high acne risk, recommend non-comedogenic products and explain WHY
5. Reference their exact skin type in every recommendation
6. The personalReason should be so specific that it could ONLY apply to this exact user
7. Order by priority - what this person needs MOST urgently based on their weakest scores
8. Include a cleanser, serum, moisturizer, and sunscreen at minimum
9. Add a treatment if they have specific concerns like acne, aging signs, or hyperpigmentation
10. The usageTip should be specific to their skin - e.g. "With your oily T-zone, apply only to dry areas"

Remember: Be specific. Not "great for dry skin" but "your hydration score of 45% with ${analysisResult.skinType} skin means you need multi-weight hyaluronic acid to pull moisture into your dehydrated barrier"

IMPORTANT: Return your response as a valid JSON object matching this exact schema:
{
  "recommendations": [
    {
      "category": "cleansers",
      "productName": "Product Name",
      "brandName": "Brand Name",
      "personalReason": "Specific reason for this user",
      "whyForYou": ["Reason 1", "Reason 2", "Reason 3"],
      "skinTypeMatch": "How it matches their skin type",
      "concernsAddressed": ["concern1", "concern2"],
      "priorityOrder": 1,
      "usageTip": "Specific usage tip"
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`);
      
      // Parse error for better messaging
      let errorMessage = `OpenAI API error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Use default error message
      }
      
      // For 401 errors, provide helpful guidance
      if (response.status === 401) {
        console.warn('⚠️ OpenAI API key is invalid or expired');
        console.warn('   Please check your EXPO_PUBLIC_OPENAI_API_KEY environment variable');
        throw new Error('AI service configuration error. Please contact support.');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsed = parseAIJSON<{ recommendations: z.infer<typeof AIRecommendationSchema>['recommendations'] }>(content);
    
    if (!parsed || !parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      console.error('❌ Invalid response format from OpenAI');
      throw new Error('Invalid response format');
    }

    // Validate against schema
    const result = AIRecommendationSchema.parse({ recommendations: parsed.recommendations });

    console.log(`✅ AI generated ${result.recommendations.length} personalized recommendations`);

    const personalizedProducts: PersonalizedProduct[] = [];

    for (const aiRec of result.recommendations) {
      const matched = findBestMatchingProduct(
        aiRec.brandName,
        aiRec.productName,
        aiRec.category,
        location
      );

      if (matched) {
        const concernOverlap = aiRec.concernsAddressed.filter(c =>
          analysisResult.dermatologyInsights.skinConcerns.some(
            sc => sc.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(sc.toLowerCase())
          )
        );

        const baseScore = 70;
        const concernBonus = Math.min(concernOverlap.length * 8, 20);
        const priorityBonus = Math.max(0, 10 - aiRec.priorityOrder * 2);
        const matchScore = Math.min(98, baseScore + concernBonus + priorityBonus);

        personalizedProducts.push({
          globalProduct: matched,
          aiInsight: aiRec,
          matchScore,
        });
      }
    }

    if (personalizedProducts.length < 3) {
      console.log('⚠️ AI returned fewer matches than expected, filling with rule-based fallbacks');
      return addFallbackProducts(personalizedProducts, analysisResult, location);
    }

    return personalizedProducts.sort((a, b) => a.aiInsight.priorityOrder - b.aiInsight.priorityOrder);
  } catch (error) {
    console.error('❌ AI recommendation generation failed:', error);
    return [];
  }
}

function findBestMatchingProduct(
  brand: string,
  productName: string,
  category: string,
  location: LocationInfo
): GlobalProduct | null {
  const brandLower = brand.toLowerCase();
  const nameLower = productName.toLowerCase();

  let bestMatch: GlobalProduct | null = null;
  let bestScore = 0;

  for (const product of ALL_PRODUCTS) {
    let score = 0;

    if (product.brand.toLowerCase() === brandLower) score += 50;
    else if (product.brand.toLowerCase().includes(brandLower) || brandLower.includes(product.brand.toLowerCase())) score += 30;

    if (product.name.toLowerCase() === nameLower) score += 50;
    else if (product.name.toLowerCase().includes(nameLower) || nameLower.includes(product.name.toLowerCase())) score += 25;

    const nameWords = nameLower.split(/\s+/);
    const productWords = product.name.toLowerCase().split(/\s+/);
    const wordOverlap = nameWords.filter(w => productWords.some(pw => pw.includes(w) || w.includes(pw)));
    score += wordOverlap.length * 5;

    if (category && product.category === category) score += 10;

    if (location.countryCode) {
      const available = product.regionalAvailability.some(
        a => a.countryCode === location.countryCode && a.available
      );
      if (!available) score -= 30;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  if (bestScore < 20) {
    const categoryProducts = getProductsByCategory(category as GlobalProduct['category']);
    if (categoryProducts.length > 0) {
      const available = categoryProducts.filter(p =>
        !location.countryCode || p.regionalAvailability.some(
          a => a.countryCode === location.countryCode && a.available
        )
      );
      return available[0] || categoryProducts[0];
    }
  }

  return bestMatch;
}

function addFallbackProducts(
  existing: PersonalizedProduct[],
  analysisResult: AnalysisResult,
  location: LocationInfo
): PersonalizedProduct[] {
  const existingCategories = new Set(existing.map(p => p.globalProduct.category));
  const requiredCategories: Array<GlobalProduct['category']> = ['cleansers', 'serums', 'moisturizers', 'sunscreens'];

  const skinType = analysisResult.skinType.toLowerCase();
  const concerns = analysisResult.dermatologyInsights.skinConcerns;

  for (const category of requiredCategories) {
    if (existingCategories.has(category)) continue;

    const products = findProductsWithIngredients([], category, skinType, concerns).filter(p =>
      !location.countryCode || p.regionalAvailability.some(
        a => a.countryCode === location.countryCode && a.available
      )
    );

    if (products.length > 0) {
      existing.push({
        globalProduct: products[0],
        aiInsight: {
          category,
          productName: products[0].name,
          brandName: products[0].brand,
          personalReason: `Selected for your ${skinType} skin to address ${concerns[0] || 'general skincare needs'}.`,
          whyForYou: [
            `Formulated for ${skinType} skin types`,
            `Targets ${concerns.slice(0, 2).join(' and ') || 'overall skin health'}`,
            `Key ingredients: ${products[0].keyIngredients.slice(0, 3).join(', ')}`,
          ],
          skinTypeMatch: `Designed for ${skinType} skin`,
          concernsAddressed: concerns.slice(0, 3),
          priorityOrder: existing.length + 1,
          usageTip: `Apply as part of your daily ${category === 'sunscreens' ? 'morning' : 'skincare'} routine.`,
        },
        matchScore: 72,
      });
    }
  }

  return existing;
}

/**
 * Product Recognition Service
 * Uses Google Vision API (OCR) + AI to identify products from photos
 */

import { extractTextFromImage } from './vision-service';
import { supabase } from './supabase';
import { convertImageToDataURL } from './ai-service';

export interface RecognizedProduct {
  brand?: string;
  name?: string;
  ingredients?: string[];
  category?: string;
  confidence: number;
  extractedText?: string;
}

/**
 * Recognize product from image using OCR + AI
 */
export async function recognizeProductFromImage(imageUri: string): Promise<RecognizedProduct> {
  try {
    console.log('🔍 Starting product recognition from image...');
    
    // Convert image to base64
    const base64Image = await convertImageToDataURL(imageUri);
    console.log('✅ Image converted to base64, length:', base64Image.length);

    // Step 1: Extract text using Google Vision API OCR
    console.log('📝 Extracting text from product image...');
    const visionResult = await extractTextFromImage(base64Image);
    
    if (visionResult.error) {
      throw new Error(visionResult.error);
    }

    // Extract all text from Vision API response
    const extractedText = extractTextFromVisionResponse(visionResult);
    console.log('📄 Extracted text:', extractedText.substring(0, 200));

    if (!extractedText || extractedText.trim().length < 10) {
      return {
        confidence: 0,
        extractedText: extractedText || '',
      };
    }

    // Step 2: Use AI to analyze extracted text and identify product
    console.log('🤖 Analyzing text with AI to identify product...');
    const recognized = await analyzeProductText(extractedText);
    
    console.log('✅ Product recognized:', recognized);
    return {
      ...recognized,
      extractedText,
    };
  } catch (error) {
    console.error('❌ Error recognizing product:', error);
    throw error;
  }
}

/**
 * Extract text from Google Vision API response
 */
function extractTextFromVisionResponse(result: any): string {
  try {
    // Google Vision API TEXT_DETECTION returns textAnnotations array
    // First element is the full text, rest are individual words
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      return result.textAnnotations[0].description || '';
    }
    
    // Fallback: try to extract from other fields
    if (result.fullTextAnnotation?.text) {
      return result.fullTextAnnotation.text;
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting text from Vision response:', error);
    return '';
  }
}

/**
 * Use AI to analyze extracted text and identify product details
 */
async function analyzeProductText(extractedText: string): Promise<Omit<RecognizedProduct, 'extractedText'>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.functions.invoke('product-recognize', {
      body: {
        extractedText,
        userId: user?.id || 'guest',
      },
    });

    if (error) {
      console.error('❌ Product recognition Edge Function error:', error);
      // Fallback: try to extract basic info from text
      return extractBasicInfoFromText(extractedText);
    }

    if (data?.error) {
      console.error('❌ Product recognition API error:', data.error);
      return extractBasicInfoFromText(extractedText);
    }

    return {
      brand: data.brand,
      name: data.name,
      ingredients: data.ingredients || [],
      category: data.category || 'skincare',
      confidence: data.confidence || 0.5,
    };
  } catch (error) {
    console.error('Error in analyzeProductText:', error);
    return extractBasicInfoFromText(extractedText);
  }
}

/**
 * Fallback: Extract basic product info from text using simple heuristics
 */
function extractBasicInfoFromText(text: string): Omit<RecognizedProduct, 'extractedText'> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Try to find brand (usually first line or contains common brand keywords)
  const brandKeywords = ['CeraVe', 'La Roche-Posay', 'Neutrogena', 'Olay', 'Cetaphil', 'The Ordinary', 'Paula\'s Choice', 'Kiehl\'s', 'Clinique', 'Estée Lauder'];
  let brand: string | undefined;
  for (const line of lines.slice(0, 5)) {
    for (const keyword of brandKeywords) {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        brand = keyword;
        break;
      }
    }
    if (brand) break;
  }
  
  // Product name is usually the second or third line, or contains product-type keywords
  const productTypeKeywords = ['Cleanser', 'Moisturizer', 'Serum', 'Sunscreen', 'Toner', 'Exfoliant', 'Treatment'];
  let name: string | undefined;
  for (const line of lines.slice(1, 6)) {
    if (productTypeKeywords.some(kw => line.includes(kw))) {
      name = line;
      break;
    }
  }
  if (!name && lines.length > 1) {
    name = lines[1];
  }
  
  // Try to extract ingredients (usually after "Ingredients:" or "INGREDIENTS:")
  let ingredients: string[] = [];
  const ingredientsIndex = text.toLowerCase().indexOf('ingredients');
  if (ingredientsIndex !== -1) {
    const ingredientsText = text.substring(ingredientsIndex + 11);
    // Ingredients are usually comma-separated
    ingredients = ingredientsText
      .split(/[,;]/)
      .map(ing => ing.trim())
      .filter(ing => ing.length > 2 && ing.length < 50)
      .slice(0, 20); // Limit to first 20 ingredients
  }
  
  return {
    brand: brand || undefined,
    name: name || lines[0] || undefined,
    ingredients: ingredients.length > 0 ? ingredients : undefined,
    category: 'skincare',
    confidence: 0.3, // Low confidence for fallback
  };
}



/**
 * Unified AI Service
 * Handles all AI analysis requests via Supabase Edge Functions
 * Properly formats images and handles errors
 */

import { supabase } from './supabase';

export interface AIAnalysisRequest {
  imageUri: string; // Can be base64 data URL or file URI
  analysisType: 'glow' | 'style';
  occasion?: string;
  multiAngle?: boolean;
  visionData?: any; // Optional Google Vision data for glow analysis
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Convert image URI to base64 data URL
 * Handles both file:// URIs and existing data URLs
 * Works in both React Native and Web environments
 */
export async function convertImageToDataURL(imageUri: string): Promise<string> {
  // If already a data URL, return as-is
  if (imageUri.startsWith('data:')) {
    return imageUri;
  }

  try {
    // For React Native file:// URIs
    if (imageUri.startsWith('file://')) {
      // In React Native, we can use expo-file-system or fetch
      // Try fetch first (works in most cases)
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch {
        // Fallback: try using expo-file-system if available
        try {
          const FileSystem = await import('expo-file-system');
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64' as any,
          });
          return `data:image/jpeg;base64,${base64}`;
        } catch (fsError) {
          console.error('Both fetch and FileSystem failed:', fsError);
          throw new Error('Failed to read image file');
        }
      }
    }

    // For HTTP/HTTPS URLs
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    // If it's already base64 without data URL prefix, add it
    if (!imageUri.includes(',') && !imageUri.includes('://')) {
      return `data:image/jpeg;base64,${imageUri}`;
    }

    return imageUri;
  } catch (error) {
    console.error('Error converting image to data URL:', error);
    throw new Error('Failed to convert image to data URL');
  }
}

/**
 * Analyze image using AI Edge Function
 */
export async function analyzeImageWithAI(
  request: AIAnalysisRequest
): Promise<any> {
  try {
    // Get current user (optional - allow anonymous analysis)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';

    // Convert image to data URL if needed
    const imageDataUrl = await convertImageToDataURL(request.imageUri);

    console.log('🤖 Calling AI Edge Function:', {
      analysisType: request.analysisType,
      hasImage: !!imageDataUrl,
      imageLength: imageDataUrl.length,
    });

    // Try Edge Function with retries (90% success rate target)
    // Retry up to 3 times before falling back to direct API
    const MAX_EDGE_RETRIES = 3;
    
    for (let attempt = 0; attempt < MAX_EDGE_RETRIES; attempt++) {
      try {
        console.log(`🔄 Edge Function attempt ${attempt + 1}/${MAX_EDGE_RETRIES}...`);
        
        const { data, error } = await supabase.functions.invoke('ai-analyze', {
          body: {
            imageData: {
              imageUri: imageDataUrl,
              analysisType: request.analysisType,
              occasion: request.occasion,
              multiAngle: request.multiAngle,
              visionData: request.visionData,
            },
            userId,
          },
        });

        if (error) {
          // Retry on network errors, rate limits, or temporary failures
          if (attempt < MAX_EDGE_RETRIES - 1 && (
            error.message?.includes('network') ||
            error.message?.includes('timeout') ||
            error.message?.includes('rate limit') ||
            error.message?.includes('429') ||
            error.message?.includes('503') ||
            error.message?.includes('502')
          )) {
            console.warn(`⚠️ Edge Function error (attempt ${attempt + 1}), retrying...`, error.message);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
            continue;
          }
          throw error;
        }

        if (data?.error) {
          // Retry on certain errors
          if (attempt < MAX_EDGE_RETRIES - 1 && (
            data.error.includes('rate limit') ||
            data.error.includes('429') ||
            data.error.includes('timeout') ||
            data.error.includes('temporary')
          )) {
            console.warn(`⚠️ Edge Function returned error (attempt ${attempt + 1}), retrying...`, data.error);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error(data.error);
        }

        console.log(`✅ AI analysis completed via Edge Function (attempt ${attempt + 1})`);
        return data;
      } catch (edgeError: any) {
        // If it's the last attempt, break to fallback
        if (attempt === MAX_EDGE_RETRIES - 1) {
          console.warn(`⚠️ Edge Function failed after ${MAX_EDGE_RETRIES} attempts, falling back to direct API`);
          break;
        }
        // Otherwise continue to next retry
        if (edgeError?.message?.includes('network') || 
            edgeError?.message?.includes('timeout') ||
            edgeError?.message?.includes('rate limit')) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        // For other errors, break to fallback
        break;
      }
    }
    
    // Fallback to direct OpenAI API only after all Edge Function retries fail
    try {
      // Fallback to direct OpenAI API call with image support (only 10% of cases)
      console.log('🔄 Falling back to direct OpenAI API (Edge Functions unavailable)...');
      const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
        throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables.');
      }

      const prompt = request.analysisType === 'glow'
        ? `You are a beauty and skincare advisor. Perform a comprehensive facial beauty analysis. This is for beauty enhancement purposes only, NOT medical diagnosis. Analyze the image and return a JSON object with skinAnalysis, dermatologyAssessment, beautyScores, beautyRecommendations, confidence, and analysisAccuracy fields.`
        : `Analyze this outfit photo for a ${request.occasion || 'general'} occasion. Provide a comprehensive style analysis in JSON format with overallScore, vibe, colorAnalysis, outfitBreakdown, occasionMatch, bodyTypeRecommendations, and overallFeedback.`;

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
              role: 'system',
              content: 'You are an expert beauty and style advisor. Always return valid JSON without markdown formatting.',
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: { url: imageDataUrl },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (fallbackError) {
      // If fallback also fails, throw to outer catch
      console.error('❌ Fallback OpenAI API also failed:', fallbackError);
      throw fallbackError;
    }
  } catch (error) {
    console.error('Error in analyzeImageWithAI:', error);
    throw error;
  }
}

/**
 * Analyze glow (beauty analysis) with vision data
 * This combines Google Vision API results with AI analysis
 */
export async function analyzeGlowWithVision(
  imageUri: string,
  visionData?: any,
  multiAngle?: boolean
): Promise<any> {
  try {
    // First, get AI analysis
    const aiAnalysis = await analyzeImageWithAI({
      imageUri,
      analysisType: 'glow',
      multiAngle,
    });

    // If we have vision data, merge it with AI analysis
    if (visionData) {
      return {
        ...aiAnalysis,
        visionData,
        // Add vision-based scores if available
        faceDetected: visionData.faceAnnotations?.length > 0,
        landmarks: visionData.landmarkAnnotations || [],
      };
    }

    return aiAnalysis;
  } catch (error) {
    console.error('Error in analyzeGlowWithVision:', error);
    throw error;
  }
}

/**
 * Analyze style (outfit analysis)
 */
export async function analyzeStyle(
  imageUri: string,
  occasion: string
): Promise<any> {
  return analyzeImageWithAI({
    imageUri,
    analysisType: 'style',
    occasion,
  });
}


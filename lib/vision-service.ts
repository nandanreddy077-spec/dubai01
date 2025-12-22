/**
 * Vision Service - Secure Google Vision API Integration
 * Uses Supabase Edge Function to keep API keys server-side
 */

import { supabase } from './supabase';
import { validateImageFromBase64, type ImageValidationResult } from './image-validation';

export interface VisionAnalysisResult {
  faceAnnotations?: any[];
  landmarkAnnotations?: any[];
  labelAnnotations?: any[];
  imagePropertiesAnnotation?: any;
  safeSearchAnnotation?: any;
  error?: string;
}

/**
 * Analyze image using Google Vision API via Edge Function
 */
export async function analyzeImageWithVision(
  base64Image: string,
  features?: { type: string; maxResults?: number }[]
): Promise<VisionAnalysisResult> {
  try {
    // Validate image first
    const validation: ImageValidationResult = await validateImageFromBase64(base64Image, {
      maxSizeMB: 15, // Increased to 15MB to account for base64 encoding overhead (~33% increase)
      maxWidth: 5000,
      maxHeight: 5000,
      minWidth: 100,
      minHeight: 100,
    });

    if (!validation.valid) {
      throw new Error(validation.error || 'Image validation failed');
    }

    // Get current user (optional - allow guest analysis)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('⚠️ Auth error (continuing as guest):', authError.message);
    }
    
    console.log('Vision analysis - User ID:', user?.id || 'guest');
    console.log('📤 Calling vision-analyze Edge Function:', {
      hasImage: !!base64Image,
      imageLength: base64Image.length,
      features: features?.length || 0,
      userId: user?.id || 'guest',
    });

    // Call Edge Function (works with or without authentication)
    const { data, error } = await supabase.functions.invoke('vision-analyze', {
      body: {
        imageData: base64Image,
        features,
        userId: user?.id || 'guest',
      },
    });

    console.log('📥 Vision Edge Function response:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorDetails: error ? JSON.stringify(error, null, 2) : null,
    });

    if (error) {
      console.error('❌ Vision Edge Function error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Failed to analyze image');
    }

    if (data?.error) {
      console.error('❌ Vision API returned error:', data.error);
      throw new Error(data.error);
    }

    // Log response for debugging
    console.log('✅ Vision Edge Function response received');
    console.log('Response keys:', Object.keys(data || {}));
    console.log('Response structure:', JSON.stringify(data, null, 2).substring(0, 500));

    // The Edge Function returns the Google Vision API response directly
    // which has faceAnnotations, imagePropertiesAnnotation, etc. at the top level
    return data as VisionAnalysisResult;
  } catch (error) {
    console.error('Error in analyzeImageWithVision:', error);
    throw error;
  }
}

/**
 * Analyze face in image
 */
export async function analyzeFace(
  base64Image: string
): Promise<VisionAnalysisResult> {
  return analyzeImageWithVision(base64Image, [
    { type: 'FACE_DETECTION', maxResults: 10 },
    { type: 'LANDMARK_DETECTION', maxResults: 10 },
  ]);
}

/**
 * Analyze labels in image
 */
export async function analyzeLabels(
  base64Image: string
): Promise<VisionAnalysisResult> {
  return analyzeImageWithVision(base64Image, [
    { type: 'LABEL_DETECTION', maxResults: 10 },
    { type: 'SAFE_SEARCH_DETECTION' },
  ]);
}


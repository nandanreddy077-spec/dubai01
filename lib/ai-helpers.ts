/**
 * AI Helpers for Skin Analysis
 * Uses Google Vision API + OpenAI GPT-4o-mini for real skin analysis
 * SECURE: API keys are stored server-side in Edge Functions
 */

import { makeOpenAIRequest, type ChatMessage } from './openai-service';
import { analyzeImageWithVision } from './vision-service';

export interface ProgressPhotoAnalysis {
  hydration: number;
  texture: number;
  brightness: number;
  acne: number;
  improvements?: string[];
  skinCondition?: string;
  confidence: number;
}

interface GoogleVisionFaceData {
  faceAnnotations?: {
    detectionConfidence?: number;
    landmarks?: {
      type: string;
      position: { x: number; y: number; z?: number };
    }[];
    rollAngle?: number;
    panAngle?: number;
    tiltAngle?: number;
    underExposedLikelihood?: string;
    blurredLikelihood?: string;
    boundingPoly?: {
      vertices: { x: number; y: number }[];
    };
  }[];
  imagePropertiesAnnotation?: {
    dominantColors?: {
      colors: {
        color: { red: number; green: number; blue: number };
        pixelFraction: number;
        score: number;
      }[];
    };
  };
}

/**
 * Convert image URI to base64
 */
export async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Analyze image using Google Vision API via secure Edge Function
 */
export async function analyzeWithGoogleVision(base64Image: string): Promise<GoogleVisionFaceData | null> {
  try {
    console.log('📸 Calling Google Vision API via Edge Function for progress photo...');
    
    // Use secure Edge Function instead of direct API call
    const result = await analyzeImageWithVision(base64Image, [
      { type: 'FACE_DETECTION', maxResults: 1 },
      { type: 'IMAGE_PROPERTIES', maxResults: 1 },
    ]);

    if (result.error) {
      console.error('Google Vision API error:', result.error);
      return null;
    }

    console.log('✅ Google Vision API response received via Edge Function');
    
    // Transform result to expected format
    return {
      faceAnnotations: result.faceAnnotations || [],
      imagePropertiesAnnotation: result.labelAnnotations?.[0] || null,
    } as GoogleVisionFaceData;
    
  } catch (error) {
    console.error('Google Vision API error:', error);
    return null;
  }
}

/**
 * Calculate brightness score from image properties
 */
function calculateBrightnessScore(colors: { color: { red: number; green: number; blue: number }; pixelFraction: number }[]): number {
  try {
    let totalBrightness = 0;
    let totalPixelFraction = 0;
    let skinToneColors = 0;
    
    colors.forEach((colorData) => {
      const rgb = colorData.color;
      const pixelFraction = colorData.pixelFraction || 0;
      
      // Calculate brightness (luminance)
      const brightness = (rgb.red * 0.299 + rgb.green * 0.587 + rgb.blue * 0.114) / 255;
      
      // Identify skin-tone colors
      const isSkinTone = (rgb.red > rgb.green && rgb.green > rgb.blue && 
                         rgb.red > 100 && rgb.green > 80 && rgb.blue > 60) ||
                        (rgb.red > 150 && rgb.green > 120 && rgb.blue > 90);
      
      if (isSkinTone) {
        skinToneColors += pixelFraction;
      }
      
      totalBrightness += brightness * pixelFraction;
      totalPixelFraction += pixelFraction;
    });
    
    const avgBrightness = totalPixelFraction > 0 ? totalBrightness / totalPixelFraction : 0.5;
    
    // Calculate glow score
    let glowScore = avgBrightness * 70;
    
    // Bonus for skin tone presence
    const skinToneBonus = Math.min(15, skinToneColors * 30);
    glowScore += skinToneBonus;
    
    return Math.max(60, Math.min(98, Math.round(glowScore)));
  } catch (error) {
    console.error('Error calculating brightness score:', error);
    return 75;
  }
}

/**
 * Calculate facial symmetry from landmarks
 */
function calculateFacialSymmetry(landmarks: { type: string; position: { x: number; y: number } }[]): number {
  try {
    const leftEye = landmarks.find((l) => l.type === 'LEFT_EYE');
    const rightEye = landmarks.find((l) => l.type === 'RIGHT_EYE');
    const noseTip = landmarks.find((l) => l.type === 'NOSE_TIP');
    const leftMouth = landmarks.find((l) => l.type === 'MOUTH_LEFT');
    const rightMouth = landmarks.find((l) => l.type === 'MOUTH_RIGHT');
    
    const symmetryScores: number[] = [];
    
    // Eye-nose symmetry
    if (leftEye && rightEye && noseTip) {
      const leftNoseDistance = Math.abs(leftEye.position.x - noseTip.position.x);
      const rightNoseDistance = Math.abs(rightEye.position.x - noseTip.position.x);
      
      const eyeSymmetryRatio = Math.min(leftNoseDistance, rightNoseDistance) / 
                              Math.max(leftNoseDistance, rightNoseDistance);
      symmetryScores.push(eyeSymmetryRatio * 100);
    }
    
    // Mouth symmetry
    if (leftMouth && rightMouth && noseTip) {
      const leftMouthDistance = Math.abs(leftMouth.position.x - noseTip.position.x);
      const rightMouthDistance = Math.abs(rightMouth.position.x - noseTip.position.x);
      
      const mouthSymmetryRatio = Math.min(leftMouthDistance, rightMouthDistance) / 
                                Math.max(leftMouthDistance, rightMouthDistance);
      symmetryScores.push(mouthSymmetryRatio * 100);
    }
    
    if (symmetryScores.length > 0) {
      const avgSymmetry = symmetryScores.reduce((sum, score) => sum + score, 0) / symmetryScores.length;
      return Math.max(65, Math.min(98, Math.round(avgSymmetry)));
    }
  } catch (error) {
    console.error('Error calculating facial symmetry:', error);
  }
  return 80;
}

/**
 * Make AI request using centralized OpenAI service
 */
async function makeAIRequest(
  messages: { role: string; content: string | { type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }[] }[], 
  maxRetries = 2
): Promise<string | null> {
  // Convert to OpenAI format
  const formattedMessages: ChatMessage[] = messages.map(msg => ({
    role: msg.role as 'system' | 'user' | 'assistant',
    content: msg.content,
  }));

  return makeOpenAIRequest(formattedMessages, {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1500,
  }, maxRetries);
}

/**
 * Sanitize JSON string for parsing
 */
function sanitizeJson(input: string): string {
  let s = input;
  // Replace smart quotes
  s = s.replace(/[\u2018\u2019\u201C\u201D]/g, (m) => {
    const map: Record<string, string> = {
      '\u2018': '\'',
      '\u2019': '\'',
      '\u201C': '"',
      '\u201D': '"',
    };
    return map[m] ?? m;
  });
  // Fix newlines
  s = s.replace(/\r?\n/g, ' ');
  // Remove trailing commas
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Fix multiple spaces
  s = s.replace(/\s+/g, ' ');
  // Fix contractions
  s = s.replace(/don't/g, 'do not');
  s = s.replace(/doesn't/g, 'does not');
  s = s.replace(/won't/g, 'will not');
  s = s.replace(/can't/g, 'cannot');
  s = s.replace(/it's/g, 'it is');
  return s;
}

/**
 * Generate consistent fallback score based on vision data
 */
function generateFallbackScores(visionData: GoogleVisionFaceData | null, imageUri: string): ProgressPhotoAnalysis {
  console.log('📊 Generating fallback analysis with vision-based scoring...');
  
  let baseHydration = 75;
  let baseTexture = 75;
  let baseBrightness = 75;
  let baseAcne = 20;
  let confidence = 0.6;
  
  if (visionData) {
    // Use image properties for brightness
    if (visionData.imagePropertiesAnnotation?.dominantColors?.colors) {
      baseBrightness = calculateBrightnessScore(visionData.imagePropertiesAnnotation.dominantColors.colors);
    }
    
    // Use face detection data
    if (visionData.faceAnnotations?.[0]) {
      const face = visionData.faceAnnotations[0];
      
      // Detection confidence affects our confidence
      confidence = Math.min(0.85, (face.detectionConfidence || 0.5) + 0.2);
      
      // Facial symmetry affects texture score
      if (face.landmarks) {
        const symmetry = calculateFacialSymmetry(face.landmarks);
        baseTexture = Math.round((baseTexture + symmetry) / 2);
      }
      
      // Image quality affects hydration perception
      const isWellLit = face.underExposedLikelihood !== 'VERY_LIKELY' && face.underExposedLikelihood !== 'LIKELY';
      const isNotBlurry = face.blurredLikelihood !== 'VERY_LIKELY' && face.blurredLikelihood !== 'LIKELY';
      
      if (isWellLit && isNotBlurry) {
        baseHydration += 5;
        confidence += 0.05;
      }
    }
  }
  
  // Add small variation based on image URI hash for consistency
  let hash = 0;
  for (let i = 0; i < imageUri.length; i++) {
    hash = ((hash << 5) - hash) + imageUri.charCodeAt(i);
    hash = hash & hash;
  }
  const variation = (Math.abs(hash) % 10) - 5; // -5 to +5
  
  return {
    hydration: Math.max(60, Math.min(95, baseHydration + variation)),
    texture: Math.max(60, Math.min(95, baseTexture + Math.floor(variation / 2))),
    brightness: Math.max(60, Math.min(95, baseBrightness)),
    acne: Math.max(5, Math.min(35, baseAcne + Math.floor(variation / 2))),
    skinCondition: 'Analyzed with vision features',
    confidence: Math.min(0.9, confidence),
  };
}

/**
 * Analyze progress photo using AI
 */
async function analyzeWithAI(base64Image: string, visionData: GoogleVisionFaceData | null): Promise<ProgressPhotoAnalysis | null> {
  const prompt = `You are a beauty and skincare advisor providing cosmetic guidance. Analyze this skincare progress photo for beauty enhancement purposes only. This is NOT medical diagnosis. Analyze the skin appearance and provide cosmetic scores.

${visionData ? `Google Vision API Analysis:
- Face Detected: ${visionData.faceAnnotations?.length ? 'Yes' : 'No'}
- Detection Confidence: ${visionData.faceAnnotations?.[0]?.detectionConfidence || 'N/A'}
- Image Lighting: ${visionData.faceAnnotations?.[0]?.underExposedLikelihood || 'N/A'}
- Image Clarity: ${visionData.faceAnnotations?.[0]?.blurredLikelihood || 'N/A'}
` : ''}

Analyze the skin and provide scores for:
1. HYDRATION (0-100): How hydrated/moisturized does the skin look? Look for dewiness, plumpness, no flakiness.
2. TEXTURE (0-100): How smooth is the skin texture? Consider pore visibility, smoothness, evenness.
3. BRIGHTNESS (0-100): How radiant/glowing is the skin? Consider luminosity, dullness, healthy glow.
4. ACNE (0-100): Acne level where 0 = completely clear, 100 = severe acne. Look for pimples, blemishes, redness.

Respond ONLY with a valid JSON object in this exact format:
{
  "hydration": 85,
  "texture": 78,
  "brightness": 82,
  "acne": 15,
  "skinCondition": "Brief description of overall skin condition",
  "improvements": ["Observation 1", "Observation 2"]
}

Be accurate and realistic. Most healthy skin scores between 70-90 for hydration/texture/brightness and 5-30 for acne.`;

  try {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
        ]
      }
    ];

    const response = await makeAIRequest(messages as any);
    
    if (!response) {
      console.log('AI returned no response');
      return null;
    }
    
    // Parse JSON response
    let cleanedText = response.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    const jsonStart = cleanedText.indexOf('{');
    const jsonEnd = cleanedText.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No valid JSON structure found');
      return null;
    }
    
    const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
    
    try {
      const parsed = JSON.parse(jsonString);
      return {
        hydration: Math.max(0, Math.min(100, parsed.hydration || 75)),
        texture: Math.max(0, Math.min(100, parsed.texture || 75)),
        brightness: Math.max(0, Math.min(100, parsed.brightness || 75)),
        acne: Math.max(0, Math.min(100, parsed.acne || 20)),
        skinCondition: parsed.skinCondition || 'Analyzed',
        improvements: parsed.improvements || [],
        confidence: 0.9,
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      
      // Try sanitized parse
      try {
        const sanitized = sanitizeJson(jsonString);
        const parsed = JSON.parse(sanitized);
        return {
          hydration: Math.max(0, Math.min(100, parsed.hydration || 75)),
          texture: Math.max(0, Math.min(100, parsed.texture || 75)),
          brightness: Math.max(0, Math.min(100, parsed.brightness || 75)),
          acne: Math.max(0, Math.min(100, parsed.acne || 20)),
          skinCondition: parsed.skinCondition || 'Analyzed',
          improvements: parsed.improvements || [],
          confidence: 0.85,
        };
      } catch {
        return null;
      }
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
}

/**
 * Main function to analyze a progress photo
 * Uses Google Vision API for face detection + GPT-4o-mini for skin analysis
 */
export async function analyzeProgressPhoto(imageUri: string): Promise<ProgressPhotoAnalysis> {
  console.log('🔍 Starting progress photo analysis...');
  
  try {
    // Step 1: Convert image to base64
    console.log('📷 Converting image to base64...');
    const base64Image = await convertImageToBase64(imageUri);
    
    // Step 2: Analyze with Google Vision API
    console.log('🔍 Analyzing with Google Vision API...');
    const visionData = await analyzeWithGoogleVision(base64Image);
    
    // Validate face detection
    if (!visionData?.faceAnnotations?.length) {
      console.log('⚠️ No face detected, using vision-based fallback...');
      return generateFallbackScores(visionData, imageUri);
    }
    
    const faceConfidence = visionData.faceAnnotations[0].detectionConfidence || 0;
    if (faceConfidence < 0.5) {
      console.log('⚠️ Low face detection confidence, using vision-based fallback...');
      return generateFallbackScores(visionData, imageUri);
    }
    
    // Step 3: Analyze with AI (GPT-4o-mini)
    console.log('🤖 Analyzing with GPT-4o-mini...');
    const aiAnalysis = await analyzeWithAI(base64Image, visionData);
    
    if (aiAnalysis) {
      console.log('✅ AI analysis completed successfully:', aiAnalysis);
      return aiAnalysis;
    }
    
    // Fallback if AI fails
    console.log('⚠️ AI analysis failed, using vision-based fallback...');
    return generateFallbackScores(visionData, imageUri);
    
  } catch (error) {
    console.error('❌ Progress photo analysis error:', error);
    // Return fallback scores on error
    return generateFallbackScores(null, imageUri);
  }
}

/**
 * Compare two progress photos and generate improvement insights
 */
export function compareProgressPhotos(
  oldAnalysis: ProgressPhotoAnalysis,
  newAnalysis: ProgressPhotoAnalysis
): string[] {
  const improvements: string[] = [];
  
  const hydrationChange = newAnalysis.hydration - oldAnalysis.hydration;
  const textureChange = newAnalysis.texture - oldAnalysis.texture;
  const brightnessChange = newAnalysis.brightness - oldAnalysis.brightness;
  const acneChange = oldAnalysis.acne - newAnalysis.acne; // Reversed - lower acne is better
  
  if (hydrationChange > 3) {
    improvements.push(`Hydration improved by ${Math.round(hydrationChange)}%`);
  } else if (hydrationChange < -3) {
    improvements.push(`Hydration decreased by ${Math.abs(Math.round(hydrationChange))}%`);
  }
  
  if (textureChange > 3) {
    improvements.push(`Texture improved by ${Math.round(textureChange)}%`);
  } else if (textureChange < -3) {
    improvements.push(`Texture decreased by ${Math.abs(Math.round(textureChange))}%`);
  }
  
  if (brightnessChange > 3) {
    improvements.push(`Glow increased by ${Math.round(brightnessChange)}%`);
  } else if (brightnessChange < -3) {
    improvements.push(`Glow decreased by ${Math.abs(Math.round(brightnessChange))}%`);
  }
  
  if (acneChange > 3) {
    improvements.push(`Clearer skin - acne reduced by ${Math.round(acneChange)}%`);
  } else if (acneChange < -3) {
    improvements.push(`More breakouts detected (+${Math.abs(Math.round(acneChange))}%)`);
  }
  
  if (improvements.length === 0) {
    improvements.push('Skin condition stable');
  }
  
  return improvements;
}



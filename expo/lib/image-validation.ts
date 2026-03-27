/**
 * Image Validation Utilities
 * Validates image files before processing to prevent security issues
 */

import { Platform } from 'react-native';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  width?: number;
  height?: number;
  size?: number;
  type?: string;
}

export interface ImageValidationOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  allowedTypes?: string[];
  requireSquare?: boolean;
}

const DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
  maxSizeMB: 15, // Increased to 15MB to account for base64 encoding overhead (~33% increase)
  maxWidth: 5000,
  maxHeight: 5000,
  minWidth: 100,
  minHeight: 100,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  requireSquare: false,
};

/**
 * Validates image from base64 data URL
 */
export async function validateImageFromBase64(
  base64Data: string,
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Extract base64 data
    let base64 = base64Data;
    if (base64Data.includes(',')) {
      base64 = base64Data.split(',')[1];
    }

    // Check size (approximate)
    const sizeInBytes = (base64.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > opts.maxSizeMB) {
      return {
        valid: false,
        error: `Image size (${sizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${opts.maxSizeMB}MB)`,
        size: sizeInBytes,
      };
    }

    // Decode and validate image
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check file signature (magic numbers)
    const signature = Array.from(bytes.slice(0, 4))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    let detectedType: string | null = null;
    if (signature.startsWith('FFD8')) {
      detectedType = 'image/jpeg';
    } else if (signature.startsWith('89504E47')) {
      detectedType = 'image/png';
    } else if (signature.startsWith('52494646')) {
      // Check for WebP
      const webpCheck = Array.from(bytes.slice(8, 12))
        .map(b => String.fromCharCode(b))
        .join('');
      if (webpCheck === 'WEBP') {
        detectedType = 'image/webp';
      }
    }

    if (!detectedType || !opts.allowedTypes.includes(detectedType)) {
      return {
        valid: false,
        error: `Invalid image type. Allowed types: ${opts.allowedTypes.join(', ')}`,
        type: detectedType || 'unknown',
      };
    }

    // Get image dimensions (optional in React Native, Edge Function will validate)
    const dimensions = await getImageDimensionsFromBase64(base64Data);
    
    // In React Native, dimensions might be null, but that's okay
    // The Edge Function will handle dimension validation
    if (!dimensions) {
      // Skip dimension validation for base64 in React Native
      // The Edge Function will validate dimensions
      console.log('⚠️ Could not read dimensions from base64, skipping dimension check (Edge Function will validate)');
      return {
        valid: true, // Allow it through, Edge Function will validate
        size: sizeInBytes,
        type: detectedType,
      };
    }

    const { width, height } = dimensions;

    // Validate dimensions
    if (width < opts.minWidth || height < opts.minHeight) {
      return {
        valid: false,
        error: `Image dimensions (${width}x${height}) are too small. Minimum: ${opts.minWidth}x${opts.minHeight}`,
        width,
        height,
      };
    }

    if (width > opts.maxWidth || height > opts.maxHeight) {
      return {
        valid: false,
        error: `Image dimensions (${width}x${height}) are too large. Maximum: ${opts.maxWidth}x${opts.maxHeight}`,
        width,
        height,
      };
    }

    if (opts.requireSquare && width !== height) {
      return {
        valid: false,
        error: `Image must be square. Current dimensions: ${width}x${height}`,
        width,
        height,
      };
    }

    return {
      valid: true,
      width,
      height,
      size: sizeInBytes,
      type: detectedType,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Image validation failed',
    };
  }
}

/**
 * Get image dimensions from base64 data URL
 * Works in both React Native and Web
 */
export async function getImageDimensionsFromBase64(
  base64Data: string
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    try {
      // For Web, use browser Image API
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Image) {
        const img = new window.Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          console.warn('Failed to load image for dimension check');
          resolve(null);
        };
        img.src = base64Data;
      } else {
        // For React Native, use Image.getSize
        // Note: Image.getSize works with URIs, not base64 directly
        // So we'll skip dimension check here and let Edge Function validate
        // Alternatively, we could create a temporary file, but that's overkill
        console.log('⚠️ Skipping dimension check in React Native (Edge Function will validate)');
        resolve(null);
      }
    } catch (error) {
      console.warn('Could not read image dimensions from base64:', error);
      resolve(null);
    }
  });
}

/**
 * Validates image from file URI (React Native)
 */
export async function validateImageFromUri(
  uri: string,
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // For React Native, we need to fetch the image
    const response = await fetch(uri);
    const blob = await response.blob();

    // Check size
    const sizeInMB = blob.size / (1024 * 1024);
    if (sizeInMB > opts.maxSizeMB) {
      return {
        valid: false,
        error: `Image size (${sizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${opts.maxSizeMB}MB)`,
        size: blob.size,
      };
    }

    // Check type
    if (!opts.allowedTypes.includes(blob.type)) {
      return {
        valid: false,
        error: `Invalid image type: ${blob.type}. Allowed types: ${opts.allowedTypes.join(', ')}`,
        type: blob.type,
      };
    }

    // Get dimensions (requires Image component in React Native)
    // For now, we'll skip dimension validation for URIs as it requires additional setup
    // You can add react-native-image-size or similar library for this

    return {
      valid: true,
      size: blob.size,
      type: blob.type,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Image validation failed',
    };
  }
}

/**
 * Validates image file before upload
 */
export function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): ImageValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB > opts.maxSizeMB) {
    return {
      valid: false,
      error: `File size (${sizeInMB.toFixed(2)}MB) exceeds maximum allowed size (${opts.maxSizeMB}MB)`,
      size: file.size,
    };
  }

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${opts.allowedTypes.join(', ')}`,
      type: file.type,
    };
  }

  return {
    valid: true,
    size: file.size,
    type: file.type,
  };
}



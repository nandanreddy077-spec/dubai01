/**
 * React Query Hooks for API Calls
 * Provides caching, pagination, and automatic refetching
 */

import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAnalysisHistory,
  getStyleAnalysisHistory,
  getSkincarePlans,
  saveAnalysis,
  saveStyleAnalysis,
  getUserProfile,
  updateUserProfile,
  uploadImage,
  deleteImage,
  analyzeImageWithAI,
  PaginationParams,
} from './api-service';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Query keys factory
 */
export const queryKeys = {
  analyses: (userId: string, page?: number) => ['analyses', userId, page],
  styleAnalyses: (userId: string, page?: number) => ['styleAnalyses', userId, page],
  skincarePlans: (userId: string, page?: number) => ['skincarePlans', userId, page],
  profile: (userId: string) => ['profile', userId],
};

/**
 * Get analysis history with pagination
 */
export function useAnalysisHistory(params: PaginationParams = {}) {
  const { user } = useAuth();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: ['analyses', userId],
    queryFn: ({ pageParam = 0 }) =>
      getAnalysisHistory(userId!, { ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Get style analysis history with pagination
 */
export function useStyleAnalysisHistory(params: PaginationParams = {}) {
  const { user } = useAuth();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: ['styleAnalyses', userId],
    queryFn: ({ pageParam = 0 }) =>
      getStyleAnalysisHistory(userId!, { ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Get skincare plans with pagination
 */
export function useSkincarePlans(params: PaginationParams = {}) {
  const { user } = useAuth();
  const userId = user?.id;

  return useInfiniteQuery({
    queryKey: ['skincarePlans', userId],
    queryFn: ({ pageParam = 0 }) =>
      getSkincarePlans(userId!, { ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Get user profile
 */
export function useUserProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: queryKeys.profile(userId!),
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Save analysis mutation
 */
export function useSaveAnalysis() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (analysisData: Parameters<typeof saveAnalysis>[1]) =>
      saveAnalysis(userId!, analysisData),
    onSuccess: () => {
      // Invalidate and refetch analyses
      queryClient.invalidateQueries({ queryKey: ['analyses', userId] });
    },
  });
}

/**
 * Save style analysis mutation
 */
export function useSaveStyleAnalysis() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (analysisData: Parameters<typeof saveStyleAnalysis>[1]) =>
      saveStyleAnalysis(userId!, analysisData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['styleAnalyses', userId] });
    },
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (updates: Parameters<typeof updateUserProfile>[1]) =>
      updateUserProfile(userId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId!) });
    },
  });
}

/**
 * Upload image mutation
 */
export function useUploadImage() {
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: ({ file, path }: { file: Blob | File; path: string }) =>
      uploadImage(file, path, userId!),
  });
}

/**
 * Delete image mutation
 */
export function useDeleteImage() {
  return useMutation({
    mutationFn: deleteImage,
  });
}

/**
 * AI analysis mutation with rate limiting
 */
export function useAIAnalysis() {
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (imageData: Parameters<typeof analyzeImageWithAI>[0]) =>
      analyzeImageWithAI(imageData, userId!),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}


















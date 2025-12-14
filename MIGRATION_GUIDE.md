# Migration Guide: Updating to Scalable Architecture

This guide shows how to update your existing code to use the new scalable API architecture.

## Key Changes

1. **Replace direct OpenAI calls** with `analyzeImageWithAI()` from `api-service.ts`
2. **Use React Query hooks** from `api-hooks.ts` for data fetching
3. **Implement pagination** for all list views
4. **Use Supabase Storage** for image uploads

## Example: Updating Analysis Loading Screen

### Before (Direct OpenAI Call):

```typescript
const makeAIRequest = async (messages: any[], maxRetries = 2): Promise<any> => {
  const { makeOpenAIRequest, formatMessages } = await import('../lib/openai-service');
  
  const formattedMessages = formatMessages(messages);
  const result = await makeOpenAIRequest(formattedMessages, {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
  }, maxRetries);
  
  return result;
};
```

### After (Using API Service):

```typescript
import { analyzeImageWithAI } from '@/lib/api-service';
import { useAIAnalysis } from '@/lib/api-hooks';
import { useAuth } from '@/contexts/AuthContext';

// In component:
const { user } = useAuth();
const aiAnalysisMutation = useAIAnalysis();

const analyzeWithAI = async (imageUri: string) => {
  try {
    const result = await analyzeImageWithAI(
      {
        imageUri,
        analysisType: 'glow',
        multiAngle: false,
      },
      user!.id
    );
    return result;
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
};
```

## Example: Updating Analysis History

### Before (Local Storage):

```typescript
const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

useEffect(() => {
  const loadHistory = async () => {
    const stored = await AsyncStorage.getItem('analysis_history');
    if (stored) {
      setAnalysisHistory(JSON.parse(stored));
    }
  };
  loadHistory();
}, []);
```

### After (React Query with Pagination):

```typescript
import { useAnalysisHistory, useSaveAnalysis } from '@/lib/api-hooks';

// In component:
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
} = useAnalysisHistory({ pageSize: 20 });

const saveAnalysisMutation = useSaveAnalysis();

// Flatten paginated data
const analysisHistory = data?.pages.flatMap(page => page.data) || [];

// Load more
const loadMore = () => {
  if (hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
};
```

## Example: Image Upload

### Before (Base64):

```typescript
const imageUri = `data:image/jpeg;base64,${base64String}`;
```

### After (Supabase Storage):

```typescript
import { uploadImage, optimizeImage, uriToBlob } from '@/lib/api-service';
import { useUploadImage } from '@/lib/api-hooks';

const uploadImageMutation = useUploadImage();

const handleImageUpload = async (imageUri: string) => {
  try {
    // Optimize image
    const optimizedUri = await optimizeImage(imageUri, {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
    });

    // Convert to blob
    const blob = await uriToBlob(optimizedUri);

    // Upload to Supabase Storage
    const publicUrl = await uploadImageMutation.mutateAsync({
      file: blob,
      path: `analysis/${Date.now()}.jpg`,
    });

    return publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};
```

## Files to Update

### High Priority:
1. `app/analysis-loading.tsx` - Replace direct OpenAI calls
2. `app/analysis-results.tsx` - Use new API hooks
3. `contexts/AnalysisContext.tsx` - Use React Query hooks
4. `contexts/StyleContext.tsx` - Use React Query hooks
5. `contexts/SkincareContext.tsx` - Use React Query hooks

### Medium Priority:
6. `app/(tabs)/progress.tsx` - Implement pagination
7. `app/(tabs)/community.tsx` - Use Supabase for community data
8. `components/PhotoPickerModal.tsx` - Use Supabase Storage

### Low Priority:
9. Update all image uploads to use `uploadImage()`
10. Add pagination to all list views
11. Replace AsyncStorage with Supabase queries where appropriate

## Step-by-Step Migration

1. **Update API calls first**:
   - Replace `makeOpenAIRequest` with `analyzeImageWithAI`
   - Test each endpoint

2. **Add React Query hooks**:
   - Replace useState/useEffect with useQuery/useMutation
   - Add pagination support

3. **Update image handling**:
   - Replace base64 with Supabase Storage
   - Add image optimization

4. **Add monitoring**:
   - Wrap API calls with `trackApiMetric`
   - Add error tracking

5. **Test thoroughly**:
   - Test with multiple users
   - Verify pagination works
   - Check rate limiting
   - Monitor performance

## Testing Checklist

- [ ] AI analysis works with new API
- [ ] Images upload to Supabase Storage
- [ ] Pagination loads correctly
- [ ] Rate limiting prevents abuse
- [ ] Caching reduces API calls
- [ ] Error handling works properly
- [ ] Performance is acceptable

## Rollback Plan

If issues occur:

1. Keep old code commented out
2. Use feature flags to switch between old/new
3. Monitor error rates closely
4. Have database backup ready
















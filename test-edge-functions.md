# Test Edge Functions

## Quick Test Steps

1. **Check if functions are deployed:**
   - Go to Supabase Dashboard → Edge Functions
   - Verify both `ai-analyze` and `vision-analyze` are listed

2. **Test using Supabase Dashboard:**
   - Click on `ai-analyze` function
   - Click the "Test" button
   - Use this test payload:
   ```json
   {
     "imageData": {
       "imageUri": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==",
       "analysisType": "glow"
     },
     "userId": "test-user-id"
   }
   ```

3. **Check the logs in real-time:**
   - While testing, watch the "Logs" tab
   - You should see the function being invoked
   - Check for any error messages

4. **Common Issues:**
   - If you see "Missing authorization header": The function needs authentication
   - If you see "OpenAI API key not configured": Check the secrets
   - If you see "Edge Function returned a non-2xx status code": Check the function code

## Debugging Steps

1. **Check Secrets:**
   - Go to Edge Functions → Secrets
   - Verify all required secrets are set:
     - `OPENAI_API_KEY`
     - `GOOGLE_VISION_API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **Check Function Code:**
   - Go to Edge Functions → `ai-analyze` → Code
   - Verify the code matches what you expect
   - Look for any syntax errors

3. **Check Invocations:**
   - Go to Edge Functions → `ai-analyze` → Invocations
   - Try changing the time filter to "Last 24 hours"
   - Look for any failed invocations

4. **Check App Console:**
   - When running the app, check the console/terminal
   - Look for the new detailed logs I added
   - They will show:
     - ✅ User authenticated
     - 📤 Request payload details
     - 📥 Response details
     - Any errors




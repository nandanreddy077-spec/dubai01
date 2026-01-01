/**
 * Quick Edge Function Integration Test
 * 
 * This script verifies that Edge Functions are properly configured
 * and accessible from the client application.
 * 
 * Usage: node scripts/test-edge-function-integration.js
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://pmroozitldbgnchainxv.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcm9veml0bGRiZ25jaGFpbnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjcxNDYsImV4cCI6MjA4MDE0MzE0Nn0.2a36x2xDZBE9XAmjmzsV_j4ljCp5aq3jx3uAlpFOWlY';

async function testEdgeFunction(functionName, testData) {
  console.log(`\n🧪 Testing Edge Function: ${functionName}`);
  console.log('─'.repeat(50));
  
  try {
    const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
    console.log(`📍 URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const status = response.status;
    const statusText = response.statusText;
    
    console.log(`📊 Status: ${status} ${statusText}`);
    
    if (status === 404) {
      console.error('❌ Edge Function not found!');
      console.error('   → Function may not be deployed');
      console.error('   → Check Supabase Dashboard → Edge Functions');
      return false;
    }
    
    if (status === 401) {
      console.warn('⚠️  Unauthorized (expected if no auth token)');
      console.warn('   → This is normal - function exists but requires authentication');
      return true; // Function exists, just needs auth
    }
    
    if (status === 500) {
      const errorText = await response.text();
      console.error('❌ Server Error:');
      console.error(`   ${errorText}`);
      
      if (errorText.includes('OPENAI_API_KEY')) {
        console.error('   → OPENAI_API_KEY secret may not be set in Supabase');
        console.error('   → Go to: Supabase Dashboard → Edge Functions → Secrets');
      }
      return false;
    }
    
    if (status === 200 || status === 201) {
      console.log('✅ Edge Function is working!');
      const data = await response.json();
      console.log('📦 Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return true;
    }
    
    const responseText = await response.text();
    console.log(`📄 Response: ${responseText.substring(0, 200)}`);
    
    return status < 500; // Any non-server error means function exists
    
  } catch (error) {
    console.error('❌ Network Error:');
    console.error(`   ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Edge Function Integration Test');
  console.log('='.repeat(50));
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
  
  const results = {
    'ai-analyze': false,
    'vision-analyze': false,
  };
  
  // Test ai-analyze Edge Function
  results['ai-analyze'] = await testEdgeFunction('ai-analyze', {
    test: true,
    imageData: {
      imageUri: 'data:image/jpeg;base64,test',
      analysisType: 'glow',
    },
    userId: 'test-user-id',
  });
  
  // Test vision-analyze Edge Function
  results['vision-analyze'] = await testEdgeFunction('vision-analyze', {
    test: true,
    imageData: 'test-base64-image-data',
    userId: 'test-user-id',
  });
  
  // Summary
  console.log('\n📋 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ ai-analyze: ${results['ai-analyze'] ? 'PASS' : 'FAIL'}`);
  console.log(`✅ vision-analyze: ${results['vision-analyze'] ? 'PASS' : 'FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All Edge Functions are accessible!');
    console.log('   → Functions are deployed and responding');
    console.log('   → Note: 401 errors are expected (auth required)');
  } else {
    console.log('\n⚠️  Some Edge Functions may need attention');
    console.log('   → Check Supabase Dashboard → Edge Functions');
    console.log('   → Verify functions are deployed');
    console.log('   → Check Edge Function logs for errors');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Verify OPENAI_API_KEY secret is set in Supabase');
  console.log('   2. Run full end-to-end tests (see PRODUCTION_TESTING_GUIDE.md)');
  console.log('   3. Test with actual authenticated requests');
}

// Run tests
main().catch(console.error);












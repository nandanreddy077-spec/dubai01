/**
 * Edge Function Diagnostic Tool
 * Run this to test your Edge Function deployment
 */

import { supabase } from '../lib/supabase';

async function testEdgeFunction() {
  console.log('🔍 Starting Edge Function Diagnostic...\n');

  console.log('1️⃣ Checking Supabase Configuration:');
  console.log('   URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  console.log('   Anon Key:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables!\n');
    return;
  }

  console.log('\n2️⃣ Checking Authentication:');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('❌ Auth error:', authError.message);
    console.log('💡 You need to be logged in to test Edge Functions\n');
    return;
  }
  
  if (!user) {
    console.error('❌ No user found - please log in first\n');
    return;
  }
  
  console.log('✅ Authenticated as:', user.email);

  console.log('\n3️⃣ Testing Edge Function (vision-analyze):');
  
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('vision-analyze', {
      body: {
        imageData: testImage,
        userId: user.id,
      },
    });
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Edge Function Error:', error);
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
      console.error('   Error context:', JSON.stringify(error.context || {}, null, 2));
      console.error('   Duration:', duration + 'ms');
      
      if (error.name === 'FunctionsFetchError') {
        console.log('\n💡 Common causes of FunctionsFetchError:');
        console.log('   1. Edge Function not deployed to Supabase');
        console.log('   2. Function name mismatch (check spelling)');
        console.log('   3. Network/CORS issues');
        console.log('   4. Supabase project URL mismatch');
        console.log('\n📝 Next steps:');
        console.log('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/functions');
        console.log('   2. Check if "vision-analyze" function exists');
        console.log('   3. Check function logs for errors');
        console.log('   4. Verify GOOGLE_VISION_API_KEY is set in Edge Function secrets');
      }
      
      return;
    }
    
    console.log('✅ Edge Function Response received');
    console.log('   Duration:', duration + 'ms');
    console.log('   Response keys:', Object.keys(data || {}));
    console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 300));
    
    console.log('\n✅ Edge Function is working correctly!\n');
    
  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message);
    console.error('   Stack:', err.stack);
  }
}

console.log('🚀 Edge Function Diagnostic Tool\n');
console.log('This tool will help diagnose Edge Function deployment issues.\n');

testEdgeFunction().catch(console.error);

/**
 * Edge Function Diagnostic Tool
 * Tests if Edge Functions are deployed and accessible
 */

import { supabase } from '../lib/supabase';

async function testEdgeFunctions() {
  console.log('🔍 Testing Edge Functions...\n');
  
  // Test 1: Check Supabase configuration
  console.log('1️⃣ Checking Supabase Configuration:');
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_URL not configured');
    return;
  }
  if (!supabaseKey || supabaseKey.includes('placeholder')) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY not configured');
    return;
  }
  
  console.log('✅ Supabase URL:', supabaseUrl);
  console.log('✅ Anon Key configured\n');
  
  // Test 2: Check authentication
  console.log('2️⃣ Checking Authentication:');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('⚠️ No user authenticated - Edge Functions require auth');
      console.log('   Please sign in to test Edge Functions\n');
      return;
    }
  } catch (error: any) {
    console.error('❌ Auth error:', error.message);
    return;
  }
  
  console.log('');
  
  // Test 3: Test vision-analyze function
  console.log('3️⃣ Testing vision-analyze function:');
  try {
    // Create a simple test image (1x1 red pixel)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    const { data, error } = await supabase.functions.invoke('vision-analyze', {
      body: {
        imageData: testImage,
        userId: (await supabase.auth.getUser()).data.user?.id,
      },
    });
    
    if (error) {
      console.error('❌ vision-analyze error:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      
      if (error.message?.includes('Failed to send a request')) {
        console.log('\n💡 SOLUTION: The vision-analyze function is NOT deployed.');
        console.log('   Deploy it using one of these methods:\n');
        console.log('   Method 1 (Dashboard):');
        console.log('   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/functions');
        console.log('   2. Click "Create a new function"');
        console.log('   3. Name: vision-analyze');
        console.log('   4. Copy code from supabase/functions/vision-analyze/index.ts');
        console.log('   5. Click Deploy\n');
        console.log('   Method 2 (CLI):');
        console.log('   supabase functions deploy vision-analyze\n');
      }
    } else {
      console.log('✅ vision-analyze is deployed and working');
      console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
  
  console.log('');
  
  // Test 4: Test ai-analyze function
  console.log('4️⃣ Testing ai-analyze function:');
  try {
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    
    const { data, error } = await supabase.functions.invoke('ai-analyze', {
      body: {
        imageData: {
          imageUri: testImage,
          analysisType: 'glow',
        },
        userId: (await supabase.auth.getUser()).data.user?.id,
      },
    });
    
    if (error) {
      console.error('❌ ai-analyze error:', error.message);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      
      if (error.message?.includes('Failed to send a request')) {
        console.log('\n💡 SOLUTION: The ai-analyze function is NOT deployed.');
        console.log('   Deploy it using one of these methods:\n');
        console.log('   Method 1 (Dashboard):');
        console.log('   1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/functions');
        console.log('   2. Click "Create a new function"');
        console.log('   3. Name: ai-analyze');
        console.log('   4. Copy code from supabase/functions/ai-analyze/index.ts');
        console.log('   5. Click Deploy\n');
        console.log('   Method 2 (CLI):');
        console.log('   supabase functions deploy ai-analyze\n');
      }
    } else {
      console.log('✅ ai-analyze is deployed and working');
      console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
  
  console.log('\n✅ Diagnostic complete!');
}

// Run tests
testEdgeFunctions().catch(console.error);

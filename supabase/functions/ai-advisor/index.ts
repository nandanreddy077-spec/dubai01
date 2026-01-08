/**
 * Supabase Edge Function for AI Advisor (Chat)
 * Handles OpenAI API calls with tool support for beauty advisor chat
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface AdvisorRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
  }>;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }>;
  userId: string;
}

serve(async (req) => {
  console.log('🚀 ai-advisor function invoked', {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get('Authorization'),
  });

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request');
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Authorization header present');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Supabase client initialized');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    console.log('🔐 Verifying user token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    console.log('📥 Parsing request body...');
    const body: AdvisorRequest = await req.json();
    const { messages, tools, userId } = body;
    
    console.log('📋 Request received:', {
      messagesCount: messages?.length || 0,
      hasTools: !!tools,
      toolsCount: tools?.length || 0,
      userId,
      userMatches: userId === user.id,
    });

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'User ID mismatch' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ OpenAI API key configured');

    // Prepare OpenAI request
    const openaiBody: any = {
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      openaiBody.tools = tools;
      openaiBody.tool_choice = 'auto';
    }

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API for chat...');
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openaiBody),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', openaiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiResponse.status} - ${errorText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ OpenAI API response received');
    const openaiData = await openaiResponse.json();
    const message = openaiData.choices?.[0]?.message;

    if (!message) {
      console.error('❌ No message in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'No response from OpenAI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare response
    const response: any = {
      content: message.content || null,
    };

    // Include tool calls if present
    if (message.tool_calls && message.tool_calls.length > 0) {
      response.toolCalls = message.tool_calls.map((tc: any) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      }));
      console.log('✅ Tool calls detected:', response.toolCalls.length);
    }

    console.log('✅ Chat response prepared, returning result');
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error in AI advisor:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});





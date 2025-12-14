/**
 * Centralized OpenAI API Service
 * Replaces Rork AI with direct OpenAI integration
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

export interface OpenAIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<OpenAIRequestOptions, 'stream'>> = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2000,
};

/**
 * Make OpenAI API request with retry logic
 */
export async function makeOpenAIRequest(
  messages: ChatMessage[],
  options: OpenAIRequestOptions = {},
  maxRetries = 2
): Promise<string | null> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
    console.error('❌ OpenAI API key not configured');
    console.error('Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file');
    return null;
  }

  const config = { ...DEFAULT_CONFIG, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 OpenAI API attempt ${attempt + 1}/${maxRetries + 1}`);

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`OpenAI API error (attempt ${attempt + 1}):`, response.status, errorText);

        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(`OpenAI API error: ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // Don't retry on client errors (4xx)
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No completion in OpenAI response');
      }

      console.log('✅ OpenAI API success');
      return content;
    } catch (error) {
      console.error(`OpenAI API error (attempt ${attempt + 1}):`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  console.error('❌ OpenAI API failed after all retries:', lastError);
  return null;
}

/**
 * Generate text with OpenAI (simple wrapper)
 */
export async function generateText(
  prompt: string,
  options: OpenAIRequestOptions = {}
): Promise<string | null> {
  return makeOpenAIRequest(
    [{ role: 'user', content: prompt }],
    options
  );
}

/**
 * Make OpenAI request with tools (function calling)
 */
export async function makeOpenAIRequestWithTools(
  messages: ChatMessage[],
  tools: ToolDefinition[],
  options: OpenAIRequestOptions = {},
  maxRetries = 2
): Promise<{
  content: string | null;
  toolCalls?: ToolCall[];
}> {
  if (!OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not configured');
    return { content: null };
  }

  const config = { ...DEFAULT_CONFIG, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 OpenAI API with tools attempt ${attempt + 1}/${maxRetries + 1}`);

      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          tools: tools,
          tool_choice: 'auto',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`OpenAI API error (attempt ${attempt + 1}):`, response.status, errorText);

        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(`OpenAI API error: ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;

      if (!message) {
        throw new Error('No message in OpenAI response');
      }

      // Check for tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        return {
          content: message.content || null,
          toolCalls: message.tool_calls,
        };
      }

      return {
        content: message.content || null,
      };
    } catch (error) {
      console.error(`OpenAI API error (attempt ${attempt + 1}):`, error);
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  console.error('❌ OpenAI API failed after all retries:', lastError);
  return { content: null };
}

/**
 * Stream OpenAI response (for chat interfaces)
 */
export async function* streamOpenAIResponse(
  messages: ChatMessage[],
  options: OpenAIRequestOptions = {}
): AsyncGenerator<string, void, unknown> {
  if (!OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not configured');
    return;
  }

  const config = { ...DEFAULT_CONFIG, ...options };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('OpenAI streaming error:', error);
    throw error;
  }
}

/**
 * Helper to convert messages to OpenAI format
 */
export function formatMessages(
  messages: Array<{ role: string; content: string; tool_call_id?: string; name?: string }>
): ChatMessage[] {
  return messages.map(msg => ({
    role: msg.role as 'system' | 'user' | 'assistant' | 'tool',
    content: msg.content,
    ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
    ...(msg.name && { name: msg.name }),
  }));
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseAIJSON<T = any>(response: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch {
    // Try extracting from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fallback: try to find any JSON object
        const objectMatch = response.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try {
            return JSON.parse(objectMatch[0]);
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}


import { createClient } from '@supabase/supabase-js';

// RevenueCat Webhook Handler
// This would typically be deployed as a serverless function (Vercel, Netlify, etc.)

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: string;
    id: string;
    event_timestamp_ms: number;
    app_user_id: string;
    original_app_user_id: string;
    product_id: string;
    entitlement_id?: string;
    transaction_id: string;
    original_transaction_id: string;
    purchase_date: string;
    expiration_date?: string;
    is_trial_period: boolean;
    auto_renewing: boolean;
    store: 'APP_STORE' | 'PLAY_STORE';
    environment: 'SANDBOX' | 'PRODUCTION';
  };
}

export async function handleRevenueCatWebhook(request: Request): Promise<Response> {
  try {
    // Verify webhook signature (recommended for production)
    const signature = request.headers.get('x-revenuecat-signature');
    if (!signature) {
      console.error('Missing RevenueCat signature');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse webhook payload
    const payload: RevenueCatWebhookEvent = await request.json();
    console.log('Received RevenueCat webhook:', payload.event.type);

    const { event } = payload;

    // Store webhook event in database
    const { error: insertError } = await supabase
      .from('revenuecat_events')
      .insert({
        event_type: event.type,
        app_user_id: event.app_user_id,
        original_app_user_id: event.original_app_user_id,
        product_id: event.product_id,
        entitlement_id: event.entitlement_id,
        transaction_id: event.transaction_id,
        original_transaction_id: event.original_transaction_id,
        purchase_date: event.purchase_date,
        expiration_date: event.expiration_date,
        is_trial_period: event.is_trial_period,
        auto_renewing: event.auto_renewing,
        store: event.store.toLowerCase(),
        environment: event.environment,
        raw_event: payload,
      });

    if (insertError) {
      console.error('Failed to insert webhook event:', insertError);
      return new Response('Database error', { status: 500 });
    }

    // The database trigger will automatically update user subscription status
    console.log(`Successfully processed ${event.type} event for user ${event.app_user_id}`);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Example deployment for Vercel
export async function vercelHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const request = new Request(`https://example.com${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: JSON.stringify(req.body),
    });

    const response = await handleRevenueCatWebhook(request);
    const text = await response.text();
    
    return res.status(response.status).send(text);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Example deployment for Netlify Functions
export const netlifyHandler = async (event: any, context: any) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const request = new Request('https://example.com' + event.path, {
      method: event.httpMethod,
      headers: event.headers,
      body: event.body,
    });

    const response = await handleRevenueCatWebhook(request);
    const text = await response.text();

    return {
      statusCode: response.status,
      body: text,
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Default export for Vercel
export default vercelHandler;
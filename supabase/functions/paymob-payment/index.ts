import { corsHeaders } from '../_shared/cors.ts';

const PAYMOB_BASE = 'https://accept.paymob.com/api';

async function getAuthToken(apiKey: string): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Paymob: Failed to get auth token');
  return data.token;
}

async function registerOrder(token: string, amountCents: number, currency: string): Promise<number> {
  const res = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency,
      items: [],
    }),
  });
  const data = await res.json();
  if (!data.id) throw new Error('Paymob: Failed to register order');
  return data.id;
}

async function getPaymentKey(
  token: string,
  orderId: number,
  amountCents: number,
  currency: string,
  integrationId: string,
  billingData: Record<string, string>
): Promise<string> {
  const res = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency,
      integration_id: parseInt(integrationId),
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Paymob: Failed to get payment key');
  return data.token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan, userEmail, userName } = await req.json();

    const PAYMOB_API_KEY = Deno.env.get('PAYMOB_API_KEY');
    const PAYMOB_INTEGRATION_ID = Deno.env.get('PAYMOB_INTEGRATION_ID');
    const PAYMOB_IFRAME_ID = Deno.env.get('PAYMOB_IFRAME_ID');

    if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
      throw new Error('Paymob credentials not configured');
    }

    // Plan pricing (in cents/piasters)
    const PLANS: Record<string, { amountCents: number; currency: string; label: string }> = {
      monthly: { amountCents: 29900, currency: 'EGP', label: 'اشتراك شهري Premium' },
      yearly: { amountCents: 269900, currency: 'EGP', label: 'اشتراك سنوي Premium' },
    };

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) throw new Error('Invalid plan selected');

    // Step 1: Auth token
    const authToken = await getAuthToken(PAYMOB_API_KEY);

    // Step 2: Register order
    const orderId = await registerOrder(authToken, selectedPlan.amountCents, selectedPlan.currency);

    // Step 3: Get payment key
    const billingData = {
      apartment: 'NA',
      email: userEmail ?? 'user@example.com',
      floor: 'NA',
      first_name: (userName ?? 'User').split(' ')[0],
      last_name: (userName ?? 'User').split(' ')[1] ?? 'NA',
      street: 'NA',
      building: 'NA',
      phone_number: '+201000000000',
      shipping_method: 'NA',
      postal_code: 'NA',
      city: 'Cairo',
      country: 'EG',
      state: 'Cairo',
    };

    const paymentKey = await getPaymentKey(
      authToken,
      orderId,
      selectedPlan.amountCents,
      selectedPlan.currency,
      PAYMOB_INTEGRATION_ID,
      billingData
    );

    const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    return new Response(
      JSON.stringify({ paymentUrl, orderId, plan: selectedPlan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('paymob-payment error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

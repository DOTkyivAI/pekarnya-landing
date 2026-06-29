// Cloudflare Worker — Stripe Checkout Session API
// Розгорнути через: https://dash.cloudflare.com → Workers & Pages → Create → Upload
// Секретний ключ: Settings → Variables → STRIPE_SECRET_KEY = sk_live_... або sk_test_...

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    try {
      const body = await request.json();
      const { lineItems, successUrl, cancelUrl, customerName, customerPhone } = body;

      if (!lineItems || !lineItems.length) {
        return json({ error: 'lineItems обовʼязковий' }, 400);
      }

      // Будуємо form-encoded тіло для Stripe REST API
      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('success_url', successUrl);
      params.append('cancel_url', cancelUrl);

      lineItems.forEach((item, i) => {
        params.append(`line_items[${i}][price]`, item.price);
        params.append(`line_items[${i}][quantity]`, String(item.quantity));
      });

      if (customerName) params.append('metadata[customer_name]', customerName);
      if (customerPhone) params.append('metadata[customer_phone]', customerPhone);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const session = await stripeRes.json();

      if (!stripeRes.ok) {
        return json({ error: session.error?.message || 'Stripe API помилка' }, stripeRes.status);
      }

      return json({ url: session.url });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

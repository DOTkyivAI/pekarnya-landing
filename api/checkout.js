const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // CORS — дозволяє запити з фронтенду
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { lineItems, successUrl, cancelUrl, customerName, customerPhone } = req.body;
    
    if (!lineItems || !lineItems.length) {
      return res.status(400).json({ error: 'Кошик порожній' });
    }
    
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems.map(item => ({
        price: item.price,
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin || ''}/?paid=success`,
      cancel_url: cancelUrl || `${req.headers.origin || ''}/`,
      customer_creation: 'always',
      metadata: {
        customerName: customerName || '',
        customerPhone: customerPhone || '',
      },
    });
    
    return res.status(200).json({ url: session.url });
    
  } catch (err) {
    console.error('Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

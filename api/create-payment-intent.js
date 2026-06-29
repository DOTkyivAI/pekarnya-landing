const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, currency, customerName, customerEmail, customerPhone } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Сума має бути більше 0.50 грн' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,               // у копійках (найменша одиниця валюти)
      currency: currency || 'uah',
      metadata: {
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
      },
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

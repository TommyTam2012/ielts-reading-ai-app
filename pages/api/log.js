export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { name, email, action } = req.body;

  if (!name || !email || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get time in Hong Kong Standard Time (UTC+8)
  const hkTime = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Hong_Kong',
  });

  const logKey = `log:${Date.now()}`;
  const logValue = JSON.stringify({ name, email, action, time: hkTime });

  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/${logKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logValue),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Unknown error saving log');
    }

    res.status(200).json({ success: true, logKey });
  } catch (err) {
    console.error('❌ Redis Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

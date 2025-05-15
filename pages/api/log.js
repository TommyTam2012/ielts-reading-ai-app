export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const key = `log:${email}:${Date.now()}`;

  const payload = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer AUEfAAIjcDFkMTBkNTFmYmIzM2I0ZGQwYTUzODk5NDI2YmZkNTMwZHAxMA',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ timestamp: Date.now() }),
  };

  const upstashRes = await fetch(`https://firm-imp-16671.upstash.io/set/${key}`, payload);
  const data = await upstashRes.json();

  return res.status(200).json({ success: true, key, data });
}

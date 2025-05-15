export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { name, email, action } = req.body;

  if (!name || !email || !action) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const payload = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer AUEfAAIjcDFkMTBkNTFmYmIzM2I0ZGQwYTUzODk5NDI2YmZkNTMwZHAxMA',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      value: JSON.stringify({
        name,
        email,
        action,
        timestamp: new Date().toISOString()
      })
    })
  };

  const key = `log:${email}:${Date.now()}`;
  const response = await fetch(`https://firm-imp-16671.upstash.io/set/${key}`, payload);
  const data = await response.json();

  return res.status(200).json({ success: true, stored: key, data });
}

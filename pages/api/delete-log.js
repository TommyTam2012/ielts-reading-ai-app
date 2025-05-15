export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing key' });

  const UPSTASH_REST_URL = 'https://firm-imp-16671.upstash.io';
  const UPSTASH_TOKEN = 'AUEfAAIjcDFkMTBkNTFmYmIzM2I0ZGQwYTUzODk5NDI2YmZkNTMwZHAxMA';

  const deleteRes = await fetch(`${UPSTASH_REST_URL}/del/${key}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
    },
  });

  const data = await deleteRes.json();
  res.status(200).json({ result: data });
}

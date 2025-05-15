// /api/viewer.js
export default async function handler(req, res) {
  const UPSTASH_REST_URL = 'https://firm-imp-16671.upstash.io';
  const UPSTASH_TOKEN = 'AUEfAAIjcDFkMTBkNTFmYmIzM2I0ZGQwYTUzODk5NDI2YmZkNTMwZHAxMA';

  // Get all log keys
  const keysRes = await fetch(`${UPSTASH_REST_URL}/keys/log:*`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });

  const keysData = await keysRes.json();
  if (!keysData.result || keysData.result.length === 0) {
    return res.status(200).json({ logs: [] });
  }

  // Fetch all log values
  const logPromises = keysData.result.map(async (key) => {
    const valueRes = await fetch(`${UPSTASH_REST_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const valueData = await valueRes.json();
    try {
      return { key, ...JSON.parse(valueData.result) };
    } catch (err) {
      return { key, error: 'Failed to parse log' };
    }
  });

  const logs = await Promise.all(logPromises);
  return res.status(200).json({ logs });
}

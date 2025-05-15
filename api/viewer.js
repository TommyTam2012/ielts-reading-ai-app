import handler from '../../api/viewer';

export default async function (req, res) {
  const UPSTASH_REST_URL = 'https://firm-imp-16671.upstash.io';
  const UPSTASH_TOKEN = 'AUEfAAIjcDFkMTBkNTFmYmIzM2I0ZGQwYTUzODk5NDI2YmZkNTMwZHAxMA';

  const keysRes = await fetch(`${UPSTASH_REST_URL}/keys/log:*`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });

  const keysData = await keysRes.json();
  if (!keysData.result || keysData.result.length === 0) {
    return res.status(200).json({ logs: [] });
  }

  const logs = await Promise.all(
    keysData.result.map(async (key) => {
      const valueRes = await fetch(`${UPSTASH_REST_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      });
      const valueData = await valueRes.json();

      try {
        const parsed = JSON.parse(valueData.result); // <-- Fix here!
        return {
          key,
          email: parsed.email,
          action: parsed.action,
          timestamp: parsed.timestamp, // should be numeric
        };
      } catch {
        return { key, error: 'Parse error' };
      }
    })
  );

  res.status(200).json({ logs });
}

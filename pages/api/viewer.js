export default async function handler(req, res) {
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
      try {
        const valueRes = await fetch(`${UPSTASH_REST_URL}/get/${key}`, {
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        });

        const valueData = await valueRes.json();
        let parsed;

        // 🧠 Smart fallback parser
        if (typeof valueData.result === 'string') {
          try {
            parsed = JSON.parse(valueData.result); // Try single parse
          } catch {
            parsed = JSON.parse(JSON.parse(valueData.result)); // Try double parse
          }
        } else {
          parsed = valueData.result;
        }

        return {
          key,
          email: parsed.email || 'Unknown',
          action: parsed.action || 'Unknown',
          timestamp: parsed.timestamp || Date.now(),
        };
      } catch (err) {
        return { key, error: 'Parse error' };
      }
    })
  );

  res.status(200).json({ logs });
}

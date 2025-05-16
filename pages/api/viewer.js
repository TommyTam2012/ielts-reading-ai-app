export default async function handler(req, res) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    // Step 1: Get all log keys (e.g., log:171584643...) from Redis
    const keysRes = await fetch(`${baseUrl}/keys/log:*`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const keysData = await keysRes.json();
    const keys = keysData.result || [];

    if (keys.length === 0) {
      return res.status(200).json({ logs: [] });
    }

    // Step 2: Fetch all log values
    const logs = [];
    for (const key of keys) {
      const valueRes = await fetch(`${baseUrl}/get/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const valueData = await valueRes.json();
      if (valueData.result) {
        logs.push({ key, ...JSON.parse(valueData.result) });
      }
    }

    // Optional: sort logs newest to oldest
    logs.sort((a, b) => b.key.localeCompare(a.key));

    return res.status(200).json({ logs });
  } catch (err) {
    console.error('❌ View logs failed:', err);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
}

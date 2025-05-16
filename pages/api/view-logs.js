export default async function handler(req, res) {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  try {
    // Get all Redis keys starting with log:
    const keysRes = await fetch(`${baseUrl}/keys/log:*`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const keysData = await keysRes.json();
    const keys = keysData.result || [];

    if (keys.length === 0) {
      return res.status(200).json({ logs: [] });
    }

    // Get all log entries
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

    // Sort by most recent first
    logs.sort((a, b) => b.key.localeCompare(a.key));

    return res.status(200).json({ logs });
  } catch (err) {
    console.error('❌ Failed to view logs:', err);
    return res.status(500).json({ error: 'Error retrieving logs' });
  }
}

export default async function handler(req, res) {
  const UPSTASH_REST_URL = 'https://firm-imp-16671.upstash.io';
  const UPSTASH_TOKEN = 'AUEfAAIjcDFkMTBkNTFmYmIzM2I0ZGQwYTUzODk5NDI2YmZkNTMwZHAxMA';

  const response = await fetch(`${UPSTASH_REST_URL}/keys/log:*`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
    },
  });

  const keysData = await response.json();

  if (!keysData.result || !Array.isArray(keysData.result)) {
    return res.status(200).json({ logs: [] });
  }

  const logs = keysData.result.map((key) => {
    try {
      const [_, email, rawTs] = key.split(':');
      const timestamp = new Date(Number(rawTs)).toISOString();
      return { email, timestamp };
    } catch {
      return { email: 'ParseError', timestamp: new Date().toISOString() };
    }
  });

  return res.status(200).json({ logs });
}

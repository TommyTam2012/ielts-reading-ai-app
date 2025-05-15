import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, action } = req.body;

    if (!name || !email || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const logFilePath = path.join(process.cwd(), 'logs.json');

    let logs = [];

    if (fs.existsSync(logFilePath)) {
      const data = fs.readFileSync(logFilePath, 'utf8');
      logs = JSON.parse(data);
    }

    const newLog = {
      name,
      email,
      action,
      timestamp: new Date().toISOString(),
    };

    logs.push(newLog);

    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));

    res.status(200).json({ success: true, saved: newLog });
  } catch (err) {
    console.error('🚨 Log error:', err);
    res.status(500).json({ error: 'Failed to write log' });
  }
}

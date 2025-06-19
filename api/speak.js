export default async function handler(req, res) {
  try {
    const { text } = await req.body ? await req.json() : {};
    const voiceId = "E2iXioKRyjSqJA8tUYsv";
    const apiKey = process.env.ELEVENLABS_API_KEY;

    console.log("📥 Text received:", text);
    console.log("🔐 API Key present?", !!apiKey);
    console.log("🗣️ Voice ID used:", voiceId);

    if (!text || !apiKey) {
      return res.status(400).json({ error: "Missing text or ElevenLabs API key." });
    }

    const payload = {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.7,
        similarity_boost: 0.85
      }
    };

    console.log("📦 Payload sent:", JSON.stringify(payload, null, 2));

    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("🛑 ElevenLabs API Error:", errText);
      return res.status(500).json({ error: "TTS API Error", detail: errText });
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("💥 TTS Server Error:", err);
    return res.status(500).json({ error: "TTS Server Error", detail: err.message });
  }
}

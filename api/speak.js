export default async function handler(req, res) {
  const { text } = await req.body ? await req.json() : {};

  const voiceId = "E2iXioKRyjSqJA8tUYsv"; // ✅ TommySir’s Voice
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!text || !apiKey) {
    return res.status(400).json({ error: "Missing text or ElevenLabs API key." });
  }

  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.7,
          similarity_boost: 0.85
        }
      })
    });

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return res.status(500).json({ error: "TTS API Error", detail: errText });
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("💥 TTS Server Error:", err);
    return res.status(500).json({
      error: "TTS Server Error",
      detail: err.message
    });
  }
}

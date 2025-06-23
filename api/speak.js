export default async function handler(req, res) {
  let text = "";
  if (req.method === "POST") {
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", chunk => (body += chunk));
      req.on("end", () => resolve());
      req.on("error", err => reject(err));
    });
    const data = JSON.parse(body);
    text = data.text;
  }

  const voiceId = "E2iXioKRyjSqJA8tUYsv"; // Your ElevenLabs voice ID
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const didAuth = process.env.Authorization; // ✅ This is now the full "Basic xxx:yyy"

  if (!text || !elevenKey || !didAuth) {
    return res.status(400).json({ error: "Missing text or API keys." });
  }

  try {
    // Step 1: Send text to ElevenLabs
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenKey,
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
      console.error("🛑 ElevenLabs error:", errText);
      return res.status(500).json({ error: "TTS error", detail: errText });
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    // Step 2: Send MP3 to D-ID using raw Basic Auth
    const didRes = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: didAuth
      },
      body: JSON.stringify({
        script: {
          type: "audio",
          audio: `data:audio/mpeg;base64,${audioBase64}`,
        },
        driver_url: "bank://lively",
        source_url: "https://tommy-tam.readyplayer.me/avatar?id=68553cde1b6a13eb98f1a0d5"
      })
    });

    if (!didRes.ok) {
      const errText = await didRes.text();
      console.error("🛑 D-ID error:", errText);
      return res.status(500).json({ error: "D-ID error", detail: errText });
    }

    const didData = await didRes.json();
    const streamUrl = didData?.result_url || didData?.url || "";

    res.status(200).json({
      audioBase64,
      didStreamUrl: streamUrl
    });

  } catch (err) {
    console.error("💥 Server error:", err);
    return res.status(500).json({ error: "TTS/D-ID Server error", detail: err.message });
  }
}

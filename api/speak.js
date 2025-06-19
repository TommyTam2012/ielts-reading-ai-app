import { NextResponse } from "next/server";

export async function POST(req) {
  const { text } = await req.json();

  const voiceId = "YOUR_CLONED_VOICE_ID"; // 🎙️ Replace with your actual voice ID
  const apiKey = process.env.ELEVENLABS_API_KEY;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.7, similarity_boost: 0.85 }
    })
  });

  if (!response.ok) {
    return NextResponse.json({ error: "TTS failed" }, { status: 500 });
  }

  const audioBuffer = await response.arrayBuffer();
  return new Response(Buffer.from(audioBuffer), {
    headers: {
      "Content-Type": "audio/mpeg"
    }
  });
}

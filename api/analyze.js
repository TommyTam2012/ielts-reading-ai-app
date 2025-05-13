import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || !messages.some(m => m.type === "image_url")) {
      return res.status(400).json({ error: "Missing or invalid message format. Ensure it includes image_url blocks." });
    }

    console.log("📤 GPT Payload:", JSON.stringify(messages, null, 2));

    // Step 1: Get English response from GPT-4o
    const englishResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: messages
        }
      ]
    });

    const english = englishResponse.choices[0]?.message?.content?.trim() || "";

    // Step 2: Translate to Chinese
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "你是一名專業翻譯，請將以下英文內容完整翻譯為簡體中文。不要解釋，只翻譯。"
        },
        {
          role: "user",
          content: english
        }
      ]
    });

    const translated = translationResponse.choices[0]?.message?.content?.trim() || "";

    return res.status(200).json({ response: english, translated });

  } catch (error) {
    console.error("GPT Vision API error:", error);
    return res.status(500).json({ error: "Internal server error", detail: error.message });
  }
}

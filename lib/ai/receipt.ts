import OpenAI from "openai";

export async function parseReceiptWithAI(base64: string) {
  if (!process.env.OPENAI_API_KEY) return {};
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Extract receipt fields: merchant, date (YYYY-MM-DD), total, items[] with name/qty/price" },
      {
        role: "user",
        content: [
          { type: "text", text: "Parse this receipt image and return JSON." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
        ]
      }
    ]
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
}

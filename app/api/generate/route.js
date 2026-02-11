import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { prompts, variations = 1 } = await req.json();

    if (!prompts || !prompts.trim()) {
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const promptList = prompts
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const images = [];

    for (const prompt of promptList) {
      for (let i = 0; i < variations; i++) {
        const result = await openai.images.generate({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
        });

        const image = result.data?.[0];

        if (image?.url) {
          images.push(image.url);
        } else if (image?.b64_json) {
          images.push(`data:image/png;base64,${image.b64_json}`);
        }
      }
    }

    return Response.json({ images });

  } catch (error) {
    console.error("IMAGE ERROR:", error);
    return Response.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
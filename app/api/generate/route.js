import OpenAI from "openai";

export async function POST(req) {
  try {
    const { prompts, sleep, variations } = await req.json();

    if (!prompts || prompts.length === 0) {
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let allImages = [];

    for (const prompt of prompts) {
      for (let i = 0; i < variations; i++) {
        const result = await openai.images.generate({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
        });

        const base64 = result.data[0].b64_json;
        const imageUrl = `data:image/png;base64,${base64}`;

        allImages.push(imageUrl);

        if (sleep) {
          await new Promise((resolve) => setTimeout(resolve, sleep));
        }
      }
    }

    return Response.json({ images: allImages });

  } catch (error) {
    console.error("API ERROR:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
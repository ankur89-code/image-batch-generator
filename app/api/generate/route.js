import OpenAI from "openai";

export async function POST(req) {
  try {
    const { prompts, variations } = await req.json();

    if (!prompts || prompts.trim() === "") {
      return Response.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const promptList = prompts.split("\n").filter(Boolean);

    let images = [];

    for (const prompt of promptList) {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024",
        n: variations || 1,
      });

      const urls = result.data.map(
        (img) => `data:image/png;base64,${img.b64_json}`
      );

      images.push(...urls);
    }

    return Response.json({ images });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
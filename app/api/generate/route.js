import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { prompts, referenceImages } = await req.json();

    const results = [];

    for (const prompt of prompts) {
      const img = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        ...(referenceImages?.length && {
          image: referenceImages[0]
        })
      });

      results.push({
        prompt,
        image: img.data[0].url
      });
    }

    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
export async function POST(request) {
  try {
    const body = await request.json();

    const prompts = body.prompts || [];
    const variations = body.variations || 1;

    // simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const images = [];

    for (let i = 0; i < prompts.length; i++) {
      for (let j = 0; j < variations; j++) {
        images.push({
          prompt: prompts[i],
          url: `https://picsum.photos/seed/${i}-${j}/400/400`,
        });
      }
    }

    return new Response(
      JSON.stringify({ images }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("MOCK ERROR:", error);

    return new Response(
      JSON.stringify({ error: "Mock generation failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

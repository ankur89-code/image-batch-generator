export async function POST(req) {
  try {
    const body = await req.json();
    const { prompts = [], variations = 1 } = body;

    // Simulate API delay (so UI feels real)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const results = [];

    prompts.forEach((prompt, i) => {
      for (let v = 0; v < variations; v++) {
        results.push({
          prompt,
          url: `https://picsum.photos/seed/${encodeURIComponent(
            prompt + v
          )}/400/400`,
        });
      }
    });

    return Response.json({
      images: results,
    });
  } catch (error) {
    return Response.json(
      { error: "Mock generation failed" },
      { status: 500 }
    );
  }
}

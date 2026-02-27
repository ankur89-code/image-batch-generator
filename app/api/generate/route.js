export async function POST(req) {
  const body = await req.json();

  // Fake delay to simulate API
  await new Promise(r => setTimeout(r, 1000));

  return Response.json({
    images: [
      { url: "https://picsum.photos/400?random=1" },
      { url: "https://picsum.photos/400?random=2" }
    ]
  });
}

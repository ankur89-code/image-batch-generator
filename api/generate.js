export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // TEMP mock response (prevents 500 error)
    const results = [
      { url: "https://via.placeholder.com/512?text=Image+1" },
      { url: "https://via.placeholder.com/512?text=Image+2" }
    ];

    return res.status(200).json({ results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      results: [],
      error: "Internal Server Error"
    });
  }
}

"use client";
import { useState } from "react";

export default function Page() {
  const [prompts, setPrompts] = useState("");
  const [variations, setVariations] = useState(5);
  const [sleep, setSleep] = useState(800);
  const [referenceImages, setReferenceImages] = useState([]);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRefs = (e) => {
    const files = Array.from(e.target.files);

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then(setReferenceImages);
  };

  const generate = async () => {
    setLoading(true);
    setResults([]);
    setProgress(0);

    const lines = prompts
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    const total = lines.length * variations;
    let done = 0;

    for (const prompt of lines) {
      for (let i = 1; i <= variations; i++) {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompts: [`${prompt} (v${i})`],
            referenceImages
          })
        });

        const data = await res.json();
        setResults((r) => [...r, ...data.results]);

        done++;
        setProgress(Math.round((done / total) * 100));
        await new Promise((r) => setTimeout(r, sleep));
      }
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">
        Batch Image Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PROMPTS */}
        <div className="lg:col-span-2 bg-white p-4 rounded shadow">
          <label className="font-medium">
            Prompts (one per line, up to 20)
          </label>
          <textarea
            className="w-full border rounded p-3 mt-2 h-48"
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
          />
        </div>

        {/* SETTINGS */}
        <div className="bg-white p-4 rounded shadow space-y-4">
          <div>
            <label className="font-medium">Sleep between requests (ms)</label>
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={sleep}
              onChange={(e) => setSleep(+e.target.value)}
            />
          </div>

          <div>
            <label className="font-medium">Variations per prompt</label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-full border p-2 rounded"
              value={variations}
              onChange={(e) => setVariations(+e.target.value)}
            />
          </div>

          <div>
            <label className="font-medium block mb-1">Reference images</label>

            <input
              type="file"
              multiple
              accept="image/*"
              id="refUpload"
              className="hidden"
              onChange={handleRefs}
            />

            <label
              htmlFor="refUpload"
              className="cursor-pointer inline-block bg-gray-100 border px-3 py-2 rounded"
            >
              Choose Files
            </label>

            <span className="ml-2 text-sm text-gray-600">
              {referenceImages.length
                ? `${referenceImages.length} file(s) selected`
                : "No file chosen"}
            </span>

            <div className="flex flex-wrap gap-2 mt-3">
              {referenceImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  className="w-16 h-16 rounded border object-cover"
                />
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            className="bg-indigo-600 text-white w-full py-2 rounded"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-6">
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-indigo-600 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm mt-1">Progress: {progress}%</div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {results.map((r, i) => (
          <div key={i} className="bg-white p-2 rounded shadow">
            <img src={r.image} className="rounded" />
            <div className="text-xs mt-2">{r.prompt}</div>
            <a
              href={r.image}
              download
              className="text-indigo-600 text-xs"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";

export default function Home() {
  const [prompts, setPrompts] = useState("");
  const [sleep, setSleep] = useState(800);
  const [variations, setVariations] = useState(1);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompts.trim()) {
      alert("Please enter a prompt");
      return;
    }

    setLoading(true);
    setImages([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompts: prompts.trim(),
          sleep: Number(sleep),
          variations: Number(variations),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setImages(data.images || []);
    } catch (err) {
      console.error(err);
      alert("Request failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>Batch Image Generator</h1>

      <textarea
        rows={6}
        value={prompts}
        onChange={(e) => setPrompts(e.target.value)}
        placeholder="an apple on white background"
        style={{ width: "100%", padding: 10 }}
      />

      <br /><br />

      <input
        type="number"
        value={sleep}
        onChange={(e) => setSleep(e.target.value)}
      />
      <span> Sleep (ms)</span>

      <br /><br />

      <input
        type="number"
        value={variations}
        onChange={(e) => setVariations(e.target.value)}
      />
      <span> Variations</span>

      <br /><br />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <div style={{ marginTop: 30 }}>
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            style={{ width: 250, margin: 10 }}
          />
        ))}
      </div>
    </div>
  );
}
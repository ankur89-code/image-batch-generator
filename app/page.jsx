"use client";

import { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function Home() {
  const [prompts, setPrompts] = useState("");
  const [sleep, setSleep] = useState(800);
  const [variations, setVariations] = useState(1);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("promptHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (newPrompt) => {
    const updated = [newPrompt, ...history.slice(0, 9)];
    setHistory(updated);
    localStorage.setItem("promptHistory", JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!prompts.trim()) {
      alert("Please enter a prompt");
      return;
    }

    setLoading(true);
    setImages([]);
    setProgress(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts, variations }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        setLoading(false);
        return;
      }

      setImages(data.images);
      saveHistory(prompts);

      setProgress(100);
    } catch (err) {
      alert("Request failed");
    }

    setLoading(false);
  };

  const downloadImage = async (url, index) => {
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, `image-${index + 1}.png`);
  };

  const downloadZip = async () => {
    const zip = new JSZip();

    for (let i = 0; i < images.length; i++) {
      const response = await fetch(images[i]);
      const blob = await response.blob();
      zip.file(`image-${i + 1}.png`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "images.zip");
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen p-8 bg-white dark:bg-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Batch Image Generator</h1>
          <button
            onClick={() => setDark(!dark)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <textarea
          className="w-full border p-4 rounded mb-4 text-black"
          rows="4"
          placeholder="Enter prompts (one per line)"
          value={prompts}
          onChange={(e) => setPrompts(e.target.value)}
        />

        <div className="flex gap-4 mb-4">
          <input
            type="number"
            value={variations}
            onChange={(e) => setVariations(Number(e.target.value))}
            className="border p-2 rounded text-black"
            placeholder="Variations"
          />
        </div>

        <button
          onClick={handleGenerate}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          {loading ? "Generating..." : "Generate"}
        </button>

        {loading && (
          <div className="mt-4 w-full bg-gray-200 rounded">
            <div
              className="bg-blue-600 text-xs leading-none py-1 text-center text-white"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        {images.length > 0 && (
          <>
            <button
              onClick={downloadZip}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded"
            >
              Download All as ZIP
            </button>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {images.map((img, index) => (
                <div key={index} className="border p-2 rounded">
                  <img src={img} alt="" className="w-full rounded" />
                  <button
                    onClick={() => downloadImage(img, index)}
                    className="mt-2 w-full px-2 py-1 bg-purple-600 text-white rounded"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {history.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-2">Prompt History</h2>
            {history.map((item, i) => (
              <div
                key={i}
                className="cursor-pointer underline"
                onClick={() => setPrompts(item)}
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
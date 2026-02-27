"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const MAX_HISTORY_ITEMS = 10;

export default function Home() {
  const [prompts, setPrompts] = useState("");
  const [variations, setVariations] = useState(1);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [runStats, setRunStats] = useState({ completed: 0, total: 0, activePrompt: "" });
  const [promptStatuses, setPromptStatuses] = useState([]);
  const controllerRef = useRef(null);

  const promptList = useMemo(
    () =>
      prompts
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
    [prompts]
  );

  const totalRequests = promptList.length * variations;
  const canGenerate = !loading && promptList.length > 0;

  useEffect(() => {
    const savedHistory = localStorage.getItem("promptHistory");
    const savedTheme = localStorage.getItem("theme");

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        setHistory([]);
      }
    }

    if (savedTheme === "dark") setDark(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const saveHistory = (newPrompt) => {
    setHistory((prev) => {
      const updated = [newPrompt, ...prev.filter((item) => item !== newPrompt)].slice(
        0,
        MAX_HISTORY_ITEMS
      );
      localStorage.setItem("promptHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (promptToRemove) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== promptToRemove);
      localStorage.setItem("promptHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const stopGeneration = () => {
    controllerRef.current?.abort();
  };

  const updatePromptStatus = (targetPrompt, status) => {
    setPromptStatuses((prev) =>
      prev.map((item) => (item.prompt === targetPrompt ? { ...item, status } : item))
    );
  };

  const handleGenerate = async () => {
    if (!promptList.length) {
      setError("Please enter at least one prompt.");
      return;
    }

    const statuses = promptList.map((prompt) => ({ prompt, status: "queued" }));
    const controller = new AbortController();
    controllerRef.current = controller;

    setError("");
    setLoading(true);
    setImages([]);
    setPromptStatuses(statuses);
    setRunStats({ completed: 0, total: totalRequests, activePrompt: "" });
    setProgress(0);

    const accumulatedImages = [];
    let completedCount = 0;

    try {
      for (const prompt of promptList) {
        updatePromptStatus(prompt, "running");
        setRunStats((prev) => ({ ...prev, activePrompt: prompt }));

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompts: prompt, variations }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          updatePromptStatus(prompt, "failed");
          throw new Error(data.error || "Image generation failed.");
        }

        const newImages = data.images || [];
        accumulatedImages.push(...newImages);
        setImages([...accumulatedImages]);

        completedCount += variations;
        setRunStats((prev) => ({ ...prev, completed: completedCount }));
        setProgress(Math.round((completedCount / totalRequests) * 100));
        updatePromptStatus(prompt, "done");
      }

      setRunStats((prev) => ({ ...prev, activePrompt: "" }));
      saveHistory(prompts);
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Generation cancelled.");
      } else {
        setError(err.message || "Request failed. Please try again.");
      }
    } finally {
      controllerRef.current = null;
      setLoading(false);
    }
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

  const statusColor = {
    queued: "bg-gray-100 dark:bg-gray-800",
    running: "bg-yellow-100 dark:bg-yellow-900",
    done: "bg-green-100 dark:bg-green-900",
    failed: "bg-red-100 dark:bg-red-900",
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen p-8 bg-white dark:bg-gray-900 dark:text-white transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Batch Image Generator</h1>
          <button
            onClick={() => setDark((prev) => !prev)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
          >
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <textarea
          className="w-full border p-4 rounded mb-2 text-black"
          rows="4"
          placeholder="Enter prompts (one per line)"
          value={prompts}
          onChange={(e) => {
            setPrompts(e.target.value);
            if (error) setError("");
          }}
        />

        <div className="text-sm mb-4 text-gray-700 dark:text-gray-300">
          {promptList.length} prompt{promptList.length === 1 ? "" : "s"} × {variations} variation
          {variations === 1 ? "" : "s"} = {totalRequests} image request
          {totalRequests === 1 ? "" : "s"}
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <span>Variations:</span>
            <input
              type="range"
              min="1"
              max="5"
              value={variations}
              onChange={(e) => setVariations(Number(e.target.value))}
            />
            <span className="font-semibold w-5 text-center">{variations}</span>
          </label>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate"}
          </button>

          {loading && (
            <button
              onClick={stopGeneration}
              className="px-4 py-3 bg-red-600 text-white rounded"
            >
              Stop
            </button>
          )}

          <button
            onClick={() => {
              setPrompts("");
              setImages([]);
              setError("");
              setProgress(0);
              setPromptStatuses([]);
              setRunStats({ completed: 0, total: 0, activePrompt: "" });
            }}
            disabled={loading}
            className="px-4 py-3 bg-gray-200 text-gray-800 rounded disabled:opacity-60"
          >
            Clear
          </button>
        </div>

        {error && <p className="mb-4 text-red-500">{error}</p>}

        {loading && (
          <div className="mt-2 w-full bg-gray-200 rounded overflow-hidden" aria-live="polite">
            <div
              className="bg-blue-600 text-xs leading-none py-1 text-center text-white transition-all"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        {(loading || runStats.completed > 0 || promptStatuses.length > 0) && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Completed {runStats.completed}/{runStats.total || totalRequests} image requests
              {runStats.activePrompt ? ` • now generating: ${runStats.activePrompt}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {promptStatuses.map((item) => (
                <span
                  key={item.prompt}
                  className={`px-3 py-1 rounded-full text-sm ${statusColor[item.status]}`}
                >
                  {item.prompt.length > 30 ? `${item.prompt.slice(0, 30)}...` : item.prompt} ({item.status})
                </span>
              ))}
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
                  <img src={img} alt={`Generated image ${index + 1}`} className="w-full rounded" />
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
            <div className="flex flex-wrap gap-2">
              {history.map((item, i) => (
                <div key={`${item}-${i}`} className="flex items-center gap-1">
                  <button
                    className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 underline"
                    onClick={() => setPrompts(item)}
                    title={item}
                  >
                    {item.length > 50 ? `${item.slice(0, 50)}...` : item}
                  </button>
                  <button
                    className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900 text-xs"
                    onClick={() => removeFromHistory(item)}
                    aria-label="Remove prompt from history"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const SAMPLE_PROMPTS = [
  "Make a premium product ad on clean pastel background, no text.",
  "Create a studio shot with soft shadows and reflective surface.",
  "Generate an outdoor lifestyle image at golden hour.",
];

export default function Home() {
  const [promptText, setPromptText] = useState("");
  const [sleepMs, setSleepMs] = useState(800);
  const [variations, setVariations] = useState(5);
  const [mode, setMode] = useState("server-batch");
  const [referenceFiles, setReferenceFiles] = useState([]);
  const [openInNewTab, setOpenInNewTab] = useState(true);

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [failedPrompts, setFailedPrompts] = useState([]);

  const prompts = useMemo(
    () =>
      promptText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 20),
    [promptText]
  );

  const totalExpected = prompts.length * variations;

  const handleGenerate = async () => {
    if (!prompts.length) {
      alert("Please add at least one prompt.");
      return;
    }

    setLoading(true);
    setImages([]);
    setFailedPrompts([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompts,
          variations,
          sleepMs,
          mode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      const generated = data.images || [];
      setImages(generated);

      if (openInNewTab) {
        generated.forEach((img) => window.open(img.url, "_blank", "noopener,noreferrer"));
      }
    } catch (error) {
      setFailedPrompts(prompts);
      alert(error.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setImages([]);
    setFailedPrompts([]);
  };

  const fillSamples = () => setPromptText(SAMPLE_PROMPTS.join("\n"));

  const retryFailed = () => {
    if (!failedPrompts.length) return;
    setPromptText(failedPrompts.join("\n"));
  };

  const downloadSingle = async (url, index) => {
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, `variation-${index + 1}.png`);
  };

  const downloadZip = async () => {
    const zip = new JSZip();

    for (let i = 0; i < images.length; i += 1) {
      const response = await fetch(images[i].url);
      const blob = await response.blob();
      zip.file(`variation-${i + 1}.png`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "variations.zip");
  };

  const downloadCsv = () => {
    const headers = ["prompt", "variation", "url"];
    const rows = images.map((item, index) => [
      `"${item.prompt.replaceAll('"', '""')}"`,
      index + 1,
      item.url,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "last-run.csv");
  };

  const progress = totalExpected ? Math.round((images.length / totalExpected) * 100) : 0;

  return (
    <main className="page-shell">
      <div className="title-row">
        <div>
          <h1>Gemini 2.5 Flash — Text → Image</h1>
          <p>Single-file UI · Throttled · Batch · Variations · Retry & logs · Reference uploads</p>
        </div>
        <span className="backend-tag">Backend: /api/generate</span>
      </div>

      <section className="workspace">
        <div className="card prompt-card">
          <label className="label">Prompts (one per line, up to 20)</label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="make an ad for my product using display bg without any text"
            rows={11}
          />
          <div className="prompt-footer">
            <span>{prompts.length}/20</span>
            <div className="inline-actions">
              <button type="button" onClick={fillSamples}>Fill samples</button>
              <button type="button" onClick={retryFailed} disabled={!failedPrompts.length}>
                Retry failed
              </button>
            </div>
          </div>
        </div>

        <aside className="card control-card">
          <label className="label" htmlFor="sleep">Sleep between requests (ms)</label>
          <input id="sleep" type="number" value={sleepMs} onChange={(e) => setSleepMs(Number(e.target.value))} />

          <label className="label" htmlFor="variations">Variations per prompt (1–10)</label>
          <input
            id="variations"
            type="number"
            min={1}
            max={10}
            value={variations}
            onChange={(e) => setVariations(Math.max(1, Math.min(10, Number(e.target.value))))}
          />

          <label className="label" htmlFor="mode">Mode</label>
          <select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="server-batch">Server batch (one POST)</option>
            <option value="client-loop">Client loop (one-by-one)</option>
          </select>

          <label className="label" htmlFor="reference">Reference images</label>
          <input
            id="reference"
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setReferenceFiles(Array.from(e.target.files || []))}
          />
          <p className="helper">Optional. Upload up to ~6 images to guide style/content.</p>
          {referenceFiles.length > 0 && <p className="helper">Selected: {referenceFiles.map((file) => file.name).join(", ")}</p>}

          <label className="checkbox">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
            />
            Open each image in a new tab
          </label>

          <div className="button-pair">
            <button className="primary" type="button" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </button>
            <button className="secondary" type="button" disabled>
              Stop
            </button>
          </div>

          <button className="secondary wide" type="button" onClick={downloadCsv} disabled={!images.length}>
            Download CSV (last run)
          </button>

          <div className="button-row">
            <button className="secondary" type="button" onClick={downloadZip} disabled={!images.length}>
              Download All as ZIP
            </button>
            <button className="ghost" type="button" onClick={clearAll}>
              Clear
            </button>
          </div>
        </aside>
      </section>

      <section className="progress-section">
        <p>Progress: {images.length}/{totalExpected} ({progress}%)</p>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="result-grid">
        {images.map((item, index) => (
          <article key={`${item.url}-${index}`} className="result-card">
            <h3>#{index + 1}</h3>
            <p>{item.prompt}</p>
            <img src={item.url} alt={item.prompt} />
            <button type="button" onClick={() => downloadSingle(item.url, index)}>
              Download
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

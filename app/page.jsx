"use client";
import { useState } from "react";

export default function Home() {
  const [prompts, setPrompts] = useState("");
  const [sleep, setSleep] = useState(800);
  const [variations, setVariations] = useState(1);
  const [images, setImages] = useState([]);

  const handleGenerate = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        prompts,
        sleep,
        variations,
      }),
    });

    const data = await res.json();
    setImages(data.images || []);
  };

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.title}>Batch Image Generator</h1>

      <div style={styles.container}>
        {/* LEFT PANEL */}
        <div style={styles.left}>
          <label>Prompts (one per line, up to 20)</label>
          <textarea
            rows={8}
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            style={styles.textarea}
            placeholder="an apple on white background"
          />
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.right}>
          <label>Sleep between requests (ms)</label>
          <input
            type="number"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            style={styles.input}
          />

          <label>Variations per prompt</label>
          <input
            type="number"
            value={variations}
            onChange={(e) => setVariations(e.target.value)}
            style={styles.input}
          />

          <label>Reference Images</label>
          <input
            type="file"
            multiple
            style={styles.file}
          />

          <button onClick={handleGenerate} style={styles.button}>
            Generate
          </button>
        </div>
      </div>

      {/* IMAGE RESULTS */}
      <div style={styles.imageGrid}>
        {images.map((img, i) => (
          <img key={i} src={img} style={styles.image} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "40px",
    fontFamily: "Arial",
    background: "#f4f6f9",
    minHeight: "100vh",
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
  },
  container: {
    display: "flex",
    gap: "30px",
    background: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.08)",
  },
  left: {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  textarea: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  input: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  file: {
    padding: "5px",
  },
  button: {
    padding: "12px",
    background: "#5b4bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  imageGrid: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "15px",
  },
  image: {
    width: "100%",
    borderRadius: "8px",
  },
};
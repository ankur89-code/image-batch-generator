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
          variations,
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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>✨ Batch Image Generator</h1>

        <textarea
          placeholder="Enter prompts (one per line)..."
          value={prompts}
          onChange={(e) => setPrompts(e.target.value)}
          style={styles.textarea}
        />

        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label>Sleep (ms)</label>
            <input
              type="number"
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Variations</label>
            <input
              type="number"
              value={variations}
              onChange={(e) => setVariations(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          style={loading ? styles.buttonDisabled : styles.button}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Images"}
        </button>
      </div>

      {images.length > 0 && (
        <div style={styles.grid}>
          {images.map((img, index) => (
            <div key={index} style={styles.imageCard}>
              <img src={img} alt="Generated" style={styles.image} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to right, #141e30, #243b55)",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "#ffffff",
    padding: "30px",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
  },
  textarea: {
    width: "100%",
    height: "120px",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
    marginBottom: "20px",
  },
  row: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
  },
  inputGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  buttonDisabled: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#999",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
  },
  grid: {
    maxWidth: "1200px",
    margin: "40px auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
  },
  imageCard: {
    background: "#fff",
    padding: "10px",
    borderRadius: "10px",
    boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  },
  image: {
    width: "100%",
    borderRadius: "8px",
  },
};
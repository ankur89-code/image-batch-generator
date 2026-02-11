const handleGenerate = async () => {
  if (!prompts.trim()) {
    alert("Please enter a prompt");
    return;
  }

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompts: prompts.trim(),
        variations: Number(variations),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong");
      return;
    }

    setImages(data.images || []);
  } catch (err) {
    console.error(err);
    alert("Request failed");
  }
};
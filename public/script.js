function generate() {
  fetch('/api/generate')
    .then(res => res.json())
    .then(data => {
      const results = Array.isArray(data.results) ? data.results : [];
      render(results);
    })
    .catch(() => render([]));
}

function render(images) {
  const grid = document.getElementById('results');
  grid.innerHTML = '';

  images.forEach((img, i) => {
    const div = document.createElement('div');
    div.innerHTML = `<img src="${img.url}" width="100%" />`;
    grid.appendChild(div);
  });
}

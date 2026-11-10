import React, { useState } from "react";

function rgbToHex(r, g, b) {
  return "#" + [r, g, b]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function colorDistance(a, b) {
  return Math.sqrt(
    Math.pow(a.r - b.r, 2) +
      Math.pow(a.g - b.g, 2) +
      Math.pow(a.b - b.b, 2)
  );
}

function extractPalette(image, maxColors = 6) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const size = 180;
  canvas.width = size;
  canvas.height = size;

  const ratio = Math.min(size / image.width, size / image.height);
  const w = image.width * ratio;
  const h = image.height * ratio;
  const x = (size - w) / 2;
  const y = (size - h) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(image, x, y, w, h);

  const data = ctx.getImageData(0, 0, size, size).data;
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 128) continue;

    const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;

    const current = buckets.get(key) || {
      r: 0,
      g: 0,
      b: 0,
      count: 0,
    };

    current.r += r;
    current.g += g;
    current.b += b;
    current.count += 1;

    buckets.set(key, current);
  }

  const sorted = [...buckets.values()]
    .map((c) => ({
      r: Math.round(c.r / c.count),
      g: Math.round(c.g / c.count),
      b: Math.round(c.b / c.count),
      count: c.count,
    }))
    .sort((a, b) => b.count - a.count);

  const selected = [];

  for (const color of sorted) {
    if (selected.every((s) => colorDistance(s, color) > 45)) {
      selected.push({
        ...color,
        hex: rgbToHex(color.r, color.g, color.b),
      });
    }

    if (selected.length >= maxColors) break;
  }

  return selected;
}

export default function PaletteDiary() {
  const [imageUrl, setImageUrl] = useState(null);
  const [colors, setColors] = useState([]);
  const [toast, setToast] = useState(null);

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result) return;

      setImageUrl(result);

      const img = new Image();

      img.onload = () => {
        const palette = extractPalette(img, 6);
        setColors(palette);
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const copyColor = async (hex) => {
    await navigator.clipboard.writeText(hex);
    setToast(`Copied ${hex}`);

    setTimeout(() => {
      setToast(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400">Palette Diary</p>
            <h1 className="text-5xl font-bold tracking-tight">
              Palette Diary
            </h1>
          </div>

          <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/10 text-5xl shadow-2xl">
            📔
          </div>
        </div>

        <div className="overflow-hidden rounded-[3rem] border border-white/10 bg-neutral-900 shadow-2xl">
          <div className="relative aspect-[3/4]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-white/10 p-6 text-5xl">
                  🖼️
                </div>

                <div>
                  <p className="text-2xl font-semibold">
                    Upload a Photo
                  </p>

                  <p className="mt-2 text-sm text-neutral-400">
                    Extract beautiful colors from your memories.
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
            )}

            {colors.length > 0 && (
              <div className="absolute inset-x-4 bottom-4 rounded-[2rem] bg-black/60 p-4 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-2 text-sm text-white/80">
                  ✨ Palette Colors
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => copyColor(color.hex)}
                    >
                      <div
                        className="h-14 rounded-full border border-white/20"
                        style={{ backgroundColor: color.hex }}
                      />

                      <p className="mt-2 text-center font-mono text-xs">
                        {color.hex}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-center justify-center rounded-[2rem] bg-white px-4 py-5 text-xl font-semibold text-black shadow-xl">
            📷 Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-center rounded-[2rem] bg-white/10 px-4 py-5 text-xl font-semibold text-white shadow-xl">
            ⬆️ Change
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white/5 p-5">
          <h2 className="mb-4 text-lg font-semibold text-neutral-300">
            Extracted Palette
          </h2>

          {colors.length > 0 ? (
            <div className="space-y-3">
              {colors.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => copyColor(color.hex)}
                  className="flex w-full items-center justify-between rounded-2xl bg-white/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full border border-white/20"
                      style={{ backgroundColor: color.hex }}
                    />

                    <div className="text-left">
                      <p className="font-mono text-sm">{color.hex}</p>

                      <p className="text-xs text-neutral-400">
                        RGB {color.r}, {color.g}, {color.b}
                      </p>
                    </div>
                  </div>

                  <span className="text-sm text-neutral-400">Copy</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Your extracted colors will appear here.
            </p>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-2xl">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

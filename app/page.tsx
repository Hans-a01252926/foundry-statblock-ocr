"use client";
import { useState } from "react";

type Result = Record<string, unknown>;

export default function Home() {
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setLoading(true); setError(""); setResult(null);
    setPreview(URL.createObjectURL(file));
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const jsonText = result ? JSON.stringify(result, null, 2) : "";

  function download() {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result?.name as string) ?? "statblock"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Foundry Statblock OCR</h1>
          <p className="text-stone-600 mt-1">
            Drop a D&D 5e statblock image on the left, get clean Foundry JSON on the right.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT: upload + preview */}
          <section className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
            <h2 className="font-semibold mb-3">1. Statblock image</h2>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="flex flex-col items-center justify-center h-48 border-2 border-dashed
                         border-stone-300 rounded-lg cursor-pointer hover:border-blue-400
                         hover:bg-blue-50/40 transition"
            >
              <span className="text-stone-500 text-sm text-center px-4">
                Click to choose or drag an image here
                <br />(PNG, JPG, WebP, GIF)
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>

            {preview && (
              <img
                src={preview}
                alt="statblock preview"
                className="mt-4 rounded-lg border border-stone-200 max-h-80 mx-auto"
              />
            )}
          </section>

          {/* RIGHT: JSON output + actions */}
          <section className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">2. Foundry JSON</h2>
              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(jsonText)}
                    className="px-3 py-1.5 text-sm rounded-md bg-stone-800 text-white hover:bg-stone-700"
                  >
                    Copy
                  </button>
                  <button
                    onClick={download}
                    className="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500"
                  >
                    Download .json
                  </button>
                </div>
              )}
            </div>

            {loading && <p className="text-stone-500">Reading statblock…</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {!loading && !error && !result && (
              <div className="flex-1 flex items-center justify-center text-stone-400 text-sm
                              border border-dashed border-stone-200 rounded-lg min-h-48">
                Your statblock JSON will appear here.
              </div>
            )}

            {result && (
              <pre className="flex-1 overflow-auto text-xs font-mono bg-stone-900 text-stone-100
                              rounded-lg p-4 min-h-48 whitespace-pre">
                {jsonText}
              </pre>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
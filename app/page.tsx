"use client";
import { useEffect, useState } from "react";
import { resizeImage } from "./lib/resizeImage";

type Page = { id: string; file: File; url: string };

export default function Home() {
  const [pages, setPages] = useState<Page[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [edited, setEdited] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (result) setEdited(JSON.stringify(result, null, 2));
  }, [result]);

  function addFiles(list: FileList | File[]) {
    const imgs = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setPages((prev) => [
      ...prev,
      ...imgs.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) })),
    ]);
  }

  function removePage(id: string) {
    setPages((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function extract() {
    if (pages.length === 0) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const form = new FormData();
      for (const p of pages) form.append("image", await resizeImage(p.file));
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

  function download() {
    const blob = new Blob([edited], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(result?.name as string) ?? "statblock"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="mb-8">
        <p className="eyebrow mono">D&D 5e → Foundry VTT</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Statblock to JSON</h1>
        <p className="text-[var(--muted)] mt-1">
          Upload a statblock image and extract Foundry VTT-ready JSON.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {/* INPUT */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="eyebrow mono mb-3">Input</p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex flex-col items-center justify-center h-40 rounded-md border-2 border-dashed
              transition-colors text-center px-4
              ${dragging ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--border)] hover:border-[var(--accent)]"}`}
          >
            <p className="text-sm text-[var(--muted)]">
              Drag images here, or{" "}
              <label className="text-[var(--accent)] font-medium cursor-pointer hover:underline">
                browse
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </label>
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Add multiple pages for a multi-page statblock.
            </p>
          </div>

          {pages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {pages.map((p, i) => (
                <div key={p.id} className="relative">
                  <img
                    src={p.url}
                    alt={`page ${i + 1}`}
                    className="rounded border border-[var(--border)] aspect-square object-cover w-full"
                  />
                  <span className="mono absolute bottom-1 left-1 text-[10px] bg-[var(--text)] text-white px-1 rounded">
                    {i + 1}
                  </span>
                  <button
                    onClick={() => removePage(p.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--text)] text-white text-xs flex items-center justify-center"
                    aria-label="Remove page"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={extract}
            disabled={pages.length === 0 || loading}
            className="mt-5 w-full py-2.5 rounded-md font-medium text-white bg-[var(--accent)]
              hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:hover:bg-[var(--accent)] transition-colors"
          >
            {loading ? "Extracting…" : "Extract JSON"}
          </button>
        </section>

        {/* OUTPUT */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow mono">Output</p>
            {result && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(edited)}
                  className="px-3 py-1 text-sm rounded-md border border-[var(--border)] hover:bg-[var(--bg)]"
                >
                  Copy
                </button>
                <button
                  onClick={download}
                  className="px-3 py-1 text-sm rounded-md text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                >
                  Download .json
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && !result && (
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted)] min-h-64
                            border border-dashed border-[var(--border)] rounded-md">
              Extract a statblock to see JSON here.
            </div>
          )}

          {result && (
            <textarea
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
              spellCheck={false}
              className="mono flex-1 min-h-64 w-full text-xs rounded-md p-4 resize-none
                bg-[var(--editor-bg)] text-[var(--editor-text)] leading-relaxed"
            />
          )}
        </section>
      </div>
    </main>
  );
}
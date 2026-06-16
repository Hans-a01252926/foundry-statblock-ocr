"use client";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setLoading(true); setError(""); setResult("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/parse", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "statblock.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Foundry Statblock OCR</h1>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full text-sm"
      />
      {loading && <p>Reading statblock…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {result && (
        <div className="space-y-3">
          <textarea
            value={result}
            readOnly
            className="w-full h-96 font-mono text-sm border rounded p-3"
          />
          <div className="flex gap-2">
            <button onClick={() => navigator.clipboard.writeText(result)}
              className="px-4 py-2 bg-gray-800 text-white rounded">Copy</button>
            <button onClick={download}
              className="px-4 py-2 bg-blue-600 text-white rounded">Download .txt</button>
          </div>
        </div>
      )}
    </main>
  );
}
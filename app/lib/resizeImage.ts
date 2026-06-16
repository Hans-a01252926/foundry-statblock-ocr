// Shrinks an image to a max long-edge before upload: smaller payload, fewer tokens.
// The vision API downscales past ~1568px anyway, so we lose no real detail.
export async function resizeImage(file: File, maxEdge = 1568): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  if (Math.max(width, height) <= maxEdge) return file; // already small enough

  const scale = maxEdge / Math.max(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92)
  );
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}
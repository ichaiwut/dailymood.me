// Client-side image resize+WebP conversion before upload.
// Keeps Worker CPU low and bandwidth minimal.

const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

export async function optimizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(MAX_DIMENSION / bitmap.width, MAX_DIMENSION / bitmap.height, 1);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unsupported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: "image/webp", quality: QUALITY });
  return new File([blob], "photo.webp", { type: "image/webp" });
}

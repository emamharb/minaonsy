export const MAX_UPLOAD_IMAGE_BYTES = 300 * 1024;

const MAX_IMAGE_SIDE = 2200;
const QUALITIES = [0.88, 0.82, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4];

function outputExtension(type) {
  if (type === "image/webp") return "webp";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return type.split("/")[1]?.replace("jpeg", "jpg") || "img";
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Keep every raster image sent to Firebase at or below 300 KiB. */
export async function prepareImageForUpload(file) {
  if (!file.type.startsWith("image/") || file.size <= MAX_UPLOAD_IMAGE_BYTES) return file;

  // Re-encoding animated GIFs or SVGs would discard animation/vector detail.
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    throw new Error("image-format-limit");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch (_) {
    try { bitmap = await createImageBitmap(file); }
    catch (_) { throw new Error("image-compression-unavailable"); }
  }

  try {
    const initialScale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("image-compression-unavailable");

    for (let scale = initialScale, attempt = 0; attempt < 10; attempt += 1, scale *= 0.82) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const type of ["image/webp", "image/jpeg"]) {
        for (const quality of QUALITIES) {
          const blob = await toBlob(canvas, type, quality);
          if (blob?.type === type && blob.size <= MAX_UPLOAD_IMAGE_BYTES) {
            const stem = file.name.replace(/\.[^.]+$/, "") || "photo";
            return new File([blob], `${stem}.${outputExtension(type)}`, {
              type,
              lastModified: file.lastModified
            });
          }
        }
      }
    }
  } finally {
    bitmap.close?.();
  }

  throw new Error("image-too-large-after-compression");
}

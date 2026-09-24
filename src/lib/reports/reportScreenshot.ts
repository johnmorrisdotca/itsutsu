import { REPORT_IMAGE_LONGEST_SIDE, REPORT_IMAGE_MAX_BYTES, REPORT_IMAGE_TYPES } from "./reports.constants";

/** A screenshot ready to send: base64 for Sumilabu, its size, and an address the window can preview it from. */
export type PreparedScreenshot = { base64: string; bytes: number; preview: string };

/** Qualities a too-large picture is tried at, as a JPEG, largest first. */
const QUALITIES = [0.85, 0.75, 0.6, 0.45];

/**
 * A picked or pasted picture, made into one Sumilabu will take — in the
 * browser, so nothing is spent on the server to do it.
 *
 * A JPEG, PNG or WebP already under 1 MiB goes as it is. Anything larger (a
 * phone's full-resolution screenshot usually is) is redrawn no longer than
 * `REPORT_IMAGE_LONGEST_SIDE` on its long side, as a JPEG, at falling quality
 * and then at smaller sizes until it fits. A picture that still will not fit,
 * or is not a picture, is refused with a sentence the window shows; the report
 * can go without it.
 */
export async function prepareScreenshot(file: Blob): Promise<PreparedScreenshot | { problem: string }> {
  if (!file.type.startsWith("image/")) return { problem: "That is not a picture. A screenshot is a PNG, JPEG or WebP." };
  let blob: Blob | null = (REPORT_IMAGE_TYPES as readonly string[]).includes(file.type) && file.size <= REPORT_IMAGE_MAX_BYTES ? file : null;
  if (blob === null) blob = await shrunk(file);
  if (blob === null) return { problem: "That picture is too large to send. Try a smaller part of the screen." };
  return { base64: await base64Of(blob), bytes: blob.size, preview: URL.createObjectURL(blob) };
}

/** Longest sides tried, in turn, when lowering the quality alone does not bring a picture under the cap. */
const SIDES = [REPORT_IMAGE_LONGEST_SIDE, 1200, 900];

/** The picture redrawn smaller as a JPEG, or null if no size and quality brings it under the cap. */
async function shrunk(file: Blob): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    for (const side of SIDES) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (context === null) return null;
      // A JPEG has no transparency, so a clear background would come out black.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of QUALITIES) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob !== null && blob.size <= REPORT_IMAGE_MAX_BYTES) return blob;
      }
    }
    return null;
  } finally {
    bitmap.close();
  }
}

/** Plain base64, with no `data:` prefix, which is what the contract asks for. */
async function base64Of(blob: Blob): Promise<string> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return url.slice(url.indexOf(",") + 1);
}

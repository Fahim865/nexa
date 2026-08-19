/**
 * Browser-only image helpers. No image content is uploaded or sent to an API.
 */
export const SUPPORTED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"] as const;

export type OutputImageFormat = "png" | "jpeg" | "webp";
export type SourceImage = {
  file: File;
  url: string;
  image: HTMLImageElement;
  width: number;
  height: number;
  format: string;
};
export type ProcessedImage = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  mime: string;
  fileName: string;
};

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_CANVAS_SIDE = 8192;
const MAX_CANVAS_PIXELS = 32_000_000;

export function readableBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatLabel(mime: string) {
  const labels: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/gif": "GIF",
    "image/bmp": "BMP",
  };
  return labels[mime] ?? mime.replace("image/", "").toUpperCase();
}

export function mimeForOutput(format: OutputImageFormat) {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

export function extensionForMime(mime: string) {
  return mime === "image/jpeg" ? "jpg" : mime.replace("image/", "");
}

export function outputFileName(fileName: string, mime: string, suffix: string) {
  const base = fileName.replace(/\.[^/.]+$/, "");
  return `${base}-${suffix}.${extensionForMime(mime)}`;
}

export function validateImageFile(file: File) {
  if (!(SUPPORTED_IMAGE_MIMES as readonly string[]).includes(file.type)) {
    return "Use a JPG, PNG, WebP, GIF, or BMP image file.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "Choose an image below 25 MB for reliable browser-side processing.";
  }
  return null;
}

export function loadLocalImage(file: File): Promise<SourceImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        URL.revokeObjectURL(url);
        reject(new Error("This image could not be decoded."));
        return;
      }
      resolve({ file, url, image, width: image.naturalWidth, height: image.naturalHeight, format: formatLabel(file.type) });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be decoded by this browser."));
    };
    image.src = url;
  });
}

export function assertCanvasSize(width: number, height: number) {
  if (width < 1 || height < 1 || width > MAX_CANVAS_SIDE || height > MAX_CANVAS_SIDE || width * height > MAX_CANVAS_PIXELS) {
    throw new Error("The requested output is too large for safe in-browser canvas processing. Reduce the output dimensions.");
  }
}

export function createCanvas(width: number, height: number) {
  assertCanvasSize(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  return canvas;
}

export function drawScaledImage(source: SourceImage, width: number, height: number, crop?: { x: number; y: number; width: number; height: number }) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (crop) {
    context.drawImage(source.image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  } else {
    context.drawImage(source.image, 0, 0, width, height);
  }
  return canvas;
}

export function sharpenCanvas(canvas: HTMLCanvasElement, amount = 0.18) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const { width, height } = canvas;
  const imageData = context.getImageData(0, 0, width, height);
  const source = new Uint8ClampedArray(imageData.data);
  const output = imageData.data;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      const north = index - width * 4;
      const south = index + width * 4;
      const west = index - 4;
      const east = index + 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = source[index + channel];
        const edge = (4 * center) - source[north + channel] - source[south + channel] - source[west + channel] - source[east + channel];
        output[index + channel] = Math.max(0, Math.min(255, center + amount * edge));
      }
    }
  }
  context.putImageData(imageData, 0, 0);
}

export function drawRotatedImage(source: SourceImage, degrees: 0 | 90 | 180 | 270, flipHorizontal: boolean, flipVertical: boolean) {
  const swapsDimensions = degrees === 90 || degrees === 270;
  const width = swapsDimensions ? source.height : source.width;
  const height = swapsDimensions ? source.width : source.height;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
  context.translate(width / 2, height / 2);
  context.rotate((degrees * Math.PI) / 180);
  context.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  context.drawImage(source.image, -source.width / 2, -source.height / 2);
  return canvas;
}

export async function encodeCanvas(canvas: HTMLCanvasElement, mime: string, quality = 0.86): Promise<Blob> {
  const encodingCanvas = mime === "image/jpeg" ? flattenForJpeg(canvas) : canvas;
  return new Promise((resolve, reject) => {
    encodingCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not encode this image format."));
    }, mime, quality);
  });
}

function flattenForJpeg(canvas: HTMLCanvasElement) {
  const flattened = createCanvas(canvas.width, canvas.height);
  const context = flattened.getContext("2d");
  if (!context) return canvas;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, flattened.width, flattened.height);
  context.drawImage(canvas, 0, 0);
  return flattened;
}

export function asProcessedImage(blob: Blob, width: number, height: number, fileName: string): ProcessedImage {
  return { blob, url: URL.createObjectURL(blob), width, height, mime: blob.type, fileName };
}

export function downloadProcessedImage(result: ProcessedImage) {
  const link = document.createElement("a");
  link.href = result.url;
  link.download = result.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

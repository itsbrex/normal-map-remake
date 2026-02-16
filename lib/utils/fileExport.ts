/**
 * File Export Utilities
 * Export textures as PNG, JPG, or TIFF
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { saveAs } from "file-saver";
import type { ExportFormat } from "@/stores/textureStore";

/**
 * Export a canvas as an image file
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  format: ExportFormat,
  options?: {
    jpgQuality?: number; // 0-100
    pngOpacity?: number; // 0-100
  }
): Promise<void> {
  const quality = (options?.jpgQuality ?? 90) / 100;
  const opacity = (options?.pngOpacity ?? 100) / 100;

  // Get extension
  const ext = format === "tiff" ? "tif" : format;
  const fullFilename = `${filename || "texture"}.${ext}`;

  // Handle PNG opacity
  let exportCanvas = canvas;
  if (format === "png" && opacity < 1) {
    exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext("2d");
    if (ctx) {
      ctx.globalAlpha = opacity;
      ctx.drawImage(canvas, 0, 0);
    }
  }

  // Get MIME type
  const mimeType =
    format === "jpg"
      ? "image/jpeg"
      : format === "tiff"
        ? "image/tiff"
        : "image/png";

  // Export TIFF (requires special handling)
  if (format === "tiff") {
    const blob = await canvasToTiff(exportCanvas);
    saveAs(blob, fullFilename);
    return;
  }

  // Export PNG/JPG using toBlob
  return new Promise((resolve, reject) => {
    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, fullFilename);
          resolve();
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Export multiple canvases at once
 */
export async function exportAllCanvases(
  canvases: {
    canvas: HTMLCanvasElement;
    name: string;
  }[],
  format: ExportFormat,
  options?: {
    jpgQuality?: number;
    pngOpacity?: number;
  }
): Promise<void> {
  for (const { canvas, name } of canvases) {
    await exportCanvas(canvas, name, format, options);
  }
}

/**
 * Convert canvas to TIFF blob
 * Simple TIFF encoder for 8-bit RGBA images
 */
async function canvasToTiff(canvas: HTMLCanvasElement): Promise<Blob> {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { width, height, data } = imageData;

  // TIFF header and IFD structure
  // Using uncompressed RGB format for simplicity
  const headerSize = 8;
  const ifdOffset = headerSize;
  const numTags = 10;
  const ifdSize = 2 + numTags * 12 + 4;
  const stripOffset = ifdOffset + ifdSize;
  const pixelDataSize = width * height * 3; // RGB only

  const totalSize = stripOffset + pixelDataSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let offset = 0;

  // TIFF header (little endian)
  view.setUint16(offset, 0x4949, true); // "II" = little endian
  offset += 2;
  view.setUint16(offset, 42, true); // Magic number
  offset += 2;
  view.setUint32(offset, ifdOffset, true); // IFD offset
  offset += 4;

  // IFD (Image File Directory)
  view.setUint16(offset, numTags, true); // Number of tags
  offset += 2;

  // Helper to write IFD entry
  const writeTag = (
    tag: number,
    type: number,
    count: number,
    value: number
  ) => {
    view.setUint16(offset, tag, true);
    offset += 2;
    view.setUint16(offset, type, true);
    offset += 2;
    view.setUint32(offset, count, true);
    offset += 4;
    if (type === 3) {
      // SHORT
      view.setUint16(offset, value, true);
      offset += 4;
    } else {
      view.setUint32(offset, value, true);
      offset += 4;
    }
  };

  // Tags
  writeTag(256, 3, 1, width); // ImageWidth
  writeTag(257, 3, 1, height); // ImageLength
  writeTag(258, 3, 3, stripOffset - 6); // BitsPerSample (offset to values)
  writeTag(259, 3, 1, 1); // Compression (1 = none)
  writeTag(262, 3, 1, 2); // PhotometricInterpretation (2 = RGB)
  writeTag(273, 4, 1, stripOffset); // StripOffsets
  writeTag(277, 3, 1, 3); // SamplesPerPixel
  writeTag(278, 3, 1, height); // RowsPerStrip
  writeTag(279, 4, 1, pixelDataSize); // StripByteCounts
  writeTag(284, 3, 1, 1); // PlanarConfiguration (1 = chunky)

  // End of IFD
  view.setUint32(offset, 0, true);
  offset += 4;

  // BitsPerSample values (8, 8, 8)
  view.setUint16(offset, 8, true);
  offset += 2;
  view.setUint16(offset, 8, true);
  offset += 2;
  view.setUint16(offset, 8, true);
  offset += 2;

  // Pixel data (RGB, discard alpha)
  offset = stripOffset;
  for (let i = 0; i < data.length; i += 4) {
    bytes[offset++] = data[i]; // R
    bytes[offset++] = data[i + 1]; // G
    bytes[offset++] = data[i + 2]; // B
  }

  return new Blob([buffer], { type: "image/tiff" });
}

/**
 * Download data URL as file
 */
export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = filename;
  link.click();
}

export default exportCanvas;

/**
 * TGA Loader
 * JavaScript loader for TGA files
 *
 * Based on jsTGALoader by Vincent Thibault (BSD License)
 * Ported to TypeScript ES module
 */

export enum TGAType {
  NO_DATA = 0,
  INDEXED = 1,
  RGB = 2,
  GREY = 3,
  RLE_INDEXED = 9,
  RLE_RGB = 10,
  RLE_GREY = 11,
}

export enum TGAOrigin {
  BOTTOM_LEFT = 0x00,
  BOTTOM_RIGHT = 0x01,
  TOP_LEFT = 0x02,
  TOP_RIGHT = 0x03,
  SHIFT = 0x04,
  MASK = 0x30,
}

export interface TGAHeader {
  idLength: number;
  colorMapType: number;
  imageType: number;
  colorMapIndex: number;
  colorMapLength: number;
  colorMapDepth: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  pixelDepth: number;
  flags: number;
  hasEncoding: boolean;
  hasColorMap: boolean;
  isGreyColor: boolean;
}

/**
 * Check the header of TGA file to detect errors
 */
function checkHeader(header: TGAHeader): void {
  if (header.imageType === TGAType.NO_DATA) {
    throw new Error("TGA: No data in file");
  }

  if (header.hasColorMap) {
    if (
      header.colorMapLength > 256 ||
      header.colorMapDepth !== 24 ||
      header.colorMapType !== 1
    ) {
      throw new Error("TGA: Invalid colormap for indexed type");
    }
  } else if (header.colorMapType) {
    throw new Error("TGA: Unexpected palette in non-indexed image");
  }

  if (header.width <= 0 || header.height <= 0) {
    throw new Error("TGA: Invalid image size");
  }

  if (![8, 16, 24, 32].includes(header.pixelDepth)) {
    throw new Error(`TGA: Invalid pixel depth "${header.pixelDepth}"`);
  }
}

/**
 * Decode RLE compression
 */
function decodeRLE(
  data: Uint8Array,
  offset: number,
  pixelSize: number,
  outputSize: number
): Uint8Array {
  const output = new Uint8Array(outputSize);
  const pixels = new Uint8Array(pixelSize);
  let pos = 0;

  while (pos < outputSize) {
    const c = data[offset++];
    const count = (c & 0x7f) + 1;

    // RLE pixels
    if (c & 0x80) {
      for (let i = 0; i < pixelSize; ++i) {
        pixels[i] = data[offset++];
      }
      for (let i = 0; i < count; ++i) {
        output.set(pixels, pos);
        pos += pixelSize;
      }
    }
    // Raw pixels
    else {
      const rawCount = count * pixelSize;
      for (let i = 0; i < rawCount; ++i) {
        output[pos++] = data[offset++];
      }
    }
  }

  return output;
}

/**
 * Get ImageData from 8-bit indexed TGA
 */
function getImageData8bits(
  imageData: Uint8ClampedArray,
  indexes: Uint8Array,
  colormap: Uint8Array,
  width: number,
  yStart: number,
  yStep: number,
  yEnd: number,
  xStart: number,
  xStep: number,
  xEnd: number
): void {
  let i = 0;
  for (let y = yStart; y !== yEnd; y += yStep) {
    for (let x = xStart; x !== xEnd; x += xStep, i++) {
      const color = indexes[i];
      const idx = (x + width * y) * 4;
      imageData[idx + 3] = 255;
      imageData[idx + 2] = colormap[color * 3 + 0];
      imageData[idx + 1] = colormap[color * 3 + 1];
      imageData[idx + 0] = colormap[color * 3 + 2];
    }
  }
}

/**
 * Get ImageData from 16-bit TGA
 */
function getImageData16bits(
  imageData: Uint8ClampedArray,
  pixels: Uint8Array,
  _colormap: Uint8Array | null,
  width: number,
  yStart: number,
  yStep: number,
  yEnd: number,
  xStart: number,
  xStep: number,
  xEnd: number
): void {
  let i = 0;
  for (let y = yStart; y !== yEnd; y += yStep) {
    for (let x = xStart; x !== xEnd; x += xStep, i += 2) {
      const color = pixels[i] | (pixels[i + 1] << 8);
      const idx = (x + width * y) * 4;
      imageData[idx + 0] = (color & 0x7c00) >> 7;
      imageData[idx + 1] = (color & 0x03e0) >> 2;
      imageData[idx + 2] = (color & 0x001f) >> 3;
      imageData[idx + 3] = color & 0x8000 ? 0 : 255;
    }
  }
}

/**
 * Get ImageData from 24-bit RGB TGA
 */
function getImageData24bits(
  imageData: Uint8ClampedArray,
  pixels: Uint8Array,
  _colormap: Uint8Array | null,
  width: number,
  yStart: number,
  yStep: number,
  yEnd: number,
  xStart: number,
  xStep: number,
  xEnd: number
): void {
  let i = 0;
  for (let y = yStart; y !== yEnd; y += yStep) {
    for (let x = xStart; x !== xEnd; x += xStep, i += 3) {
      const idx = (x + width * y) * 4;
      imageData[idx + 3] = 255;
      imageData[idx + 2] = pixels[i + 0];
      imageData[idx + 1] = pixels[i + 1];
      imageData[idx + 0] = pixels[i + 2];
    }
  }
}

/**
 * Get ImageData from 32-bit RGBA TGA
 */
function getImageData32bits(
  imageData: Uint8ClampedArray,
  pixels: Uint8Array,
  _colormap: Uint8Array | null,
  width: number,
  yStart: number,
  yStep: number,
  yEnd: number,
  xStart: number,
  xStep: number,
  xEnd: number
): void {
  let i = 0;
  for (let y = yStart; y !== yEnd; y += yStep) {
    for (let x = xStart; x !== xEnd; x += xStep, i += 4) {
      const idx = (x + width * y) * 4;
      imageData[idx + 2] = pixels[i + 0];
      imageData[idx + 1] = pixels[i + 1];
      imageData[idx + 0] = pixels[i + 2];
      imageData[idx + 3] = pixels[i + 3];
    }
  }
}

/**
 * Get ImageData from 8-bit greyscale TGA
 */
function getImageDataGrey8bits(
  imageData: Uint8ClampedArray,
  pixels: Uint8Array,
  _colormap: Uint8Array | null,
  width: number,
  yStart: number,
  yStep: number,
  yEnd: number,
  xStart: number,
  xStep: number,
  xEnd: number
): void {
  let i = 0;
  for (let y = yStart; y !== yEnd; y += yStep) {
    for (let x = xStart; x !== xEnd; x += xStep, i++) {
      const color = pixels[i];
      const idx = (x + width * y) * 4;
      imageData[idx + 0] = color;
      imageData[idx + 1] = color;
      imageData[idx + 2] = color;
      imageData[idx + 3] = 255;
    }
  }
}

/**
 * Get ImageData from 16-bit greyscale TGA
 */
function getImageDataGrey16bits(
  imageData: Uint8ClampedArray,
  pixels: Uint8Array,
  _colormap: Uint8Array | null,
  width: number,
  yStart: number,
  yStep: number,
  yEnd: number,
  xStart: number,
  xStep: number,
  xEnd: number
): void {
  let i = 0;
  for (let y = yStart; y !== yEnd; y += yStep) {
    for (let x = xStart; x !== xEnd; x += xStep, i += 2) {
      const idx = (x + width * y) * 4;
      imageData[idx + 0] = pixels[i];
      imageData[idx + 1] = pixels[i];
      imageData[idx + 2] = pixels[i];
      imageData[idx + 3] = pixels[i + 1];
    }
  }
}

/**
 * TGA Image class
 */
export class TGAImage {
  header: TGAHeader | null = null;
  imageData: Uint8Array | null = null;
  palette: Uint8Array | null = null;

  /**
   * Load TGA from ArrayBuffer or Uint8Array
   */
  load(buffer: ArrayBuffer | Uint8Array): void {
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    if (data.length < 0x12) {
      throw new Error("TGA: Not enough data to contain header");
    }

    let offset = 0;

    // Read header
    this.header = {
      idLength: data[offset++],
      colorMapType: data[offset++],
      imageType: data[offset++],
      colorMapIndex: data[offset++] | (data[offset++] << 8),
      colorMapLength: data[offset++] | (data[offset++] << 8),
      colorMapDepth: data[offset++],
      offsetX: data[offset++] | (data[offset++] << 8),
      offsetY: data[offset++] | (data[offset++] << 8),
      width: data[offset++] | (data[offset++] << 8),
      height: data[offset++] | (data[offset++] << 8),
      pixelDepth: data[offset++],
      flags: data[offset++],
      hasEncoding: false,
      hasColorMap: false,
      isGreyColor: false,
    };

    // Set shortcuts
    this.header.hasEncoding =
      this.header.imageType === TGAType.RLE_INDEXED ||
      this.header.imageType === TGAType.RLE_RGB ||
      this.header.imageType === TGAType.RLE_GREY;

    this.header.hasColorMap =
      this.header.imageType === TGAType.RLE_INDEXED ||
      this.header.imageType === TGAType.INDEXED;

    this.header.isGreyColor =
      this.header.imageType === TGAType.RLE_GREY ||
      this.header.imageType === TGAType.GREY;

    // Validate header
    checkHeader(this.header);

    // Skip ID field
    offset += this.header.idLength;
    if (offset >= data.length) {
      throw new Error("TGA: No data after header");
    }

    // Read palette
    if (this.header.hasColorMap) {
      const colorMapSize =
        this.header.colorMapLength * (this.header.colorMapDepth >> 3);
      this.palette = data.subarray(offset, offset + colorMapSize);
      offset += colorMapSize;
    }

    const pixelSize = this.header.pixelDepth >> 3;
    const imageSize = this.header.width * this.header.height;
    const pixelTotal = imageSize * pixelSize;

    // Decode pixel data
    if (this.header.hasEncoding) {
      this.imageData = decodeRLE(data, offset, pixelSize, pixelTotal);
    } else {
      this.imageData = data.subarray(
        offset,
        offset + (this.header.hasColorMap ? imageSize : pixelTotal)
      );
    }
  }

  /**
   * Get ImageData from loaded TGA
   */
  getImageData(): ImageData {
    if (!this.header || !this.imageData) {
      throw new Error("TGA: No data loaded");
    }

    const { width, height, flags, pixelDepth, isGreyColor, hasColorMap } =
      this.header;

    const imageData = new ImageData(width, height);
    const origin = (flags & TGAOrigin.MASK) >> TGAOrigin.SHIFT;

    // Determine iteration direction based on origin
    let yStart: number, yStep: number, yEnd: number;
    let xStart: number, xStep: number, xEnd: number;

    if (origin === TGAOrigin.TOP_LEFT || origin === TGAOrigin.TOP_RIGHT) {
      yStart = 0;
      yStep = 1;
      yEnd = height;
    } else {
      yStart = height - 1;
      yStep = -1;
      yEnd = -1;
    }

    if (origin === TGAOrigin.TOP_LEFT || origin === TGAOrigin.BOTTOM_LEFT) {
      xStart = 0;
      xStep = 1;
      xEnd = width;
    } else {
      xStart = width - 1;
      xStep = -1;
      xEnd = -1;
    }

    // Select appropriate decoder
    type DecoderFn = (
      imageData: Uint8ClampedArray,
      pixels: Uint8Array,
      colormap: Uint8Array | null,
      width: number,
      yStart: number,
      yStep: number,
      yEnd: number,
      xStart: number,
      xStep: number,
      xEnd: number
    ) => void;

    let decoder: DecoderFn;

    switch (pixelDepth) {
      case 8:
        decoder = isGreyColor
          ? getImageDataGrey8bits
          : (getImageData8bits as DecoderFn);
        break;
      case 16:
        decoder = isGreyColor ? getImageDataGrey16bits : getImageData16bits;
        break;
      case 24:
        decoder = getImageData24bits;
        break;
      case 32:
        decoder = getImageData32bits;
        break;
      default:
        throw new Error(`TGA: Unsupported pixel depth ${pixelDepth}`);
    }

    decoder(
      imageData.data,
      this.imageData,
      hasColorMap ? this.palette : null,
      width,
      yStart,
      yStep,
      yEnd,
      xStart,
      xStep,
      xEnd
    );

    return imageData;
  }

  /**
   * Create a canvas element with the TGA image
   */
  getCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx || !this.header) {
      throw new Error("TGA: Failed to create canvas context");
    }

    canvas.width = this.header.width;
    canvas.height = this.header.height;

    const imageData = this.getImageData();
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  /**
   * Get data URL from TGA image
   */
  getDataURL(type: string = "image/png"): string {
    return this.getCanvas().toDataURL(type);
  }

  /**
   * Convert to HTMLImageElement
   */
  async toImage(): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = this.getDataURL();
    });
  }
}

/**
 * Load TGA from File object
 */
export async function loadTGAFromFile(file: File): Promise<TGAImage> {
  const buffer = await file.arrayBuffer();
  const tga = new TGAImage();
  tga.load(buffer);
  return tga;
}

/**
 * Load TGA from URL
 */
export async function loadTGAFromURL(url: string): Promise<TGAImage> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const tga = new TGAImage();
  tga.load(buffer);
  return tga;
}

/**
 * Check if file is a TGA file based on extension
 */
export function isTGAFile(filename: string): boolean {
  return /\.tga$/i.test(filename);
}

export default TGAImage;

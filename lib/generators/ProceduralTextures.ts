/**
 * ProceduralTextures Module
 * Procedural texture generation for the TextureGenerator app
 *
 * Based on original TextureGenerator-Online by Christian Petry (MIT 2014)
 */

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Seeded random number generator (LCG)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = 1) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  reset(seed: number): void {
    this.seed = seed;
  }
}

/**
 * Linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smooth interpolation (ease in-out)
 */
function _smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Mix two colors
 */
function mixColors(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  };
}

// ============================================================================
// Perlin Noise Implementation
// ============================================================================

class PerlinNoise {
  private permutation: number[] = [];
  private p: number[] = [];

  constructor(seed: number = 1) {
    this.init(seed);
  }

  init(seed: number): void {
    const rng = new SeededRandom(seed);

    // Initialize permutation array
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle using Fisher-Yates
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [
        this.permutation[j],
        this.permutation[i],
      ];
    }

    // Duplicate permutation array
    this.p = [...this.permutation, ...this.permutation];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = this.fade(x);
    const v = this.fade(y);

    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;

    return lerp(
      lerp(this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y), u),
      lerp(
        this.grad(this.p[A + 1], x, y - 1),
        this.grad(this.p[B + 1], x - 1, y - 1),
        u
      ),
      v
    );
  }

  /**
   * Fractal Brownian Motion (fBm) / Octave noise
   */
  fbm(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
    scale: number
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total +=
        this.noise2D((x * frequency) / scale, (y * frequency) / scale) *
        amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }

  /**
   * Turbulence (absolute value sum)
   */
  turbulence(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
    scale: number
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total +=
        Math.abs(
          this.noise2D((x * frequency) / scale, (y * frequency) / scale)
        ) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

// ============================================================================
// Texture Types
// ============================================================================

export type TextureType =
  | "brick"
  | "checker"
  | "clouds"
  | "gradient"
  | "perlinNoise"
  | "terrain"
  | "textiles"
  | "tiles";

// ============================================================================
// Brick Texture
// ============================================================================

export interface BrickSettings {
  width: number;
  height: number;
  pattern: "straight" | "block_wide" | "block" | "circle" | "edges";
  brickColor: string;
  groutColor: string;
  groutWidth: number;
  gradientEnabled: boolean;
  gradientColor: string;
  gradientSize: number;
}

export function generateBrick(
  width: number,
  height: number,
  settings: BrickSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const brickColor = hexToRgb(settings.brickColor);
  const groutColor = hexToRgb(settings.groutColor);
  const gradientColor = hexToRgb(settings.gradientColor);

  const brickWidth = Math.floor(width / settings.width);
  const brickHeight = Math.floor(height / settings.height);
  const groutW = settings.groutWidth;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate brick position
      const brickY = Math.floor(y / brickHeight);
      const localY = y % brickHeight;

      // Offset for alternating rows (standard brick pattern)
      let offset = 0;
      if (settings.pattern === "edges") {
        offset = brickY % 2 === 1 ? brickWidth / 2 : 0;
      } else if (settings.pattern === "block_wide") {
        offset = brickY % 2 === 1 ? brickWidth / 3 : 0;
      }

      const _brickX = Math.floor((x + offset) / brickWidth);
      const localX = (x + offset) % brickWidth;

      // Check if in grout
      const inGroutX = localX < groutW || localX >= brickWidth - groutW;
      const inGroutY = localY < groutW || localY >= brickHeight - groutW;

      let color: { r: number; g: number; b: number };

      if (inGroutX || inGroutY) {
        color = groutColor;
      } else {
        // Brick area
        color = { ...brickColor };

        // Apply gradient if enabled
        if (settings.gradientEnabled && settings.gradientSize > 0) {
          const distFromEdge = Math.min(
            localX - groutW,
            brickWidth - groutW - localX - 1,
            localY - groutW,
            brickHeight - groutW - localY - 1
          );
          const gradientFactor = Math.max(
            0,
            1 - distFromEdge / settings.gradientSize
          );
          color = mixColors(color, gradientColor, gradientFactor);
        }
      }

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Checker Texture
// ============================================================================

export interface CheckerSettings {
  countX: number;
  countY: number;
  color1: string;
  color2: string;
  percentage: number;
  seed: number;
}

export function generateChecker(
  width: number,
  height: number,
  settings: CheckerSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const color1 = hexToRgb(settings.color1);
  const color2 = hexToRgb(settings.color2);
  const rng = new SeededRandom(settings.seed);

  const cellWidth = width / settings.countX;
  const cellHeight = height / settings.countY;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  // Pre-calculate which cells to show (for percentage < 100)
  const showCell: boolean[][] = [];
  for (let cy = 0; cy < settings.countY; cy++) {
    showCell[cy] = [];
    for (let cx = 0; cx < settings.countX; cx++) {
      showCell[cy][cx] = rng.next() * 100 < settings.percentage;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const cellX = Math.floor(x / cellWidth);
      const cellY = Math.floor(y / cellHeight);

      const isEven = (cellX + cellY) % 2 === 0;

      let color: { r: number; g: number; b: number };

      if (settings.percentage < 100 && !showCell[cellY][cellX]) {
        color = color2; // Empty cells show color2
      } else {
        color = isEven ? color1 : color2;
      }

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Clouds Texture
// ============================================================================

export interface CloudsSettings {
  color1: string;
  color2: string;
  scale: number;
  detail: number;
  percentage: number;
  seed: number;
}

export function generateClouds(
  width: number,
  height: number,
  settings: CloudsSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const color1 = hexToRgb(settings.color1);
  const color2 = hexToRgb(settings.color2);
  const perlin = new PerlinNoise(settings.seed);

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const octaves = Math.max(1, Math.floor(settings.detail * 8));
  const persistence = 0.5 + settings.detail * 0.3;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      let noise = perlin.fbm(x, y, octaves, persistence, settings.scale * 10);

      // Normalize to 0-1 and apply percentage threshold
      noise = (noise + 1) / 2;
      noise = Math.pow(noise, 1 / settings.percentage);
      noise = Math.max(0, Math.min(1, noise));

      const color = mixColors(color1, color2, noise);

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Gradient Texture
// ============================================================================

export interface GradientStop {
  position: number; // 0-1
  color: string;
}

export interface GradientSettings {
  type: "linear" | "radial";
  stops: GradientStop[];
  angle?: number; // For linear gradient (in degrees)
}

export function generateGradient(
  width: number,
  height: number,
  settings: GradientSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Sort stops by position
  const stops = [...settings.stops].sort((a, b) => a.position - b.position);

  if (stops.length === 0) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    return canvas;
  }

  if (stops.length === 1) {
    ctx.fillStyle = stops[0].color;
    ctx.fillRect(0, 0, width, height);
    return canvas;
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const colors = stops.map((s) => hexToRgb(s.color));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      let t: number;

      if (settings.type === "radial") {
        // Radial gradient from center
        const dx = x - width / 2;
        const dy = y - height / 2;
        const maxDist = Math.sqrt(
          (width / 2) * (width / 2) + (height / 2) * (height / 2)
        );
        t = Math.sqrt(dx * dx + dy * dy) / maxDist;
      } else {
        // Linear gradient
        const angle = ((settings.angle || 0) * Math.PI) / 180;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const projectedX = (x / width - 0.5) * cos + (y / height - 0.5) * sin;
        t = projectedX + 0.5;
      }

      t = Math.max(0, Math.min(1, t));

      // Find the two stops to interpolate between
      let color: { r: number; g: number; b: number };

      if (t <= stops[0].position) {
        color = colors[0];
      } else if (t >= stops[stops.length - 1].position) {
        color = colors[colors.length - 1];
      } else {
        let i = 0;
        while (i < stops.length - 1 && stops[i + 1].position < t) {
          i++;
        }
        const localT =
          (t - stops[i].position) / (stops[i + 1].position - stops[i].position);
        color = mixColors(colors[i], colors[i + 1], localT);
      }

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Perlin Noise Texture
// ============================================================================

export interface PerlinNoiseSettings {
  color1: string;
  color2: string;
  type: "PerlinNoise" | "FractalNoise" | "Turbulence";
  octaves: number;
  scale: number;
  persistence: number;
  seed: number;
}

export function generatePerlinNoise(
  width: number,
  height: number,
  settings: PerlinNoiseSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const color1 = hexToRgb(settings.color1);
  const color2 = hexToRgb(settings.color2);
  const perlin = new PerlinNoise(settings.seed);

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      let noise: number;

      switch (settings.type) {
        case "PerlinNoise":
          noise = perlin.noise2D(x / settings.scale, y / settings.scale);
          break;
        case "FractalNoise":
          noise = perlin.fbm(
            x,
            y,
            settings.octaves,
            settings.persistence,
            settings.scale
          );
          break;
        case "Turbulence":
          noise = perlin.turbulence(
            x,
            y,
            settings.octaves,
            settings.persistence,
            settings.scale
          );
          // Turbulence is already 0-1 range
          noise = noise * 2 - 1; // Convert back to -1 to 1 for mixing
          break;
        default:
          noise = 0;
      }

      // Normalize to 0-1
      const t = (noise + 1) / 2;
      const color = mixColors(color1, color2, t);

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Terrain Texture
// ============================================================================

export interface TerrainSettings {
  scale: number;
  detail: number;
  height: number;
  seed: number;
  shadow: boolean;
  shadowIntensity: number;
  shadowDirection: { x: number; y: number };
  colored: boolean;
}

const TERRAIN_COLORS = [
  { height: 0.0, color: { r: 0, g: 0, b: 128 } }, // Deep water
  { height: 0.3, color: { r: 0, g: 100, b: 200 } }, // Water
  { height: 0.35, color: { r: 200, g: 190, b: 140 } }, // Sand
  { height: 0.45, color: { r: 34, g: 139, b: 34 } }, // Grass
  { height: 0.65, color: { r: 100, g: 80, b: 60 } }, // Mountain
  { height: 0.85, color: { r: 139, g: 137, b: 137 } }, // Rock
  { height: 1.0, color: { r: 255, g: 255, b: 255 } }, // Snow
];

export function generateTerrain(
  width: number,
  height: number,
  settings: TerrainSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const perlin = new PerlinNoise(settings.seed);

  // Generate height map
  const heightMap: number[][] = [];
  const octaves = Math.max(1, Math.floor(settings.detail * 8));

  for (let y = 0; y < height; y++) {
    heightMap[y] = [];
    for (let x = 0; x < width; x++) {
      let noise = perlin.fbm(x, y, octaves, 0.5, settings.scale * 10);
      noise = (noise + 1) / 2; // Normalize to 0-1
      noise = Math.pow(noise, 1 / settings.height); // Apply height exponent
      heightMap[y][x] = noise;
    }
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const h = heightMap[y][x];

      let color: { r: number; g: number; b: number };

      if (settings.colored) {
        // Find terrain color based on height
        let i = 0;
        while (
          i < TERRAIN_COLORS.length - 1 &&
          TERRAIN_COLORS[i + 1].height < h
        ) {
          i++;
        }

        if (i >= TERRAIN_COLORS.length - 1) {
          color = TERRAIN_COLORS[TERRAIN_COLORS.length - 1].color;
        } else {
          const t =
            (h - TERRAIN_COLORS[i].height) /
            (TERRAIN_COLORS[i + 1].height - TERRAIN_COLORS[i].height);
          color = mixColors(
            TERRAIN_COLORS[i].color,
            TERRAIN_COLORS[i + 1].color,
            t
          );
        }
      } else {
        // Grayscale
        const gray = Math.floor(h * 255);
        color = { r: gray, g: gray, b: gray };
      }

      // Apply shadow
      if (settings.shadow) {
        const sx = Math.floor(x + settings.shadowDirection.x);
        const sy = Math.floor(y + settings.shadowDirection.y);

        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const neighborHeight = heightMap[sy][sx];
          if (neighborHeight > h) {
            const shadowFactor = 1 - (neighborHeight - h) * settings.shadowIntensity;
            color = {
              r: Math.floor(color.r * shadowFactor),
              g: Math.floor(color.g * shadowFactor),
              b: Math.floor(color.b * shadowFactor),
            };
          }
        }
      }

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Tiles Texture
// ============================================================================

export interface TilesSettings {
  countX: number;
  countY: number;
  tileColor: string;
  groutColor: string;
  groutWidth: { x: number; y: number };
  gradientEnabled: boolean;
  gradientColor: string;
  gradientSize: { x: number; y: number };
}

export function generateTiles(
  width: number,
  height: number,
  settings: TilesSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const tileColor = hexToRgb(settings.tileColor);
  const groutColor = hexToRgb(settings.groutColor);
  const gradientColor = hexToRgb(settings.gradientColor);

  const tileWidth = width / settings.countX;
  const tileHeight = height / settings.countY;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const localX = x % tileWidth;
      const localY = y % tileHeight;

      // Check if in grout
      const inGroutX =
        localX < settings.groutWidth.x ||
        localX >= tileWidth - settings.groutWidth.x;
      const inGroutY =
        localY < settings.groutWidth.y ||
        localY >= tileHeight - settings.groutWidth.y;

      let color: { r: number; g: number; b: number };

      if (inGroutX || inGroutY) {
        color = groutColor;
      } else {
        color = { ...tileColor };

        // Apply gradient if enabled
        if (settings.gradientEnabled) {
          const distFromEdgeX = Math.min(
            localX - settings.groutWidth.x,
            tileWidth - settings.groutWidth.x - localX - 1
          );
          const distFromEdgeY = Math.min(
            localY - settings.groutWidth.y,
            tileHeight - settings.groutWidth.y - localY - 1
          );

          const gradientFactorX =
            settings.gradientSize.x > 0
              ? Math.max(0, 1 - distFromEdgeX / settings.gradientSize.x)
              : 0;
          const gradientFactorY =
            settings.gradientSize.y > 0
              ? Math.max(0, 1 - distFromEdgeY / settings.gradientSize.y)
              : 0;

          const gradientFactor = Math.max(gradientFactorX, gradientFactorY);
          color = mixColors(color, gradientColor, gradientFactor);
        }
      }

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Textiles Texture
// ============================================================================

export interface TextilesSettings {
  color1: string;
  color2: string;
  isDouble: boolean;
  tightness: number;
  thickness: number;
  smoothness: number;
  offset: number;
  depth: number;
}

export function generateTextiles(
  width: number,
  height: number,
  settings: TextilesSettings
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const color1 = hexToRgb(settings.color1);
  const color2 = hexToRgb(settings.color2);

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  const spacing = settings.tightness;
  const thickness = settings.thickness;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Weave pattern
      const warpPhase = Math.floor(x / spacing) % 2;
      const weftPhase = Math.floor(y / spacing) % 2;

      // Calculate thread positions
      const xInCell = x % spacing;
      const yInCell = y % spacing;

      const isWarp = xInCell < thickness;
      const isWeft = yInCell < thickness;

      let color: { r: number; g: number; b: number };
      let depth = 1.0;

      if (isWarp && isWeft) {
        // Intersection - determine which thread is on top
        const warpOnTop = (warpPhase + weftPhase) % 2 === 0;
        color = warpOnTop ? color1 : color2;
        depth = 1.0 - settings.depth * 0.3;
      } else if (isWarp) {
        color = color1;
        depth = 1.0 - settings.depth * 0.1 * (weftPhase === 0 ? 1 : 0.5);
      } else if (isWeft) {
        color = color2;
        depth = 1.0 - settings.depth * 0.1 * (warpPhase === 0 ? 0.5 : 1);
      } else {
        // Gap between threads - show background
        color = mixColors(color1, color2, 0.5);
        depth = 1.0 - settings.depth;
      }

      // Apply depth shading
      color = {
        r: Math.floor(color.r * depth),
        g: Math.floor(color.g * depth),
        b: Math.floor(color.b * depth),
      };

      data[idx] = color.r;
      data[idx + 1] = color.g;
      data[idx + 2] = color.b;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============================================================================
// Main Generator Class
// ============================================================================

export class ProceduralTextureGenerator {
  private width: number = 512;
  private height: number = 512;

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  generateBrick(settings: BrickSettings): HTMLCanvasElement {
    return generateBrick(this.width, this.height, settings);
  }

  generateChecker(settings: CheckerSettings): HTMLCanvasElement {
    return generateChecker(this.width, this.height, settings);
  }

  generateClouds(settings: CloudsSettings): HTMLCanvasElement {
    return generateClouds(this.width, this.height, settings);
  }

  generateGradient(settings: GradientSettings): HTMLCanvasElement {
    return generateGradient(this.width, this.height, settings);
  }

  generatePerlinNoise(settings: PerlinNoiseSettings): HTMLCanvasElement {
    return generatePerlinNoise(this.width, this.height, settings);
  }

  generateTerrain(settings: TerrainSettings): HTMLCanvasElement {
    return generateTerrain(this.width, this.height, settings);
  }

  generateTiles(settings: TilesSettings): HTMLCanvasElement {
    return generateTiles(this.width, this.height, settings);
  }

  generateTextiles(settings: TextilesSettings): HTMLCanvasElement {
    return generateTextiles(this.width, this.height, settings);
  }
}

export default ProceduralTextureGenerator;

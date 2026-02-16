/**
 * TextureGenerator Store
 * Zustand store for procedural texture generation state
 *
 * Based on original TextureGenerator-Online by Christian Petry (MIT 2014)
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  BrickSettings,
  CheckerSettings,
  CloudsSettings,
  GradientSettings,
  PerlinNoiseSettings,
  TerrainSettings,
  TilesSettings,
  TextilesSettings,
} from "@/lib/generators";

export type ProceduralTextureType =
  | "brick"
  | "checker"
  | "clouds"
  | "gradient"
  | "perlinNoise"
  | "terrain"
  | "tiles"
  | "textiles";

export interface TextureGeneratorState {
  // Current texture type
  currentType: ProceduralTextureType;

  // Generated texture canvas
  generatedTexture: HTMLCanvasElement | null;

  // Texture size
  textureWidth: number;
  textureHeight: number;

  // Settings for each texture type
  brickSettings: BrickSettings;
  checkerSettings: CheckerSettings;
  cloudsSettings: CloudsSettings;
  gradientSettings: GradientSettings;
  perlinNoiseSettings: PerlinNoiseSettings;
  terrainSettings: TerrainSettings;
  tilesSettings: TilesSettings;
  textilesSettings: TextilesSettings;

  // Export settings
  exportFilename: string;
  exportFormat: "png" | "jpg" | "tiff";
  exportJpgQuality: number;

  // Actions
  setCurrentType: (type: ProceduralTextureType) => void;
  setGeneratedTexture: (canvas: HTMLCanvasElement | null) => void;
  setTextureSize: (width: number, height: number) => void;
  setBrickSettings: (settings: Partial<BrickSettings>) => void;
  setCheckerSettings: (settings: Partial<CheckerSettings>) => void;
  setCloudsSettings: (settings: Partial<CloudsSettings>) => void;
  setGradientSettings: (settings: Partial<GradientSettings>) => void;
  setPerlinNoiseSettings: (settings: Partial<PerlinNoiseSettings>) => void;
  setTerrainSettings: (settings: Partial<TerrainSettings>) => void;
  setTilesSettings: (settings: Partial<TilesSettings>) => void;
  setTextilesSettings: (settings: Partial<TextilesSettings>) => void;
  setExportFilename: (filename: string) => void;
  setExportFormat: (format: "png" | "jpg" | "tiff") => void;
  setExportJpgQuality: (quality: number) => void;
}

// Default settings
const defaultBrickSettings: BrickSettings = {
  width: 6,
  height: 6,
  pattern: "edges",
  brickColor: "#b85c38",
  groutColor: "#666666",
  groutWidth: 6,
  gradientEnabled: true,
  gradientColor: "#8b4726",
  gradientSize: 3,
};

const defaultCheckerSettings: CheckerSettings = {
  countX: 6,
  countY: 6,
  color1: "#ffffff",
  color2: "#000000",
  percentage: 100,
  seed: 1,
};

const defaultCloudsSettings: CloudsSettings = {
  color1: "#ffffff",
  color2: "#87ceeb",
  scale: 7,
  detail: 0.45,
  percentage: 0.6,
  seed: 1,
};

const defaultGradientSettings: GradientSettings = {
  type: "radial",
  stops: [
    { position: 0, color: "#ff0000" },
    { position: 0.5, color: "#00ff00" },
    { position: 1, color: "#0000ff" },
  ],
  angle: 0,
};

const defaultPerlinNoiseSettings: PerlinNoiseSettings = {
  color1: "#000000",
  color2: "#ffffff",
  type: "FractalNoise",
  octaves: 6,
  scale: 50,
  persistence: 0.5,
  seed: 1,
};

const defaultTerrainSettings: TerrainSettings = {
  scale: 7,
  detail: 0.45,
  height: 0.7,
  seed: 1,
  shadow: true,
  shadowIntensity: 2,
  shadowDirection: { x: 5, y: 5 },
  colored: true,
};

const defaultTilesSettings: TilesSettings = {
  countX: 2,
  countY: 2,
  tileColor: "#d4c4a8",
  groutColor: "#666666",
  groutWidth: { x: 8, y: 8 },
  gradientEnabled: true,
  gradientColor: "#b8a888",
  gradientSize: { x: 15, y: 15 },
};

const defaultTextilesSettings: TextilesSettings = {
  color1: "#1e3a5f",
  color2: "#c4a35a",
  isDouble: false,
  tightness: 8,
  thickness: 4,
  smoothness: 0.5,
  offset: 0,
  depth: 0.3,
};

export const useTextureGeneratorStore = create<TextureGeneratorState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    currentType: "perlinNoise",
    generatedTexture: null,
    textureWidth: 512,
    textureHeight: 512,

    // Default settings
    brickSettings: { ...defaultBrickSettings },
    checkerSettings: { ...defaultCheckerSettings },
    cloudsSettings: { ...defaultCloudsSettings },
    gradientSettings: { ...defaultGradientSettings },
    perlinNoiseSettings: { ...defaultPerlinNoiseSettings },
    terrainSettings: { ...defaultTerrainSettings },
    tilesSettings: { ...defaultTilesSettings },
    textilesSettings: { ...defaultTextilesSettings },

    // Export settings
    exportFilename: "texture",
    exportFormat: "png",
    exportJpgQuality: 0.95,

    // Actions
    setCurrentType: (type) => set({ currentType: type }),
    setGeneratedTexture: (canvas) => set({ generatedTexture: canvas }),
    setTextureSize: (width, height) =>
      set({ textureWidth: width, textureHeight: height }),

    setBrickSettings: (settings) =>
      set((state) => ({
        brickSettings: { ...state.brickSettings, ...settings },
      })),

    setCheckerSettings: (settings) =>
      set((state) => ({
        checkerSettings: { ...state.checkerSettings, ...settings },
      })),

    setCloudsSettings: (settings) =>
      set((state) => ({
        cloudsSettings: { ...state.cloudsSettings, ...settings },
      })),

    setGradientSettings: (settings) =>
      set((state) => ({
        gradientSettings: { ...state.gradientSettings, ...settings },
      })),

    setPerlinNoiseSettings: (settings) =>
      set((state) => ({
        perlinNoiseSettings: { ...state.perlinNoiseSettings, ...settings },
      })),

    setTerrainSettings: (settings) =>
      set((state) => ({
        terrainSettings: { ...state.terrainSettings, ...settings },
      })),

    setTilesSettings: (settings) =>
      set((state) => ({
        tilesSettings: { ...state.tilesSettings, ...settings },
      })),

    setTextilesSettings: (settings) =>
      set((state) => ({
        textilesSettings: { ...state.textilesSettings, ...settings },
      })),

    setExportFilename: (filename) => set({ exportFilename: filename }),
    setExportFormat: (format) => set({ exportFormat: format }),
    setExportJpgQuality: (quality) => set({ exportJpgQuality: quality }),
  }))
);

export default useTextureGeneratorStore;

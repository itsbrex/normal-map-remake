/**
 * Texture Store
 * Zustand state management for texture generation settings
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { FalloffType } from "@/lib/shaders";

// Texture types enum matching original
export enum TextureType {
  Normal = 0,
  Displacement = 1,
  AmbientOcclusion = 2,
  Specular = 3,
}

// Normal map mode - height map or pictures (4 directional images)
export type NormalMapMode = "height" | "pictures";

// Edge detection algorithm type
export type EdgeDetectionType = "sobel" | "scharr";

// Export file format
export type ExportFormat = "png" | "jpg" | "tiff";

// Normal map generation settings
export interface NormalSettings {
  strength: number; // default 2.5
  level: number; // default 7
  smoothing: number; // default 0
  type: EdgeDetectionType; // default "sobel"
  invertR: boolean; // default false
  invertG: boolean; // default false
  invertSource: boolean; // default false
  heightOffset: boolean; // default true
}

// Displacement map settings
export interface DisplacementSettings {
  contrast: number; // default -0.5
  smoothing: number; // default 0
  invert: boolean; // default false
}

// Ambient occlusion settings
export interface AmbientOcclusionSettings {
  strength: number; // default 0.5
  mean: number; // default 1
  range: number; // default 1
  smoothing: number; // default 0
  level: number; // default 1
  invert: boolean; // default false
}

// Specular map settings
export interface SpecularSettings {
  strength: number; // default 1
  mean: number; // default 1
  range: number; // default 1
  falloff: FalloffType; // default Linear
  invert: boolean; // default false
}

// Export settings
export interface ExportSettings {
  format: ExportFormat;
  jpgQuality: number; // 0-100, default 90
  pngTransparency: number; // 0-100, default 100
  filename: string;
}

// Source images for pictures mode
export interface PicturesSource {
  above: HTMLImageElement | null;
  below: HTMLImageElement | null;
  left: HTMLImageElement | null;
  right: HTMLImageElement | null;
}

// Generated texture outputs
export interface GeneratedTextures {
  normal: HTMLCanvasElement | null;
  displacement: HTMLCanvasElement | null;
  ambientOcclusion: HTMLCanvasElement | null;
  specular: HTMLCanvasElement | null;
}

// Loading states for each texture type
export interface LoadingState {
  normal: boolean;
  displacement: boolean;
  ambientOcclusion: boolean;
  specular: boolean;
}

// Error state
export interface ErrorState {
  message: string | null;
  type: "normal" | "displacement" | "ambientOcclusion" | "specular" | "general" | null;
}

// Main store state
export interface TextureState {
  // App state
  autoUpdate: boolean;
  currentTexture: TextureType;
  normalMapMode: NormalMapMode;

  // Source images
  heightMap: HTMLImageElement | null;
  heightMapDimensions: { width: number; height: number };
  picturesSource: PicturesSource;

  // Settings per texture type
  normalSettings: NormalSettings;
  displacementSettings: DisplacementSettings;
  ambientOcclusionSettings: AmbientOcclusionSettings;
  specularSettings: SpecularSettings;

  // Export settings
  exportSettings: ExportSettings;

  // Generated textures (canvas elements)
  generatedTextures: GeneratedTextures;

  // Loading and error states
  loading: LoadingState;
  error: ErrorState;

  // Actions
  setAutoUpdate: (enabled: boolean) => void;
  setCurrentTexture: (type: TextureType) => void;
  setNormalMapMode: (mode: NormalMapMode) => void;

  // Source image actions
  setHeightMap: (image: HTMLImageElement | null) => void;
  setPicturesSource: (source: Partial<PicturesSource>) => void;

  // Settings actions
  setNormalSettings: (settings: Partial<NormalSettings>) => void;
  setDisplacementSettings: (settings: Partial<DisplacementSettings>) => void;
  setAmbientOcclusionSettings: (
    settings: Partial<AmbientOcclusionSettings>
  ) => void;
  setSpecularSettings: (settings: Partial<SpecularSettings>) => void;
  setExportSettings: (settings: Partial<ExportSettings>) => void;

  // Reset actions
  resetNormalSettings: () => void;
  resetDisplacementSettings: () => void;
  resetAmbientOcclusionSettings: () => void;
  resetSpecularSettings: () => void;

  // Generated texture actions
  setGeneratedTexture: (
    type: keyof GeneratedTextures,
    canvas: HTMLCanvasElement | null
  ) => void;

  // Loading and error actions
  setLoading: (type: keyof LoadingState, isLoading: boolean) => void;
  setError: (error: ErrorState) => void;
  clearError: () => void;
}

// Default values matching original app
const DEFAULT_NORMAL_SETTINGS: NormalSettings = {
  strength: 2.5,
  level: 7,
  smoothing: 0,
  type: "sobel",
  invertR: false,
  invertG: false,
  invertSource: false,
  heightOffset: true,
};

const DEFAULT_DISPLACEMENT_SETTINGS: DisplacementSettings = {
  contrast: -0.5,
  smoothing: 0,
  invert: false,
};

const DEFAULT_AMBIENT_OCCLUSION_SETTINGS: AmbientOcclusionSettings = {
  strength: 0.5,
  mean: 1,
  range: 1,
  smoothing: 0,
  level: 1,
  invert: false,
};

const DEFAULT_SPECULAR_SETTINGS: SpecularSettings = {
  strength: 1,
  mean: 1,
  range: 1,
  falloff: FalloffType.Linear,
  invert: false,
};

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  format: "png",
  jpgQuality: 90,
  pngTransparency: 100,
  filename: "",
};

export const useTextureStore = create<TextureState>()(
  subscribeWithSelector((set) => ({
    // Initial app state
    autoUpdate: true,
    currentTexture: TextureType.Normal,
    normalMapMode: "height",

    // Source images
    heightMap: null,
    heightMapDimensions: { width: 0, height: 0 },
    picturesSource: {
      above: null,
      below: null,
      left: null,
      right: null,
    },

    // Settings
    normalSettings: { ...DEFAULT_NORMAL_SETTINGS },
    displacementSettings: { ...DEFAULT_DISPLACEMENT_SETTINGS },
    ambientOcclusionSettings: { ...DEFAULT_AMBIENT_OCCLUSION_SETTINGS },
    specularSettings: { ...DEFAULT_SPECULAR_SETTINGS },
    exportSettings: { ...DEFAULT_EXPORT_SETTINGS },

    // Generated textures
    generatedTextures: {
      normal: null,
      displacement: null,
      ambientOcclusion: null,
      specular: null,
    },

    // Loading and error states
    loading: {
      normal: false,
      displacement: false,
      ambientOcclusion: false,
      specular: false,
    },
    error: {
      message: null,
      type: null,
    },

    // Actions
    setAutoUpdate: (enabled) => set({ autoUpdate: enabled }),

    setCurrentTexture: (type) => set({ currentTexture: type }),

    setNormalMapMode: (mode) => set({ normalMapMode: mode }),

    setHeightMap: (image) =>
      set({
        heightMap: image,
        heightMapDimensions: image
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : { width: 0, height: 0 },
      }),

    setPicturesSource: (source) =>
      set((state) => ({
        picturesSource: { ...state.picturesSource, ...source },
      })),

    setNormalSettings: (settings) =>
      set((state) => ({
        normalSettings: { ...state.normalSettings, ...settings },
      })),

    setDisplacementSettings: (settings) =>
      set((state) => ({
        displacementSettings: { ...state.displacementSettings, ...settings },
      })),

    setAmbientOcclusionSettings: (settings) =>
      set((state) => ({
        ambientOcclusionSettings: {
          ...state.ambientOcclusionSettings,
          ...settings,
        },
      })),

    setSpecularSettings: (settings) =>
      set((state) => ({
        specularSettings: { ...state.specularSettings, ...settings },
      })),

    setExportSettings: (settings) =>
      set((state) => ({
        exportSettings: { ...state.exportSettings, ...settings },
      })),

    resetNormalSettings: () =>
      set({ normalSettings: { ...DEFAULT_NORMAL_SETTINGS } }),

    resetDisplacementSettings: () =>
      set({ displacementSettings: { ...DEFAULT_DISPLACEMENT_SETTINGS } }),

    resetAmbientOcclusionSettings: () =>
      set({
        ambientOcclusionSettings: { ...DEFAULT_AMBIENT_OCCLUSION_SETTINGS },
      }),

    resetSpecularSettings: () =>
      set({ specularSettings: { ...DEFAULT_SPECULAR_SETTINGS } }),

    setGeneratedTexture: (type, canvas) =>
      set((state) => ({
        generatedTextures: { ...state.generatedTextures, [type]: canvas },
      })),

    setLoading: (type, isLoading) =>
      set((state) => ({
        loading: { ...state.loading, [type]: isLoading },
      })),

    setError: (error) => set({ error }),

    clearError: () => set({ error: { message: null, type: null } }),
  }))
);

// Selector hooks for common patterns
export const useNormalSettings = () =>
  useTextureStore((state) => state.normalSettings);
export const useDisplacementSettings = () =>
  useTextureStore((state) => state.displacementSettings);
export const useAmbientOcclusionSettings = () =>
  useTextureStore((state) => state.ambientOcclusionSettings);
export const useSpecularSettings = () =>
  useTextureStore((state) => state.specularSettings);
export const useHeightMap = () =>
  useTextureStore((state) => state.heightMap);
export const useCurrentTexture = () =>
  useTextureStore((state) => state.currentTexture);
export const useAutoUpdate = () =>
  useTextureStore((state) => state.autoUpdate);
export const useLoading = () =>
  useTextureStore((state) => state.loading);
export const useError = () =>
  useTextureStore((state) => state.error);

export default useTextureStore;

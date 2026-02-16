/**
 * Texture Generators Barrel Export
 */

export {
  NormalMapGenerator,
  generateNormalMap,
  generateNormalMapFromPictures,
  defaultNormalMapSettings,
} from "./NormalMapGenerator";
export type { NormalMapSettings } from "./NormalMapGenerator";

export {
  DisplacementGenerator,
  generateDisplacementMap,
  defaultDisplacementSettings,
} from "./DisplacementGenerator";
export type { DisplacementSettings } from "./DisplacementGenerator";

export {
  AmbientOcclusionGenerator,
  generateAmbientOcclusionMap,
  defaultAmbientOcclusionSettings,
} from "./AmbientOcclusionGenerator";
export type { AmbientOcclusionSettings } from "./AmbientOcclusionGenerator";

export {
  SpecularGenerator,
  generateSpecularMap,
  defaultSpecularSettings,
  FalloffType,
} from "./SpecularGenerator";
export type { SpecularSettings } from "./SpecularGenerator";

export {
  ProceduralTextureGenerator,
  generateBrick,
  generateChecker,
  generateClouds,
  generateGradient,
  generatePerlinNoise,
  generateTerrain,
  generateTiles,
  generateTextiles,
} from "./ProceduralTextures";
export type {
  TextureType,
  BrickSettings,
  CheckerSettings,
  CloudsSettings,
  GradientSettings,
  GradientStop,
  PerlinNoiseSettings,
  TerrainSettings,
  TilesSettings,
  TextilesSettings,
} from "./ProceduralTextures";

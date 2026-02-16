/**
 * Shader Barrel Export
 * All GLSL shaders for texture generation
 */

// Normal Map Generation
export {
  NormalMapShader,
  createNormalMapUniforms,
  calculateDz,
  type NormalMapUniforms,
} from "./NormalMapShader";

export {
  NormalMapFromPicturesShader,
  createNormalMapFromPicturesUniforms,
  type NormalMapFromPicturesUniforms,
} from "./NormalMapFromPicturesShader";

export {
  NormalToHeightShader,
  createNormalToHeightUniforms,
  type NormalToHeightUniforms,
} from "./NormalToHeightShader";

// Displacement Map
export {
  DisplacementShader,
  createDisplacementUniforms,
  type DisplacementUniforms,
} from "./DisplacementShader";

// Ambient Occlusion
export {
  AmbientOcclusionShader,
  createAmbientOcclusionUniforms,
  type AmbientOcclusionUniforms,
} from "./AmbientOcclusionShader";

// Specular Map
export {
  SpecularShader,
  createSpecularUniforms,
  FalloffType,
  type SpecularUniforms,
} from "./SpecularShader";

// Blur Shaders (for post-processing)
export {
  HorizontalBlurShader,
  VerticalBlurShader,
  createHorizontalBlurUniforms,
  createVerticalBlurUniforms,
  type HorizontalBlurUniforms,
  type VerticalBlurUniforms,
} from "./BlurShaders";

// Utility Shaders
export {
  CopyShader,
  createCopyUniforms,
  type CopyUniforms,
} from "./CopyShader";

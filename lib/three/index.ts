/**
 * Three.js Module Barrel Export
 * Scene management and texture rendering utilities
 */

// Scene Management
export {
  TextureSceneManager,
  PreviewSceneManager,
  createOrthographicCamera,
  createPerspectiveCamera,
  createTextureRenderer,
  createPreviewRenderer,
  createRenderPlane,
  createRenderTargetParams,
  createRenderTexture,
  setupPreviewLighting,
  createOrbitControls,
  createModelGeometry,
  createPreviewMesh,
  type TextureSceneConfig,
  type PreviewSceneConfig,
  type PreviewModel,
} from "./SceneManager";

// Texture Renderers
export {
  NormalMapRenderer,
  NormalMapFromPicturesRenderer,
  DisplacementMapRenderer,
  AmbientOcclusionMapRenderer,
  SpecularMapRenderer,
  type TextureRenderConfig,
} from "./TextureRenderer";

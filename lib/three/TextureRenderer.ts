/**
 * Texture Renderer
 * Post-processing pipeline for texture generation using EffectComposer
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

import {
  NormalMapShader,
  NormalMapFromPicturesShader,
  DisplacementShader,
  AmbientOcclusionShader,
  SpecularShader,
  HorizontalBlurShader,
  VerticalBlurShader,
  createNormalMapUniforms,
  createNormalMapFromPicturesUniforms,
  createDisplacementUniforms,
  createAmbientOcclusionUniforms,
  createSpecularUniforms,
  createHorizontalBlurUniforms,
  createVerticalBlurUniforms,
  calculateDz,
  type NormalMapUniforms,
  type NormalMapFromPicturesUniforms,
  type DisplacementUniforms,
  type AmbientOcclusionUniforms,
  type SpecularUniforms,
} from "../shaders";

import type { NormalSettings, DisplacementSettings, AmbientOcclusionSettings, SpecularSettings } from "../../stores/textureStore";

/**
 * Configuration for texture rendering
 */
export interface TextureRenderConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Base class for texture renderers
 */
abstract class BaseTextureRenderer {
  protected renderer: THREE.WebGLRenderer;
  protected camera: THREE.OrthographicCamera;
  protected scene: THREE.Scene;
  protected composer: EffectComposer;
  protected renderPass: RenderPass;
  protected blurPassH: ShaderPass;
  protected blurPassV: ShaderPass;
  protected mesh: THREE.Mesh;
  protected material: THREE.ShaderMaterial;

  constructor(config: TextureRenderConfig) {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(config.width, config.height);
    this.renderer.setClearColor(0x000000, 0);

    // Create orthographic camera for texture rendering
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);

    // Create scene
    this.scene = new THREE.Scene();

    // Create render plane
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    this.material = this.createMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = "renderPlane";
    this.scene.add(this.mesh);

    // Create render target
    const renderTarget = new THREE.WebGLRenderTarget(config.width, config.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    });

    // Create effect composer
    this.composer = new EffectComposer(this.renderer, renderTarget);

    // Add render pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // Add blur passes (used for smoothing/sharpening)
    this.blurPassV = new ShaderPass({
      name: VerticalBlurShader.name,
      uniforms: createVerticalBlurUniforms(),
      vertexShader: VerticalBlurShader.vertexShader,
      fragmentShader: VerticalBlurShader.fragmentShader,
    });
    this.blurPassH = new ShaderPass({
      name: HorizontalBlurShader.name,
      uniforms: createHorizontalBlurUniforms(),
      vertexShader: HorizontalBlurShader.vertexShader,
      fragmentShader: HorizontalBlurShader.fragmentShader,
    });
    this.blurPassH.renderToScreen = true;

    this.composer.addPass(this.blurPassV);
    this.composer.addPass(this.blurPassH);
  }

  protected abstract createMaterial(): THREE.ShaderMaterial;

  /**
   * Updates the blur/sharpen amount
   */
  setSmoothing(smoothing: number, width: number, height: number): void {
    this.blurPassV.uniforms.v.value = smoothing / width / 5;
    this.blurPassH.uniforms.h.value = smoothing / height / 5;
  }

  /**
   * Resizes the renderer and render target
   */
  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
    });
    this.composer.reset(renderTarget);
  }

  /**
   * Renders the texture
   */
  render(): void {
    this.composer.render(1 / 60);
  }

  /**
   * Disposes of resources
   */
  dispose(): void {
    this.renderer.dispose();
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

/**
 * Normal Map Renderer
 * Generates normal maps from height maps using Sobel/Scharr edge detection
 */
export class NormalMapRenderer extends BaseTextureRenderer {
  private uniforms: NormalMapUniforms;
  private heightTexture: THREE.Texture;

  constructor(config: TextureRenderConfig) {
    super(config);
    this.uniforms = this.material.uniforms as unknown as NormalMapUniforms;
    this.heightTexture = new THREE.Texture();
    this.heightTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.heightTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.heightTexture.minFilter = THREE.NearestFilter;
    this.heightTexture.magFilter = THREE.NearestFilter;
    this.heightTexture.anisotropy = 2;
  }

  protected createMaterial(): THREE.ShaderMaterial {
    const uniforms = createNormalMapUniforms();
    return new THREE.ShaderMaterial({
      name: NormalMapShader.name,
      uniforms,
      vertexShader: NormalMapShader.vertexShader,
      fragmentShader: NormalMapShader.fragmentShader,
      transparent: true,
    });
  }

  /**
   * Sets the height map image
   */
  setHeightMap(image: HTMLImageElement): void {
    this.heightTexture.image = image;
    this.heightTexture.needsUpdate = true;
    this.uniforms.tHeightMap.value = this.heightTexture;
    this.uniforms.dimensions.value.set(
      image.naturalWidth,
      image.naturalHeight,
      0
    );
  }

  /**
   * Updates settings from store
   */
  updateSettings(settings: NormalSettings): void {
    // Calculate dz from strength and level
    this.uniforms.dz.value = calculateDz(settings.strength, settings.level);

    // Set edge detection type (0 = Sobel, 1 = Scharr)
    this.uniforms.type.value = settings.type === "sobel" ? 0 : 1;

    // Set inversion flags
    this.uniforms.invertR.value = settings.invertR ? -1 : 1;
    this.uniforms.invertG.value = settings.invertG ? -1 : 1;
    this.uniforms.invertH.value = settings.invertSource ? -1 : 1;

    // Height offset
    this.uniforms.heightOffset.value = settings.heightOffset ? 0 : 1;
  }
}

/**
 * Normal Map From Pictures Renderer
 * Generates normal maps from 4 directional images
 */
export class NormalMapFromPicturesRenderer extends BaseTextureRenderer {
  private uniforms: NormalMapFromPicturesUniforms;
  private textures: {
    above: THREE.Texture;
    below: THREE.Texture;
    left: THREE.Texture;
    right: THREE.Texture;
  };

  constructor(config: TextureRenderConfig) {
    super(config);
    this.uniforms = this.material.uniforms as unknown as NormalMapFromPicturesUniforms;

    // Create textures for all 4 directions
    const createDirTexture = (): THREE.Texture => {
      const tex = new THREE.Texture();
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.anisotropy = 2;
      return tex;
    };

    this.textures = {
      above: createDirTexture(),
      below: createDirTexture(),
      left: createDirTexture(),
      right: createDirTexture(),
    };
  }

  protected createMaterial(): THREE.ShaderMaterial {
    const uniforms = createNormalMapFromPicturesUniforms();
    return new THREE.ShaderMaterial({
      name: NormalMapFromPicturesShader.name,
      uniforms,
      vertexShader: NormalMapFromPicturesShader.vertexShader,
      fragmentShader: NormalMapFromPicturesShader.fragmentShader,
      transparent: true,
    });
  }

  /**
   * Sets the directional images
   */
  setImages(images: {
    above?: HTMLImageElement;
    below?: HTMLImageElement;
    left?: HTMLImageElement;
    right?: HTMLImageElement;
  }): void {
    if (images.above) {
      this.textures.above.image = images.above;
      this.textures.above.needsUpdate = true;
      this.uniforms.tAbove.value = this.textures.above;
      this.uniforms.dimensions.value.set(
        images.above.naturalWidth,
        images.above.naturalHeight,
        0
      );
    }
    if (images.below) {
      this.textures.below.image = images.below;
      this.textures.below.needsUpdate = true;
      this.uniforms.tBelow.value = this.textures.below;
    }
    if (images.left) {
      this.textures.left.image = images.left;
      this.textures.left.needsUpdate = true;
      this.uniforms.tLeft.value = this.textures.left;
    }
    if (images.right) {
      this.textures.right.image = images.right;
      this.textures.right.needsUpdate = true;
      this.uniforms.tRight.value = this.textures.right;
    }
  }

  /**
   * Updates settings
   */
  updateSettings(settings: NormalSettings): void {
    this.uniforms.dz.value = calculateDz(settings.strength, settings.level);
    this.uniforms.invertR.value = settings.invertR ? -1 : 1;
    this.uniforms.invertG.value = settings.invertG ? -1 : 1;
    this.uniforms.invertH.value = settings.invertSource ? -1 : 1;
    this.uniforms.heightOffset.value = settings.heightOffset ? 0 : 1;
  }
}

/**
 * Displacement Map Renderer
 */
export class DisplacementMapRenderer extends BaseTextureRenderer {
  private uniforms: DisplacementUniforms;
  private heightTexture: THREE.Texture;

  constructor(config: TextureRenderConfig) {
    super(config);
    this.uniforms = this.material.uniforms as unknown as DisplacementUniforms;
    this.heightTexture = new THREE.Texture();
    this.heightTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.heightTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.heightTexture.minFilter = THREE.NearestFilter;
    this.heightTexture.magFilter = THREE.NearestFilter;
    this.heightTexture.anisotropy = 2;
  }

  protected createMaterial(): THREE.ShaderMaterial {
    const uniforms = createDisplacementUniforms();
    return new THREE.ShaderMaterial({
      name: DisplacementShader.name,
      uniforms,
      vertexShader: DisplacementShader.vertexShader,
      fragmentShader: DisplacementShader.fragmentShader,
      transparent: true,
    });
  }

  setHeightMap(image: HTMLImageElement | ImageData, flipY: boolean = false): void {
    this.heightTexture.image = image as TexImageSource;
    this.heightTexture.needsUpdate = true;
    this.uniforms.tHeight.value = this.heightTexture;
    this.uniforms.flipY.value = flipY ? 1 : 0;
  }

  updateSettings(settings: DisplacementSettings): void {
    this.uniforms.contrast.value = settings.contrast;
    this.uniforms.invert.value = settings.invert ? 1 : 0;
  }
}

/**
 * Ambient Occlusion Map Renderer
 */
export class AmbientOcclusionMapRenderer extends BaseTextureRenderer {
  private uniforms: AmbientOcclusionUniforms;
  private heightTexture: THREE.Texture;

  constructor(config: TextureRenderConfig) {
    super(config);
    this.uniforms = this.material.uniforms as unknown as AmbientOcclusionUniforms;
    this.heightTexture = new THREE.Texture();
    this.heightTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.heightTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.heightTexture.minFilter = THREE.NearestFilter;
    this.heightTexture.magFilter = THREE.NearestFilter;
    this.heightTexture.anisotropy = 2;
  }

  protected createMaterial(): THREE.ShaderMaterial {
    const uniforms = createAmbientOcclusionUniforms();
    return new THREE.ShaderMaterial({
      name: AmbientOcclusionShader.name,
      uniforms,
      vertexShader: AmbientOcclusionShader.vertexShader,
      fragmentShader: AmbientOcclusionShader.fragmentShader,
      transparent: true,
    });
  }

  setHeightMap(image: HTMLImageElement | ImageData, flipY: boolean = false): void {
    this.heightTexture.image = image as TexImageSource;
    this.heightTexture.needsUpdate = true;
    this.uniforms.tHeight.value = this.heightTexture;
    this.uniforms.flipY.value = flipY ? 1 : 0;
  }

  updateSettings(settings: AmbientOcclusionSettings): void {
    this.uniforms.strength.value = settings.strength;
    this.uniforms.mean.value = settings.mean;
    this.uniforms.range.value = settings.range;
    this.uniforms.level.value = settings.level;
    this.uniforms.invert.value = settings.invert ? 1 : 0;
  }
}

/**
 * Specular Map Renderer
 */
export class SpecularMapRenderer extends BaseTextureRenderer {
  private uniforms: SpecularUniforms;
  private heightTexture: THREE.Texture;

  constructor(config: TextureRenderConfig) {
    super(config);
    this.uniforms = this.material.uniforms as unknown as SpecularUniforms;
    this.heightTexture = new THREE.Texture();
    this.heightTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.heightTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.heightTexture.minFilter = THREE.NearestFilter;
    this.heightTexture.magFilter = THREE.NearestFilter;
    this.heightTexture.anisotropy = 2;
  }

  protected createMaterial(): THREE.ShaderMaterial {
    const uniforms = createSpecularUniforms();
    return new THREE.ShaderMaterial({
      name: SpecularShader.name,
      uniforms,
      vertexShader: SpecularShader.vertexShader,
      fragmentShader: SpecularShader.fragmentShader,
      transparent: true,
    });
  }

  setHeightMap(image: HTMLImageElement | ImageData, flipY: boolean = false): void {
    this.heightTexture.image = image as TexImageSource;
    this.heightTexture.needsUpdate = true;
    this.uniforms.tHeight.value = this.heightTexture;
    this.uniforms.flipY.value = flipY ? 1 : 0;
  }

  updateSettings(settings: SpecularSettings): void {
    this.uniforms.strength.value = settings.strength;
    this.uniforms.mean.value = settings.mean;
    this.uniforms.range.value = settings.range;
    this.uniforms.falloff.value = settings.falloff;
    this.uniforms.invert.value = settings.invert ? 1 : 0;
  }
}

export {
  NormalMapRenderer as default,
};

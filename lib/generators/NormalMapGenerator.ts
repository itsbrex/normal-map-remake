/**
 * Normal Map Generator
 * Generates normal maps from height maps using WebGL
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import {
  NormalMapShader,
  type NormalMapUniforms,
} from "@/lib/shaders/NormalMapShader";
import {
  NormalMapFromPicturesShader,
  type NormalMapFromPicturesUniforms,
} from "@/lib/shaders/NormalMapFromPicturesShader";
import {
  HorizontalBlurShader,
  VerticalBlurShader,
} from "@/lib/shaders/BlurShaders";

export interface NormalMapSettings {
  strength: number; // 0.1 - 10, default 2.5
  level: number; // 1 - 10, default 7
  blur: number; // 0 - 2, default 0
  type: "sobel" | "scharr"; // Edge detection algorithm
  invertR: boolean;
  invertG: boolean;
  invertSource: boolean;
  heightOffset: boolean;
}

export const defaultNormalMapSettings: NormalMapSettings = {
  strength: 2.5,
  level: 7,
  blur: 0,
  type: "sobel",
  invertR: false,
  invertG: false,
  invertSource: false,
  heightOffset: false,
};

/**
 * Normal Map Generator class using WebGL shaders
 */
export class NormalMapGenerator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private blurPassH: ShaderPass;
  private blurPassV: ShaderPass;

  private normalMapMaterial: THREE.ShaderMaterial;
  private normalMapFromPicturesMaterial: THREE.ShaderMaterial;
  private uniforms: NormalMapUniforms;
  private picturesUniforms: NormalMapFromPicturesUniforms;

  private mesh: THREE.Mesh;
  private heightTexture: THREE.Texture | null = null;
  private pictureTextures: {
    above: THREE.Texture | null;
    left: THREE.Texture | null;
    right: THREE.Texture | null;
    below: THREE.Texture | null;
  } = { above: null, left: null, right: null, below: null };

  private canvas: HTMLCanvasElement;
  private mode: "height" | "pictures" = "height";

  constructor(canvas?: HTMLCanvasElement) {
    // Create or use provided canvas
    this.canvas = canvas || document.createElement("canvas");

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: this.canvas,
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 0);

    // Orthographic camera for 2D rendering
    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
    this.scene = new THREE.Scene();

    // Clone uniforms for normal map shader
    this.uniforms = THREE.UniformsUtils.clone(
      NormalMapShader.uniforms
    ) as NormalMapUniforms;

    // Clone uniforms for pictures shader
    this.picturesUniforms = THREE.UniformsUtils.clone(
      NormalMapFromPicturesShader.uniforms
    ) as NormalMapFromPicturesUniforms;

    // Create materials
    this.normalMapMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: NormalMapShader.vertexShader,
      fragmentShader: NormalMapShader.fragmentShader,
      transparent: true,
    });

    this.normalMapFromPicturesMaterial = new THREE.ShaderMaterial({
      uniforms: this.picturesUniforms,
      vertexShader: NormalMapFromPicturesShader.vertexShader,
      fragmentShader: NormalMapFromPicturesShader.fragmentShader,
      transparent: true,
    });

    // Create mesh
    const geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.Mesh(geometry, this.normalMapMaterial);
    this.mesh.name = "normalMapMesh";
    this.scene.add(this.mesh);

    // Setup composer with blur passes
    this.renderPass = new RenderPass(this.scene, this.camera);

    this.blurPassH = new ShaderPass(HorizontalBlurShader);
    this.blurPassV = new ShaderPass(VerticalBlurShader);
    this.blurPassV.renderToScreen = true;

    // Initialize composer (will be properly sized later)
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.blurPassV);
    this.composer.addPass(this.blurPassH);
  }

  /**
   * Set height map image for normal map generation
   */
  setHeightMap(image: HTMLImageElement): void {
    this.mode = "height";

    // Dispose old texture
    if (this.heightTexture) {
      this.heightTexture.dispose();
    }

    // Create new texture
    this.heightTexture = new THREE.Texture(image);
    this.heightTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.heightTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.heightTexture.minFilter = THREE.NearestFilter;
    this.heightTexture.magFilter = THREE.NearestFilter;
    this.heightTexture.anisotropy = 2;
    this.heightTexture.needsUpdate = true;

    // Update uniforms
    this.uniforms.tHeightMap.value = this.heightTexture;
    this.uniforms.dimensions.value = new THREE.Vector3(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
      0
    );

    // Update renderer size
    this.updateSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height
    );

    // Switch material
    this.mesh.material = this.normalMapMaterial;
  }

  /**
   * Set 4 directional pictures for normal map generation
   */
  setPictures(
    above: HTMLImageElement,
    left: HTMLImageElement,
    right: HTMLImageElement,
    below: HTMLImageElement
  ): void {
    this.mode = "pictures";

    // Dispose old textures
    Object.values(this.pictureTextures).forEach((tex) => tex?.dispose());

    // Create textures
    const createTex = (img: HTMLImageElement): THREE.Texture => {
      const tex = new THREE.Texture(img);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.anisotropy = 2;
      tex.needsUpdate = true;
      return tex;
    };

    this.pictureTextures = {
      above: createTex(above),
      left: createTex(left),
      right: createTex(right),
      below: createTex(below),
    };

    // Update uniforms
    this.picturesUniforms.tAbove.value = this.pictureTextures.above;
    this.picturesUniforms.tLeft.value = this.pictureTextures.left;
    this.picturesUniforms.tRight.value = this.pictureTextures.right;
    this.picturesUniforms.tBelow.value = this.pictureTextures.below;
    this.picturesUniforms.dimensions.value = new THREE.Vector3(
      above.naturalWidth || above.width,
      above.naturalHeight || above.height,
      0
    );

    // Update renderer size
    this.updateSize(
      above.naturalWidth || above.width,
      above.naturalHeight || above.height
    );

    // Switch material
    this.mesh.material = this.normalMapFromPicturesMaterial;
  }

  /**
   * Update generator settings
   */
  updateSettings(settings: Partial<NormalMapSettings>): void {
    if (this.mode === "height") {
      if (settings.type !== undefined) {
        this.uniforms.type.value = settings.type === "scharr" ? 1 : 0;
      }
      if (settings.strength !== undefined || settings.level !== undefined) {
        const strength = settings.strength ?? 2.5;
        const level = settings.level ?? 7;
        this.uniforms.dz.value =
          (1.0 / strength) * (1.0 + Math.pow(2.0, level));
      }
      if (settings.invertR !== undefined) {
        this.uniforms.invertR.value = settings.invertR ? -1 : 1;
      }
      if (settings.invertG !== undefined) {
        this.uniforms.invertG.value = settings.invertG ? -1 : 1;
      }
      if (settings.invertSource !== undefined) {
        this.uniforms.invertH.value = settings.invertSource ? -1 : 1;
      }
      if (settings.heightOffset !== undefined) {
        this.uniforms.heightOffset.value = settings.heightOffset ? 1 : 0;
      }
    }

    // Update blur
    if (settings.blur !== undefined) {
      const width =
        this.canvas.width || this.uniforms.dimensions.value.x || 512;
      const height =
        this.canvas.height || this.uniforms.dimensions.value.y || 512;
      (this.blurPassH.uniforms as { h: THREE.IUniform<number> }).h.value =
        settings.blur / width;
      (this.blurPassV.uniforms as { v: THREE.IUniform<number> }).v.value =
        settings.blur / height;
    }
  }

  /**
   * Update renderer and composer size
   */
  private updateSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    // Create new render target
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });
    this.composer.reset(renderTarget);
  }

  /**
   * Render normal map and return canvas
   */
  render(): HTMLCanvasElement {
    this.composer.render(1 / 60);
    return this.canvas;
  }

  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get ImageData from rendered normal map
   */
  getImageData(): ImageData {
    this.render();
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D context");
    }
    return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Dispose of WebGL resources
   */
  dispose(): void {
    this.heightTexture?.dispose();
    Object.values(this.pictureTextures).forEach((tex) => tex?.dispose());
    this.normalMapMaterial.dispose();
    this.normalMapFromPicturesMaterial.dispose();
    (this.mesh.geometry as THREE.BufferGeometry).dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}

/**
 * Generate normal map from height map image
 */
export function generateNormalMap(
  heightMap: HTMLImageElement,
  settings: Partial<NormalMapSettings> = {}
): HTMLCanvasElement {
  const generator = new NormalMapGenerator();
  generator.setHeightMap(heightMap);
  generator.updateSettings({ ...defaultNormalMapSettings, ...settings });
  const result = generator.render();

  // Copy to new canvas before disposing
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = result.width;
  outputCanvas.height = result.height;
  const ctx = outputCanvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(result, 0, 0);
  }

  generator.dispose();
  return outputCanvas;
}

/**
 * Generate normal map from 4 directional pictures
 */
export function generateNormalMapFromPictures(
  above: HTMLImageElement,
  left: HTMLImageElement,
  right: HTMLImageElement,
  below: HTMLImageElement,
  settings: Partial<NormalMapSettings> = {}
): HTMLCanvasElement {
  const generator = new NormalMapGenerator();
  generator.setPictures(above, left, right, below);
  generator.updateSettings({ ...defaultNormalMapSettings, ...settings });
  const result = generator.render();

  // Copy to new canvas before disposing
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = result.width;
  outputCanvas.height = result.height;
  const ctx = outputCanvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(result, 0, 0);
  }

  generator.dispose();
  return outputCanvas;
}

export default NormalMapGenerator;

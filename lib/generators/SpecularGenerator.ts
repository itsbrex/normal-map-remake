/**
 * Specular Map Generator
 * Generates specular maps from height maps using WebGL
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import {
  SpecularShader,
  type SpecularUniforms,
  FalloffType,
} from "@/lib/shaders/SpecularShader";
import {
  HorizontalBlurShader,
  VerticalBlurShader,
} from "@/lib/shaders/BlurShaders";

export interface SpecularSettings {
  strength: number; // 0 - 5, default 1
  mean: number; // 0 - 1, default 0.5
  range: number; // 0 - 1, default 0.5
  falloff: FalloffType;
  blur: number; // 0 - 2, default 0
  invert: boolean;
}

export const defaultSpecularSettings: SpecularSettings = {
  strength: 1,
  mean: 0.5,
  range: 0.5,
  falloff: FalloffType.Linear,
  blur: 0,
  invert: false,
};

/**
 * Specular Map Generator class
 */
export class SpecularGenerator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private composer: EffectComposer;
  private blurPassH: ShaderPass;
  private blurPassV: ShaderPass;

  private material: THREE.ShaderMaterial;
  private uniforms: SpecularUniforms;
  private mesh: THREE.Mesh;
  private sourceTexture: THREE.Texture | null = null;
  private canvas: HTMLCanvasElement;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas || document.createElement("canvas");

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: this.canvas,
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
    this.scene = new THREE.Scene();

    this.uniforms = THREE.UniformsUtils.clone(
      SpecularShader.uniforms
    ) as SpecularUniforms;

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: SpecularShader.vertexShader,
      fragmentShader: SpecularShader.fragmentShader,
      transparent: true,
    });

    const geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.blurPassH = new ShaderPass(HorizontalBlurShader);
    this.blurPassV = new ShaderPass(VerticalBlurShader);
    this.blurPassV.renderToScreen = true;

    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });

    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.blurPassV);
    this.composer.addPass(this.blurPassH);
  }

  /**
   * Set source image (height map)
   */
  setSource(image: HTMLImageElement | ImageData): void {
    if (this.sourceTexture) {
      this.sourceTexture.dispose();
    }

    if (image instanceof HTMLImageElement) {
      this.sourceTexture = new THREE.Texture(image);
      this.updateSize(
        image.naturalWidth || image.width,
        image.naturalHeight || image.height
      );
    } else {
      this.sourceTexture = new THREE.DataTexture(
        image.data,
        image.width,
        image.height,
        THREE.RGBAFormat
      );
      this.updateSize(image.width, image.height);
    }

    this.sourceTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.sourceTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.sourceTexture.minFilter = THREE.NearestFilter;
    this.sourceTexture.magFilter = THREE.NearestFilter;
    this.sourceTexture.needsUpdate = true;

    this.uniforms.tHeight.value = this.sourceTexture;
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<SpecularSettings>): void {
    if (settings.strength !== undefined) {
      this.uniforms.strength.value = settings.strength;
    }
    if (settings.mean !== undefined) {
      this.uniforms.mean.value = settings.mean;
    }
    if (settings.range !== undefined) {
      this.uniforms.range.value = settings.range;
    }
    if (settings.falloff !== undefined) {
      this.uniforms.falloff.value = settings.falloff;
    }
    if (settings.invert !== undefined) {
      this.uniforms.invert.value = settings.invert ? 1 : 0;
    }
    if (settings.blur !== undefined) {
      const width = this.canvas.width || 512;
      const height = this.canvas.height || 512;
      (this.blurPassH.uniforms as { h: THREE.IUniform<number> }).h.value =
        settings.blur / width;
      (this.blurPassV.uniforms as { v: THREE.IUniform<number> }).v.value =
        settings.blur / height;
    }
  }

  private updateSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
    });
    this.composer.reset(renderTarget);
  }

  render(): HTMLCanvasElement {
    this.composer.render(1 / 60);
    return this.canvas;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    this.sourceTexture?.dispose();
    this.material.dispose();
    (this.mesh.geometry as THREE.BufferGeometry).dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}

/**
 * Generate specular map from height map
 */
export function generateSpecularMap(
  source: HTMLImageElement | ImageData,
  settings: Partial<SpecularSettings> = {}
): HTMLCanvasElement {
  const generator = new SpecularGenerator();
  generator.setSource(source);
  generator.updateSettings({ ...defaultSpecularSettings, ...settings });
  const result = generator.render();

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

// Re-export FalloffType for convenience
export { FalloffType };

export default SpecularGenerator;

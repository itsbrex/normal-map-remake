/**
 * Scene Manager
 * Manages Three.js scenes for texture rendering and 3D preview
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Model types for 3D preview
export type PreviewModel = "Cube" | "Sphere" | "Cylinder" | "Plane" | "Teapot";

// Configuration for texture rendering scene
export interface TextureSceneConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  alpha?: boolean;
  antialias?: boolean;
}

// Configuration for 3D preview scene
export interface PreviewSceneConfig {
  container: HTMLElement;
  size: number;
  enableShadows?: boolean;
}

/**
 * Creates an orthographic camera for texture rendering
 * Uses -0.5 to 0.5 bounds for a unit plane
 */
export function createOrthographicCamera(): THREE.OrthographicCamera {
  return new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
}

/**
 * Creates a perspective camera for 3D preview
 */
export function createPerspectiveCamera(
  fov: number = 30,
  aspect: number = 1
): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100000);
  camera.position.z = 29;
  camera.lookAt(0, 0, 0);
  return camera;
}

/**
 * Creates a WebGL renderer for texture rendering
 */
export function createTextureRenderer(
  config: TextureSceneConfig
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas: config.canvas,
    alpha: config.alpha ?? true,
    antialias: config.antialias ?? true,
  });
  renderer.setSize(config.width, config.height);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/**
 * Creates a WebGL renderer for 3D preview
 */
export function createPreviewRenderer(
  config: PreviewSceneConfig
): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    alpha: false,
    antialias: true,
  });
  renderer.setSize(config.size, config.size);

  if (config.enableShadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  config.container.appendChild(renderer.domElement);
  return renderer;
}

/**
 * Creates a unit plane for texture rendering
 */
export function createRenderPlane(
  material: THREE.Material
): THREE.Mesh<THREE.PlaneGeometry, THREE.Material> {
  const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "renderPlane";
  return mesh;
}

/**
 * Creates render target parameters for post-processing
 */
export function createRenderTargetParams(): THREE.RenderTargetOptions {
  return {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
  };
}

/**
 * Creates a texture with standard settings for rendering
 */
export function createRenderTexture(
  image: HTMLImageElement | ImageData | null,
  options?: {
    wrapMode?: THREE.Wrapping;
    minFilter?: THREE.MinificationTextureFilter;
    magFilter?: THREE.MagnificationTextureFilter;
    anisotropy?: number;
  }
): THREE.Texture {
  const texture = new THREE.Texture(image as TexImageSource);
  texture.wrapS = options?.wrapMode ?? THREE.ClampToEdgeWrapping;
  texture.wrapT = options?.wrapMode ?? THREE.ClampToEdgeWrapping;
  texture.minFilter = options?.minFilter ?? THREE.NearestFilter;
  texture.magFilter = options?.magFilter ?? THREE.NearestFilter;
  texture.anisotropy = options?.anisotropy ?? 2;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Sets up lighting for 3D preview scene
 * Based on original app's lighting setup
 */
export function setupPreviewLighting(scene: THREE.Scene): void {
  // Hemisphere light for ambient
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 500, 0);
  scene.add(hemiLight);

  // Directional light for shadows
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(50);
  scene.add(dirLight);

  // Shadow configuration
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;

  const d = 50;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = -0.0001;
}

/**
 * Creates orbit controls for 3D preview
 */
export function createOrbitControls(
  camera: THREE.Camera,
  domElement: HTMLElement
): OrbitControls {
  return new OrbitControls(camera, domElement);
}

/**
 * Creates a geometry for the specified model type
 */
export function createModelGeometry(
  type: PreviewModel
): THREE.BufferGeometry {
  switch (type) {
    case "Cube": {
      const box = new THREE.BoxGeometry(10, 10, 10, 128, 128, 128);
      // Copy UV channel for AO map support
      const uvs = box.getAttribute("uv");
      box.setAttribute("uv2", uvs.clone());
      return box;
    }
    case "Sphere": {
      const sphere = new THREE.SphereGeometry(7, 128, 128);
      const uvs = sphere.getAttribute("uv");
      sphere.setAttribute("uv2", uvs.clone());
      return sphere;
    }
    case "Cylinder": {
      const cylinder = new THREE.CylinderGeometry(7, 7, 10, 128);
      const uvs = cylinder.getAttribute("uv");
      cylinder.setAttribute("uv2", uvs.clone());
      return cylinder;
    }
    case "Plane": {
      const plane = new THREE.PlaneGeometry(12, 12, 128, 128);
      const uvs = plane.getAttribute("uv");
      plane.setAttribute("uv2", uvs.clone());
      return plane;
    }
    case "Teapot": {
      // Teapot requires separate import from three examples
      // For now, return a torus as placeholder
      const torus = new THREE.TorusKnotGeometry(4, 1.5, 128, 32);
      const uvs = torus.getAttribute("uv");
      torus.setAttribute("uv2", uvs.clone());
      return torus;
    }
  }
}

/**
 * Creates a mesh with shadow support for 3D preview
 */
export function createPreviewMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * SceneManager class for managing texture rendering scenes
 */
export class TextureSceneManager {
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.OrthographicCamera;
  public scene: THREE.Scene;
  public renderPlane: THREE.Mesh | null = null;

  constructor(config: TextureSceneConfig) {
    this.renderer = createTextureRenderer(config);
    this.camera = createOrthographicCamera();
    this.scene = new THREE.Scene();
  }

  /**
   * Sets the render plane material
   */
  setMaterial(material: THREE.Material): void {
    if (this.renderPlane) {
      this.scene.remove(this.renderPlane);
    }
    this.renderPlane = createRenderPlane(material);
    this.scene.add(this.renderPlane);
  }

  /**
   * Resizes the renderer
   */
  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  /**
   * Renders the scene
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Disposes of resources
   */
  dispose(): void {
    this.renderer.dispose();
    if (this.renderPlane) {
      this.renderPlane.geometry.dispose();
      if (this.renderPlane.material instanceof THREE.Material) {
        this.renderPlane.material.dispose();
      }
    }
  }
}

/**
 * PreviewSceneManager class for managing 3D preview scene
 */
export class PreviewSceneManager {
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  public controls: OrbitControls;
  public mesh: THREE.Mesh | null = null;
  public rotationEnabled: boolean = true;
  private animationId: number | null = null;

  constructor(config: PreviewSceneConfig) {
    this.renderer = createPreviewRenderer(config);
    this.camera = createPerspectiveCamera();
    this.scene = new THREE.Scene();

    // Setup lighting
    setupPreviewLighting(this.scene);

    // Setup controls
    this.controls = createOrbitControls(this.camera, this.renderer.domElement);
  }

  /**
   * Sets the preview model
   */
  setModel(type: PreviewModel, material: THREE.Material): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    const geometry = createModelGeometry(type);
    this.mesh = createPreviewMesh(geometry, material);
    this.scene.add(this.mesh);

    // Reset rotation for plane
    if (type === "Plane") {
      this.rotationEnabled = false;
      if (this.mesh) {
        this.mesh.rotation.set(0, 0, 0);
      }
      this.camera.position.set(0, 0, 29);
      this.camera.lookAt(0, 0, 0);
    }
  }

  /**
   * Starts the render loop
   */
  startRenderLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);

      // Auto-rotate
      if (this.rotationEnabled && this.mesh) {
        this.mesh.rotation.x += 0.0015;
        this.mesh.rotation.y += 0.0015;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Stops the render loop
   */
  stopRenderLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Toggles rotation
   */
  toggleRotation(): void {
    this.rotationEnabled = !this.rotationEnabled;
  }

  /**
   * Resizes the renderer
   */
  resize(size: number): void {
    this.renderer.setSize(size, size);
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Disposes of resources
   */
  dispose(): void {
    this.stopRenderLoop();
    this.renderer.dispose();
    this.controls.dispose();
    if (this.mesh) {
      this.mesh.geometry.dispose();
    }
  }
}

export default TextureSceneManager;

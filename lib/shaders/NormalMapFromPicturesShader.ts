/**
 * Normal Map From Pictures Shader
 * Generates normal maps from 4 directional images (above, left, right, below)
 *
 * Original Author: Christian Petry
 * License: MIT (2014)
 */

import * as THREE from "three";

export interface NormalMapFromPicturesUniforms {
  [key: string]: THREE.IUniform;
  invertR: THREE.IUniform<number>;
  invertG: THREE.IUniform<number>;
  invertH: THREE.IUniform<number>;
  dz: THREE.IUniform<number>;
  dimensions: THREE.IUniform<THREE.Vector3>;
  tAbove: THREE.IUniform<THREE.Texture | null>;
  tLeft: THREE.IUniform<THREE.Texture | null>;
  tRight: THREE.IUniform<THREE.Texture | null>;
  tBelow: THREE.IUniform<THREE.Texture | null>;
  heightOffset: THREE.IUniform<number>;
}

export const NormalMapFromPicturesShader = {
  name: "NormalMapFromPicturesShader",

  uniforms: {
    invertR: { value: 1 },
    invertG: { value: 1 },
    invertH: { value: 1 },
    dz: { value: 0 },
    dimensions: { value: new THREE.Vector3(0, 0, 0) },
    tAbove: { value: null as THREE.Texture | null },
    tLeft: { value: null as THREE.Texture | null },
    tRight: { value: null as THREE.Texture | null },
    tBelow: { value: null as THREE.Texture | null },
    heightOffset: { value: 0 },
  } as NormalMapFromPicturesUniforms,

  vertexShader: /* glsl */ `
    precision mediump float;
    varying vec2 vUv;
    varying vec2 step;
    uniform vec3 dimensions;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      // Negative step to switch from GLSL orientation to application orientation
      step = vec2(-1.0 / dimensions.x, -1.0 / dimensions.y);
      vUv = uv;
    }
  `,

  fragmentShader: /* glsl */ `
    precision mediump float;
    uniform vec3 dimensions;
    varying vec2 vUv;
    varying vec2 step;
    uniform float dz;
    uniform float invertR;
    uniform float invertG;
    uniform float invertH;

    uniform sampler2D tAbove;
    uniform sampler2D tLeft;
    uniform sampler2D tRight;
    uniform sampler2D tBelow;
    uniform int heightOffset;

    void main(void) {
      // Sample directional images and compute blending values
      vec4 A = vec4(
        (1.0 - texture2D(tLeft, vUv.xy).r) * 0.5,
        (1.0 - texture2D(tAbove, vUv.xy).g) * 0.5,
        0.5,
        1.0
      );
      vec4 B = vec4(
        texture2D(tRight, vUv.xy).r * 0.5 + 0.5,
        texture2D(tBelow, vUv.xy).g * 0.5 + 0.5,
        0.0,
        1.0
      );

      // Overlay blend mode for R and G channels
      float r = (A.r <= 0.5)
        ? (B.r * A.r * 2.0)
        : (1.0 - 2.0 * (1.0 - A.r) * (1.0 - B.r));
      float g = (A.g <= 0.5)
        ? (B.g * A.g * 2.0)
        : (1.0 - 2.0 * (1.0 - A.g) * (1.0 - B.g));
      float b = dz;

      vec4 overlay = vec4(r, g, b, 1.0);
      vec4 normal = vec4(
        normalize(vec3(
          (r - 0.5) * invertR * invertH * 255.0,
          (g - 0.5) * invertG * invertH * 255.0,
          b
        )),
        1.0
      );

      // Output with optional height offset
      gl_FragColor = (heightOffset == 0)
        ? vec4(1.0 - (normal.xy * 0.5 + 0.5), normal.zw)
        : vec4(1.0 - (normal.xyz * 0.5 + 0.5), normal.w);
    }
  `,
};

export function createNormalMapFromPicturesUniforms(): NormalMapFromPicturesUniforms {
  return {
    invertR: { value: 1 },
    invertG: { value: 1 },
    invertH: { value: 1 },
    dz: { value: 0 },
    dimensions: { value: new THREE.Vector3(0, 0, 0) },
    tAbove: { value: null },
    tLeft: { value: null },
    tRight: { value: null },
    tBelow: { value: null },
    heightOffset: { value: 0 },
  };
}

export default NormalMapFromPicturesShader;

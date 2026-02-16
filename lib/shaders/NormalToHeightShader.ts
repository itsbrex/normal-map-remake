/**
 * Normal To Height Shader
 * Converts normal map back to height map by averaging 4 directional samples
 *
 * Original Author: Christian Petry
 * License: MIT (2014)
 */

import * as THREE from "three";

export interface NormalToHeightUniforms {
  [key: string]: THREE.IUniform;
  tAbove: THREE.IUniform<THREE.Texture | null>;
  tLeft: THREE.IUniform<THREE.Texture | null>;
  tRight: THREE.IUniform<THREE.Texture | null>;
  tBelow: THREE.IUniform<THREE.Texture | null>;
}

export const NormalToHeightShader = {
  name: "NormalToHeightShader",

  uniforms: {
    tAbove: { value: null as THREE.Texture | null },
    tLeft: { value: null as THREE.Texture | null },
    tRight: { value: null as THREE.Texture | null },
    tBelow: { value: null as THREE.Texture | null },
  } as NormalToHeightUniforms,

  vertexShader: /* glsl */ `
    precision mediump float;
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
      // Flip Y coordinate
      vUv.y = 1.0 - vUv.y;
    }
  `,

  fragmentShader: /* glsl */ `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D tAbove;
    uniform sampler2D tLeft;
    uniform sampler2D tRight;
    uniform sampler2D tBelow;

    void main(void) {
      // Average all 4 directional samples
      vec4 sum = (
        texture2D(tAbove, vUv) +
        texture2D(tLeft, vUv) +
        texture2D(tRight, vUv) +
        texture2D(tBelow, vUv)
      ) / 4.0;

      // Convert to grayscale using luminance weights
      float gray = dot(sum.rgb, vec3(0.299, 0.587, 0.114));

      gl_FragColor.rgb = vec3(gray, gray, gray);
      gl_FragColor.a = sum.a;
    }
  `,
};

export function createNormalToHeightUniforms(): NormalToHeightUniforms {
  return {
    tAbove: { value: null },
    tLeft: { value: null },
    tRight: { value: null },
    tBelow: { value: null },
  };
}

export default NormalToHeightShader;

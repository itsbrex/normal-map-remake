/**
 * Displacement Map Shader
 * Processes height map for displacement mapping with contrast and inversion
 *
 * Original Author: Christian Petry
 * License: MIT (2014)
 */

import * as THREE from "three";

export interface DisplacementUniforms {
  [key: string]: THREE.IUniform;
  invert: THREE.IUniform<number>;
  contrast: THREE.IUniform<number>;
  flipY: THREE.IUniform<number>;
  tHeight: THREE.IUniform<THREE.Texture | null>;
}

export const DisplacementShader = {
  name: "DisplacementShader",

  uniforms: {
    invert: { value: 1 },
    contrast: { value: 0 },
    flipY: { value: 0 },
    tHeight: { value: null as THREE.Texture | null },
  } as DisplacementUniforms,

  vertexShader: /* glsl */ `
    precision mediump float;
    varying vec2 vUv;
    uniform float flipY;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
      vUv.y = (flipY > 0.0) ? (1.0 - vUv.y) : vUv.y;
    }
  `,

  fragmentShader: /* glsl */ `
    precision mediump float;
    varying vec2 vUv;
    uniform float contrast;
    uniform float invert;
    uniform sampler2D tHeight;

    void main(void) {
      vec4 v = texture2D(tHeight, vUv.xy);

      // Apply contrast adjustment
      // Formula: factor * (value - 0.5) + 0.5
      float factor = (contrast + 1.0) / (1.0 - contrast);
      v.rgb = factor * (v.rgb - vec3(0.5)) + vec3(0.5);

      // Apply inversion if enabled
      v.rgb = (invert == 1.0) ? vec3(1.0) - v.rgb : v.rgb;

      gl_FragColor = v;
    }
  `,
};

export function createDisplacementUniforms(): DisplacementUniforms {
  return {
    invert: { value: 1 },
    contrast: { value: 0 },
    flipY: { value: 0 },
    tHeight: { value: null },
  };
}

export default DisplacementShader;

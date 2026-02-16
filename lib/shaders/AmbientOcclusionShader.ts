/**
 * Ambient Occlusion Shader
 * Generates ambient occlusion map from height map
 *
 * Original Author: Christian Petry
 * License: MIT (2014)
 */

import * as THREE from "three";

export interface AmbientOcclusionUniforms {
  [key: string]: THREE.IUniform;
  invert: THREE.IUniform<number>;
  range: THREE.IUniform<number>;
  strength: THREE.IUniform<number>;
  mean: THREE.IUniform<number>;
  level: THREE.IUniform<number>;
  flipY: THREE.IUniform<number>;
  tHeight: THREE.IUniform<THREE.Texture | null>;
}

export const AmbientOcclusionShader = {
  name: "AmbientOcclusionShader",

  uniforms: {
    invert: { value: 1 },
    range: { value: 0 },
    strength: { value: 0 },
    mean: { value: 0 },
    level: { value: 0 },
    flipY: { value: 0 },
    tHeight: { value: null as THREE.Texture | null },
  } as AmbientOcclusionUniforms,

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
    uniform float range;
    uniform float strength;
    uniform float mean;
    uniform float level;
    uniform float invert;
    uniform sampler2D tHeight;

    void main(void) {
      vec4 v = texture2D(tHeight, vUv.xy);

      // Calculate percentage distance to mean
      float perc_dist_to_mean = (range - abs(v.r - mean)) / range;

      // Apply square root falloff for smoother transitions
      v.r = v.g = v.b = (perc_dist_to_mean > 0.0) ? sqrt(perc_dist_to_mean) : 0.0;

      // Apply strength (blend with white)
      v.rgb = v.rgb + (vec3(1.0) - v.rgb) * (1.0 - strength);

      // Apply inversion if enabled
      v.rgb = (invert > 0.5) ? (1.0 - v.rgb) : v.rgb;

      gl_FragColor = v;
    }
  `,
};

export function createAmbientOcclusionUniforms(): AmbientOcclusionUniforms {
  return {
    invert: { value: 1 },
    range: { value: 0 },
    strength: { value: 0 },
    mean: { value: 0 },
    level: { value: 0 },
    flipY: { value: 0 },
    tHeight: { value: null },
  };
}

export default AmbientOcclusionShader;

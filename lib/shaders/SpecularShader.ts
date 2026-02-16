/**
 * Specular Map Shader
 * Generates specular/roughness map from height map
 *
 * Original Author: Christian Petry
 * License: MIT (2014)
 */

import * as THREE from "three";

export enum FalloffType {
  None = 0,
  Linear = 1,
  Square = 2,
}

export interface SpecularUniforms {
  [key: string]: THREE.IUniform;
  invert: THREE.IUniform<number>;
  range: THREE.IUniform<number>;
  strength: THREE.IUniform<number>;
  mean: THREE.IUniform<number>;
  falloff: THREE.IUniform<number>;
  flipY: THREE.IUniform<number>;
  tHeight: THREE.IUniform<THREE.Texture | null>;
}

export const SpecularShader = {
  name: "SpecularShader",

  uniforms: {
    invert: { value: 1 },
    range: { value: 0 },
    strength: { value: 0 },
    mean: { value: 0 },
    falloff: { value: 0 },
    flipY: { value: 0 },
    tHeight: { value: null as THREE.Texture | null },
  } as SpecularUniforms,

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
    uniform int invert;
    uniform int falloff;
    uniform sampler2D tHeight;

    void main(void) {
      vec4 v = texture2D(tHeight, vUv.xy);

      // Calculate percentage distance to mean
      float perc_dist_to_mean = (range - abs(v.r - mean)) / range;

      // Apply falloff type
      if (falloff == 0) {
        // No falloff - binary threshold
        perc_dist_to_mean = (perc_dist_to_mean > 0.0) ? 1.0 : 0.0;
      } else if (falloff == 1) {
        // Linear falloff
        perc_dist_to_mean = (perc_dist_to_mean > 0.0) ? perc_dist_to_mean : 0.0;
      } else if (falloff == 2) {
        // Square root falloff (smoother)
        perc_dist_to_mean = (perc_dist_to_mean > 0.0) ? sqrt(perc_dist_to_mean) : 0.0;
      }

      v.r = v.g = v.b = perc_dist_to_mean;

      // Apply strength
      v.rgb = v.rgb * strength;

      // Apply inversion if enabled
      v.rgb = (invert == 1) ? (1.0 - v.rgb) : v.rgb;

      gl_FragColor = v;
    }
  `,
};

export function createSpecularUniforms(): SpecularUniforms {
  return {
    invert: { value: 1 },
    range: { value: 0 },
    strength: { value: 0 },
    mean: { value: 0 },
    falloff: { value: 0 },
    flipY: { value: 0 },
    tHeight: { value: null },
  };
}

export default SpecularShader;

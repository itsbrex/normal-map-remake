/**
 * Normal Map Shader
 * Converts height map to normal map using Sobel or Scharr edge detection
 *
 * Original Author: Christian Petry
 * License: MIT (2014)
 *
 * Ported to TypeScript ES module
 */

import * as THREE from "three";

export interface NormalMapUniforms {
  [key: string]: THREE.IUniform;
  type: THREE.IUniform<number>; // 0 = Sobel, 1 = Scharr
  invertR: THREE.IUniform<number>; // 1 or -1
  invertG: THREE.IUniform<number>; // 1 or -1
  invertH: THREE.IUniform<number>; // 1 or -1 (height inversion)
  dz: THREE.IUniform<number>; // Z depth factor
  dimensions: THREE.IUniform<THREE.Vector3>; // [width, height, 0]
  tHeightMap: THREE.IUniform<THREE.Texture | null>; // Height map texture
  heightOffset: THREE.IUniform<number>; // 0 or 1
}

export const NormalMapShader = {
  name: "NormalMapShader",

  uniforms: {
    type: { value: 0 },
    invertR: { value: 1 },
    invertG: { value: 1 },
    invertH: { value: 1 },
    dz: { value: 0 },
    dimensions: { value: new THREE.Vector3(0, 0, 0) },
    tHeightMap: { value: null as THREE.Texture | null },
    heightOffset: { value: 0 },
  } as NormalMapUniforms,

  vertexShader: /* glsl */ `
    precision mediump float;
    varying vec2 vUv;
    varying vec2 step;
    uniform vec3 dimensions;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      // Negative to switch from GLSL orientation to expected orientation
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
    uniform int type;
    uniform sampler2D tHeightMap;
    uniform int heightOffset;

    // Wrap UV coordinates for seamless tiling
    vec2 wrapUV(vec2 uv) {
      return vec2(
        uv.x >= 0.0 ? (uv.x < 1.0 ? uv.x : uv.x - 1.0) : (1.0 + uv.x),
        uv.y >= 0.0 ? (uv.y < 1.0 ? uv.y : uv.y - 1.0) : (1.0 + uv.y)
      );
    }

    void main(void) {
      // Sample 8 neighboring pixels for gradient calculation
      // tl = top-left, l = left, bl = bottom-left, etc.
      vec2 tlv = wrapUV(vec2(vUv.x - step.x, vUv.y + step.y));
      vec2 lv  = wrapUV(vec2(vUv.x - step.x, vUv.y));
      vec2 blv = wrapUV(vec2(vUv.x - step.x, vUv.y - step.y));
      vec2 tv  = wrapUV(vec2(vUv.x,          vUv.y + step.y));
      vec2 bv  = wrapUV(vec2(vUv.x,          vUv.y - step.y));
      vec2 trv = wrapUV(vec2(vUv.x + step.x, vUv.y + step.y));
      vec2 rv  = wrapUV(vec2(vUv.x + step.x, vUv.y));
      vec2 brv = wrapUV(vec2(vUv.x + step.x, vUv.y - step.y));

      // Sample height values from the height map
      float tl = abs(texture2D(tHeightMap, tlv).r);
      float l  = abs(texture2D(tHeightMap, lv).r);
      float bl = abs(texture2D(tHeightMap, blv).r);
      float t  = abs(texture2D(tHeightMap, tv).r);
      float b  = abs(texture2D(tHeightMap, bv).r);
      float tr = abs(texture2D(tHeightMap, trv).r);
      float r  = abs(texture2D(tHeightMap, rv).r);
      float br = abs(texture2D(tHeightMap, brv).r);

      float dx = 0.0;
      float dy = 0.0;

      if (type == 0) {
        // Sobel kernel (3x3)
        // [ 1  0 -1 ]      [ 1  2  1 ]
        // [ 2  0 -2 ]  and [ 0  0  0 ]
        // [ 1  0 -1 ]      [-1 -2 -1 ]
        dx = tl + l * 2.0 + bl - tr - r * 2.0 - br;
        dy = tl + t * 2.0 + tr - bl - b * 2.0 - br;
      } else {
        // Scharr kernel (3x3) - more accurate gradients
        // [  3  0  -3 ]      [  3  10   3 ]
        // [ 10  0 -10 ]  and [  0   0   0 ]
        // [  3  0  -3 ]      [ -3 -10  -3 ]
        dx = tl * 3.0 + l * 10.0 + bl * 3.0 - tr * 3.0 - r * 10.0 - br * 3.0;
        dy = tl * 3.0 + t * 10.0 + tr * 3.0 - bl * 3.0 - b * 10.0 - br * 3.0;
      }

      // Calculate normal vector and normalize
      vec3 normalVec = normalize(vec3(
        dx * invertR * invertH * 255.0,
        dy * invertG * invertH * 255.0,
        dz
      ));

      // Preserve alpha from original texture
      float alpha = texture2D(tHeightMap, vUv).a;

      // Map normal from [-1, 1] to [0, 1] color space
      // heightOffset controls whether Z is included in remapping
      if (heightOffset == 0) {
        gl_FragColor = vec4(normalVec.xy * 0.5 + 0.5, normalVec.z, alpha);
      } else {
        gl_FragColor = vec4(normalVec * 0.5 + 0.5, alpha);
      }
    }
  `,
};

/**
 * Create a clone of the uniforms for use in a new material
 */
export function createNormalMapUniforms(): NormalMapUniforms {
  return {
    type: { value: 0 },
    invertR: { value: 1 },
    invertG: { value: 1 },
    invertH: { value: 1 },
    dz: { value: 0 },
    dimensions: { value: new THREE.Vector3(0, 0, 0) },
    tHeightMap: { value: null },
    heightOffset: { value: 0 },
  };
}

/**
 * Calculate the dz uniform value based on strength and level settings
 * @param strength - Normal map strength (default 2.5)
 * @param level - Detail level (default 7)
 */
export function calculateDz(strength: number, level: number): number {
  return (1.0 / strength) * (1.0 + Math.pow(2.0, level));
}

export default NormalMapShader;

/**
 * Gaussian Blur Shaders (Horizontal and Vertical passes)
 *
 * Based on work by:
 * @author zz85 / http://www.lab4games.net/zz85/blog
 *
 * Two pass Gaussian blur filter
 * - 9 samples per pass
 * - standard deviation 2.7
 * - "h" and "v" parameters should be set to "1 / width" and "1 / height"
 *
 * Original from Three.js examples, modified for tile-wrapping
 */

import * as THREE from "three";

export interface HorizontalBlurUniforms {
  [key: string]: THREE.IUniform;
  tDiffuse: THREE.IUniform<THREE.Texture | null>;
  h: THREE.IUniform<number>;
}

export interface VerticalBlurUniforms {
  [key: string]: THREE.IUniform;
  tDiffuse: THREE.IUniform<THREE.Texture | null>;
  v: THREE.IUniform<number>;
}

export const HorizontalBlurShader = {
  name: "HorizontalBlurShader",

  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    h: { value: 3.0 / 512.0 },
  } as HorizontalBlurUniforms,

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float h;
    varying vec2 vUv;

    // Wrap coordinate for seamless tiling
    float wrap(float coord) {
      return coord >= 0.0 ? (coord < 1.0 ? coord : coord - 1.0) : (1.0 + coord);
    }

    void main() {
      vec4 sum = vec4(0.0);

      // Sample positions (wrapped for tiling)
      float lef4 = wrap(vUv.x - 4.0 * h);
      float lef3 = wrap(vUv.x - 3.0 * h);
      float lef2 = wrap(vUv.x - 2.0 * h);
      float lef1 = wrap(vUv.x - 1.0 * h);
      float rig1 = wrap(vUv.x + 1.0 * h);
      float rig2 = wrap(vUv.x + 2.0 * h);
      float rig3 = wrap(vUv.x + 3.0 * h);
      float rig4 = wrap(vUv.x + 4.0 * h);

      // Gaussian weights (sum to ~1.0)
      sum += texture2D(tDiffuse, vec2(lef4, vUv.y)) * 0.051;
      sum += texture2D(tDiffuse, vec2(lef3, vUv.y)) * 0.0918;
      sum += texture2D(tDiffuse, vec2(lef2, vUv.y)) * 0.12245;
      sum += texture2D(tDiffuse, vec2(lef1, vUv.y)) * 0.1531;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
      sum += texture2D(tDiffuse, vec2(rig1, vUv.y)) * 0.1531;
      sum += texture2D(tDiffuse, vec2(rig2, vUv.y)) * 0.12245;
      sum += texture2D(tDiffuse, vec2(rig3, vUv.y)) * 0.0918;
      sum += texture2D(tDiffuse, vec2(rig4, vUv.y)) * 0.051;

      // When h > 0, apply sharpening instead of blur
      if (h > 0.0) {
        vec4 srcValue = texture2D(tDiffuse, vec2(vUv.x, vUv.y));
        sum = srcValue + srcValue - sum;
      }

      gl_FragColor = sum;
    }
  `,
};

export const VerticalBlurShader = {
  name: "VerticalBlurShader",

  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    v: { value: 3.0 / 512.0 },
  } as VerticalBlurUniforms,

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float v;
    varying vec2 vUv;

    // Wrap coordinate for seamless tiling
    float wrap(float coord) {
      return coord >= 0.0 ? (coord < 1.0 ? coord : coord - 1.0) : (1.0 + coord);
    }

    void main() {
      vec4 sum = vec4(0.0);

      // Sample positions (wrapped for tiling)
      float top4 = wrap(vUv.y - 4.0 * v);
      float top3 = wrap(vUv.y - 3.0 * v);
      float top2 = wrap(vUv.y - 2.0 * v);
      float top1 = wrap(vUv.y - 1.0 * v);
      float bot1 = wrap(vUv.y + 1.0 * v);
      float bot2 = wrap(vUv.y + 2.0 * v);
      float bot3 = wrap(vUv.y + 3.0 * v);
      float bot4 = wrap(vUv.y + 4.0 * v);

      // Gaussian weights (sum to ~1.0)
      sum += texture2D(tDiffuse, vec2(vUv.x, top4)) * 0.051;
      sum += texture2D(tDiffuse, vec2(vUv.x, top3)) * 0.0918;
      sum += texture2D(tDiffuse, vec2(vUv.x, top2)) * 0.12245;
      sum += texture2D(tDiffuse, vec2(vUv.x, top1)) * 0.1531;
      sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
      sum += texture2D(tDiffuse, vec2(vUv.x, bot1)) * 0.1531;
      sum += texture2D(tDiffuse, vec2(vUv.x, bot2)) * 0.12245;
      sum += texture2D(tDiffuse, vec2(vUv.x, bot3)) * 0.0918;
      sum += texture2D(tDiffuse, vec2(vUv.x, bot4)) * 0.051;

      // When v > 0, apply sharpening instead of blur
      if (v > 0.0) {
        vec4 srcValue = texture2D(tDiffuse, vec2(vUv.x, vUv.y));
        sum = srcValue + srcValue - sum;
      }

      gl_FragColor = sum;
    }
  `,
};

export function createHorizontalBlurUniforms(): HorizontalBlurUniforms {
  return {
    tDiffuse: { value: null },
    h: { value: 3.0 / 512.0 },
  };
}

export function createVerticalBlurUniforms(): VerticalBlurUniforms {
  return {
    tDiffuse: { value: null },
    v: { value: 3.0 / 512.0 },
  };
}

/**
 * Copy Shader
 * Full-screen textured quad shader for copying textures
 *
 * @author alteredq / http://alteredqualia.com/
 */

import * as THREE from "three";

export interface CopyUniforms {
  [key: string]: THREE.IUniform;
  tDiffuse: THREE.IUniform<THREE.Texture | null>;
  opacity: THREE.IUniform<number>;
}

export const CopyShader = {
  name: "CopyShader",

  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    opacity: { value: 1.0 },
  } as CopyUniforms,

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform float opacity;
    uniform sampler2D tDiffuse;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      gl_FragColor = opacity * texel;
    }
  `,
};

export function createCopyUniforms(): CopyUniforms {
  return {
    tDiffuse: { value: null },
    opacity: { value: 1.0 },
  };
}

export default CopyShader;

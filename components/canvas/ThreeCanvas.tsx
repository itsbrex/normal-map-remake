"use client";

/**
 * ThreeCanvas Component
 * 3D preview canvas for texture mapping using react-three-fiber
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useRef, useState, useMemo, useEffect, Suspense, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useTextureStore } from "@/stores/textureStore";
import { cn } from "@/lib/utils";

// Model types available for preview
export type ModelType = "cube" | "sphere" | "cylinder" | "plane" | "teapot";

export interface ThreeCanvasProps {
  className?: string;
  modelType?: ModelType;
  autoRotate?: boolean;
  enableDisplacement?: boolean;
  enableNormal?: boolean;
  enableAO?: boolean;
  enableSpecular?: boolean;
  enableDiffuse?: boolean;
  displacementScale?: number;
  displacementBias?: number;
  tileRepeat?: [number, number];
}

/**
 * Custom geometry wrapper for different model types - memoized for performance
 */
const ModelGeometry = memo(function ModelGeometry({ type }: { type: ModelType }) {
  switch (type) {
    case "sphere":
      return <sphereGeometry args={[7, 128, 128]} />;
    case "cylinder":
      return <cylinderGeometry args={[7, 7, 10, 128]} />;
    case "plane":
      return <planeGeometry args={[12, 12, 128, 128]} />;
    case "teapot":
      // Three.js doesn't have TeapotBufferGeometry built-in anymore
      // We'll use a sphere with slight modification as a placeholder
      // In production, you'd import TeapotGeometry from three/addons
      return <sphereGeometry args={[5, 64, 64]} />;
    case "cube":
    default:
      return <boxGeometry args={[10, 10, 10, 128, 128, 128]} />;
  }
});

/**
 * Textured model component
 */
function TexturedModel({
  type,
  autoRotate,
  enableDisplacement,
  enableNormal,
  enableAO,
  enableSpecular,
  enableDiffuse,
  displacementScale,
  displacementBias,
  tileRepeat,
}: {
  type: ModelType;
  autoRotate: boolean;
  enableDisplacement: boolean;
  enableNormal: boolean;
  enableAO: boolean;
  enableSpecular: boolean;
  enableDiffuse: boolean;
  displacementScale: number;
  displacementBias: number;
  tileRepeat: [number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const generatedTextures = useTextureStore((s) => s.generatedTextures);
  const heightMap = useTextureStore((s) => s.heightMap);

  // Create textures from canvas elements
  const textures = useMemo(() => {
    const result: {
      diffuse: THREE.Texture | null;
      normal: THREE.Texture | null;
      displacement: THREE.Texture | null;
      ao: THREE.Texture | null;
      specular: THREE.Texture | null;
    } = {
      diffuse: null,
      normal: null,
      displacement: null,
      ao: null,
      specular: null,
    };

    // Use height map as diffuse if available
    if (heightMap) {
      result.diffuse = new THREE.Texture(heightMap);
      result.diffuse.wrapS = THREE.RepeatWrapping;
      result.diffuse.wrapT = THREE.RepeatWrapping;
      result.diffuse.repeat.set(tileRepeat[0], tileRepeat[1]);
      result.diffuse.needsUpdate = true;
    }

    // Create normal map texture
    if (generatedTextures.normal) {
      result.normal = new THREE.CanvasTexture(generatedTextures.normal);
      result.normal.wrapS = THREE.RepeatWrapping;
      result.normal.wrapT = THREE.RepeatWrapping;
      result.normal.repeat.set(tileRepeat[0], tileRepeat[1]);
      result.normal.needsUpdate = true;
    }

    // Create displacement texture
    if (generatedTextures.displacement) {
      result.displacement = new THREE.CanvasTexture(
        generatedTextures.displacement
      );
      result.displacement.wrapS = THREE.RepeatWrapping;
      result.displacement.wrapT = THREE.RepeatWrapping;
      result.displacement.repeat.set(tileRepeat[0], tileRepeat[1]);
      result.displacement.needsUpdate = true;
    }

    // Create AO texture
    if (generatedTextures.ambientOcclusion) {
      result.ao = new THREE.CanvasTexture(generatedTextures.ambientOcclusion);
      result.ao.wrapS = THREE.RepeatWrapping;
      result.ao.wrapT = THREE.RepeatWrapping;
      result.ao.repeat.set(tileRepeat[0], tileRepeat[1]);
      result.ao.needsUpdate = true;
    }

    // Create specular texture
    if (generatedTextures.specular) {
      result.specular = new THREE.CanvasTexture(generatedTextures.specular);
      result.specular.wrapS = THREE.RepeatWrapping;
      result.specular.wrapT = THREE.RepeatWrapping;
      result.specular.repeat.set(tileRepeat[0], tileRepeat[1]);
      result.specular.needsUpdate = true;
    }

    return result;
  }, [generatedTextures, heightMap, tileRepeat]);

  // Auto-rotation
  useFrame(() => {
    if (meshRef.current && autoRotate && type !== "plane") {
      meshRef.current.rotation.x += 0.0015;
      meshRef.current.rotation.y += 0.0015;
    }
  });

  // Cleanup textures on unmount
  useEffect(() => {
    return () => {
      Object.values(textures).forEach((tex) => tex?.dispose());
    };
  }, [textures]);

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <ModelGeometry type={type} />
      <meshStandardMaterial
        color={0xaaaaaa}
        map={enableDiffuse ? textures.diffuse : null}
        normalMap={enableNormal ? textures.normal : null}
        displacementMap={enableDisplacement ? textures.displacement : null}
        displacementScale={displacementScale}
        displacementBias={displacementBias}
        aoMap={enableAO ? textures.ao : null}
        aoMapIntensity={1}
        roughnessMap={enableSpecular ? textures.specular : null}
        metalness={0.1}
        roughness={0.8}
        side={type === "plane" ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  );
}

/**
 * Scene lighting - memoized for performance
 */
const Lighting = memo(function Lighting() {
  return (
    <>
      <hemisphereLight
        color={0xffffff}
        groundColor={0xffffff}
        intensity={0.6}
        position={[0, 500, 0]}
      />
      <directionalLight
        color={0xffffff}
        intensity={1}
        position={[-50, 87.5, 50]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-far={3500}
        shadow-bias={-0.0001}
      />
    </>
  );
});

/**
 * Camera controller with orbit controls - memoized for performance
 */
const CameraController = memo(function CameraController() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.z = 29;
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return <OrbitControls enableDamping dampingFactor={0.05} />;
});

/**
 * Loading fallback - memoized for performance
 */
const LoadingFallback = memo(function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
});

/**
 * ThreeCanvas Component
 */
export function ThreeCanvas({
  className,
  modelType = "cube",
  autoRotate = true,
  enableDisplacement = false,
  enableNormal = true,
  enableAO = true,
  enableSpecular = true,
  enableDiffuse = true,
  displacementScale = -0.3,
  displacementBias = 0,
  tileRepeat = [1, 1],
}: ThreeCanvasProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "bg-muted rounded-lg flex items-center justify-center",
          className
        )}
      >
        <span className="text-muted-foreground text-sm">Loading 3D view...</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg overflow-hidden", className)}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        camera={{
          fov: 30,
          near: 0.1,
          far: 100000,
          position: [0, 0, 29],
        }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <Suspense fallback={<LoadingFallback />}>
          <Lighting />
          <TexturedModel
            type={modelType}
            autoRotate={autoRotate}
            enableDisplacement={enableDisplacement}
            enableNormal={enableNormal}
            enableAO={enableAO}
            enableSpecular={enableSpecular}
            enableDiffuse={enableDiffuse}
            displacementScale={displacementScale}
            displacementBias={displacementBias}
            tileRepeat={tileRepeat}
          />
          <CameraController />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default ThreeCanvas;

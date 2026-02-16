"use client";

/**
 * useTextureGeneration Hook
 * React hook for generating textures from height maps
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useTextureStore, TextureType } from "@/stores/textureStore";
import {
  NormalMapGenerator,
  DisplacementGenerator,
  AmbientOcclusionGenerator,
  SpecularGenerator,
} from "@/lib/generators";
import { FalloffType } from "@/lib/shaders";

export interface UseTextureGenerationReturn {
  generateNormalMap: () => void;
  generateDisplacementMap: () => void;
  generateAmbientOcclusionMap: () => void;
  generateSpecularMap: () => void;
  generateAll: () => void;
  isGenerating: boolean;
}

/**
 * Hook for texture generation with state integration
 */
export function useTextureGeneration(): UseTextureGenerationReturn {
  // Refs for generators (persistent across renders)
  const normalGeneratorRef = useRef<NormalMapGenerator | null>(null);
  const displacementGeneratorRef = useRef<DisplacementGenerator | null>(null);
  const aoGeneratorRef = useRef<AmbientOcclusionGenerator | null>(null);
  const specularGeneratorRef = useRef<SpecularGenerator | null>(null);
  const isGeneratingRef = useRef(false);

  // Store state
  const heightMap = useTextureStore((s) => s.heightMap);
  const normalMapMode = useTextureStore((s) => s.normalMapMode);
  const picturesSource = useTextureStore((s) => s.picturesSource);
  const normalSettings = useTextureStore((s) => s.normalSettings);
  const displacementSettings = useTextureStore((s) => s.displacementSettings);
  const ambientOcclusionSettings = useTextureStore(
    (s) => s.ambientOcclusionSettings
  );
  const specularSettings = useTextureStore((s) => s.specularSettings);
  const setGeneratedTexture = useTextureStore((s) => s.setGeneratedTexture);
  const autoUpdate = useTextureStore((s) => s.autoUpdate);
  const setLoading = useTextureStore((s) => s.setLoading);
  const setError = useTextureStore((s) => s.setError);

  // Cleanup generators on unmount
  useEffect(() => {
    return () => {
      normalGeneratorRef.current?.dispose();
      displacementGeneratorRef.current?.dispose();
      aoGeneratorRef.current?.dispose();
      specularGeneratorRef.current?.dispose();
    };
  }, []);

  /**
   * Generate normal map
   */
  const generateNormalMap = useCallback(() => {
    if (!heightMap && normalMapMode === "height") return;
    if (
      normalMapMode === "pictures" &&
      (!picturesSource.above ||
        !picturesSource.below ||
        !picturesSource.left ||
        !picturesSource.right)
    ) {
      return;
    }

    isGeneratingRef.current = true;
    setLoading("normal", true);

    try {
      // Create or reuse generator
      if (!normalGeneratorRef.current) {
        normalGeneratorRef.current = new NormalMapGenerator();
      }

      const generator = normalGeneratorRef.current;

      // Set source image(s)
      if (normalMapMode === "height" && heightMap) {
        generator.setHeightMap(heightMap);
      } else if (normalMapMode === "pictures") {
        generator.setPictures(
          picturesSource.above!,
          picturesSource.left!,
          picturesSource.right!,
          picturesSource.below!
        );
      }

      // Update settings
      generator.updateSettings({
        strength: normalSettings.strength,
        level: normalSettings.level,
        blur: normalSettings.smoothing,
        type: normalSettings.type,
        invertR: normalSettings.invertR,
        invertG: normalSettings.invertG,
        invertSource: normalSettings.invertSource,
      });

      // Render and get canvas
      const canvas = generator.render();

      // Create a copy of the canvas for the store
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const ctx = outputCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
      }

      setGeneratedTexture("normal", outputCanvas);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate normal map";
      setError({ message, type: "normal" });
      toast.error("Normal Map Generation Failed", { description: message });
    } finally {
      isGeneratingRef.current = false;
      setLoading("normal", false);
    }
  }, [
    heightMap,
    normalMapMode,
    picturesSource,
    normalSettings,
    setGeneratedTexture,
    setLoading,
    setError,
  ]);

  /**
   * Generate displacement map
   */
  const generateDisplacementMap = useCallback(() => {
    if (!heightMap) return;

    isGeneratingRef.current = true;
    setLoading("displacement", true);

    try {
      if (!displacementGeneratorRef.current) {
        displacementGeneratorRef.current = new DisplacementGenerator();
      }

      const generator = displacementGeneratorRef.current;
      generator.setSource(heightMap);
      generator.updateSettings({
        contrast: displacementSettings.contrast,
        blur: displacementSettings.smoothing,
        invert: displacementSettings.invert,
      });

      const canvas = generator.render();

      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const ctx = outputCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
      }

      setGeneratedTexture("displacement", outputCanvas);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate displacement map";
      setError({ message, type: "displacement" });
      toast.error("Displacement Map Generation Failed", { description: message });
    } finally {
      isGeneratingRef.current = false;
      setLoading("displacement", false);
    }
  }, [heightMap, displacementSettings, setGeneratedTexture, setLoading, setError]);

  /**
   * Generate ambient occlusion map
   */
  const generateAmbientOcclusionMap = useCallback(() => {
    if (!heightMap) return;

    isGeneratingRef.current = true;
    setLoading("ambientOcclusion", true);

    try {
      if (!aoGeneratorRef.current) {
        aoGeneratorRef.current = new AmbientOcclusionGenerator();
      }

      const generator = aoGeneratorRef.current;
      generator.setSource(heightMap);
      generator.updateSettings({
        strength: ambientOcclusionSettings.strength,
        mean: ambientOcclusionSettings.mean,
        range: ambientOcclusionSettings.range,
        blur: ambientOcclusionSettings.smoothing,
        invert: ambientOcclusionSettings.invert,
      });

      const canvas = generator.render();

      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const ctx = outputCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
      }

      setGeneratedTexture("ambientOcclusion", outputCanvas);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate ambient occlusion map";
      setError({ message, type: "ambientOcclusion" });
      toast.error("AO Map Generation Failed", { description: message });
    } finally {
      isGeneratingRef.current = false;
      setLoading("ambientOcclusion", false);
    }
  }, [heightMap, ambientOcclusionSettings, setGeneratedTexture, setLoading, setError]);

  /**
   * Generate specular map
   */
  const generateSpecularMap = useCallback(() => {
    if (!heightMap) return;

    isGeneratingRef.current = true;
    setLoading("specular", true);

    try {
      if (!specularGeneratorRef.current) {
        specularGeneratorRef.current = new SpecularGenerator();
      }

      const generator = specularGeneratorRef.current;
      generator.setSource(heightMap);
      generator.updateSettings({
        strength: specularSettings.strength,
        mean: specularSettings.mean,
        range: specularSettings.range,
        falloff: specularSettings.falloff as FalloffType,
        invert: specularSettings.invert,
      });

      const canvas = generator.render();

      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const ctx = outputCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
      }

      setGeneratedTexture("specular", outputCanvas);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate specular map";
      setError({ message, type: "specular" });
      toast.error("Specular Map Generation Failed", { description: message });
    } finally {
      isGeneratingRef.current = false;
      setLoading("specular", false);
    }
  }, [heightMap, specularSettings, setGeneratedTexture, setLoading, setError]);

  /**
   * Generate all texture maps
   */
  const generateAll = useCallback(() => {
    generateNormalMap();
    generateDisplacementMap();
    generateAmbientOcclusionMap();
    generateSpecularMap();
  }, [
    generateNormalMap,
    generateDisplacementMap,
    generateAmbientOcclusionMap,
    generateSpecularMap,
  ]);

  // Auto-update textures when height map or settings change
  useEffect(() => {
    if (autoUpdate && heightMap) {
      generateAll();
    }
  }, [autoUpdate, heightMap, generateAll]);

  // Auto-update specific texture when settings change
  useEffect(() => {
    if (autoUpdate && heightMap) {
      generateNormalMap();
    }
  }, [autoUpdate, heightMap, normalSettings, generateNormalMap]);

  useEffect(() => {
    if (autoUpdate && heightMap) {
      generateDisplacementMap();
    }
  }, [autoUpdate, heightMap, displacementSettings, generateDisplacementMap]);

  useEffect(() => {
    if (autoUpdate && heightMap) {
      generateAmbientOcclusionMap();
    }
  }, [
    autoUpdate,
    heightMap,
    ambientOcclusionSettings,
    generateAmbientOcclusionMap,
  ]);

  useEffect(() => {
    if (autoUpdate && heightMap) {
      generateSpecularMap();
    }
  }, [autoUpdate, heightMap, specularSettings, generateSpecularMap]);

  return {
    generateNormalMap,
    generateDisplacementMap,
    generateAmbientOcclusionMap,
    generateSpecularMap,
    generateAll,
    isGenerating: isGeneratingRef.current,
  };
}

/**
 * Hook for generating a single texture type
 */
export function useGenerateTexture(
  type: TextureType
): () => void {
  const {
    generateNormalMap,
    generateDisplacementMap,
    generateAmbientOcclusionMap,
    generateSpecularMap,
  } = useTextureGeneration();

  return useCallback(() => {
    switch (type) {
      case TextureType.Normal:
        generateNormalMap();
        break;
      case TextureType.Displacement:
        generateDisplacementMap();
        break;
      case TextureType.AmbientOcclusion:
        generateAmbientOcclusionMap();
        break;
      case TextureType.Specular:
        generateSpecularMap();
        break;
    }
  }, [
    type,
    generateNormalMap,
    generateDisplacementMap,
    generateAmbientOcclusionMap,
    generateSpecularMap,
  ]);
}

export default useTextureGeneration;

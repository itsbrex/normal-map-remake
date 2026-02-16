"use client";

/**
 * useBatchProcessing Hook
 * Process multiple height maps and generate all textures for each
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback, useState } from "react";
import { useTextureStore } from "@/stores/textureStore";
import {
  NormalMapGenerator,
  DisplacementGenerator,
  AmbientOcclusionGenerator,
  SpecularGenerator,
} from "@/lib/generators";
import { exportCanvas } from "@/lib/utils/fileExport";
import { loadTGAFromFile, isTGAFile } from "@/lib/loaders";
import { FalloffType } from "@/lib/shaders";

export interface BatchOptions {
  includeNormal: boolean;
  includeDisplacement: boolean;
  includeAmbientOcclusion: boolean;
  includeSpecular: boolean;
}

export interface BatchProgress {
  current: number;
  total: number;
  currentFile: string;
  status: "idle" | "processing" | "complete" | "error";
  error?: string;
}

export interface UseBatchProcessingReturn {
  processBatch: (files: File[], options: BatchOptions) => Promise<void>;
  progress: BatchProgress;
  isProcessing: boolean;
  cancel: () => void;
}

/**
 * Hook for batch processing multiple height maps
 */
export function useBatchProcessing(): UseBatchProcessingReturn {
  const [progress, setProgress] = useState<BatchProgress>({
    current: 0,
    total: 0,
    currentFile: "",
    status: "idle",
  });
  const [cancelRequested, setCancelRequested] = useState(false);

  // Get settings from store
  const normalSettings = useTextureStore((s) => s.normalSettings);
  const displacementSettings = useTextureStore((s) => s.displacementSettings);
  const ambientOcclusionSettings = useTextureStore(
    (s) => s.ambientOcclusionSettings
  );
  const specularSettings = useTextureStore((s) => s.specularSettings);
  const exportSettings = useTextureStore((s) => s.exportSettings);

  /**
   * Load an image from a file
   */
  const loadImage = useCallback(
    async (file: File): Promise<HTMLImageElement> => {
      if (isTGAFile(file.name)) {
        const tga = await loadTGAFromFile(file);
        return tga.toImage();
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
    []
  );

  /**
   * Get base name from filename (without extension)
   */
  const getBaseName = useCallback((filename: string): string => {
    return filename.replace(/\.[^/.]+$/, "");
  }, []);

  /**
   * Process a single image and generate all selected textures
   */
  const processImage = useCallback(
    async (image: HTMLImageElement, baseName: string, options: BatchOptions) => {
      const format = exportSettings.format;
      const exportOptions = {
        jpgQuality: exportSettings.jpgQuality,
        pngOpacity: exportSettings.pngTransparency,
      };

      // Create generators
      const normalGenerator = new NormalMapGenerator();
      const displacementGenerator = new DisplacementGenerator();
      const aoGenerator = new AmbientOcclusionGenerator();
      const specularGenerator = new SpecularGenerator();

      try {
        // Generate and export normal map
        if (options.includeNormal) {
          normalGenerator.setHeightMap(image);
          normalGenerator.updateSettings({
            strength: normalSettings.strength,
            level: normalSettings.level,
            blur: normalSettings.smoothing,
            type: normalSettings.type,
            invertR: normalSettings.invertR,
            invertG: normalSettings.invertG,
            invertSource: normalSettings.invertSource,
          });
          const canvas = normalGenerator.render();
          exportCanvas(canvas, `${baseName}_normal`, format, exportOptions);
        }

        // Generate and export displacement map
        if (options.includeDisplacement) {
          displacementGenerator.setSource(image);
          displacementGenerator.updateSettings({
            contrast: displacementSettings.contrast,
            blur: displacementSettings.smoothing,
            invert: displacementSettings.invert,
          });
          const canvas = displacementGenerator.render();
          exportCanvas(canvas, `${baseName}_displacement`, format, exportOptions);
        }

        // Generate and export AO map
        if (options.includeAmbientOcclusion) {
          aoGenerator.setSource(image);
          aoGenerator.updateSettings({
            strength: ambientOcclusionSettings.strength,
            mean: ambientOcclusionSettings.mean,
            range: ambientOcclusionSettings.range,
            blur: ambientOcclusionSettings.smoothing,
            invert: ambientOcclusionSettings.invert,
          });
          const canvas = aoGenerator.render();
          exportCanvas(canvas, `${baseName}_ao`, format, exportOptions);
        }

        // Generate and export specular map
        if (options.includeSpecular) {
          specularGenerator.setSource(image);
          specularGenerator.updateSettings({
            strength: specularSettings.strength,
            mean: specularSettings.mean,
            range: specularSettings.range,
            falloff: specularSettings.falloff as FalloffType,
            invert: specularSettings.invert,
          });
          const canvas = specularGenerator.render();
          exportCanvas(canvas, `${baseName}_specular`, format, exportOptions);
        }
      } finally {
        // Cleanup generators
        normalGenerator.dispose();
        displacementGenerator.dispose();
        aoGenerator.dispose();
        specularGenerator.dispose();
      }
    },
    [
      normalSettings,
      displacementSettings,
      ambientOcclusionSettings,
      specularSettings,
      exportSettings,
    ]
  );

  /**
   * Process all files in batch
   */
  const processBatch = useCallback(
    async (files: File[], options: BatchOptions) => {
      setCancelRequested(false);
      setProgress({
        current: 0,
        total: files.length,
        currentFile: "",
        status: "processing",
      });

      try {
        for (let i = 0; i < files.length; i++) {
          if (cancelRequested) {
            setProgress((prev) => ({ ...prev, status: "idle" }));
            return;
          }

          const file = files[i];
          const baseName = getBaseName(file.name);

          setProgress({
            current: i + 1,
            total: files.length,
            currentFile: file.name,
            status: "processing",
          });

          try {
            const image = await loadImage(file);
            await processImage(image, baseName, options);
          } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
            // Continue with next file
          }

          // Small delay to prevent browser freezing
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        setProgress((prev) => ({
          ...prev,
          status: "complete",
        }));
      } catch (error) {
        setProgress((prev) => ({
          ...prev,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    },
    [loadImage, processImage, getBaseName, cancelRequested]
  );

  /**
   * Cancel batch processing
   */
  const cancel = useCallback(() => {
    setCancelRequested(true);
  }, []);

  return {
    processBatch,
    progress,
    isProcessing: progress.status === "processing",
    cancel,
  };
}

export default useBatchProcessing;

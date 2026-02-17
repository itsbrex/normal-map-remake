"use client";

/**
 * Normal Map Generator Page
 * Main page for normal map and texture generation
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DropZone, TexturePreview, ThreeCanvas, PicturesUpload } from "@/components/canvas";
import type { ModelType } from "@/components/canvas";
import {
  NormalMapControls,
  DisplacementControls,
  AmbientOcclusionControls,
  SpecularControls,
} from "@/components/controls";
import { ModeSelector, ExportControls, BatchProcessing, ThemeToggle, CornerBanner } from "@/components/layout";
import { useTextureStore, TextureType, useLoading } from "@/stores/textureStore";
import { useTextureGeneration } from "@/hooks/useTextureGeneration";
import { exportCanvas, exportAllCanvases } from "@/lib/utils/fileExport";
import { loadTGAFromFile, isTGAFile } from "@/lib/loaders";
import { toast } from "sonner";

export default function NormalMapPage() {
  const [mounted, setMounted] = useState(false);
  const [modelType, setModelType] = useState<ModelType>("cube");
  const [autoRotate, setAutoRotate] = useState(true);
  const [showPreview3D, setShowPreview3D] = useState(true);

  // Store state
  const heightMap = useTextureStore((s) => s.heightMap);
  const setHeightMap = useTextureStore((s) => s.setHeightMap);
  const normalMapMode = useTextureStore((s) => s.normalMapMode);
  const currentTexture = useTextureStore((s) => s.currentTexture);
  const setCurrentTexture = useTextureStore((s) => s.setCurrentTexture);
  const generatedTextures = useTextureStore((s) => s.generatedTextures);
  const exportSettings = useTextureStore((s) => s.exportSettings);
  const autoUpdate = useTextureStore((s) => s.autoUpdate);
  const setAutoUpdate = useTextureStore((s) => s.setAutoUpdate);
  const loading = useLoading();

  // Texture generation hook
  const { generateAll } = useTextureGeneration();

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Handle image load from DropZone
   */
  const handleImageLoad = useCallback(
    async (image: HTMLImageElement, file: File) => {
      // Handle TGA files specially (DropZone doesn't handle them yet)
      if (isTGAFile(file.name)) {
        try {
          const tga = await loadTGAFromFile(file);
          const img = await tga.toImage();
          setHeightMap(img);
          toast.success("TGA Image Loaded", { description: `${file.name} (${img.naturalWidth}x${img.naturalHeight})` });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error("Failed to load TGA file:", error);
          toast.error("Failed to Load TGA", { description: message });
        }
        return;
      }

      // Standard image - already loaded by DropZone
      setHeightMap(image);
    },
    [setHeightMap]
  );

  /**
   * Handle export single texture
   */
  const handleDownload = useCallback(() => {
    let canvas: HTMLCanvasElement | null = null;
    let name = exportSettings.filename || "texture";

    switch (currentTexture) {
      case TextureType.Normal:
        canvas = generatedTextures.normal;
        name = exportSettings.filename || "normal";
        break;
      case TextureType.Displacement:
        canvas = generatedTextures.displacement;
        name = exportSettings.filename || "displacement";
        break;
      case TextureType.AmbientOcclusion:
        canvas = generatedTextures.ambientOcclusion;
        name = exportSettings.filename || "ao";
        break;
      case TextureType.Specular:
        canvas = generatedTextures.specular;
        name = exportSettings.filename || "specular";
        break;
    }

    if (canvas) {
      exportCanvas(canvas, name, exportSettings.format, {
        jpgQuality: exportSettings.jpgQuality,
        pngOpacity: exportSettings.pngTransparency,
      });
    }
  }, [currentTexture, generatedTextures, exportSettings]);

  /**
   * Handle export all textures
   */
  const handleDownloadAll = useCallback(() => {
    const canvases: { canvas: HTMLCanvasElement; name: string }[] = [];
    const baseName = exportSettings.filename || "texture";

    if (generatedTextures.normal) {
      canvases.push({
        canvas: generatedTextures.normal,
        name: `${baseName}_normal`,
      });
    }
    if (generatedTextures.displacement) {
      canvases.push({
        canvas: generatedTextures.displacement,
        name: `${baseName}_displacement`,
      });
    }
    if (generatedTextures.ambientOcclusion) {
      canvases.push({
        canvas: generatedTextures.ambientOcclusion,
        name: `${baseName}_ao`,
      });
    }
    if (generatedTextures.specular) {
      canvases.push({
        canvas: generatedTextures.specular,
        name: `${baseName}_specular`,
      });
    }

    exportAllCanvases(canvases, exportSettings.format, {
      jpgQuality: exportSettings.jpgQuality,
      pngOpacity: exportSettings.pngTransparency,
    });
  }, [generatedTextures, exportSettings]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Corner Banner */}
      <CornerBanner />

      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold truncate">
              <span className="sm:hidden">Normal Map</span>
              <span className="hidden sm:inline">Normal Map Generator</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <BatchProcessing />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Label
                htmlFor="auto-update"
                className="text-sm text-muted-foreground"
              >
                Auto Update
              </Label>
              <Checkbox
                id="auto-update"
                checked={autoUpdate}
                onCheckedChange={(checked) => setAutoUpdate(!!checked)}
              />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 flex-1">
        {/* Mobile controls bar - shown only on small screens */}
        <div className="flex items-center justify-between gap-4 mb-4 md:hidden">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="auto-update-mobile"
              className="text-sm text-muted-foreground"
            >
              Auto
            </Label>
            <Checkbox
              id="auto-update-mobile"
              checked={autoUpdate}
              onCheckedChange={(checked) => setAutoUpdate(!!checked)}
            />
          </div>
          <div className="sm:hidden">
            <BatchProcessing />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Panel - Source Image */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-4">Source Image</h3>
                <ModeSelector className="mb-4" />
                {normalMapMode === "height" ? (
                  <DropZone
                    onImageLoad={handleImageLoad}
                    className="h-48"
                  />
                ) : (
                  <PicturesUpload previewSize={80} />
                )}
                {heightMap && normalMapMode === "height" && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {heightMap.naturalWidth} x {heightMap.naturalHeight}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => !autoUpdate && generateAll()}
                      disabled={autoUpdate}
                    >
                      Generate All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Controls */}
            <Card>
              <CardContent className="p-4">
                <ExportControls
                  onDownload={handleDownload}
                  onDownloadAll={handleDownloadAll}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Preview */}
          <div className="lg:col-span-6 space-y-4">
            {/* Texture Type Tabs */}
            <Tabs
              value={currentTexture.toString()}
              onValueChange={(v) => setCurrentTexture(parseInt(v) as TextureType)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="0" className="flex-1 text-xs sm:text-sm">
                  <span className="sm:hidden">Norm</span>
                  <span className="hidden sm:inline">Normal</span>
                </TabsTrigger>
                <TabsTrigger value="1" className="flex-1 text-xs sm:text-sm">
                  <span className="sm:hidden">Disp</span>
                  <span className="hidden sm:inline">Displacement</span>
                </TabsTrigger>
                <TabsTrigger value="2" className="flex-1 text-xs sm:text-sm">
                  AO
                </TabsTrigger>
                <TabsTrigger value="3" className="flex-1 text-xs sm:text-sm">
                  <span className="sm:hidden">Spec</span>
                  <span className="hidden sm:inline">Specular</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="0" className="mt-0">
                <TexturePreview
                  canvas={generatedTextures.normal}
                  title="Normal Map"
                  className="aspect-square"
                  isLoading={loading.normal}
                />
              </TabsContent>
              <TabsContent value="1" className="mt-0">
                <TexturePreview
                  canvas={generatedTextures.displacement}
                  title="Displacement Map"
                  className="aspect-square"
                  isLoading={loading.displacement}
                />
              </TabsContent>
              <TabsContent value="2" className="mt-0">
                <TexturePreview
                  canvas={generatedTextures.ambientOcclusion}
                  title="Ambient Occlusion"
                  className="aspect-square"
                  isLoading={loading.ambientOcclusion}
                />
              </TabsContent>
              <TabsContent value="3" className="mt-0">
                <TexturePreview
                  canvas={generatedTextures.specular}
                  title="Specular Map"
                  className="aspect-square"
                  isLoading={loading.specular}
                />
              </TabsContent>
            </Tabs>

            {/* 3D Preview */}
            {showPreview3D && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">3D Preview</h3>
                    <div className="flex items-center gap-2">
                      <Select
                        value={modelType}
                        onValueChange={(v) => setModelType(v as ModelType)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cube">Cube</SelectItem>
                          <SelectItem value="sphere">Sphere</SelectItem>
                          <SelectItem value="cylinder">Cylinder</SelectItem>
                          <SelectItem value="plane">Plane</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoRotate(!autoRotate)}
                      >
                        <Eye
                          className={`h-4 w-4 ${autoRotate ? "text-primary" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                  <ThreeCanvas
                    className="aspect-video w-full"
                    modelType={modelType}
                    autoRotate={autoRotate}
                    enableNormal={true}
                    enableDisplacement={false}
                    enableAO={true}
                    enableSpecular={true}
                    enableDiffuse={true}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Controls */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Settings</h3>
                </div>

                {currentTexture === TextureType.Normal && (
                  <NormalMapControls />
                )}
                {currentTexture === TextureType.Displacement && (
                  <DisplacementControls />
                )}
                {currentTexture === TextureType.AmbientOcclusion && (
                  <AmbientOcclusionControls />
                )}
                {currentTexture === TextureType.Specular && (
                  <SpecularControls />
                )}
              </CardContent>
            </Card>

            {/* 3D Preview Toggle */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-3d" className="text-sm">
                    Show 3D Preview
                  </Label>
                  <Checkbox
                    id="show-3d"
                    checked={showPreview3D}
                    onCheckedChange={(checked) => setShowPreview3D(!!checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Original project by{" "}
            <a
              href="https://github.com/cpetry"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Christian Petry
            </a>{" "}
            | MIT License
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Refactored by{" "}
            <a
              href="https://github.com/itsbrex/normal-map-remake"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              itsbrex
            </a>{" "}
            with ❤️ and 👽
          </p>
        </div>
      </footer>
    </div>
  );
}

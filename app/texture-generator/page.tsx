"use client";

/**
 * Texture Generator Page
 * Procedural texture generation tool
 *
 * Based on original TextureGenerator-Online by Christian Petry (MIT 2014)
 */

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TexturePreview } from "@/components/canvas";
import { ThemeToggle, CornerBanner } from "@/components/layout";
import {
  useTextureGeneratorStore,
  ProceduralTextureType,
} from "@/stores/textureGeneratorStore";
import {
  generateBrick,
  generateChecker,
  generateClouds,
  generateGradient,
  generatePerlinNoise,
  generateTerrain,
  generateTiles,
  generateTextiles,
} from "@/lib/generators";
import { exportCanvas } from "@/lib/utils/fileExport";

const TEXTURE_TYPES: { value: ProceduralTextureType; label: string }[] = [
  { value: "brick", label: "Brick" },
  { value: "checker", label: "Checker" },
  { value: "clouds", label: "Clouds" },
  { value: "gradient", label: "Gradient" },
  { value: "perlinNoise", label: "Perlin Noise" },
  { value: "terrain", label: "Terrain" },
  { value: "tiles", label: "Tiles" },
  { value: "textiles", label: "Textiles" },
];

export default function TextureGeneratorPage() {
  const [mounted, setMounted] = useState(false);

  // Store state
  const currentType = useTextureGeneratorStore((s) => s.currentType);
  const setCurrentType = useTextureGeneratorStore((s) => s.setCurrentType);
  const generatedTexture = useTextureGeneratorStore((s) => s.generatedTexture);
  const setGeneratedTexture = useTextureGeneratorStore(
    (s) => s.setGeneratedTexture
  );
  const textureWidth = useTextureGeneratorStore((s) => s.textureWidth);
  const textureHeight = useTextureGeneratorStore((s) => s.textureHeight);
  const setTextureSize = useTextureGeneratorStore((s) => s.setTextureSize);

  // Settings
  const brickSettings = useTextureGeneratorStore((s) => s.brickSettings);
  const setBrickSettings = useTextureGeneratorStore((s) => s.setBrickSettings);
  const checkerSettings = useTextureGeneratorStore((s) => s.checkerSettings);
  const setCheckerSettings = useTextureGeneratorStore(
    (s) => s.setCheckerSettings
  );
  const cloudsSettings = useTextureGeneratorStore((s) => s.cloudsSettings);
  const setCloudsSettings = useTextureGeneratorStore((s) => s.setCloudsSettings);
  const gradientSettings = useTextureGeneratorStore((s) => s.gradientSettings);
  const setGradientSettings = useTextureGeneratorStore(
    (s) => s.setGradientSettings
  );
  const perlinNoiseSettings = useTextureGeneratorStore(
    (s) => s.perlinNoiseSettings
  );
  const setPerlinNoiseSettings = useTextureGeneratorStore(
    (s) => s.setPerlinNoiseSettings
  );
  const terrainSettings = useTextureGeneratorStore((s) => s.terrainSettings);
  const setTerrainSettings = useTextureGeneratorStore(
    (s) => s.setTerrainSettings
  );
  const tilesSettings = useTextureGeneratorStore((s) => s.tilesSettings);
  const setTilesSettings = useTextureGeneratorStore((s) => s.setTilesSettings);
  const textilesSettings = useTextureGeneratorStore((s) => s.textilesSettings);
  const setTextilesSettings = useTextureGeneratorStore(
    (s) => s.setTextilesSettings
  );

  // Export settings
  const exportFilename = useTextureGeneratorStore((s) => s.exportFilename);
  const setExportFilename = useTextureGeneratorStore((s) => s.setExportFilename);
  const exportFormat = useTextureGeneratorStore((s) => s.exportFormat);
  const setExportFormat = useTextureGeneratorStore((s) => s.setExportFormat);
  const exportJpgQuality = useTextureGeneratorStore((s) => s.exportJpgQuality);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Generate the current texture
   */
  const generateTexture = useCallback(() => {
    let canvas: HTMLCanvasElement | null = null;

    switch (currentType) {
      case "brick":
        canvas = generateBrick(textureWidth, textureHeight, brickSettings);
        break;
      case "checker":
        canvas = generateChecker(textureWidth, textureHeight, checkerSettings);
        break;
      case "clouds":
        canvas = generateClouds(textureWidth, textureHeight, cloudsSettings);
        break;
      case "gradient":
        canvas = generateGradient(textureWidth, textureHeight, gradientSettings);
        break;
      case "perlinNoise":
        canvas = generatePerlinNoise(
          textureWidth,
          textureHeight,
          perlinNoiseSettings
        );
        break;
      case "terrain":
        canvas = generateTerrain(textureWidth, textureHeight, terrainSettings);
        break;
      case "tiles":
        canvas = generateTiles(textureWidth, textureHeight, tilesSettings);
        break;
      case "textiles":
        canvas = generateTextiles(textureWidth, textureHeight, textilesSettings);
        break;
    }

    setGeneratedTexture(canvas);
  }, [
    currentType,
    textureWidth,
    textureHeight,
    brickSettings,
    checkerSettings,
    cloudsSettings,
    gradientSettings,
    perlinNoiseSettings,
    terrainSettings,
    tilesSettings,
    textilesSettings,
    setGeneratedTexture,
  ]);

  // Auto-generate on settings change
  useEffect(() => {
    if (mounted) {
      generateTexture();
    }
  }, [mounted, generateTexture]);

  /**
   * Handle download
   */
  const handleDownload = useCallback(() => {
    if (generatedTexture) {
      exportCanvas(generatedTexture, exportFilename || "texture", exportFormat, {
        jpgQuality: exportJpgQuality,
      });
    }
  }, [generatedTexture, exportFilename, exportFormat, exportJpgQuality]);

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
              <span className="sm:hidden">Textures</span>
              <span className="hidden sm:inline">Texture Generator</span>
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-4 sm:py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Panel - Texture Type Selection */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-4">Texture Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {TEXTURE_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={currentType === type.value ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => setCurrentType(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Size Settings */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-4">Size</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Width</Label>
                    <Select
                      value={textureWidth.toString()}
                      onValueChange={(v) =>
                        setTextureSize(parseInt(v), textureHeight)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[128, 256, 512, 1024, 2048].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Height</Label>
                    <Select
                      value={textureHeight.toString()}
                      onValueChange={(v) =>
                        setTextureSize(textureWidth, parseInt(v))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[128, 256, 512, 1024, 2048].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Controls */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-4">Export</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Filename</Label>
                    <Input
                      value={exportFilename}
                      onChange={(e) => setExportFilename(e.target.value)}
                      placeholder="texture"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Format</Label>
                    <Select
                      value={exportFormat}
                      onValueChange={(v) =>
                        setExportFormat(v as "png" | "jpg" | "tiff")
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="tiff">TIFF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={!generatedTexture}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Preview */}
          <div className="lg:col-span-6">
            <TexturePreview
              canvas={generatedTexture}
              title={
                TEXTURE_TYPES.find((t) => t.value === currentType)?.label ||
                "Texture"
              }
              className="aspect-square"
            />
          </div>

          {/* Right Panel - Settings */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Settings</h3>
                </div>

                {/* Brick Settings */}
                {currentType === "brick" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Cols</Label>
                        <Input
                          type="number"
                          value={brickSettings.width}
                          onChange={(e) =>
                            setBrickSettings({ width: parseInt(e.target.value) || 1 })
                          }
                          min={1}
                          max={50}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rows</Label>
                        <Input
                          type="number"
                          value={brickSettings.height}
                          onChange={(e) =>
                            setBrickSettings({ height: parseInt(e.target.value) || 1 })
                          }
                          min={1}
                          max={50}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Brick Color</Label>
                      <Input
                        type="color"
                        value={brickSettings.brickColor}
                        onChange={(e) =>
                          setBrickSettings({ brickColor: e.target.value })
                        }
                        className="h-8 w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Grout Color</Label>
                      <Input
                        type="color"
                        value={brickSettings.groutColor}
                        onChange={(e) =>
                          setBrickSettings({ groutColor: e.target.value })
                        }
                        className="h-8 w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Grout Width: {brickSettings.groutWidth}</Label>
                      <Slider
                        value={[brickSettings.groutWidth]}
                        onValueChange={([v]) =>
                          setBrickSettings({ groutWidth: v })
                        }
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                  </div>
                )}

                {/* Checker Settings */}
                {currentType === "checker" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Cols</Label>
                        <Input
                          type="number"
                          value={checkerSettings.countX}
                          onChange={(e) =>
                            setCheckerSettings({
                              countX: parseInt(e.target.value) || 1,
                            })
                          }
                          min={1}
                          max={50}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rows</Label>
                        <Input
                          type="number"
                          value={checkerSettings.countY}
                          onChange={(e) =>
                            setCheckerSettings({
                              countY: parseInt(e.target.value) || 1,
                            })
                          }
                          min={1}
                          max={50}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Color 1</Label>
                        <Input
                          type="color"
                          value={checkerSettings.color1}
                          onChange={(e) =>
                            setCheckerSettings({ color1: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color 2</Label>
                        <Input
                          type="color"
                          value={checkerSettings.color2}
                          onChange={(e) =>
                            setCheckerSettings({ color2: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Percentage: {checkerSettings.percentage}%</Label>
                      <Slider
                        value={[checkerSettings.percentage]}
                        onValueChange={([v]) =>
                          setCheckerSettings({ percentage: v })
                        }
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Seed</Label>
                      <Input
                        type="number"
                        value={checkerSettings.seed}
                        onChange={(e) =>
                          setCheckerSettings({ seed: parseInt(e.target.value) || 1 })
                        }
                        min={1}
                        max={1000}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Clouds Settings */}
                {currentType === "clouds" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Color 1</Label>
                        <Input
                          type="color"
                          value={cloudsSettings.color1}
                          onChange={(e) =>
                            setCloudsSettings({ color1: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color 2</Label>
                        <Input
                          type="color"
                          value={cloudsSettings.color2}
                          onChange={(e) =>
                            setCloudsSettings({ color2: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Scale: {cloudsSettings.scale}</Label>
                      <Slider
                        value={[cloudsSettings.scale]}
                        onValueChange={([v]) => setCloudsSettings({ scale: v })}
                        min={1}
                        max={20}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Detail: {cloudsSettings.detail.toFixed(2)}</Label>
                      <Slider
                        value={[cloudsSettings.detail]}
                        onValueChange={([v]) => setCloudsSettings({ detail: v })}
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Seed</Label>
                      <Input
                        type="number"
                        value={cloudsSettings.seed}
                        onChange={(e) =>
                          setCloudsSettings({ seed: parseInt(e.target.value) || 1 })
                        }
                        min={1}
                        max={1000}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Gradient Settings */}
                {currentType === "gradient" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={gradientSettings.type}
                        onValueChange={(v) =>
                          setGradientSettings({ type: v as "linear" | "radial" })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="radial">Radial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {gradientSettings.type === "linear" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Angle: {gradientSettings.angle || 0}°</Label>
                        <Slider
                          value={[gradientSettings.angle || 0]}
                          onValueChange={([v]) =>
                            setGradientSettings({ angle: v })
                          }
                          min={0}
                          max={360}
                          step={1}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      {gradientSettings.stops.map((stop, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={stop.color}
                            onChange={(e) => {
                              const newStops = [...gradientSettings.stops];
                              newStops[i] = { ...stop, color: e.target.value };
                              setGradientSettings({ stops: newStops });
                            }}
                            className="h-8 w-12"
                          />
                          <Input
                            type="number"
                            value={Math.round(stop.position * 100)}
                            onChange={(e) => {
                              const newStops = [...gradientSettings.stops];
                              newStops[i] = {
                                ...stop,
                                position: (parseInt(e.target.value) || 0) / 100,
                              };
                              setGradientSettings({ stops: newStops });
                            }}
                            min={0}
                            max={100}
                            className="h-8 flex-1 text-xs"
                          />
                          <span className="text-xs">%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Perlin Noise Settings */}
                {currentType === "perlinNoise" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Color 1</Label>
                        <Input
                          type="color"
                          value={perlinNoiseSettings.color1}
                          onChange={(e) =>
                            setPerlinNoiseSettings({ color1: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color 2</Label>
                        <Input
                          type="color"
                          value={perlinNoiseSettings.color2}
                          onChange={(e) =>
                            setPerlinNoiseSettings({ color2: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={perlinNoiseSettings.type}
                        onValueChange={(v) =>
                          setPerlinNoiseSettings({
                            type: v as "PerlinNoise" | "FractalNoise" | "Turbulence",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PerlinNoise">Perlin Noise</SelectItem>
                          <SelectItem value="FractalNoise">Fractal Noise</SelectItem>
                          <SelectItem value="Turbulence">Turbulence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Octaves: {perlinNoiseSettings.octaves}</Label>
                      <Slider
                        value={[perlinNoiseSettings.octaves]}
                        onValueChange={([v]) =>
                          setPerlinNoiseSettings({ octaves: v })
                        }
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Scale: {perlinNoiseSettings.scale}</Label>
                      <Slider
                        value={[perlinNoiseSettings.scale]}
                        onValueChange={([v]) =>
                          setPerlinNoiseSettings({ scale: v })
                        }
                        min={1}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Persistence: {perlinNoiseSettings.persistence.toFixed(2)}
                      </Label>
                      <Slider
                        value={[perlinNoiseSettings.persistence]}
                        onValueChange={([v]) =>
                          setPerlinNoiseSettings({ persistence: v })
                        }
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Seed</Label>
                      <Input
                        type="number"
                        value={perlinNoiseSettings.seed}
                        onChange={(e) =>
                          setPerlinNoiseSettings({
                            seed: parseInt(e.target.value) || 1,
                          })
                        }
                        min={1}
                        max={1000}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Terrain Settings */}
                {currentType === "terrain" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Scale: {terrainSettings.scale}</Label>
                      <Slider
                        value={[terrainSettings.scale]}
                        onValueChange={([v]) =>
                          setTerrainSettings({ scale: v })
                        }
                        min={2}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Detail: {terrainSettings.detail.toFixed(2)}</Label>
                      <Slider
                        value={[terrainSettings.detail]}
                        onValueChange={([v]) =>
                          setTerrainSettings({ detail: v })
                        }
                        min={0.25}
                        max={0.6}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Mountains: {terrainSettings.height.toFixed(2)}</Label>
                      <Slider
                        value={[terrainSettings.height]}
                        onValueChange={([v]) =>
                          setTerrainSettings({ height: v })
                        }
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terrain-colored"
                        checked={terrainSettings.colored}
                        onCheckedChange={(checked) =>
                          setTerrainSettings({ colored: !!checked })
                        }
                      />
                      <Label htmlFor="terrain-colored" className="text-xs">
                        Colored
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terrain-shadow"
                        checked={terrainSettings.shadow}
                        onCheckedChange={(checked) =>
                          setTerrainSettings({ shadow: !!checked })
                        }
                      />
                      <Label htmlFor="terrain-shadow" className="text-xs">
                        Shadow
                      </Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Seed</Label>
                      <Input
                        type="number"
                        value={terrainSettings.seed}
                        onChange={(e) =>
                          setTerrainSettings({
                            seed: parseInt(e.target.value) || 1,
                          })
                        }
                        min={1}
                        max={1000}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Tiles Settings */}
                {currentType === "tiles" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Cols</Label>
                        <Input
                          type="number"
                          value={tilesSettings.countX}
                          onChange={(e) =>
                            setTilesSettings({
                              countX: parseInt(e.target.value) || 1,
                            })
                          }
                          min={1}
                          max={50}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Rows</Label>
                        <Input
                          type="number"
                          value={tilesSettings.countY}
                          onChange={(e) =>
                            setTilesSettings({
                              countY: parseInt(e.target.value) || 1,
                            })
                          }
                          min={1}
                          max={50}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tile Color</Label>
                      <Input
                        type="color"
                        value={tilesSettings.tileColor}
                        onChange={(e) =>
                          setTilesSettings({ tileColor: e.target.value })
                        }
                        className="h-8 w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Grout Color</Label>
                      <Input
                        type="color"
                        value={tilesSettings.groutColor}
                        onChange={(e) =>
                          setTilesSettings({ groutColor: e.target.value })
                        }
                        className="h-8 w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Textiles Settings */}
                {currentType === "textiles" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Color 1</Label>
                        <Input
                          type="color"
                          value={textilesSettings.color1}
                          onChange={(e) =>
                            setTextilesSettings({ color1: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Color 2</Label>
                        <Input
                          type="color"
                          value={textilesSettings.color2}
                          onChange={(e) =>
                            setTextilesSettings({ color2: e.target.value })
                          }
                          className="h-8 w-full"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tightness: {textilesSettings.tightness}</Label>
                      <Slider
                        value={[textilesSettings.tightness]}
                        onValueChange={([v]) =>
                          setTextilesSettings({ tightness: v })
                        }
                        min={2}
                        max={20}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Thickness: {textilesSettings.thickness}</Label>
                      <Slider
                        value={[textilesSettings.thickness]}
                        onValueChange={([v]) =>
                          setTextilesSettings({ thickness: v })
                        }
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Depth: {textilesSettings.depth.toFixed(2)}</Label>
                      <Slider
                        value={[textilesSettings.depth]}
                        onValueChange={([v]) =>
                          setTextilesSettings({ depth: v })
                        }
                        min={0}
                        max={1}
                        step={0.05}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="textiles-double"
                        checked={textilesSettings.isDouble}
                        onCheckedChange={(checked) =>
                          setTextilesSettings({ isDouble: !!checked })
                        }
                      />
                      <Label htmlFor="textiles-double" className="text-xs">
                        Double Weave
                      </Label>
                    </div>
                  </div>
                )}
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

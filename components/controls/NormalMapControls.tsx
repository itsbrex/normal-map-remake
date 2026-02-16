"use client";

/**
 * NormalMapControls Component
 * UI controls for normal map generation settings
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";
import {
  useTextureStore,
  useNormalSettings,
  type EdgeDetectionType,
} from "@/stores/textureStore";

export interface NormalMapControlsProps {
  onSettingsChange?: () => void;
  className?: string;
}

export function NormalMapControls({
  onSettingsChange,
  className,
}: NormalMapControlsProps) {
  const settings = useNormalSettings();
  const setNormalSettings = useTextureStore((s) => s.setNormalSettings);
  const resetNormalSettings = useTextureStore((s) => s.resetNormalSettings);

  const handleChange = useCallback(
    <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
      setNormalSettings({ [key]: value });
      onSettingsChange?.();
    },
    [setNormalSettings, onSettingsChange]
  );

  const handleReset = useCallback(() => {
    resetNormalSettings();
    onSettingsChange?.();
  }, [resetNormalSettings, onSettingsChange]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 id="normal-settings-heading" className="text-sm font-semibold">Normal Map Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2"
          aria-label="Reset normal map settings to defaults"
        >
          <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
          Reset
        </Button>
      </div>

      <div className="space-y-4" role="group" aria-labelledby="normal-settings-heading">
        {/* Strength */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="strength" className="text-xs">
              Strength
            </Label>
            <Input
              id="strength-num"
              type="number"
              value={settings.strength}
              onChange={(e) =>
                handleChange("strength", parseFloat(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={0.1}
              max={10}
              step={0.1}
            />
          </div>
          <Slider
            id="strength"
            value={[settings.strength]}
            onValueChange={([v]) => handleChange("strength", v)}
            min={0.1}
            max={10}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="level" className="text-xs">
              Level
            </Label>
            <Input
              id="level-num"
              type="number"
              value={settings.level}
              onChange={(e) =>
                handleChange("level", parseInt(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={0}
              max={10}
              step={1}
            />
          </div>
          <Slider
            id="level"
            value={[settings.level]}
            onValueChange={([v]) => handleChange("level", v)}
            min={0}
            max={10}
            step={1}
            className="w-full"
          />
        </div>

        {/* Smoothing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="smoothing" className="text-xs">
              Blur / Sharpen
            </Label>
            <Input
              id="smoothing-num"
              type="number"
              value={settings.smoothing}
              onChange={(e) =>
                handleChange("smoothing", parseFloat(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={-10}
              max={10}
              step={0.5}
            />
          </div>
          <Slider
            id="smoothing"
            value={[settings.smoothing]}
            onValueChange={([v]) => handleChange("smoothing", v)}
            min={-10}
            max={10}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Filter Type */}
        <div className="space-y-2">
          <Label htmlFor="type" className="text-xs">
            Filter Type
          </Label>
          <Select
            value={settings.type}
            onValueChange={(v) => handleChange("type", v as EdgeDetectionType)}
          >
            <SelectTrigger id="type" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sobel">Sobel</SelectItem>
              <SelectItem value="scharr">Scharr</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="invertR"
              checked={settings.invertR}
              onCheckedChange={(checked) =>
                handleChange("invertR", checked === true)
              }
            />
            <Label htmlFor="invertR" className="text-xs cursor-pointer">
              Invert Red
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="invertG"
              checked={settings.invertG}
              onCheckedChange={(checked) =>
                handleChange("invertG", checked === true)
              }
            />
            <Label htmlFor="invertG" className="text-xs cursor-pointer">
              Invert Green
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="invertSource"
              checked={settings.invertSource}
              onCheckedChange={(checked) =>
                handleChange("invertSource", checked === true)
              }
            />
            <Label htmlFor="invertSource" className="text-xs cursor-pointer">
              Invert Height
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="heightOffset"
              checked={settings.heightOffset}
              onCheckedChange={(checked) =>
                handleChange("heightOffset", checked === true)
              }
            />
            <Label htmlFor="heightOffset" className="text-xs cursor-pointer">
              Height in Blue
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NormalMapControls;

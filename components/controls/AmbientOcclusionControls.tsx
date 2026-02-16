"use client";

/**
 * AmbientOcclusionControls Component
 * UI controls for ambient occlusion map generation settings
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  useTextureStore,
  useAmbientOcclusionSettings,
} from "@/stores/textureStore";

export interface AmbientOcclusionControlsProps {
  onSettingsChange?: () => void;
  className?: string;
}

export function AmbientOcclusionControls({
  onSettingsChange,
  className,
}: AmbientOcclusionControlsProps) {
  const settings = useAmbientOcclusionSettings();
  const setAmbientOcclusionSettings = useTextureStore(
    (s) => s.setAmbientOcclusionSettings
  );
  const resetAmbientOcclusionSettings = useTextureStore(
    (s) => s.resetAmbientOcclusionSettings
  );

  const handleChange = useCallback(
    <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
      setAmbientOcclusionSettings({ [key]: value });
      onSettingsChange?.();
    },
    [setAmbientOcclusionSettings, onSettingsChange]
  );

  const handleReset = useCallback(() => {
    resetAmbientOcclusionSettings();
    onSettingsChange?.();
  }, [resetAmbientOcclusionSettings, onSettingsChange]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Ambient Occlusion Settings</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {/* Strength */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ao-strength" className="text-xs">
              Strength
            </Label>
            <Input
              id="ao-strength-num"
              type="number"
              value={settings.strength}
              onChange={(e) =>
                handleChange("strength", parseFloat(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={0}
              max={1}
              step={0.05}
            />
          </div>
          <Slider
            id="ao-strength"
            value={[settings.strength]}
            onValueChange={([v]) => handleChange("strength", v)}
            min={0}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Mean */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ao-mean" className="text-xs">
              Mean
            </Label>
            <Input
              id="ao-mean-num"
              type="number"
              value={settings.mean}
              onChange={(e) =>
                handleChange("mean", parseFloat(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={0}
              max={255}
              step={1}
            />
          </div>
          <Slider
            id="ao-mean"
            value={[settings.mean]}
            onValueChange={([v]) => handleChange("mean", v)}
            min={0}
            max={255}
            step={1}
            className="w-full"
          />
        </div>

        {/* Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ao-range" className="text-xs">
              Range
            </Label>
            <Input
              id="ao-range-num"
              type="number"
              value={settings.range}
              onChange={(e) =>
                handleChange("range", parseFloat(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={0}
              max={255}
              step={1}
            />
          </div>
          <Slider
            id="ao-range"
            value={[settings.range]}
            onValueChange={([v]) => handleChange("range", v)}
            min={0}
            max={255}
            step={1}
            className="w-full"
          />
        </div>

        {/* Smoothing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ao-smoothing" className="text-xs">
              Blur / Sharpen
            </Label>
            <Input
              id="ao-smoothing-num"
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
            id="ao-smoothing"
            value={[settings.smoothing]}
            onValueChange={([v]) => handleChange("smoothing", v)}
            min={-10}
            max={10}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Invert */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="ao-invert"
            checked={settings.invert}
            onCheckedChange={(checked) =>
              handleChange("invert", checked === true)
            }
          />
          <Label htmlFor="ao-invert" className="text-xs cursor-pointer">
            Invert
          </Label>
        </div>
      </div>
    </div>
  );
}

export default AmbientOcclusionControls;

"use client";

/**
 * SpecularControls Component
 * UI controls for specular map generation settings
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
import { useTextureStore, useSpecularSettings } from "@/stores/textureStore";
import { FalloffType } from "@/lib/shaders";

export interface SpecularControlsProps {
  onSettingsChange?: () => void;
  className?: string;
}

export function SpecularControls({
  onSettingsChange,
  className,
}: SpecularControlsProps) {
  const settings = useSpecularSettings();
  const setSpecularSettings = useTextureStore((s) => s.setSpecularSettings);
  const resetSpecularSettings = useTextureStore((s) => s.resetSpecularSettings);

  const handleChange = useCallback(
    <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
      setSpecularSettings({ [key]: value });
      onSettingsChange?.();
    },
    [setSpecularSettings, onSettingsChange]
  );

  const handleReset = useCallback(() => {
    resetSpecularSettings();
    onSettingsChange?.();
  }, [resetSpecularSettings, onSettingsChange]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Specular Settings</h3>
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
            <Label htmlFor="spec-strength" className="text-xs">
              Strength
            </Label>
            <Input
              id="spec-strength-num"
              type="number"
              value={settings.strength}
              onChange={(e) =>
                handleChange("strength", parseFloat(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={0}
              max={2}
              step={0.1}
            />
          </div>
          <Slider
            id="spec-strength"
            value={[settings.strength]}
            onValueChange={([v]) => handleChange("strength", v)}
            min={0}
            max={2}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Mean */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="spec-mean" className="text-xs">
              Mean
            </Label>
            <Input
              id="spec-mean-num"
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
            id="spec-mean"
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
            <Label htmlFor="spec-range" className="text-xs">
              Range
            </Label>
            <Input
              id="spec-range-num"
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
            id="spec-range"
            value={[settings.range]}
            onValueChange={([v]) => handleChange("range", v)}
            min={0}
            max={255}
            step={1}
            className="w-full"
          />
        </div>

        {/* Falloff Type */}
        <div className="space-y-2">
          <Label htmlFor="spec-falloff" className="text-xs">
            Falloff Type
          </Label>
          <Select
            value={String(settings.falloff)}
            onValueChange={(v) => handleChange("falloff", parseInt(v) as FalloffType)}
          >
            <SelectTrigger id="spec-falloff" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(FalloffType.None)}>None</SelectItem>
              <SelectItem value={String(FalloffType.Linear)}>Linear</SelectItem>
              <SelectItem value={String(FalloffType.Square)}>Square</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invert */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="spec-invert"
            checked={settings.invert}
            onCheckedChange={(checked) =>
              handleChange("invert", checked === true)
            }
          />
          <Label htmlFor="spec-invert" className="text-xs cursor-pointer">
            Invert
          </Label>
        </div>
      </div>
    </div>
  );
}

export default SpecularControls;

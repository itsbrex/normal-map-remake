"use client";

/**
 * DisplacementControls Component
 * UI controls for displacement map generation settings
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
  useDisplacementSettings,
} from "@/stores/textureStore";

export interface DisplacementControlsProps {
  onSettingsChange?: () => void;
  className?: string;
}

export function DisplacementControls({
  onSettingsChange,
  className,
}: DisplacementControlsProps) {
  const settings = useDisplacementSettings();
  const setDisplacementSettings = useTextureStore(
    (s) => s.setDisplacementSettings
  );
  const resetDisplacementSettings = useTextureStore(
    (s) => s.resetDisplacementSettings
  );

  const handleChange = useCallback(
    <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
      setDisplacementSettings({ [key]: value });
      onSettingsChange?.();
    },
    [setDisplacementSettings, onSettingsChange]
  );

  const handleReset = useCallback(() => {
    resetDisplacementSettings();
    onSettingsChange?.();
  }, [resetDisplacementSettings, onSettingsChange]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Displacement Settings</h3>
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
        {/* Contrast */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="contrast" className="text-xs">
              Contrast
            </Label>
            <Input
              id="contrast-num"
              type="number"
              value={settings.contrast}
              onChange={(e) =>
                handleChange("contrast", parseFloat(e.target.value) || 0)
              }
              className="w-16 h-6 text-xs"
              min={-1}
              max={1}
              step={0.1}
            />
          </div>
          <Slider
            id="contrast"
            value={[settings.contrast]}
            onValueChange={([v]) => handleChange("contrast", v)}
            min={-1}
            max={1}
            step={0.01}
            className="w-full"
          />
        </div>

        {/* Smoothing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="dm-smoothing" className="text-xs">
              Blur / Sharpen
            </Label>
            <Input
              id="dm-smoothing-num"
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
            id="dm-smoothing"
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
            id="dm-invert"
            checked={settings.invert}
            onCheckedChange={(checked) =>
              handleChange("invert", checked === true)
            }
          />
          <Label htmlFor="dm-invert" className="text-xs cursor-pointer">
            Invert
          </Label>
        </div>
      </div>
    </div>
  );
}

export default DisplacementControls;

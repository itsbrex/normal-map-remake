"use client";

/**
 * ExportControls Component
 * Controls for exporting generated textures
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, DownloadCloud } from "lucide-react";
import { useTextureStore, type ExportFormat } from "@/stores/textureStore";

export interface ExportControlsProps {
  onDownload?: () => void;
  onDownloadAll?: () => void;
  className?: string;
}

export function ExportControls({
  onDownload,
  onDownloadAll,
  className,
}: ExportControlsProps) {
  const exportSettings = useTextureStore((s) => s.exportSettings);
  const setExportSettings = useTextureStore((s) => s.setExportSettings);

  const handleFormatChange = useCallback(
    (format: ExportFormat) => {
      setExportSettings({ format });
    },
    [setExportSettings]
  );

  const handleFilenameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setExportSettings({ filename: e.target.value });
    },
    [setExportSettings]
  );

  const handleQualityChange = useCallback(
    (value: number[]) => {
      setExportSettings({ jpgQuality: value[0] });
    },
    [setExportSettings]
  );

  const handleTransparencyChange = useCallback(
    (value: number[]) => {
      setExportSettings({ pngTransparency: value[0] });
    },
    [setExportSettings]
  );

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold mb-4">Export</h3>

      <div className="space-y-4">
        {/* Filename */}
        <div className="space-y-2">
          <Label htmlFor="filename" className="text-xs">
            Filename
          </Label>
          <Input
            id="filename"
            placeholder="NormalMap"
            value={exportSettings.filename}
            onChange={handleFilenameChange}
            className="h-8 text-xs"
          />
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label htmlFor="format" className="text-xs">
            Format
          </Label>
          <Select
            value={exportSettings.format}
            onValueChange={(v) => handleFormatChange(v as ExportFormat)}
          >
            <SelectTrigger id="format" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="tiff">TIFF</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* JPG Quality (only shown for JPG) */}
        {exportSettings.format === "jpg" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quality" className="text-xs">
                Quality
              </Label>
              <span className="text-xs text-muted-foreground">
                {exportSettings.jpgQuality}%
              </span>
            </div>
            <Slider
              id="quality"
              value={[exportSettings.jpgQuality]}
              onValueChange={handleQualityChange}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* PNG Transparency (only shown for PNG) */}
        {exportSettings.format === "png" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="transparency" className="text-xs">
                Opacity
              </Label>
              <span className="text-xs text-muted-foreground">
                {exportSettings.pngTransparency}%
              </span>
            </div>
            <Slider
              id="transparency"
              value={[exportSettings.pngTransparency]}
              onValueChange={handleTransparencyChange}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Download buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onDownload} className="flex-1 h-8 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button
            onClick={onDownloadAll}
            variant="outline"
            className="h-8 text-xs"
          >
            <DownloadCloud className="h-3 w-3 mr-1" />
            All
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ExportControls;

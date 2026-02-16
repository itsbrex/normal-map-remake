"use client";

/**
 * TexturePreview Component
 * Displays a generated texture with download functionality
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useRef, useEffect, useCallback, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Download, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface TexturePreviewProps {
  canvas: HTMLCanvasElement | null;
  title: string;
  size?: number;
  onDownload?: () => void;
  className?: string;
  isLoading?: boolean;
}

export const TexturePreview = memo(function TexturePreview({
  canvas,
  title,
  size = 200,
  onDownload,
  className,
  isLoading = false,
}: TexturePreviewProps) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Draw the source canvas to the preview canvas with proper scaling
   * Uses progressive downsampling for high-quality results
   */
  const drawPreview = useCallback(() => {
    if (!canvas || !previewRef.current) return;

    const preview = previewRef.current;
    const ctx = preview.getContext("2d");
    if (!ctx) return;

    const sourceWidth = canvas.width;
    const sourceHeight = canvas.height;

    // Calculate aspect ratio
    const ratio = sourceWidth / sourceHeight;
    const drawWidth = ratio >= 1 ? size : size * ratio;
    const drawHeight = ratio >= 1 ? size / ratio : size;

    // Set preview canvas size
    preview.width = drawWidth;
    preview.height = drawHeight;

    // Clear canvas
    ctx.clearRect(0, 0, drawWidth, drawHeight);

    // Progressive downsampling for better quality
    if (sourceWidth > drawWidth * 2 || sourceHeight > drawHeight * 2) {
      // Create temporary canvases for step-down
      let currentWidth = sourceWidth;
      let currentHeight = sourceHeight;
      const tempCanvas = document.createElement("canvas");
      const helperCanvas = document.createElement("canvas");

      tempCanvas.width = sourceWidth;
      tempCanvas.height = sourceHeight;
      helperCanvas.width = sourceWidth;
      helperCanvas.height = sourceHeight;

      const tempCtx = tempCanvas.getContext("2d");
      const helperCtx = helperCanvas.getContext("2d");

      if (!tempCtx || !helperCtx) {
        // Fallback to direct draw
        ctx.drawImage(canvas, 0, 0, drawWidth, drawHeight);
        return;
      }

      // Initial draw
      tempCtx.drawImage(canvas, 0, 0);

      // Progressive halving until we're within 2x of target
      while (currentWidth > drawWidth * 2 && currentHeight > drawHeight * 2) {
        helperCtx.clearRect(0, 0, currentWidth, currentHeight);
        helperCtx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight);
        tempCtx.clearRect(0, 0, currentWidth, currentHeight);
        tempCtx.drawImage(
          helperCanvas,
          0,
          0,
          currentWidth * 0.5,
          currentHeight * 0.5
        );
        currentWidth *= 0.5;
        currentHeight *= 0.5;
      }

      // Final draw to preview
      ctx.drawImage(tempCanvas, 0, 0, currentWidth, currentHeight, 0, 0, drawWidth, drawHeight);
    } else {
      // Direct draw for small images
      ctx.drawImage(canvas, 0, 0, drawWidth, drawHeight);
    }
  }, [canvas, size]);

  // Redraw when canvas changes
  useEffect(() => {
    drawPreview();
  }, [drawPreview, canvas]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          <Spinner className="h-4 w-4" />
        </div>
        <Skeleton
          className="rounded-lg"
          style={{ width: size, height: size }}
        />
        <div className="text-xs text-muted-foreground">Generating...</div>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 text-muted-foreground text-sm",
          className
        )}
        style={{ width: size, height: size }}
      >
        No texture
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Title */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <div className="flex gap-1">
          {/* Fullscreen button */}
          <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Maximize2 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <div className="flex items-center justify-center p-4">
                <img
                  src={canvas.toDataURL("image/png")}
                  alt={title}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Download button */}
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onDownload}
            >
              <Download className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview canvas */}
      <div
        className="flex items-center justify-center rounded-lg border border-muted-foreground/25 bg-muted/50 overflow-hidden"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={previewRef}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Dimensions */}
      <div className="text-xs text-muted-foreground">
        {canvas.width} x {canvas.height}
      </div>
    </div>
  );
});

export default TexturePreview;

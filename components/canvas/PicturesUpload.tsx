"use client";

/**
 * PicturesUpload Component
 * Upload area for 4 directional images (above, below, left, right)
 * Used for normal map generation from pictures mode
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useTextureStore } from "@/stores/textureStore";

export interface PicturesUploadProps {
  className?: string;
  previewSize?: number;
}

interface DirectionalImageProps {
  direction: "above" | "below" | "left" | "right";
  image: HTMLImageElement | null;
  onImageLoad: (image: HTMLImageElement) => void;
  onClear: () => void;
  size: number;
}

const DirectionIcon = {
  above: ArrowUp,
  below: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
};

const DirectionLabel = {
  above: "Above",
  below: "Below",
  left: "Left",
  right: "Right",
};

function DirectionalImage({
  direction,
  image,
  onImageLoad,
  onClear,
  size,
}: DirectionalImageProps) {
  const [isDragging, setIsDragging] = useState(false);
  const Icon = DirectionIcon[direction];

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        loadImage(files[0]);
      }
    },
    []
  );

  const loadImage = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          onImageLoad(img);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        loadImage(files[0]);
      }
    };
    input.click();
  }, [loadImage]);

  return (
    <div
      onClick={image ? undefined : handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        !image && "cursor-pointer"
      )}
      style={{ width: size, height: size }}
    >
      {image ? (
        <div className="relative w-full h-full">
          <img
            src={image.src}
            alt={DirectionLabel[direction]}
            className="w-full h-full object-cover rounded-md"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="absolute bottom-1 left-1 bg-background/80 rounded px-1">
            <span className="text-xs">{DirectionLabel[direction]}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 p-2 text-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {DirectionLabel[direction]}
          </span>
        </div>
      )}
    </div>
  );
}

export function PicturesUpload({
  className,
  previewSize = 100,
}: PicturesUploadProps) {
  const picturesSource = useTextureStore((s) => s.picturesSource);
  const setPicturesSource = useTextureStore((s) => s.setPicturesSource);

  const handleImageLoad = useCallback(
    (direction: "above" | "below" | "left" | "right") =>
      (image: HTMLImageElement) => {
        setPicturesSource({ [direction]: image });
      },
    [setPicturesSource]
  );

  const handleClear = useCallback(
    (direction: "above" | "below" | "left" | "right") => () => {
      setPicturesSource({ [direction]: null });
    },
    [setPicturesSource]
  );

  const allImagesLoaded =
    picturesSource.above &&
    picturesSource.below &&
    picturesSource.left &&
    picturesSource.right;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="text-sm text-muted-foreground">
        Upload 4 directional images for normal map generation
      </div>

      {/* 2x2 grid for directional images */}
      <div className="grid grid-cols-2 gap-2" style={{ maxWidth: previewSize * 2 + 8 }}>
        {/* Top row: Above */}
        <div className="col-span-2 flex justify-center">
          <DirectionalImage
            direction="above"
            image={picturesSource.above}
            onImageLoad={handleImageLoad("above")}
            onClear={handleClear("above")}
            size={previewSize}
          />
        </div>

        {/* Middle row: Left and Right */}
        <DirectionalImage
          direction="left"
          image={picturesSource.left}
          onImageLoad={handleImageLoad("left")}
          onClear={handleClear("left")}
          size={previewSize}
        />
        <DirectionalImage
          direction="right"
          image={picturesSource.right}
          onImageLoad={handleImageLoad("right")}
          onClear={handleClear("right")}
          size={previewSize}
        />

        {/* Bottom row: Below */}
        <div className="col-span-2 flex justify-center">
          <DirectionalImage
            direction="below"
            image={picturesSource.below}
            onImageLoad={handleImageLoad("below")}
            onClear={handleClear("below")}
            size={previewSize}
          />
        </div>
      </div>

      {/* Status */}
      {allImagesLoaded ? (
        <div className="text-xs text-green-500">
          All 4 images loaded - ready to generate
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {[
            picturesSource.above && "Above",
            picturesSource.below && "Below",
            picturesSource.left && "Left",
            picturesSource.right && "Right",
          ]
            .filter(Boolean)
            .join(", ") || "No images loaded"}
        </div>
      )}
    </div>
  );
}

export default PicturesUpload;

"use client";

/**
 * DropZone Component
 * Drag-and-drop file upload area with preview
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback, useState, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";

// Supported image formats
const ACCEPTED_FORMATS = ["image/png", "image/jpeg", "image/tga", "image/x-tga"];
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".tga"];

export interface DropZoneProps {
  onImageLoad: (image: HTMLImageElement, file: File) => void;
  label?: string;
  className?: string;
  previewSize?: number;
  disabled?: boolean;
}

export const DropZone = memo(function DropZone({
  onImageLoad,
  label = "Drop height map here",
  className,
  previewSize = 200,
  disabled = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Check if a number is a power of 2
   */
  const isPowerOf2 = (n: number): boolean => {
    return n > 0 && (n & (n - 1)) === 0;
  };

  /**
   * Load and process the image file
   */
  const loadImage = useCallback(
    (file: File) => {
      setError(null);

      // Check file type
      const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      const isTGA = fileExt === ".tga";

      if (!isTGA && !ACCEPTED_FORMATS.includes(file.type)) {
        setError(`Unsupported format. Use: ${ACCEPTED_EXTENSIONS.join(", ")}`);
        return;
      }

      // TGA files need special handling
      if (isTGA) {
        // TODO: Implement TGA loading
        setError("TGA support coming soon");
        return;
      }

      // Standard image loading
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setPreview(img.src);
          setFileName(file.name);
          setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          onImageLoad(img, file);
        };
        img.onerror = () => {
          setError("Failed to load image");
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        setError("Failed to read file");
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        loadImage(files[0]);
      }
    },
    [disabled, loadImage]
  );

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        loadImage(files[0]);
      }
    },
    [loadImage]
  );

  /**
   * Open file dialog
   */
  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  /**
   * Handle keyboard activation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled]
  );

  /**
   * Clear the current image
   */
  const handleClear = useCallback(() => {
    setPreview(null);
    setFileName(null);
    setDimensions(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const showPowerOf2Warning =
    dimensions &&
    (!isPowerOf2(dimensions.width) || !isPowerOf2(dimensions.height));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        aria-label="Upload image file"
      />

      {/* Drop zone area */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={preview ? `Image uploaded: ${fileName}. Click or press Enter to replace` : label}
        aria-disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          !preview && "min-h-[200px]"
        )}
        style={{
          width: previewSize,
          height: preview ? "auto" : previewSize,
        }}
      >
        {preview ? (
          // Preview image
          <div className="relative w-full">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-md"
              style={{ maxHeight: previewSize }}
            />
            {/* Clear button */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          // Upload prompt
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            {isDragging ? (
              <Upload className="h-10 w-10 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground/75">
              PNG, JPG, or TGA
            </p>
          </div>
        )}
      </div>

      {/* File info */}
      {fileName && (
        <div className="text-xs text-muted-foreground truncate max-w-full">
          {fileName}
        </div>
      )}

      {/* Dimensions and warnings */}
      {dimensions && (
        <div
          className={cn(
            "text-xs",
            showPowerOf2Warning ? "text-yellow-500" : "text-muted-foreground"
          )}
        >
          {dimensions.width} x {dimensions.height}
          {showPowerOf2Warning && " (not power of 2)"}
        </div>
      )}

      {/* Error message */}
      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
});

export default DropZone;

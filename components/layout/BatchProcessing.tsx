"use client";

/**
 * BatchProcessing Component
 * UI for batch processing multiple height maps
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { useCallback, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderOpen, X, Layers } from "lucide-react";
import { useBatchProcessing, BatchOptions } from "@/hooks/useBatchProcessing";

export interface BatchProcessingProps {
  className?: string;
}

export function BatchProcessing({ className }: BatchProcessingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<BatchOptions>({
    includeNormal: true,
    includeDisplacement: true,
    includeAmbientOcclusion: true,
    includeSpecular: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { processBatch, progress, isProcessing, cancel } = useBatchProcessing();

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        setSelectedFiles(Array.from(files));
      }
    },
    []
  );

  /**
   * Trigger file input click
   */
  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Remove a file from selection
   */
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Start batch processing
   */
  const handleStartBatch = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    await processBatch(selectedFiles, options);
  }, [selectedFiles, options, processBatch]);

  /**
   * Reset state when dialog closes
   */
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedFiles([]);
    }
  }, []);

  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Layers className="h-4 w-4" />
          Batch Mode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Processing</DialogTitle>
          <DialogDescription>
            Process multiple height maps and generate textures for each.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label>Select Files</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*, .tga"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={handleSelectClick}
              disabled={isProcessing}
              className="w-full"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Select Height Maps
            </Button>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm bg-muted rounded px-2 py-1"
                  >
                    <span className="truncate flex-1 mr-2">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isProcessing}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Texture Options */}
          <div className="space-y-2">
            <Label>Generate Textures</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batch-normal"
                  checked={options.includeNormal}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeNormal: !!checked,
                    }))
                  }
                  disabled={isProcessing}
                />
                <Label htmlFor="batch-normal" className="text-sm">
                  Normal Map
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batch-displacement"
                  checked={options.includeDisplacement}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeDisplacement: !!checked,
                    }))
                  }
                  disabled={isProcessing}
                />
                <Label htmlFor="batch-displacement" className="text-sm">
                  Displacement
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batch-ao"
                  checked={options.includeAmbientOcclusion}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeAmbientOcclusion: !!checked,
                    }))
                  }
                  disabled={isProcessing}
                />
                <Label htmlFor="batch-ao" className="text-sm">
                  Ambient Occlusion
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batch-specular"
                  checked={options.includeSpecular}
                  onCheckedChange={(checked) =>
                    setOptions((prev) => ({
                      ...prev,
                      includeSpecular: !!checked,
                    }))
                  }
                  disabled={isProcessing}
                />
                <Label htmlFor="batch-specular" className="text-sm">
                  Specular
                </Label>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Processing: {progress.currentFile}
                </span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={progressPercent} />
            </div>
          )}

          {/* Complete Status */}
          {progress.status === "complete" && (
            <div className="text-sm text-green-500">
              Batch processing complete! All textures have been downloaded.
            </div>
          )}

          {/* Error Status */}
          {progress.status === "error" && (
            <div className="text-sm text-red-500">
              Error: {progress.error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {isProcessing ? (
            <Button variant="destructive" onClick={cancel}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button
                onClick={handleStartBatch}
                disabled={
                  selectedFiles.length === 0 ||
                  (!options.includeNormal &&
                    !options.includeDisplacement &&
                    !options.includeAmbientOcclusion &&
                    !options.includeSpecular)
                }
              >
                Start Processing
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BatchProcessing;

"use client";

/**
 * ModeSelector Component
 * Switch between Height Map mode and Pictures mode
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTextureStore, type NormalMapMode } from "@/stores/textureStore";
import { Image, Grid2X2 } from "lucide-react";

export interface ModeSelectorProps {
  className?: string;
}

export function ModeSelector({ className }: ModeSelectorProps) {
  const normalMapMode = useTextureStore((s) => s.normalMapMode);
  const setNormalMapMode = useTextureStore((s) => s.setNormalMapMode);

  return (
    <Tabs
      value={normalMapMode}
      onValueChange={(v) => setNormalMapMode(v as NormalMapMode)}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="height" className="text-xs gap-1">
          <Image className="h-3 w-3" />
          Height Map
        </TabsTrigger>
        <TabsTrigger value="pictures" className="text-xs gap-1">
          <Grid2X2 className="h-3 w-3" />
          Pictures
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default ModeSelector;

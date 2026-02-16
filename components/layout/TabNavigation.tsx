"use client";

/**
 * TabNavigation Component
 * Navigation tabs for switching between texture types
 *
 * Based on original NormalMap-Online by Christian Petry (MIT 2014)
 */

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTextureStore, useCurrentTexture, TextureType } from "@/stores/textureStore";

export interface TabNavigationProps {
  className?: string;
}

const TAB_LABELS: Record<TextureType, string> = {
  [TextureType.Normal]: "Normal",
  [TextureType.Displacement]: "Displacement",
  [TextureType.AmbientOcclusion]: "AO",
  [TextureType.Specular]: "Specular",
};

export function TabNavigation({ className }: TabNavigationProps) {
  const currentTexture = useCurrentTexture();
  const setCurrentTexture = useTextureStore((s) => s.setCurrentTexture);

  return (
    <Tabs
      value={String(currentTexture)}
      onValueChange={(v) => setCurrentTexture(parseInt(v) as TextureType)}
      className={className}
    >
      <TabsList className="grid w-full grid-cols-4">
        {Object.entries(TAB_LABELS).map(([value, label]) => (
          <TabsTrigger key={value} value={value} className="text-xs">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default TabNavigation;

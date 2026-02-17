"use client";

import { cn } from "@/lib/utils";

export interface CornerBannerProps {
  className?: string;
}

/**
 * Corner ribbon banners for original and refactored repos
 * Hidden on mobile devices to avoid UI clutter
 */
export function CornerBanner({ className }: CornerBannerProps) {
  const originalRepo = "https://github.com/cpetry/NormalMap-Online";
  const refactoredRepo = "https://github.com/itsbrex/normal-map-remake";

  return (
    <div className={cn("hidden md:block", className)}>
      {/* Original repo banner - top right */}
      <a
        href={originalRepo}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-0 right-0 z-[100] overflow-hidden w-32 h-32 pointer-events-none"
      >
        <div
          className={cn(
            "absolute top-0 right-0 w-[170px] text-center py-1.5 text-xs font-semibold pointer-events-auto cursor-pointer",
            "transform rotate-45 translate-x-[29px] translate-y-[18px]",
            "transition-all duration-200 ease-in-out",
            "shadow-md hover:shadow-lg",
            "bg-gradient-to-r from-blue-600 to-cyan-500 text-white",
            "hover:from-blue-500 hover:to-cyan-400"
          )}
        >
          Check Original
        </div>
      </a>

      {/* Refactored repo banner - top left */}
      <a
        href={refactoredRepo}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-0 left-0 z-[100] overflow-hidden w-32 h-32 pointer-events-none"
      >
        <div
          className={cn(
            "absolute top-0 left-0 w-[170px] text-center py-1.5 text-xs font-semibold pointer-events-auto cursor-pointer",
            "transform -rotate-45 -translate-x-[29px] translate-y-[18px]",
            "transition-all duration-200 ease-in-out",
            "shadow-md hover:shadow-lg",
            "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
            "hover:from-purple-500 hover:to-pink-400"
          )}
        >
          Refactored
        </div>
      </a>
    </div>
  );
}

export type { CornerBannerProps as CornerBannerPropsType };

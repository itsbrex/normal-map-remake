"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CornerBannerProps {
  className?: string;
}

/**
 * Corner ribbon banner that shows original repo by default
 * and switches to refactored repo on hover
 */
export function CornerBanner({ className }: CornerBannerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const originalRepo = "https://github.com/cpetry/NormalMap-Online";
  const refactoredRepo = "https://github.com/itsbrex/normal-map-remake";

  return (
    <a
      href={isHovered ? refactoredRepo : originalRepo}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed top-0 right-0 z-[100] overflow-hidden w-32 h-32 pointer-events-none",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-[170px] text-center py-1.5 text-xs font-semibold pointer-events-auto cursor-pointer",
          "transform rotate-45 translate-x-[29px] translate-y-[18px]",
          "transition-all duration-300 ease-in-out",
          "shadow-md",
          isHovered
            ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white scale-105"
            : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
        )}
        style={{
          transformOrigin: "center",
        }}
      >
        <span
          className={cn(
            "inline-block transition-all duration-300",
            isHovered ? "animate-pulse" : ""
          )}
        >
          {isHovered ? "Refactored" : "Original"}
        </span>
      </div>
      {/* Decorative glow effect on hover */}
      <div
        className={cn(
          "absolute top-0 right-0 w-full h-full pointer-events-none",
          "transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="absolute top-8 right-8 w-8 h-8 bg-purple-400/30 rounded-full blur-xl" />
        <div className="absolute top-12 right-12 w-6 h-6 bg-pink-400/20 rounded-full blur-lg" />
      </div>
    </a>
  );
}

export type { CornerBannerProps as CornerBannerPropsType };

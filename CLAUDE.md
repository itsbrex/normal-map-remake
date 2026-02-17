# CLAUDE.md

This file provides guidance for AI assistants working with the normal-map-remake codebase.

## Project Overview

A browser-based normal map and texture generator built with Next.js. Users can generate normal maps, displacement maps, ambient occlusion maps, and specular maps from height maps or directional photographs. All processing is 100% client-side using WebGL/GPU acceleration via Three.js. Originally by Christian Petry (MIT 2014), refactored by itsbrex.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with Turbopack
- **Language:** TypeScript (strict mode)
- **UI:** React 19, Tailwind CSS v4, shadcn/ui (new-york style)
- **3D:** Three.js + @react-three/fiber + @react-three/drei
- **State:** Zustand with `subscribeWithSelector` middleware
- **Package Manager:** Bun (`bun.lock`)
- **Forms:** react-hook-form + zod validation

## Commands

```bash
bun run dev          # Start development server
bun run build        # Production build
bun run start        # Start production server
bun run lint         # Run ESLint
bun run typecheck    # TypeScript type checking (tsc --noEmit)
```

## Project Structure

```
app/                          # Next.js App Router pages
  layout.tsx                  # Root layout (metadata, theme provider, toaster)
  page.tsx                    # Landing page
  normal-map/page.tsx         # Normal map generator page (3D preview + controls)
  texture-generator/page.tsx  # Procedural texture generator page
  globals.css                 # Global styles, Tailwind imports, OKLCH theme vars

components/
  canvas/                     # Visual/interactive components
    ThreeCanvas.tsx            # 3D preview with react-three-fiber
    TexturePreview.tsx         # Generated texture display
    DropZone.tsx               # Drag-and-drop image upload
    PicturesUpload.tsx         # Multi-directional image upload (4 images)
  controls/                   # Settings panels for each map type
    NormalMapControls.tsx      # Strength, level, smoothing, algorithm
    DisplacementControls.tsx   # Contrast, smoothing, invert
    AmbientOcclusionControls.tsx
    SpecularControls.tsx
  layout/                     # Layout and navigation components
    ExportControls.tsx         # Export filename, format, quality
    ModeSelector.tsx           # Height map vs. pictures mode
    TabNavigation.tsx          # Tab-based navigation
    BatchProcessing.tsx        # Batch process multiple images
    ThemeToggle.tsx            # Dark/light theme switcher
    CornerBanner.tsx           # Attribution banner
  providers/
    ThemeProvider.tsx           # next-themes provider wrapper
  ui/                          # shadcn/ui components (do not edit directly)

hooks/
  useTextureGeneration.ts     # Main hook: runs generators, handles auto-update
  useBatchProcessing.ts       # Batch processing multiple images
  use-mobile.ts               # Mobile screen detection

stores/
  textureStore.ts             # Zustand store for normal map page state
  textureGeneratorStore.ts    # Zustand store for procedural texture page state

lib/
  generators/                 # Texture generation classes (GPU-accelerated)
    NormalMapGenerator.ts     # Normal maps via Sobel/Scharr algorithms
    DisplacementGenerator.ts  # Displacement maps
    AmbientOcclusionGenerator.ts
    SpecularGenerator.ts      # Specular maps with falloff options
    ProceduralTextures.ts     # Procedural textures (brick, checker, clouds, gradients, Perlin noise, terrain, tiles, textiles)
  shaders/                    # GLSL shaders as TypeScript string exports
    NormalMapShader.ts        # Normal map from height
    NormalMapFromPicturesShader.ts  # Normal map from directional photos
    NormalToHeightShader.ts   # Convert normal map back to height
    DisplacementShader.ts
    AmbientOcclusionShader.ts
    SpecularShader.ts
    BlurShaders.ts            # Horizontal/vertical blur
    CopyShader.ts             # Passthrough
  three/                      # Three.js utilities
    TextureRenderer.ts        # High-level shader rendering API
    SceneManager.ts           # Scene, camera, renderer management
  loaders/
    TGALoader.ts              # TGA image format loader
  utils.ts                    # cn() utility (clsx + tailwind-merge)
  utils/
    fileExport.ts             # Export canvas to PNG/JPG/TIFF
```

## Architecture Patterns

### Generator Pattern
All texture generators follow the same interface:
- Class-based with `updateSettings()` for configuration
- `render()` method returns an HTML canvas element
- `dispose()` method for GPU resource cleanup
- Use Three.js `WebGLRenderer` internally with GLSL shaders

### Shader Pattern
- GLSL shaders exported as TypeScript template literal strings
- Separate TypeScript interfaces for uniforms
- Factory functions to create default uniform objects
- Stored in `lib/shaders/` with consistent naming

### State Management
- Zustand stores with `subscribeWithSelector` middleware
- Default values defined as exported constants
- Stores expose setter actions and selector hooks
- Two stores: `textureStore` (normal map page), `textureGeneratorStore` (procedural page)

### Component Organization
- `"use client"` directive on interactive components
- `React.memo` used for performance-critical 3D components
- Controls separated from canvas/display components
- shadcn/ui components in `components/ui/` — managed by shadcn CLI, do not hand-edit

## Code Conventions

- **Components:** PascalCase filenames matching export name
- **Hooks:** camelCase with `use` prefix
- **Store actions:** camelCase with `set`/`reset` prefixes
- **Constants:** camelCase or SCREAMING_SNAKE_CASE
- **Imports:** Use `@/*` path alias (maps to project root)
- **Barrel exports:** `index.ts` files in `lib/generators/`, `lib/shaders/`, `lib/three/`, `lib/loaders/`, `hooks/`
- **Unused variables:** Prefix with `_` (ESLint configured to allow)
- **`any` type:** Allowed (ESLint `@typescript-eslint/no-explicit-any` is off)

## ESLint Configuration

Flat config format (ESLint v9) in `eslint.config.mjs`:
- `typescript-eslint` recommended rules
- `@next/eslint-plugin-next` with core-web-vitals
- Ignores: `.next/`, `node_modules/`, `og-site/`

## Styling

- Tailwind CSS v4 with PostCSS
- OKLCH color model for theme variables (defined in `app/globals.css`)
- Dark mode via CSS class selector (`next-themes`)
- shadcn/ui configured with `new-york` style, `neutral` base color, CSS variables enabled

## Important Notes

- **No test framework** is configured. There are no tests in the project.
- **No Prettier** — formatting is handled by ESLint only.
- **Client-side only** processing — no server-side texture generation. All GPU work happens in the browser.
- **shadcn/ui components** (`components/ui/`) are generated by the shadcn CLI. Update them via `bun run shadcn:update`, not by hand.
- The `og-site/` directory is excluded from TypeScript, ESLint, and git — it is a legacy directory.

## CI/CD

Two GitHub Actions workflows in `.github/workflows/`:
- `claude.yml` — Claude Code assistant triggered by `@claude` mentions in issues/PRs
- `claude-code-review.yml` — Automated code review on pull requests

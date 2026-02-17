import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Grid3X3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle, CornerBanner } from "@/components/layout";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Corner Banner */}
      <CornerBanner />

      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold">NormalMap-Online</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a
                href="https://github.com/cpetry/NormalMap-Online"
                target="_blank"
                rel="noopener noreferrer"
                title="Original repository by cpetry (Christian Petry)"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Original Repo
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild className="sm:hidden">
              <a
                href="https://github.com/cpetry/NormalMap-Online"
                target="_blank"
                rel="noopener noreferrer"
                title="Original repository"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div id="main-content" className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold mb-4">
            Texture Map Generator
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base sm:text-lg px-4 sm:px-0">
            Create normal maps, displacement maps, ambient occlusion, and specular
            maps directly in your browser. No uploads required - completely
            client-side processing with GPU acceleration.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-4xl w-full px-4 sm:px-0">
          <Link href="/normal-map" className="group">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Layers className="h-6 w-6" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Normal Map Generator
                  </CardTitle>
                </div>
                <CardDescription className="pt-2">
                  Generate normal maps from height maps or directional photographs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sobel & Scharr edge detection algorithms</li>
                  <li>• Displacement map generation</li>
                  <li>• Ambient occlusion calculation</li>
                  <li>• Specular map creation</li>
                  <li>• Real-time 3D preview</li>
                  <li>• Export to PNG, JPG, TIFF</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          <Link href="/texture-generator" className="group">
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Grid3X3 className="h-6 w-6" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Texture Generator
                  </CardTitle>
                </div>
                <CardDescription className="pt-2">
                  Create procedural textures for materials and surfaces.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Brick and tile patterns</li>
                  <li>• Perlin & fractal noise</li>
                  <li>• Terrain heightmaps</li>
                  <li>• Checker patterns</li>
                  <li>• Linear & radial gradients</li>
                  <li>• Cloud textures</li>
                </ul>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-12 sm:mt-16 text-center px-4">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Features</h3>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <span className="px-2 sm:px-3 py-1 rounded-full bg-muted">GPU Accelerated</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-muted">100% Client-Side</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-muted">No Data Upload</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-muted">TGA Support</span>
            <span className="px-2 sm:px-3 py-1 rounded-full bg-muted">Batch Export</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Original project by{" "}
            <a
              href="https://github.com/cpetry"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              Christian Petry
            </a>{" "}
            | MIT License
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Refactored by{" "}
            <a
              href="https://github.com/itsbrex/normal-map-remake"
              className="underline hover:text-foreground"
              target="_blank"
              rel="noopener noreferrer"
            >
              itsbrex
            </a>{" "}
            with ❤️ and 👽
          </p>
        </div>
      </footer>
    </main>
  );
}

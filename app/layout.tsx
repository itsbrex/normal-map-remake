import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://normalmap-online.vercel.app"
  ),
  title: "NormalMap-Online | Free Normal Map Generator",
  description:
    "Create normal maps, displacement maps, ambient occlusion, and specular maps directly in your browser. No uploads required, completely client-based.",
  keywords: [
    "normal map",
    "normalmap",
    "texture generator",
    "height map",
    "displacement map",
    "ambient occlusion",
    "specular map",
    "WebGL",
    "three.js",
  ],
  authors: [
    { name: "Christian Petry", url: "https://www.petry-christian.de" },
  ],
  openGraph: {
    title: "NormalMap-Online | Free Normal Map Generator",
    description:
      "Create normal maps, displacement maps, ambient occlusion, and specular maps directly in your browser. No uploads required, completely client-based.",
    siteName: "NormalMap-Online",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NormalMap-Online | Free Normal Map Generator",
    description:
      "Create normal maps, displacement maps, ambient occlusion, and specular maps directly in your browser. No uploads required, completely client-based.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Skip to main content link for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none"
          >
            Skip to main content
          </a>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

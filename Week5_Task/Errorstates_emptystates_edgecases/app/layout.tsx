import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InlineScript } from "@/components/InlineScript";
import { themeScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevLog Assistant",
  description: "Search, chart and save your DevLog entries by chatting with the DevLog Assistant.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Keep the composer above the on-screen keyboard on mobile (Android Chrome;
  // iOS is handled by useVisualViewport).
  interactiveWidget: "resizes-content",
  // Draw under the iPhone home indicator so env(safe-area-inset-bottom) is
  // non-zero; the composer's footer pads itself by that inset.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme before React hydrates.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { motionTokensCss } from "@/lib/motion";
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
  title: "Buttons with a brain · DevLog",
  description: "A stateful \"Send message\" button that shows its whole async lifecycle with intentional motion.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Motion tokens, generated from lib/motion.ts so CSS and JS share one source. */}
        <style dangerouslySetInnerHTML={{ __html: motionTokensCss }} />
      </head>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { Plus_Jakarta_Sans, Playfair_Display, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hita — A calmer way to think with AI",
  description: "Your AI travel guardian for unfamiliar places. Safety scores, fair fares, best routes, and local secrets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn( playfair.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-dark">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

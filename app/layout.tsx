import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
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
  title: "Word Grind",
  description: "Weekly spelling and vocab practice for two.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The theme script adds a class before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Bottom padding on phones keeps content clear of the menu button. */}
      <body className="flex min-h-full flex-col pb-20 md:pb-0">
        {/* The header reads the URL, which dynamic pages only know at request time. */}
        <Suspense fallback={<div className="h-14 border-b" />}>
          <SiteHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

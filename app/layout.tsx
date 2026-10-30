import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { SiteHeader } from "@/components/site-header";
import { themeScript } from "@/lib/theme";

import { Account } from "./account";
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

// On Android, the on-screen keyboard shrinks the page instead of covering
// it, so the answer box and Submit stay in view while typing. iOS ignores
// this and scrolls the focused box into view itself.
export const viewport: Viewport = { interactiveWidget: "resizes-content" };

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
          <SiteHeader
            account={
              <Suspense>
                <Account />
              </Suspense>
            }
          />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

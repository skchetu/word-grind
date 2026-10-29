"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { activeTab, showsNav, TABS } from "@/lib/nav";
import { cn } from "@/lib/utils";

// The app's name plus its tabs: a tab bar on laptops, and a floating menu
// button at the bottom right on phones, where a thumb can reach it.
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!showsNav(pathname)) return null;
  const current = activeTab(pathname);

  const links = TABS.map((tab) => (
    <Link
      key={tab.href}
      href={tab.href}
      aria-current={tab.href === current ? "page" : undefined}
      onClick={() => setOpen(false)}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        tab.href === current &&
          "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
      )}
    >
      {tab.label}
    </Link>
  ));

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-center px-4 md:justify-start md:gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Word Grind
          </Link>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {links}
          </nav>
        </div>
      </header>

      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2 md:hidden">
        {open && (
          <nav
            id="phone-menu"
            aria-label="Main"
            className="flex w-44 flex-col gap-1 rounded-lg border bg-background p-2 shadow-lg"
          >
            {links}
          </nav>
        )}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="phone-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
          className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
    </>
  );
}

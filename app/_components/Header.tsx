"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import React from "react";

const navLinks = [
  { href: "/", label: "Home", always: true },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Go to home">
          <Image
            src="/logo.png"
            alt="Logo"
            width={200}
            height={56}
            priority
            sizes="(max-width: 640px) 140px, 200px"
            className="h-10 w-auto max-w-[160px] sm:h-14 sm:max-w-[200px] object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 sm:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground ${
                pathname === l.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}

          <SignedOut>
            <SignInButton mode="modal">
              <Button className="ml-2 font-semibold">Get Started</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="ml-1 rounded-md border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>

        {/* Mobile: Hamburger */}
        <div className="sm:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function MobileMenu() {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open menu" className="text-foreground">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 z-[60]">
        
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-2">
          {navLinks.map((l) => (
            <SheetClose asChild key={l.href}>
              <Link
                href={l.href}
                className={`rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-muted ${
                  pathname === l.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            </SheetClose>
          ))}
        </div>

        <Separator className="my-4" />

        <SignedOut>
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <Button className="w-full font-semibold">Get Started</Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center justify-between">
            <SheetClose asChild>
              <Link
                href="/dashboard"
                className="rounded-md border px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Dashboard
              </Link>
            </SheetClose>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
      </SheetContent>
    </Sheet>
  );
}

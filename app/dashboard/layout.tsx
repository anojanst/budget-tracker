"use client";

import { db } from "@/utils/dbConfig";
import { Budgets } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getPendingRepaymentsCount } from "@/utils/loanUtils";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Landmark,
  LayoutGrid,
  PiggyBank,
  PocketKnife,
  ReceiptText,
  ShieldCheck,
  Wallet,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  // Menu list moved to useMemo to avoid re-creating on every render
  const menuList = useMemo(
    () => [
      { id: 1, name: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
      { id: 2, name: "Budgets", icon: PiggyBank, path: "/dashboard/budgets" },
      { id: 3, name: "Expenses", icon: ReceiptText, path: "/dashboard/expenses" },
      { id: 4, name: "Incomes", icon: Wallet, path: "/dashboard/incomes" },
      { id: 5, name: "Loans", icon: Landmark, path: "/dashboard/loans" },
      { id: 6, name: "Shopping Planner", icon: ShoppingCart, path: "/dashboard/shopping-planner" },
      { id: 7, name: "Upgrade", icon: ShieldCheck, path: "/dashboard/upgrade" },
      { id: 8, name: "Toolkits", icon: PocketKnife, path: "/dashboard/toolkits" },
    ],
    []
  );

  useEffect(() => {
    const fetchPendingRepaymentsCount = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      const c = await getPendingRepaymentsCount(
        user.primaryEmailAddress.emailAddress
      );
      setCount(c);
    };
    if (user) fetchPendingRepaymentsCount();
  }, [user]);

  useEffect(() => {
    const checkUserHasBudgets = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      const result = await db
        .select()
        .from(Budgets)
        .where(eq(Budgets.createdBy, user.primaryEmailAddress.emailAddress));
      if (result.length === 0) router.push("/dashboard/budgets");
    };
    if (user) checkUserHasBudgets();
  }, [user, router]);

  return (
    <div className="min-h-dvh bg-background">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-8xl items-center justify-between px-3 sm:px-4">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Dashboard home">
            <Image
              src="/logo.png"
              alt="logo"
              width={200}
              height={56}
              priority
              sizes="(max-width: 640px) 140px, 200px"
              className="h-9 w-auto max-w-[160px] sm:h-11 sm:max-w-[200px] object-contain"
            />
          </Link>
          
          <div className="md:hidden">
            <MobileSidebar menuList={menuList} pathname={pathname} count={count} />
          </div>
          
        </div>
      </header>

      <div className="mx-auto flex max-w-8xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r bg-background p-5 shadow-sm md:block">
          <nav className="mt-2 space-y-1 overflow-y-auto pr-1">
            {menuList.map((item) => (
              <Link key={item.id} href={item.path}>
                <div
                  className={`flex items-center rounded-md p-3 text-sm font-medium transition-colors hover:bg-purple-200 hover:text-primary ${
                    pathname === item.path ? "bg-purple-200 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span className="truncate">
                    {item.name}
                    {count > 0 && item.name === "Loans" && (
                      <Badge className="ml-2 animate-pulse">{`${count} Pending`}</Badge>
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-5 left-0 right-0 flex items-center gap-3 p-5 text-sm text-muted-foreground">
            <UserButton />
            <span>Profile</span>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-3 sm:p-4 md:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function MobileSidebar({
  menuList,
  pathname,
  count,
}: {
  menuList: { id: number; name: string; icon: any; path: string }[];
  pathname: string | null;
  count: number;
}) {
  return (
    <Sheet>
      <SheetContent side="left" className="w-80 sm:w-96 z-[60]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={160} height={48} className="h-8 w-auto object-contain" />
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-1">
          {menuList.map((item) => (
            <SheetClose asChild key={item.id}>
              <Link href={item.path}>
                <div
                  className={`flex items-center rounded-md p-3 text-base font-medium transition-colors hover:bg-purple-200 hover:text-primary ${
                    pathname === item.path ? "bg-purple-200 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span>
                    {item.name}
                    {count > 0 && item.name === "Loans" && (
                      <Badge className="ml-2">{`${count} Pending`}</Badge>
                    )}
                  </span>
                </div>
              </Link>
            </SheetClose>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
          <UserButton />
          <span>Profile</span>
        </div>
      </SheetContent>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open menu" className="text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </Button>
      </SheetTrigger>
    </Sheet>
  );
}

export default DashboardLayout;

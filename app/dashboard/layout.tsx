"use client";

import { db } from "@/utils/dbConfig";
import { Budgets } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getPendingRepaymentsCount } from "@/utils/loanUtils";
import { useUser, SignOutButton } from "@clerk/nextjs";
import {
  Landmark,
  LayoutGrid,
  PiggyBank,
  PocketKnife,
  ReceiptText,
  Wallet,
  ShoppingCart,
  Target,
  User,
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
      { id: 7, name: "Saving Goals", icon: Target, path: "/dashboard/saving-goals" },
      { id: 9, name: "Toolkits", icon: PocketKnife, path: "/dashboard/toolkits" },
      { id: 10, name: "Profile", icon: User, path: "/dashboard/profile" },
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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex h-12 md:h-14 items-center justify-between px-3 md:px-4 lg:px-6">
          <Link href="/dashboard" className="flex items-center" aria-label="Dashboard home">
            <Image
              src="/logo.png"
              alt="logo"
              width={140}
              height={40}
              priority
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <MobileSidebar menuList={menuList} pathname={pathname} count={count} />
          </div>
        </div>
      </header>

      <div className="w-full flex">
        {/* Desktop Sidebar - hidden on mobile, visible on md+ */}
        <aside 
          className="hidden md:block md:sticky md:w-64 md:shrink-0 md:border-r md:bg-background md:p-4 lg:p-6" 
          style={{ 
            top: 'calc(3.5rem + env(safe-area-inset-top))',
            height: 'calc(100dvh - 3.5rem - env(safe-area-inset-top))'
          }}
        >
          <nav className="mt-2 space-y-1 overflow-y-auto pr-1">
            {menuList.map((item) => (
              <Link key={item.id} href={item.path}>
                <div
                  className={`flex items-center rounded-md p-3 text-sm font-medium transition-colors hover:bg-purple-100 hover:text-primary ${
                    pathname === item.path ? "bg-purple-100 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  <span className="truncate">
                    {item.name}
                    {count > 0 && item.name === "Loans" && (
                      <Badge className="ml-2 text-xs">{count}</Badge>
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-4 left-0 right-0 px-4 border-t pt-4">
            <SignOutButton>
              <Button 
                variant="outline" 
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-sm"
              >
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </aside>

        {/* Main content - mobile-first, with margin on desktop for sidebar */}
        <main className="w-full md:ml-0">
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
      <SheetContent side="left" className="w-[280px] z-[60]">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Image src="/logo.png" alt="logo" width={140} height={40} className="h-8 w-auto object-contain" />
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-1">
          {menuList.map((item) => (
            <SheetClose asChild key={item.id}>
              <Link href={item.path}>
                <div
                  className={`flex items-center rounded-lg p-3 text-base font-medium transition-colors active:bg-purple-100 ${
                    pathname === item.path ? "bg-purple-100 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span className="flex-1">
                    {item.name}
                    {count > 0 && item.name === "Loans" && (
                      <Badge className="ml-2 text-xs">{count}</Badge>
                    )}
                  </span>
                </div>
              </Link>
            </SheetClose>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t">
          <SignOutButton>
            <Button 
              variant="outline" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </SheetContent>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="h-9 w-9">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </Button>
      </SheetTrigger>
    </Sheet>
  );
}

export default DashboardLayout;

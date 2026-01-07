"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiggyBank, Wallet, ShoppingCart, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Budgets", icon: PiggyBank, path: "/dashboard/budgets" },
  { name: "Incomes", icon: Wallet, path: "/dashboard/incomes" },
  { name: "Shopping", icon: ShoppingCart, path: "/dashboard/shopping-planner" },
  { name: "Savings", icon: Target, path: "/dashboard/saving-goals" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-border bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
            (item.path !== "/dashboard/budgets" && pathname?.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive && "text-primary"
              )} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


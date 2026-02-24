"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BellRing, Boxes, GitBranch, Home, Settings, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/campaigns", label: "Campaigns", icon: BellRing },
  { href: "/journeys", label: "Journeys", icon: GitBranch },
  { href: "/subscribers", label: "Subscribers", icon: Users },
  { href: "/segments", label: "Segments", icon: Boxes },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/", label: "Home", icon: Home },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white",
              active && "bg-indigo-500 text-white hover:bg-indigo-500"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

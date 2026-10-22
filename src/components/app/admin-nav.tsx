"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileWarning,
  LayoutDashboard,
  Library,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Verifications", href: "/admin/organizations", icon: Building2 },
  { label: "Reports", href: "/admin/reports", icon: FileWarning },
  { label: "Members", href: "/admin/users", icon: Users },
  { label: "Content", href: "/admin/content", icon: Library },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="bg-card mb-6 flex gap-1 overflow-x-auto rounded-xl border p-1"
    >
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

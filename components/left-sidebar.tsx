"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, BarChart3 } from "lucide-react";
import { UserNav } from "./user-nav";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";

const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface LeftSidebarProps {
  onItemClick?: () => void;
}

export function LeftSidebar({ onItemClick }: LeftSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full px-4 py-4">
      {/* Logo */}
      <div className="mb-8">
        <Link
          href="/"
          className="flex items-center space-x-3"
          onClick={onItemClick}
        >
          <Logo className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold lg:hidden xl:block">
            Flip Forge
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center space-x-4 px-3 py-3 rounded-full text-xl transition-colors ${
                isActive
                  ? "bg-gray-100 dark:bg-gray-800 font-bold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="lg:hidden xl:block">{item.name}</span>
            </Link>
          );
        })}

        {/* Theme Toggle */}
        <ThemeToggle />
      </nav>

      {/* User Navigation */}
      <div className="mt-auto">
        <UserNav />
      </div>
    </div>
  );
}

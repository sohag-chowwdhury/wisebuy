"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LeftSidebar } from "./left-sidebar";
import { Button } from "./ui/button";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold">Flip Forge</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 p-0"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background">
          <div className="pt-16">
            <LeftSidebar onItemClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:container lg:mx-auto lg:max-w-7xl lg:flex">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block w-64 xl:w-80 shrink-0">
          <div className="fixed w-64 xl:w-80 h-full">
            <LeftSidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 pt-16 lg:pt-0">
          <main className="lg:border-x border-border min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

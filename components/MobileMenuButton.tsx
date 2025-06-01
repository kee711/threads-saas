"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useMobileSidebar } from "@/contexts/MobileSidebarContext";

export function MobileMenuButton() {
  const { toggleSidebar, isMobile } = useMobileSidebar();

  if (!isMobile) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="md:hidden fixed top-4 left-4 z-30 bg-background/80 backdrop-blur-sm border"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">메뉴 열기</span>
    </Button>
  );
} 
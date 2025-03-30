'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Newspaper,
  FileEdit,
  Calendar,
  BarChart2,
  MessageSquare,
  ChevronDown,
  Timer,
  List,
  CalendarDays,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

// Navigation item type definition
interface NavItem {
  name: string;          // Display name of the navigation item
  href?: string;         // URL path for navigation (optional for expandable items)
  icon: LucideIcon;      // Lucide icon component
  isExpandable?: boolean;// Whether this item has expandable sub-items
  subItems?: {           // Array of sub-navigation items
    name: string;
    href: string;
    icon: LucideIcon;
  }[];
}

interface SidebarProps {
  className?: string;    // Optional className for styling
}

// Local storage key for persisting sidebar state
const STORAGE_KEY = 'sidebar-open-items';

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  // Initialize with empty array to prevent hydration mismatch
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load saved state after initial render
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setOpenItems(JSON.parse(saved));
    }
    setMounted(true);
  }, []);

  // Persist open items state to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openItems));
    }
  }, [openItems, mounted]);

  // Toggle handler for expandable menu items
  const toggleItem = (itemName: string) => {
    setOpenItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [itemName] // Only keep the newly opened item
    );
  };

  // Navigation configuration
  const navigation: NavItem[] = [
    {
      name: 'Contents Helper',
      icon: FileEdit,
      isExpandable: true,
      subItems: [
        { name: 'Viral Posts', href: '/contents-helper/viral-posts', icon: TrendingUp },
        { name: 'News', href: '/contents-helper/news', icon: Newspaper },
        { name: 'My Drafts', href: '/contents-helper/drafts', icon: FileEdit },
      ],
    },
    {
      name: 'Schedule',
      icon: Calendar,
      isExpandable: true,
      subItems: [
        { name: 'Calendar View', href: '/schedule/calendar', icon: CalendarDays },
        { name: 'List View', href: '/schedule/list', icon: List },
      ],
    },
    {
      name: 'Statistics',
      href: '/statistics',
      icon: BarChart2,
    },
    {
      name: 'Comments',
      href: '/comments',
      icon: MessageSquare,
    },
  ];

  return (
    <div className={cn("flex h-screen flex-col justify-between border-r bg-background", className)}>
      {/* Top section: Logo and Navigation */}
      <div className="px-3 py-2">
        {/* Logo */}
        <div className="mb-4 px-3 py-2">
          <h1 className="text-2xl font-bold tracking-tight">LOGO</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            // Render expandable menu item with dropdown
            if (item.isExpandable) {
              const isOpen = openItems.includes(item.name);
              return (
                <div key={item.name} className="space-y-1">
                  {/* Dropdown trigger button */}
                  <Button
                    variant="ghost"
                    className="w-full justify-between font-normal"
                    onClick={() => toggleItem(item.name)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isOpen && "transform rotate-180"
                      )}
                    />
                  </Button>

                  {/* Dropdown content with animation */}
                  <div className={cn(
                    "ml-4 space-y-1 overflow-hidden transition-all duration-200",
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    {item.subItems?.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                          pathname === subItem.href
                            ? "bg-accent text-accent-foreground"
                            : "transparent"
                        )}
                      >
                        <subItem.icon className="mr-3 h-5 w-5" />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            // Skip items without href
            if (!item.href) return null;

            // Render regular menu item
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "transparent"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: User Profile */}
      <div className="mt-auto border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <Avatar>
              <AvatarImage src="/avatars/01.png" alt="Harry Kee" />
              <AvatarFallback>HK</AvatarFallback>
            </Avatar>
            {/* User Info */}
            <div>
              <p className="text-sm font-medium">Harry Kee</p>
              <div className="flex items-center space-x-1">
                {/* Pro Badge */}
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600">
                  Pro
                </span>
                {/* Timer Display */}
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  <span>14</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
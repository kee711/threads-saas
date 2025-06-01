'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
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
  Settings,
  Flame,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { SocialAccountSelector } from '@/components/SocialAccountSelector';
import { useTheme } from 'next-themes';

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
  const { data: session } = useSession();
  const { theme } = useTheme();
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
      name: 'Contents Cooker',
      icon: FileEdit,
      isExpandable: true,
      subItems: [
        { name: 'Topic Finder', href: '/contents-cooker/topic-finder', icon: TrendingUp },
        // { name: 'Post Radar', href: '/contents-cooker/post-radar', icon: Newspaper },
        { name: 'Saved', href: '/contents-cooker/saved', icon: FileEdit },
      ],
    },
    {
      name: 'Schedule',
      href: '/schedule',
      icon: Calendar,
    },
    {
      name: 'Statistics',
      href: '/statistics',
      icon: BarChart2,
    },
    // {
    //   name: 'Comments',
    //   href: '/comments',
    //   icon: MessageSquare,
    // },
  ];

  // 테마에 따라 적절한 로고 이미지 선택
  const logoSrc = theme === 'dark' ? '/conflow-logo-dark.svg' : '/conflow-logo.svg';

  return (
    <div className={cn("bg-muted w-[250px]", className)}>
      <div className="flex flex-col justify-between h-full">
        {/* Top section: Logo and Navigation */}
        <div className="px-3 py-2 flex-1">
          {/* Logo */}
          <div className="mt-2 mb-4 px-3 py-2">
            {/* Logo Image - 테마에 따라 다른 로고 표시 */}
            <Image src={logoSrc} alt="Logo" width={120} height={100} />
          </div>

          {/* 소셜 계정 전환 dropdown */}
          <div className="border-t border-slate-300 mb-4">
            <SocialAccountSelector />
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              // Render expandable menu item with dropdown
              if (item.isExpandable) {
                const isOpen = openItems.includes(item.name);
                return (
                  <div key={item.name}>
                    {/* Dropdown trigger button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-between font-normal px-3"
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
                      "space-y-1 overflow-hidden transition-all duration-200",
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      {item.subItems?.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            "flex items-center rounded-lg px-6 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
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

        {/* Streaks */}
        <div className="border border-slate-300 rounded-lg px-2 py-4 m-4 mb-0">
          <div className="flex items-center justify-center">
            <Flame className="h-7 w-7" />
            <p className="text-2xl font-bold">10</p>
          </div>
        </div>

        {/* Bottom section: User Profile */}
        <div className="border border-slate-300 rounded-lg px-2 py-4 m-4 mt-2">
          {session ? (
            // 로그인된 경우
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* User Avatar */}
                <Avatar>
                  <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                  <AvatarFallback>
                    {session.user?.name
                      ? session.user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                      : '??'}
                  </AvatarFallback>
                </Avatar>
                {/* User Info */}
                <div>
                  <p className="text-sm font-medium">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground">Premium Plan</p>
                </div>
              </div>
              {/* Settings Button */}
              <Button
                variant="ghost"
                size="icon"
                asChild
              >
                <Link href="/settings">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">설정</span>
                </Link>
              </Button>
            </div>
          ) : (
            // 로그인되지 않은 경우
            <Button
              variant="default"
              className="w-full"
              onClick={() => signIn()}
            >
              로그인
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 
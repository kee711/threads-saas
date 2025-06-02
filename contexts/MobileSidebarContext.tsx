"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MobileSidebarContextType {
  // 좌측 사이드바 상태
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // 우측 사이드바 상태
  isRightSidebarOpen: boolean;
  openRightSidebar: () => void;
  closeRightSidebar: () => void;
  toggleRightSidebar: () => void;

  // 모바일 여부 확인
  isMobile: boolean;
}

const MobileSidebarContext = createContext<MobileSidebarContextType | undefined>(undefined);

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 변화 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md 브레이크포인트

      // 데스크톱으로 변경되면 모든 모바일 사이드바 닫기
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
        setIsRightSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 좌측 사이드바 관리
  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // 우측 사이드바 관리
  const openRightSidebar = () => setIsRightSidebarOpen(true);
  const closeRightSidebar = () => setIsRightSidebarOpen(false);
  const toggleRightSidebar = () => setIsRightSidebarOpen(prev => !prev);

  // ESC 키로 사이드바 닫기
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsRightSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <MobileSidebarContext.Provider
      value={{
        isSidebarOpen,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        isRightSidebarOpen,
        openRightSidebar,
        closeRightSidebar,
        toggleRightSidebar,
        isMobile,
      }}
    >
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext);
  if (context === undefined) {
    throw new Error('useMobileSidebar must be used within a MobileSidebarProvider');
  }
  return context;
} 
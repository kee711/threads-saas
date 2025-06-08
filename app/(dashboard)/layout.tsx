import { Sidebar } from "@/components/Sidebar";
import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";
import { MobileMenuButton } from "@/components/MobileMenuButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen">
        <Sidebar className="h-[calc(100vh-48px)] mt-6 rounded-r-xl" />
        <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] md:ml-0 relative">
          <MobileMenuButton />
          {children}
        </main>
      </div>
    </MobileSidebarProvider>
  );
} 
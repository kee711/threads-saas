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
      <div className="flex h-screen overflow-hidden p-2">
        <Sidebar className="h-full rounded-r-xl" />
        <main className="flex-1 h-full overflow-hidden relative">
          <MobileMenuButton />
          {children}
        </main>
      </div>
    </MobileSidebarProvider>
  );
} 
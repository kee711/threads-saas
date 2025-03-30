import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from '@/components/RightSidebar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Threads SaaS",
  description: "Threads management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`h-full ${inter.className}`}>
        <div className="flex h-screen">
          <Sidebar className="h-full" />
          <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {children}
          </main>
          <RightSidebar className="h-full" />
        </div>
      </body>
    </html>
  );
}

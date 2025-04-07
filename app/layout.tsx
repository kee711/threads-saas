import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from 'sonner';
import { Providers } from './providers'
import { SessionProvider } from './providers/SessionProvider'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Threads SaaS Platform",
  description: "Threads SaaS platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession()

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`h-full ${inter.className}`}>
        <SessionProvider session={session}>
          <Providers>
            <div className="flex h-screen">
              <Sidebar className="h-full" />
              <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {children}
              </main>
            </div>
          </Providers>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { Providers } from './providers'
import { SessionProvider } from './providers/SessionProvider'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { StagewiseToolbar } from '@stagewise/toolbar-next'
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ViralChef",
  description: "ViralChef",
};

const stagewiseConfig = {
  plugins: []
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
            {children}
            {process.env.NODE_ENV === 'development' && (
              <StagewiseToolbar config={stagewiseConfig} />
            )}
          </Providers>
        </SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}

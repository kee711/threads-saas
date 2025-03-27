import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/hooks/toast-provider";

export const metadata: Metadata = {
  title: "AI 스레드 콘텐츠 생성기",
  description: "GPT로 스레드 콘텐츠를 생성하고 자동으로 게시하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}

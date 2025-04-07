import { RightSidebar } from '@/components/RightSidebar'

interface ContentsHelperLayoutProps {
  children: React.ReactNode
}

export default function ContentsHelperLayout({
  children,
}: ContentsHelperLayoutProps) {
  return (
    <div className="flex h-screen">
      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {children}
      </main>
      <RightSidebar />
    </div>
  )
} 
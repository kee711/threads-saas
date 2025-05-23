import { RightSidebar } from '@/components/RightSidebar'

interface ContentsCookerLayoutProps {
  children: React.ReactNode
}

export default function ContentsCookerLayout({
  children,
}: ContentsCookerLayoutProps) {
  return (
    <div className="flex h-screen">
      <main className="flex-1 bg-white m-6 rounded-xl overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {children}
      </main>
      <RightSidebar />
    </div>
  )
} 
import { RightSidebar } from '@/components/RightSidebar'

interface ContentsCookerLayoutProps {
  children: React.ReactNode
}

export default function ContentsCookerLayout({
  children,
}: ContentsCookerLayoutProps) {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <main className="flex-1 bg-white m-6 rounded-xl overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] md:mr-0">
        {children}
      </main>
      <RightSidebar />
    </div>
  )
} 
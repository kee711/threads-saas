// layout -> bg-white rounded-xl

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl px-6 pt-6 h-full">
      {children}
    </div>
  );
}

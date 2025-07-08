'use client';

import { Calendar } from '@/components/schedule/Calendar'

export default function ListPage() {
  return (
    <div className="h-full w-full overflow-hidden">
      <Calendar defaultView="list" />
    </div>
  );
} 
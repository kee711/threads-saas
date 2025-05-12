'use client';

import { Calendar } from '@/components/schedule/Calendar'

export default function ListPage() {
  return (
    <div className="container py-10">
      <Calendar defaultView="list" />
    </div>
  );
} 
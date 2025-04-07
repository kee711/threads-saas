'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from '@/components/schedule/Calendar'

export default function CalendarPage() {
  console.log("clicked")
  return (
    <div className="container py-10">
      <Calendar />
    </div>
  );
} 
'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, ChevronDown, Plus, Edit, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar'
import { ChangePublishTimeDialog } from './ChangePublishTimeDialog'

interface ScheduleHeaderProps {
  view: 'calendar' | 'list'
  setView: (view: 'calendar' | 'list') => void
  scheduledCount: number
  month: Date
  selectedDate?: Date
  onMonthChange: (date: Date) => void
  onDateChange?: (date: Date | undefined) => void
}

export function ScheduleHeader({
  view,
  setView,
  scheduledCount,
  month,
  selectedDate,
  onMonthChange,
  onDateChange,
}: ScheduleHeaderProps) {
  const handleListDateSelect = (date: Date | undefined) => {
    if (onDateChange) {
      onDateChange(date)
    }
  }

  const handleMonthOnlyChange = (newMonthDate: Date) => {
    onMonthChange(newMonthDate)
  }

  return (
    <div className="flex items-center justify-between">
      {/* View Toggle */}
      <div className="flex items-center gap-2 text-xl font-semibold">
        <button
          onClick={() => setView('calendar')}
          className={cn(
            'hover:text-primary transition-colors',
            view === 'calendar' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          Calendar
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          onClick={() => setView('list')}
          className={cn(
            'hover:text-primary transition-colors',
            view === 'list' ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          List
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Scheduled Count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>{scheduledCount} Scheduled</span>
        </div>

        {/* Change Publish Time */}
        <ChangePublishTimeDialog />

        {/* Month/Date Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              {view === 'list' && selectedDate
                ? format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })
                : format(month, 'yyyy년 MM월', { locale: ko })}
              <ChevronDown className="h-4 w-4 ml-auto" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-auto" align="end">
            {view === 'list' ? (
              <ShadcnCalendar
                mode="single"
                selected={selectedDate}  // undefined 아님! 무조건 있어야 함
                onSelect={handleListDateSelect}  // undefined 아님!
                month={month}
                onMonthChange={handleMonthOnlyChange}
                numberOfMonths={1}
              />
            ) : (
              <ShadcnCalendar
                month={month}
                onMonthChange={handleMonthOnlyChange}
                numberOfMonths={1}
              />
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
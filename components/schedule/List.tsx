'use client'

import { useState, useEffect, useRef } from 'react'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getMonth, getYear, setMonth as setDateMonth, setYear as setDateYear, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/PostCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { EditPostModal } from './EditPostModal'
import { Event } from './types' // Event 타입을 별도 파일로 분리했다고 가정

interface ListProps {
  events: Event[]
  month: Date
  onMonthChange: (date: Date) => void
  onEventUpdate: (event: Event) => void
  onEventDelete: (eventId: string) => void
}

export function List({
  events,
  month,
  onEventUpdate,
  onEventDelete,
}: ListProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [dropTargetDate, setDropTargetDate] = useState<Date | null>(null)
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // 표시할 날짜 범위 계산 (현재 월 기준 앞뒤 1개월)
  const startDate = startOfMonth(addDays(month, -31))
  const endDate = endOfMonth(addDays(month, 31))
  const allDates = eachDayOfInterval({ start: startDate, end: endDate })

  const handleEventClick = (event: Event) => {
    if (event.status === 'scheduled') {
      setSelectedEvent(event)
      setIsEditModalOpen(true)
    }
  }

  const handleSaveChanges = (updatedEvent: Event) => {
    onEventUpdate(updatedEvent)
    setIsEditModalOpen(false)
  }

  const handleDragStart = (e: React.DragEvent, event: Event) => {
    if (event.status === 'scheduled') {
      e.dataTransfer.setData('text/plain', JSON.stringify(event))
      setDraggedEvent(event)
    }
  }

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (draggedEvent) {
      setDropTargetDate(date)
    }
  }

  const handleDragLeave = () => {
    setDropTargetDate(null)
  }

  const handleDrop = (e: React.DragEvent, dropDate: Date) => {
    e.preventDefault()
    const eventDataString = e.dataTransfer.getData('text/plain')
    setDraggedEvent(null)
    setDropTargetDate(null)

    if (!eventDataString) return

    try {
      const eventData = JSON.parse(eventDataString) as Event
      if (eventData.status !== 'scheduled') return

      const [hours, minutes] = eventData.time.split(':').map(Number)
      const newDate = new Date(dropDate)
      newDate.setHours(hours, minutes, 0, 0)

      const updatedEvent = {
        ...eventData,
        date: newDate
      }

      onEventUpdate(updatedEvent)
    } catch (error) {
      console.error("Error parsing dropped event data:", error)
    }
  }

  return (
    <div className="space-y-4">
      {allDates.map((date) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayEvents = events.filter(event => isSameDay(event.date, date))

        return (
          <div
            key={dateStr}
            ref={(el) => { dateRefs.current[dateStr] = el }}
            id={dateStr}
            className={cn(
              "p-4 rounded-lg border border-transparent",
              dropTargetDate && isSameDay(date, dropTargetDate) && "border-primary bg-primary/10"
            )}
            onDragOver={(e) => handleDragOver(e, date)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, date)}
          >
            <h3 className="text-lg font-semibold mb-2">
              {format(date, 'yyyy년 MM월 dd일 (eee)', { locale: ko })}
            </h3>
            {dayEvents.length > 0 ? (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg',
                      event.status === 'scheduled' ? 'bg-muted hover:bg-blue-100 cursor-grab' : 'bg-gray-150 text-muted-foreground',
                      draggedEvent?.id === event.id && "opacity-50"
                    )}
                    draggable={event.status === 'scheduled'}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium w-12 text-center">{event.time}</div>
                      <div className="line-clamp-1">{event.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground h-10 flex items-center justify-center">
                예약된 일정이 없습니다.
              </div>
            )}
          </div>
        )
      })}

      <EditPostModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        event={selectedEvent}
        onEventUpdate={handleSaveChanges}
        onEventDelete={(eventId) => {
          onEventDelete(eventId)
          setIsEditModalOpen(false)
        }}
      />
    </div>
  )
} 
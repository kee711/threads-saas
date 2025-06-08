'use client'

import { useEffect, useState, useRef } from 'react'
import { format, isSameDay, startOfMonth } from 'date-fns'
import { Clock, Plus, Edit, Check, Trash2, Image, Video, FileText, Images } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getContents, updateContent } from '@/app/actions/content' // ⭐ 서버 액션 import
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { PostCard } from '@/components/PostCard'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ScheduleHeader } from './ScheduleHeader'
import { List } from './List'
import { EditPostModal } from './EditPostModal'
import { Event } from './types'
import { deleteSchedule } from '@/app/actions/schedule'

interface CalendarProps {
  defaultView?: 'calendar' | 'list'
}

export function Calendar({ defaultView = 'calendar' }: CalendarProps) {
  const [view, setView] = useState<'calendar' | 'list'>(defaultView)
  const [events, setEvents] = useState<Event[]>([])
  const [month, setMonth] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [dropTargetDate, setDropTargetDate] = useState<Date | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await getContents({});
        if (error) throw error;

        if (data) {
          const formattedEvents = data.map((content: any) => ({
            id: content.id,
            title: content.content,
            date: new Date(content.scheduled_at),
            time: format(new Date(content.scheduled_at), 'HH:mm'),
            status: content.publish_status,
            media_type: content.media_type || 'TEXT',
            media_urls: content.media_urls || [],
            is_carousel: content.is_carousel || false
          }));
          setEvents(formattedEvents);
        } else {
          setEvents([]); // 데이터가 null이면 빈 배열로 설정
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]); // 오류 발생 시 빈 배열로 설정
      }
    }

    fetchEvents()
  }, [])

  const scrollToListDate = (date: Date) => {
    if (view === 'list' && listContainerRef.current) {
      const dateStr = format(date, 'yyyy-MM-dd')
      requestAnimationFrame(() => {
        const listEl = document.getElementById(dateStr)
        const container = listContainerRef.current
        if (listEl && container) {
          const containerRect = container.getBoundingClientRect()
          const elementRect = listEl.getBoundingClientRect()
          const offsetTopRelativeToContainer = elementRect.top - containerRect.top + container.scrollTop
          const scrollToPosition = offsetTopRelativeToContainer - container.clientHeight / 3
          container.scrollTo({ top: scrollToPosition, behavior: 'smooth' })
        }
      })
    }
  }

  const handleSelectedDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      if (month.getMonth() !== date.getMonth() || month.getFullYear() !== date.getFullYear()) {
        setMonth(date)
      }
    }
  }

  const handleMonthChange = (newMonthDate: Date) => {
    setMonth(newMonthDate)
    if (view === 'list') {
      scrollToListDate(startOfMonth(newMonthDate))
    }
  }

  useEffect(() => {
    if (view === 'list') {
      scrollToListDate(selectedDate)
    }
  }, [selectedDate, view])

  const handleEventClick = (event: Event) => {
    if (event.status === 'scheduled') {
      setSelectedEvent(event)
      setIsEditModalOpen(true)
    }
  }

  const handleEventUpdate = async (updatedEvent: Event) => {
    try {
      const { data } = await updateContent(updatedEvent.id, {
        content: updatedEvent.title,
        scheduled_at: updatedEvent.date.toISOString(),
      }) // ⭐ 서버 액션으로 업데이트

      if (data) {
        setEvents(events.map(event =>
          event.id === updatedEvent.id ? updatedEvent : event
        ))
      }
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleEventDelete = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setEventToDelete(event)
      setIsDeleteDialogOpen(true)
    }
  }

  const confirmDelete = async () => {
    if (!eventToDelete) return

    try {
      const { error } = await deleteSchedule(eventToDelete.id)

      if (error) {
        throw error
      }

      setEvents(events.filter(event => event.id !== eventToDelete.id))
      setIsDeleteDialogOpen(false)
      setEventToDelete(null)
    } catch (error) {
      console.error('Error deleting event:', error)
      // 필요시 toast 알림 추가
    }
  }

  const handleDragStart = (e: React.DragEvent, event: Event) => {
    if (event.status === 'scheduled') {
      e.dataTransfer.setData('text/plain', JSON.stringify(event))
      setDraggedEvent(event)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropDate: Date) => {
    e.preventDefault();
    const eventDataString = e.dataTransfer.getData('text/plain');
    setDraggedEvent(null);
    setDropTargetDate(null);

    if (!eventDataString) return;
    try {
      const parsedEventData = JSON.parse(eventDataString) as Omit<Event, 'date'> & { date: string }; // date가 string임을 명시

      // date 문자열을 Date 객체로 변환
      const eventData: Event = {
        ...parsedEventData,
        date: new Date(parsedEventData.date),
      };

      // 시간을 유지하면서 날짜만 변경
      const existingTime = format(eventData.date, 'HH:mm'); // 이제 eventData.date는 Date 객체
      const newDateTime = new Date(dropDate);
      const [hours, minutes] = existingTime.split(':').map(Number);
      newDateTime.setHours(hours, minutes, 0, 0); // 시간, 분 설정

      const updatedEvent: Event = {
        ...eventData,
        date: newDateTime,
        time: format(newDateTime, 'HH:mm'), // 시간도 업데이트
      };

      // DB 업데이트
      const { data: updatedData, error } = await updateContent(updatedEvent.id, {
        scheduled_at: newDateTime.toISOString(), // ISO 문자열로 변환하여 전달
      });

      if (error) {
        console.error('Error updating event on drop:', error);
        // 에러 처리 (예: 사용자에게 알림)
        return;
      }

      // UI 상태 업데이트
      if (updatedData) {
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === updatedEvent.id ? updatedEvent : event
          )
        );
      }

    } catch (error) {
      console.error("Error handling drop event:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, date?: Date) => {
    e.preventDefault()
    if (draggedEvent && date) {
      setDropTargetDate(date)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setDropTargetDate(null)
  }

  const scheduledCount = events.filter(event => event.status === 'scheduled').length
  const postedCount = events.filter(event => event.status === 'posted').length
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(firstDayOfMonth.getDate() - (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1))

  const totalDays = Math.ceil((lastDayOfMonth.getDate() + (firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1)) / 7) * 7
  const weeksCount = totalDays / 7

  return (
    <div className="w-full space-y-4">
      <ScheduleHeader
        view={view}
        setView={setView}
        scheduledCount={scheduledCount}
        postedCount={postedCount}
        month={month}
        selectedDate={selectedDate}
        onMonthChange={handleMonthChange}
        onDateChange={handleSelectedDateChange}
      />

      {view === 'calendar' ? (
        <div className="bg-card h-[calc(100vh-9rem)] overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="rounded-lg py-1 px-3 grid grid-cols-7 gap-px mb-2 bg-muted text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="p-2 text-md font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="rounded-lg">
            {Array.from({ length: weeksCount }).map((_, rowIndex) => (
              <div key={rowIndex} className="rounded-lg grid grid-cols-7 gap-px bg-muted mb-2 py-1 px-3">
                {Array.from({ length: 7 }).map((_, colIndex) => {
                  const dayOffset = rowIndex * 7 + colIndex
                  const currentDate = new Date(startDate)
                  currentDate.setDate(startDate.getDate() + dayOffset)

                  const isCurrentMonth = currentDate.getMonth() === month.getMonth()

                  const dayEvents = events
                    .filter(event => format(event.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'))
                    .sort((a, b) => a.date.getTime() - b.date.getTime()) // ⭐ 같은 날 안에서는 시간순 정렬

                  const isDropTarget = dropTargetDate && isSameDay(currentDate, dropTargetDate)

                  return (
                    <div
                      key={dayOffset}
                      className={cn(
                        "min-h-[100px] md:min-h-[180px] md:p-3 border border-transparent rounded transition-colors duration-150 ease-in-out",
                        isDropTarget && "border-primary bg-primary/10"
                      )}
                      onDragOver={(e) => handleDragOver(e, currentDate)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, currentDate)}
                    >
                      <div className="text-sm font-medium text-muted-foreground mb-3">
                        {format(currentDate, 'd')}
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              'relative rounded-md px-1 py-2 md:p-3 text-sm hover:opacity-75 transition-colors cursor-pointer border',
                              event.status === 'scheduled'
                                ? 'bg-blue-50 border-blue-200 text-foreground cursor-grab hover:bg-blue-100'
                                : 'bg-gray-50 border-gray-200 text-foreground hover:bg-gray-100',
                              draggedEvent?.id === event.id && "opacity-50 ring-2 ring-primary ring-offset-2"
                            )}
                            onClick={() => handleEventClick(event)}
                            draggable={event.status === 'scheduled'}
                            onDragStart={(e) => handleDragStart(e, event)}
                            onDragEnd={() => {
                              setDraggedEvent(null)
                              setDropTargetDate(null)
                            }}
                          >
                            <div
                              className={cn(
                                "absolute bottom-2 md:top-2 right-1 md:right-2 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full",
                                event.status === 'scheduled'
                                  ? "bg-red-500 animate-pulse"
                                  : "bg-green-500"
                              )}
                            />
                            <div className="font-semibold text-xs mb-1">{event.time}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 mt-0.5 hidden md:block">
                                {event.media_type === 'IMAGE' && <Image className="w-3 h-3" />}
                                {event.media_type === 'VIDEO' && <Video className="w-3 h-3" />}
                                {event.media_type === 'TEXT' && <FileText className="w-3 h-3" />}
                                {event.media_type === 'CAROUSEL' && <Images className="w-3 h-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-xs leading-relaxed break-words"
                                  style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word',
                                    hyphens: 'auto'
                                  }}
                                >
                                  {event.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div ref={listContainerRef} className="h-[calc(100vh-9rem)] overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <List
            events={events}
            month={month}
            onMonthChange={handleMonthChange}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
          />
        </div>
      )}

      <EditPostModal
        isOpen={isEditModalOpen}
        onOpenChange={(isOpen) => {
          setIsEditModalOpen(isOpen)
          if (!isOpen) {
            setSelectedEvent(null)
          }
        }}
        event={selectedEvent}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>일정을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              예약된 게시물 일정이 취소되며, 게시물은 초안으로 저장됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
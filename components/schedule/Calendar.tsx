'use client'

import { useEffect, useState, useRef } from 'react'
import { format, isSameDay, startOfMonth } from 'date-fns'
import { Image, Video, FileText, Images, Users } from 'lucide-react'
import useSocialAccountStore from '@/stores/useSocialAccountStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getContents, updateContent } from '@/app/actions/content' // ⭐ 서버 액션 import
import { updateThreadChain } from '@/app/actions/threadChain' // ⭐ threadChain 업데이트 import
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const { currentSocialId } = useSocialAccountStore()

  // Check if social account is connected
  const checkSocialAccountConnection = () => {
    if (!currentSocialId) {
      toast.error("계정 추가가 필요해요", {
        description: "스케줄 관리를 위해 먼저 Threads 계정을 연결해주세요.",
        action: {
          label: "계정 연결",
          onClick: () => window.location.href = "/api/threads/oauth"
        }
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    async function fetchEvents() {
      try {
        checkSocialAccountConnection()
        const { currentSocialId } = useSocialAccountStore.getState()
        const { data, error } = await getContents({
          currentSocialId: currentSocialId
        });
        if (error) throw error;

        if (data) {
          const formattedEvents = data
            .filter((content: any) => {
              // Only show threads with thread_sequence === 0 (first thread in chain) or non-thread posts
              return !content.is_thread_chain || content.thread_sequence === 0;
            })
            .map((content: any) => {
              // scheduled 상태면 scheduled_at, posted 상태면 created_at 사용
              const dateField = content.publish_status === 'scheduled' ? content.scheduled_at : content.created_at;
              const eventDate = new Date(dateField);

              return {
                id: content.my_contents_id,
                title: content.content,
                date: eventDate,
                time: format(eventDate, 'HH:mm'),
                status: content.publish_status,
                media_type: content.media_type || 'TEXT',
                media_urls: content.media_urls || [],
                is_carousel: content.is_carousel || false,
                is_thread_chain: content.is_thread_chain || false,
                parent_media_id: content.parent_media_id,
                thread_sequence: content.thread_sequence || 0
              };
            });
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
  }, [currentSocialId, isEditModalOpen])

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
      if (updatedEvent.is_thread_chain && updatedEvent.threads) {
        // ⭐ threadChain인 경우 updateThreadChain 사용
        const parentId = updatedEvent.parent_media_id || updatedEvent.id
        const { success, error } = await updateThreadChain(
          parentId,
          updatedEvent.threads,
          updatedEvent.date.toISOString()
        )

        if (!success) {
          throw new Error(error || 'Failed to update thread chain')
        }
      } else {
        // ⭐ 단일 포스트인 경우 updateContent 사용
        const { data } = await updateContent(updatedEvent.id, {
          content: updatedEvent.title,
          scheduled_at: updatedEvent.date.toISOString(),
        })

        if (!data) {
          throw new Error('Failed to update content')
        }
      }

      // UI 상태 업데이트
      setEvents(events.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      ))
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('업데이트에 실패했습니다.')
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
      setIsEditModalOpen(false)
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

    if (!eventDataString || eventDataString === 'undefined' || eventDataString === 'null') return;
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

      if (!existingTime || typeof existingTime !== 'string') {
        console.error("Invalid existing time format:", existingTime)
        return
      }

      const timeParts = existingTime.split(':')
      if (timeParts.length !== 2) {
        console.error("Invalid existing time format:", existingTime)
        return
      }

      const [hours, minutes] = timeParts.map(Number);
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

  const handleDragLeave = () => {
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
    <div
      ref={view === 'list' ? listContainerRef : null}
      className="h-full w-full overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    >
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
        <div className="bg-card pb-4">
          <div className="rounded-xl py-1 px-3 grid grid-cols-7 gap-px mb-2 bg-muted text-muted-foreground">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="p-2 text-md font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="rounded-xl">
            {Array.from({ length: weeksCount }).map((_, rowIndex) => (
              <div key={rowIndex} className="rounded-xl grid grid-cols-7 gap-px bg-muted mb-2 py-1 px-3">
                {Array.from({ length: 7 }).map((_, colIndex) => {
                  const dayOffset = rowIndex * 7 + colIndex
                  const currentDate = new Date(startDate)
                  currentDate.setDate(startDate.getDate() + dayOffset)

                  const dayEvents = events
                    .filter(event => format(event.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'))
                    .sort((a, b) => a.date.getTime() - b.date.getTime()) // ⭐ 같은 날 안에서는 시간순 정렬

                  const isDropTarget = dropTargetDate && isSameDay(currentDate, dropTargetDate)

                  return (
                    <div
                      key={dayOffset}
                      className={cn(
                        "min-h-[100px] md:min-h-[180px] md:p-3 border border-transparent rounded-2xl transition-colors duration-150 ease-in-out",
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
                              'relative rounded-xl px-1 py-2 md:p-3 text-sm transition-colors',
                              event.status === 'scheduled'
                                ? 'bg-white border-gray-200 text-foreground cursor-grab hover:bg-gray-50'
                                : 'bg-muted-foreground/5 border-gray-200 text-gray-500',
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
                                  ? "bg-green-400 animate-pulse"
                                  : ""
                              )}
                            />
                            <div className="font-semibold text-xs mb-1">{event.time}</div>
                            <div className="flex items-center gap-1">
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
        <div className="mt-4 pb-8">
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete schedule?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the scheduled post?
              The post will be saved as a draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={confirmDelete}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/PostCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Event } from './types'

interface EditPostModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  event: Event | null
  onEventUpdate: (updatedEvent: Event) => void
  onEventDelete: (eventId: string) => void
}

export function EditPostModal({
  isOpen,
  onOpenChange,
  event,
  onEventUpdate,
  onEventDelete,
}: EditPostModalProps) {
  const [editContent, setEditContent] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const timeSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (event) {
      setEditContent(event.title)
      setEditTime(event.time)
      setEditDate(event.date)
    } else {
      setEditContent('')
      setEditTime('')
      setEditDate(undefined)
    }
  }, [event])

  useEffect(() => {
    if (isOpen && timeSectionRef.current) {
      setTimeout(() => {
        timeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isOpen]);

  const handleSaveChanges = () => {
    if (!event || !editDate) return

    const [hours, minutes] = editTime.split(':').map(Number)
    const newDate = new Date(editDate)
    newDate.setHours(hours, minutes, 0, 0)

    const updatedEvent = {
      ...event,
      title: editContent,
      time: editTime,
      date: newDate
    }

    onEventUpdate(updatedEvent)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!event) return
    onOpenChange(false) // 먼저 EditPostModal 닫기
    onEventDelete(event.id) // 삭제 요청
  }

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit content</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <PostCard
            variant="writing"
            username="내 계정" // TODO: 실제 사용자 이름으로 변경
            content={editContent}
            onContentChange={setEditContent}
          />
        </div>

        <div ref={timeSectionRef} className="flex items-center justify-end gap-4 pb-4">
          <div className="font-medium">일정:</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !editDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editDate ? format(editDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={editDate}
                onSelect={setEditDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={editTime} onValueChange={setEditTime}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="시간 선택" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px] overflow-y-auto">
              {Array.from({ length: 24 }).flatMap((_, hour) =>
                Array.from({ length: 4 }).map((_, minuteIndex) => {
                  const minute = minuteIndex * 15
                  const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                  return (
                    <SelectItem key={timeString} value={timeString}>
                      {timeString}
                    </SelectItem>
                  )
                })
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          <div className="flex justify-between w-full">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Schedule
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveChanges}>
                Change Schedule
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
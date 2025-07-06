'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { PostCard } from '@/components/PostCard'
import { ThreadChain } from '@/components/ThreadChain'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Event } from './types'
import { ThreadContent, getThreadChainByParentId } from '@/app/actions/threadChain'

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
  const [editThreads, setEditThreads] = useState<ThreadContent[]>([])
  const [editTime, setEditTime] = useState('')
  const [editDate, setEditDate] = useState<Date | undefined>(undefined)
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const timeSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadThreadChainData() {
      if (!event) {
        setEditContent('')
        setEditThreads([])
        setEditTime('')
        setEditDate(undefined)
        return
      }

      setEditContent(event.title)
      setEditTime(event.time)
      setEditDate(event.date)
      
      // Load complete thread chain data if this is a thread chain
      if (event.is_thread_chain) {
        setIsLoadingThreads(true)
        try {
          // For thread chains, use parent_media_id if available, or the event's own id if it's the first thread
          const parentId = event.parent_media_id || event.id
          console.log('Loading thread chain for parentId:', parentId, 'event:', event)
          const { data: threadChainData, error } = await getThreadChainByParentId(parentId)
          console.log('Thread chain data received:', threadChainData, 'error:', error)
          
          if (error) {
            console.error('Error loading thread chain:', error)
            // Fallback to single thread
            setEditThreads([{
              content: event.title,
              media_urls: event.media_urls || [],
              media_type: event.media_type
            }])
          } else if (threadChainData && threadChainData.length > 0) {
            // Convert database records to ThreadContent format
            const threads: ThreadContent[] = threadChainData.map(thread => ({
              content: thread.content,
              media_urls: thread.media_urls || [],
              media_type: thread.media_type || 'TEXT'
            }))
            setEditThreads(threads)
          } else {
            // Fallback to single thread
            setEditThreads([{
              content: event.title,
              media_urls: event.media_urls || [],
              media_type: event.media_type
            }])
          }
        } catch (error) {
          console.error('Error loading thread chain:', error)
          // Fallback to single thread
          setEditThreads([{
            content: event.title,
            media_urls: event.media_urls || [],
            media_type: event.media_type
          }])
        } finally {
          setIsLoadingThreads(false)
        }
      } else {
        // Single post
        setEditThreads([{
          content: event.title,
          media_urls: event.media_urls || [],
          media_type: event.media_type
        }])
      }
    }

    loadThreadChainData()
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

    if (!editTime || typeof editTime !== 'string') {
      console.error("Invalid edit time format:", editTime);
      return;
    }

    const timeParts = editTime.split(':');
    if (timeParts.length !== 2) {
      console.error("Invalid edit time format:", editTime);
      return;
    }

    const [hours, minutes] = timeParts.map(Number)
    const newDate = new Date(editDate)
    newDate.setHours(hours, minutes, 0, 0)

    const updatedEvent = {
      ...event,
      title: event.is_thread_chain ? editThreads[0]?.content || '' : editContent,
      time: editTime,
      date: newDate,
      threads: event.is_thread_chain ? editThreads : undefined
    }

    onEventUpdate(updatedEvent)
    onOpenChange(false)
  }

  // Thread chain handlers
  const updateThreadContent = (index: number, content: string) => {
    setEditThreads(prev => prev.map((thread, i) =>
      i === index ? { ...thread, content } : thread
    ))
    // Update editContent for single posts
    if (index === 0) {
      setEditContent(content)
    }
  }

  const updateThreadMedia = (index: number, media_urls: string[]) => {
    setEditThreads(prev => prev.map((thread, i) =>
      i === index ? {
        ...thread,
        media_urls,
        media_type: media_urls.length > 1 ? 'CAROUSEL' : media_urls.length === 1 ? 'IMAGE' : 'TEXT'
      } : thread
    ))
  }

  const addNewThread = () => {
    setEditThreads(prev => [...prev, { content: '', media_urls: [], media_type: 'TEXT' }])
  }

  const removeThread = (index: number) => {
    if (editThreads.length <= 1) return
    setEditThreads(prev => prev.filter((_, i) => i !== index))
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
          {isLoadingThreads ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading thread chain...</div>
            </div>
          ) : event?.is_thread_chain ? (
            <ThreadChain
              threads={editThreads}
              variant="writing"
              username="내 계정" // TODO: 실제 사용자 이름으로 변경
              onThreadContentChange={updateThreadContent}
              onThreadMediaChange={updateThreadMedia}
              onAddThread={addNewThread}
              onRemoveThread={removeThread}
            />
          ) : (
            <PostCard
              variant="writing"
              username="내 계정" // TODO: 실제 사용자 이름으로 변경
              content={editContent}
              onContentChange={setEditContent}
            />
          )}
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
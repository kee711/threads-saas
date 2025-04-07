'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar as CalendarIcon, Clock, ChevronDown, Plus, Edit, Check } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'

interface Event {
  id: string
  title: string
  date: Date
  time: string
  status: 'scheduled' | 'posted'
}

export function Calendar() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [date, setDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/contents/scheduled')
        const data = await response.json()

        const formattedEvents = data.map((content: any) => ({
          id: content.id,
          title: content.content,
          date: new Date(content.publish_at || content.created_at),
          time: format(new Date(content.publish_at || content.created_at), 'HH:mm'),
          status: content.publish_status
        }))

        setEvents(formattedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      }
    }

    fetchEvents()
  }, [])

  const scheduledCount = events.filter(event => event.status === 'scheduled').length

  return (
    <div className="w-full space-y-4">
      {/* Header */}
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

          {/* Date Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                {format(date, 'yyyy MMMM', { locale: ko })}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(newDate: Date | undefined) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card">
        {/* Weekday Headers */}
        <div className="rounded-lg py-1 px-3 grid grid-cols-7 gap-px mb-2 bg-muted text-muted-foreground">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-2 text-md font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="rounded-lg">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div key={rowIndex} className="rounded-lg grid grid-cols-7 gap-px bg-muted mb-2 py-1 px-3">
              {Array.from({ length: 7 }).map((_, colIndex) => {
                const i = rowIndex * 7 + colIndex; // 각 날짜 인덱스 계산
                const currentDate = new Date(2025, 2, i + 1);
                const dayEvents = events.filter(
                  event => format(event.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                );

                return (
                  <div key={i} className="min-h-[150px] p-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      {format(currentDate, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'rounded-md p-2 text-sm hover:bg-accent transition-colors',
                            event.status === 'scheduled'
                              ? 'bg-blue-50 text-foreground'
                              : 'bg-blue-100 text-muted-foreground'
                          )}
                        >
                          <div className="font-semibold">{event.time}</div>
                          <div className="truncate">
                            {event.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ChangePublishTimeDialog() {
  const [publishTimes, setPublishTimes] = useState<string[]>(['11:00', '16:00']);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newTime, setNewTime] = useState('');

  const addTime = () => {
    if (newTime) {
      setPublishTimes([...publishTimes, newTime]);
      setNewTime('');
    }
  };

  const editTime = (index: number) => {
    setEditingIndex(index);
    setNewTime(publishTimes[index]);
  };

  const saveTime = (index: number) => {
    const updatedTimes = [...publishTimes];
    updatedTimes[index] = newTime;
    setPublishTimes(updatedTimes);
    setEditingIndex(null);
    setNewTime('');
  };

  const saveToDatabase = async () => {
    try {
      const response = await fetch('/api/user/update-publish-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publishTimes }),
      });

      if (!response.ok) {
        throw new Error('Failed to save publish times');
      }
    } catch (error) {
      console.error('Error saving publish times:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Change Publish Time</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Change Publish Time
          </DialogTitle>
        </DialogHeader>
        <div>
          {publishTimes.map((time, index) => (
            <div key={index} className=" rounded-lg flex items-center justify-between px-4 py-2 mb-2 bg-muted">
              {editingIndex === index ? (
                <>
                  <input
                    type="time"
                    value={newTime}
                    className='bg-transparent'
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                  <Button variant='ghost' size='icon' onClick={() => saveTime(index)}>
                    <Check />
                  </Button>
                </>
              ) : (
                <>
                  <span>{time}</span>
                  <Button variant='ghost' size='icon' onClick={() => editTime(index)}>
                    <Edit />
                  </Button>
                </>
              )}
            </div>
          ))}
          <div className="flex items-center">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
            <Button onClick={addTime}>
              <Plus />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={saveToDatabase}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
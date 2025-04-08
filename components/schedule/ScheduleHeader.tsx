'use client'

import { useState } from 'react'
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
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
            <ShadcnCalendar
              mode={view === 'list' ? "single" : "default"}
              selected={view === 'list' ? selectedDate : undefined}
              onSelect={view === 'list' ? handleListDateSelect : undefined}
              month={month}
              onMonthChange={handleMonthOnlyChange}
              initialFocus
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

export function ChangePublishTimeDialog() {
  const [publishTimes, setPublishTimes] = useState<string[]>(['11:00', '16:00'])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newTime, setNewTime] = useState('')

  const addTime = () => {
    if (newTime) {
      setPublishTimes([...publishTimes, newTime])
      setNewTime('')
    }
  }

  const editTime = (index: number) => {
    setEditingIndex(index)
    setNewTime(publishTimes[index])
  }

  const saveTime = (index: number) => {
    const updatedTimes = [...publishTimes]
    updatedTimes[index] = newTime
    setPublishTimes(updatedTimes)
    setEditingIndex(null)
    setNewTime('')
  }

  const removeTime = (index: number) => {
    setPublishTimes(publishTimes.filter((_, i: number) => i !== index))
  }

  const saveToDatabase = async () => {
    try {
      const response = await fetch('/api/user/update-publish-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publishTimes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save publish times')
      }
    } catch (error) {
      console.error('Error saving publish times:', error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>게시 시간 변경</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">게시 시간 관리</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground mb-2">
            게시물이 자동으로 등록될 시간을 설정합니다.
          </div>

          {publishTimes.length > 0 ? (
            <div className="space-y-2">
              {publishTimes.map((time: string, index: number) => (
                <div key={index} className="rounded-lg flex items-center justify-between px-4 py-2 bg-muted">
                  {editingIndex === index ? (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <Select value={newTime} onValueChange={setNewTime}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="시간 선택" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {Array.from({ length: 24 }).flatMap((_, hour: number) =>
                              Array.from({ length: 4 }).map((_, minuteIndex: number) => {
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
                      <Button variant='outline' size='icon' onClick={() => saveTime(index)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant='ghost' size='icon' onClick={() => editTime(index)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant='ghost' size='icon' onClick={() => removeTime(index)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              설정된 게시 시간이 없습니다.
            </div>
          )}

          <div className="flex items-center gap-2 w-full mt-4">
            <div className="flex-1">
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="시간 선택" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {Array.from({ length: 24 }).flatMap((_, hour: number) =>
                    Array.from({ length: 4 }).map((_, minuteIndex: number) => {
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
            <Button variant="outline" onClick={addTime} disabled={!newTime}>
              <Plus className="h-4 w-4 mr-2" />
              <span>추가</span>
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={saveToDatabase} className="w-full">저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
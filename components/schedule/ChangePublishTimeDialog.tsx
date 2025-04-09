import { useEffect, useState } from "react"
import { updatePublishTimes } from '@/app/actions/user'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Edit, Plus, Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChangePublishTimeDialogProps {
  variant?: 'default' | 'icon'
  onPublishTimeChange?: () => void
  ondisabled?: boolean
}

export function ChangePublishTimeDialog({ variant = 'default', onPublishTimeChange, ondisabled }: ChangePublishTimeDialogProps) {
  const [publishTimes, setPublishTimes] = useState<string[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [newTime, setNewTime] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getDBPublishTimes()
  }, [])

  const getDBPublishTimes = async () => {
    const response = await fetch('/api/user/get-publish-times')
    if (!response.ok) {
      console.error('Failed to fetch publish times')
      return
    }

    const dbTimes = await response.json()

    if (!dbTimes || !Array.isArray(dbTimes)) {
      setPublishTimes([])
      return
    }

    const localTimes = dbTimes.map(time => {
      if (typeof time === 'string' && time.includes('T')) {
        const date = new Date(time)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } else if (typeof time === 'string' && time.includes(':')) {
        const [hours, minutes] = time.split(':').map(Number)

        const date = new Date()
        date.setUTCHours(hours, minutes, 0, 0)

        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      }
      return time
    })

    setPublishTimes(localTimes)
  }

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
      const utcTimes = publishTimes.map(localTime => {
        const [hours, minutes] = localTime.split(':').map(Number)

        const date = new Date()
        date.setHours(hours, minutes, 0, 0)

        const utcHours = date.getUTCHours()
        const utcMinutes = date.getUTCMinutes()

        return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`
      })

      const response = await updatePublishTimes(utcTimes)

      if (!response.success) {
        throw new Error('Failed to save publish times')
      }

      setOpen(false)
      onPublishTimeChange?.()
    } catch (error) {
      console.error('Error saving publish times:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant === 'icon' ? 'default' : 'outline'} disabled={ondisabled} className={`flex items-center gap-2 ${variant === 'icon' ? 'h-full w-8 p-0 rounded-l-sm rounded-r-lg bg-black text-white hover:bg-black/90' : ''}`}>
          {variant === 'icon' ? (
            <Clock className="h-full w-4" />
          ) : (
            <>
              <Clock className="h-4 w-4" />
              <span>게시 시간 변경</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">게시 시간 관리</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground mb-2">
            게시물이 자동으로 등록될 시간을 설정합니다.
            <br />
            가까운 시간대부터 순서대로 예약됩니다.
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
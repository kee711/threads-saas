import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ScheduleTime {
  hour: number
  minute: number
}

interface ScheduleStore {
  scheduleTimes: ScheduleTime[]
  setScheduleTimes: (times: ScheduleTime[]) => void
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      scheduleTimes: [
        { hour: 11, minute: 0 },  // 11:00
        { hour: 16, minute: 0 },  // 16:00
      ],
      setScheduleTimes: (times) => set({ scheduleTimes: times }),
    }),
    {
      name: 'schedule-store',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate schedule store:', error);
          // Clear corrupted data
          localStorage.removeItem('schedule-store');
        }
      },
    }
  )
)

export default useScheduleStore 
export interface Event {
  id: string
  title: string
  date: Date
  time: string
  status: 'scheduled' | 'posted'
} 
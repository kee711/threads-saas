export type Event = {
  id: string
  title: string
  date: Date
  time: string
  status: 'scheduled' | 'posted'
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'
  media_urls: string[]
  is_carousel: boolean
} 
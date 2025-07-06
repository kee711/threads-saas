export type Event = {
  id: string
  title: string
  date: Date
  time: string
  status: 'scheduled' | 'posted'
  media_type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'
  media_urls: string[]
  is_carousel: boolean
  // Thread chain properties
  is_thread_chain?: boolean
  parent_media_id?: string
  thread_sequence?: number
  threads?: {
    content: string
    media_urls?: string[]
    media_type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'
  }[]
} 
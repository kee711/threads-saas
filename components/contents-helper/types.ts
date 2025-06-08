export type ContentCategory = 'external' | 'saved';

export type PublishStatus = 'draft' | 'scheduled' | 'posted';

export interface ContentItem {
  id: string;
  content: string;
  created_at: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  repost_count?: number;
  share_count?: number;
  top_comment?: string;
  url?: string;
  publish_status?: 'draft' | 'scheduled' | 'published' | 'failed';
  category?: string;
}

export interface ContentListProps {
  category: ContentCategory;
  title: string;
}

export interface ExternalContent {
  id: string;
  content: string;
  top_comment?: string;
  view_count?: number;
  url?: string;
  category?: string;
  like_count?: number;
  comment_count?: number;
  repost_count?: number;
  share_count?: number;
  is_engaged?: boolean;
  created_at: string;
} 
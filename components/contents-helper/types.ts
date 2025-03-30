export type ContentCategory = 'viral' | 'news' | 'drafts';

export type PublishStatus = 'draft' | 'scheduled' | 'posted';

export interface ContentItem {
  id: string;
  content: string;
  category?: string;
  publish_status?: PublishStatus;
  scheduled_at?: string;
  created_at: string;
  user_id?: string;
  // External content fields
  top_comment?: string;
  view_count?: number;
  url?: string;
  like_count?: number;
  comment_count?: number;
  repost_count?: number;
  share_count?: number;
  is_engaged?: boolean;
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
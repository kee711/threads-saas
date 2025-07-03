export type ContentCategory = 'external' | 'saved';

export type PublishStatus = 'draft' | 'scheduled' | 'posted';

export interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  replies: PostComment[];
  is_replied: boolean;
  root_post: string;
  root_post_content?: ContentItem;
}

export interface PostComment {
  media_type: string;
  text: string;
  reply_to_id: string;
}

export interface ContentItem {
  my_contents_id: string;
  content: string;
  created_at?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  repost_count?: number;
  share_count?: number;
  top_comment?: string;
  url?: string;
  publish_status?: 'draft' | 'scheduled' | 'published' | 'failed';
  category?: string;
  media_id?: string;
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
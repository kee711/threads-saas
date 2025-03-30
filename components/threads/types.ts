export interface ThreadsCredentials {
  username: string;
  password: string;
}

export interface ThreadsContent {
  id: number;
  content: string;
  isConfirmed: boolean;
  isScheduled: boolean;
  publishDate?: string;
  createdAt: Date;
}

export interface ThreadsUser {
  username: string;
  password: string;
}

export interface GenerateContentParams {
  topic: string;
  reference: string;
}

export interface ThreadsSearchResult {
  id: string;
  content: string;
  timestamp: string;
  username: string;
} 
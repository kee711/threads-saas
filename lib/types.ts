export interface Content {
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
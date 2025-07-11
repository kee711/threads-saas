-- 스레드 큐 테이블 생성
CREATE TABLE thread_queue (
    queue_id VARCHAR PRIMARY KEY,
    parent_media_id VARCHAR NOT NULL,
    thread_sequence INTEGER NOT NULL,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    media_type VARCHAR DEFAULT 'TEXT',
    social_id VARCHAR NOT NULL,
    access_token VARCHAR NOT NULL,
    user_id UUID NOT NULL,
    reply_to_id VARCHAR,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

-- 인덱스 생성
CREATE INDEX idx_thread_queue_status ON thread_queue(status);
CREATE INDEX idx_thread_queue_created_at ON thread_queue(created_at);
CREATE INDEX idx_thread_queue_parent_media_id ON thread_queue(parent_media_id);
CREATE INDEX idx_thread_queue_user_id ON thread_queue(user_id);

-- RLS 정책 설정
ALTER TABLE thread_queue ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 큐 아이템만 볼 수 있음
CREATE POLICY "Users can view their own queue items" ON thread_queue
    FOR SELECT USING (user_id = auth.uid());

-- 사용자는 자신의 큐 아이템만 삽입할 수 있음
CREATE POLICY "Users can insert their own queue items" ON thread_queue
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 사용자는 자신의 큐 아이템만 업데이트할 수 있음
CREATE POLICY "Users can update their own queue items" ON thread_queue
    FOR UPDATE USING (user_id = auth.uid());

-- 사용자는 자신의 큐 아이템만 삭제할 수 있음
CREATE POLICY "Users can delete their own queue items" ON thread_queue

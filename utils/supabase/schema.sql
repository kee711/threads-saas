-- 1. external_contents (외부 콘텐츠)
CREATE TABLE IF NOT EXISTS public.external_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    key_comments TEXT,
    view_count INTEGER DEFAULT 0,
    url TEXT NOT NULL,
    category VARCHAR(255),
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    repost_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    is_engaged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. users (내 계정)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    threads_profile VARCHAR(255),
    performance_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. user_contents (내 콘텐츠)
CREATE TABLE IF NOT EXISTS public.user_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    content TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(255),
    status VARCHAR(50) CHECK (status IN ('draft', 'scheduled', 'posted')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 
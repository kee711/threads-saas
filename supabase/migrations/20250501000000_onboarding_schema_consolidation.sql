-- 1. social_accounts 테이블에 필드 추가
ALTER TABLE social_accounts 
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS account_info TEXT,
ADD COLUMN IF NOT EXISTS account_tags TEXT[];

-- 2. 기존 account_type 테이블의 데이터를 social_accounts로 이관
UPDATE social_accounts sa
SET account_type = at.type
FROM account_type at
WHERE sa.id = at.social_account_id;

-- 3. 기존 account_info 테이블의 데이터를 social_accounts로 이관
UPDATE social_accounts sa
SET account_info = ai.info
FROM account_info ai
WHERE sa.id = ai.social_account_id;

-- 4. 기존 account_tags 테이블의 데이터를 social_accounts로 이관
UPDATE social_accounts sa
SET account_tags = ARRAY(
  SELECT tag
  FROM account_tags at
  WHERE at.social_account_id = sa.id
);

-- 5. 기존 테이블 삭제
DROP TABLE IF EXISTS account_tags;
DROP TABLE IF EXISTS account_info;
DROP TABLE IF EXISTS account_type; 
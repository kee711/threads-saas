-- 기존 암호화된 토큰들을 초기화하는 스크립트
-- 주의: 이 스크립트를 실행하면 모든 사용자가 Threads 계정을 다시 연결해야 합니다.

UPDATE social_accounts 
SET 
  access_token = NULL,
  expires_at = NULL,
  is_active = false
WHERE platform = 'threads' AND access_token IS NOT NULL;

-- 결과 확인
SELECT 
  COUNT(*) as updated_accounts 
FROM social_accounts 
WHERE platform = 'threads' AND access_token IS NULL; 
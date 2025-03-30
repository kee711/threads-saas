# Threads 콘텐츠 생성기

AI를 이용해 Threads에 발행할 콘텐츠를 자동으로 생성하고 발행할 수 있는 서비스입니다.

## 주요 기능

- AI를 통한 Threads 콘텐츠 자동 생성
- 생성된 콘텐츠 편집 및 확정
- Threads 계정 연동
- 콘텐츠 자동 예약 발행

## 기술 스택

- [Next.js 15](https://nextjs.org/) - 리액트 프레임워크
- [React 19](https://react.dev/) - UI 라이브러리
- [TypeScript](https://www.typescriptlang.org/) - 정적 타입 지원
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [shadcn/ui](https://ui.shadcn.com/) - UI 컴포넌트 라이브러리
- [Supabase](https://supabase.com/) - 백엔드 서비스
- [OpenAI API](https://openai.com/) - AI 콘텐츠 생성
- [Threads API](https://www.npmjs.com/package/threads-api) - Threads 연동

## 시작하기

### 환경 설정

먼저 프로젝트에 필요한 환경 변수를 설정하세요. 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 설치 및 실행

```bash
# 종속성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 사용 방법

1. Threads 계정으로 로그인합니다.
2. 콘텐츠 생성 양식에서 주제와 선택적으로 참고 자료를 입력합니다.
3. AI가 생성한 콘텐츠를 검토하고 필요에 따라 편집합니다.
4. 발행하고 싶은 콘텐츠를 확정합니다.
5. '확정된 콘텐츠 발행' 버튼을 클릭하여 콘텐츠를 Threads에 자동으로 발행합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

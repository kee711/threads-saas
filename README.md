# AI 스레드 콘텐츠 생성기

AI를 활용하여 스레드용 콘텐츠를 자동으로 생성하고 발행하는 웹 애플리케이션입니다.

## 기능

1. **AI 콘텐츠 생성**: 주제와 참고 자료를 입력하여 GPT 기반으로 10개의 스레드 콘텐츠를 자동 생성합니다.
2. **콘텐츠 편집 및 관리**: 생성된 콘텐츠를 직접 편집하고 관리할 수 있습니다.
3. **자동 발행 스케줄링**: 확정된 콘텐츠를 1시간 간격으로의 자동 발행을 스케줄링합니다.

## 기술 스택

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- OpenAI API
- Threads API

## 시작하기

### 환경 설정

1. 저장소를 클론합니다.
```bash
git clone https://github.com/yourusername/threads-saas.git
cd threads-saas
```

2. 필요한 패키지를 설치합니다.
```bash
npm install
```

3. `.env.local` 파일을 생성하고 필요한 환경 변수를 설정합니다.
```
OPENAI_API_KEY=your_openai_api_key
```

4. 개발 서버를 실행합니다.
```bash
npm run dev
```

## 사용 방법

1. 홈페이지에서 Threads 계정으로 로그인합니다.
2. 콘텐츠 생성 폼에서 주제와 참고 자료를 입력합니다.
3. 생성된 콘텐츠를 검토하고 필요에 따라 편집합니다.
4. 마음에 드는 콘텐츠는 '확정' 버튼을 클릭합니다.
5. '확정된 콘텐츠 발행하기' 버튼을 클릭하여 자동 발행을 예약합니다.

## 라이선스

MIT

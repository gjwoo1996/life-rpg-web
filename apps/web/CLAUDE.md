# CLAUDE.md — apps/web

Next.js App Router 프론트엔드 (포트 3000).

## 명령어

```bash
npm run lint --workspace=apps/web    # ESLint
npm run build --workspace=apps/web   # 프로덕션 빌드 (타입 에러도 확인됨)
```

## 아키텍처

### API 클라이언트

**`src/lib/api.ts` 단일 파일**. `api.character`, `api.goal`, `api.activity` 등 리소스별 네임스페이스로 구성된 단일 클라이언트 객체. 모든 페이지/컴포넌트는 이 파일만 import한다.

### 페이지 라우팅

- `/` — 캐릭터 목록 (홈)
- `/characters/[id]` — 캐릭터 대시보드 (Phaser 캐릭터, 능력치, 목표 목록)
- `/characters/[id]/activity/new` — 활동 로그 작성
- `/characters/[id]/goals/new` — 목표 생성
- `/activity` — 월별 활동 캘린더
- `/growth` — 성장 그래프
- `/analysis` — 일일/목표 AI 분석
- `/settings` — 설정 (폰트 선택 등)
- `/character-test` — Phaser 캐릭터 테스트 페이지

### 폰트

`FontProvider` 컴포넌트가 `localStorage`에서 선택된 폰트를 읽어 `<body>`에 CSS 변수로 적용. 선택지: Jua, Gowun Dodum, Hi Melody.

### Phaser 통합

`PhaserCharacter.tsx`는 SSR 비호환이므로 반드시 `dynamic(() => import(...), { ssr: false })`로 로드.

## 코딩 규칙

### API 호출

- 반드시 `src/lib/api.ts`만 사용한다. 컴포넌트/페이지에서 `fetch` 직접 호출 금지.
- 새 엔드포인트 추가 시 `api.ts`의 해당 네임스페이스 객체에 메서드를 추가한다.

### 컴포넌트 `'use client'` 기준

- 브라우저 API(`localStorage`, `window`), React 훅(`useState`, `useEffect`), 이벤트 핸들러가 필요한 경우에만 선언.
- 데이터 페칭만 하는 컴포넌트는 Server Component로 유지.

### SSR 주의사항

- 브라우저 전용 라이브러리는 반드시 `dynamic(() => import(...), { ssr: false })`로 로드.
- `typeof window !== 'undefined'` 가드는 동적 임포트로 해결 가능한 경우 사용하지 않는다.

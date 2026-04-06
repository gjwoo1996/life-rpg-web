# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### 전체 실행
```bash
npm install          # 루트에서 실행 (npm workspaces — api + web 모두 설치)
npm run dev          # API 먼저 기동 후 웹 자동 기동 (concurrently)
npm run dev:api      # NestJS API만 (포트 3001, 핫리로드)
npm run dev:web      # Next.js 웹만 (포트 3000)
npm run build        # api → web 순서로 빌드
```

### API (apps/api)
```bash
npm run test --workspace=apps/api          # 전체 테스트
npm run test --workspace=apps/api -- --testPathPattern=activity  # 특정 모듈 테스트
npm run test:e2e --workspace=apps/api      # E2E 테스트
npm run lint --workspace=apps/api          # ESLint 자동 수정 포함
npx tsc -p apps/api/tsconfig.json --noEmit # 타입 검증
```

### 웹 (apps/web)
```bash
npm run lint --workspace=apps/web          # ESLint
npm run build --workspace=apps/web         # 프로덕션 빌드 (타입 에러도 확인됨)
```

## 아키텍처

### 전체 구조
npm workspaces 모노레포. `apps/api`(NestJS, REST API)와 `apps/web`(Next.js, 프론트엔드)로 구성되며 외부 의존성으로 PostgreSQL과 Ollama(LLM)를 사용한다. 두 서비스 모두 Common_Repo에서 `host.docker.internal`로 접근한다.

### API (apps/api/src)

**도메인 모듈 구조**: 각 도메인은 `module / controller / service / dto` 4파일 세트.
- `character` — 캐릭터 CRUD, XP·레벨 계산 (`xp_to_level: 1 + floor(xp/100)`)
- `goal` — 목표 CRUD, 날짜 범위 조회(`findForDate`)
- `goal-step` — 목표 하위 스텝 (goal 날짜 범위 내로 제한 검증 포함)
- `ability` — 능력치 CRUD + `AbilityStat` XP upsert (최대 100 cap)
- `activity` — 활동 로그 생성 시 Ollama 호출 → XP 반영 → 분석 트리거까지 오케스트레이션
- `analysis` — 일일/목표 분석 생성 및 저장 (Ollama 사용)
- `ollama` — LLM 통신 레이어. `prompt-builder.ts`(프롬프트 생성), `xp-rules.ts`(규칙 기반 XP 계산)로 분리
- `reset` — 개발용 전체 데이터 초기화

**엔티티는 `src/entities/`에 집중**: 모든 TypeORM 엔티티가 한 디렉토리에 있으며 `index.ts`로 re-export. 각 모듈에서 `TypeOrmModule.forFeature()`로 필요한 엔티티만 주입받는다.

**활동 생성 플로우** (`activity.service.ts::create`):
1. 능력치 목록 조회 → 2. Ollama 요약 → 3. Ollama XP 분석(규칙 우선, 실패 시 LLM) → 4. 능력치 XP 반영 → 5. 캐릭터 XP 반영 → 6. 활동 로그 저장 → 7. 일일 분석 재생성 → 8. 목표 분석 재생성 (7, 8은 실패해도 무시)

**DB 스키마 자동 동기화**: `NODE_ENV !== 'production'` 환경에서는 TypeORM `synchronize: true`가 활성화된다. 운영에서는 반드시 마이그레이션 사용.

### 웹 (apps/web/src)

**API 호출은 `lib/api.ts` 단일 파일**: `api.character`, `api.goal`, `api.activity` 등 리소스별 네임스페이스로 구성된 단일 클라이언트 객체. 모든 페이지/컴포넌트는 이 파일만 import한다.

**페이지 라우팅** (Next.js App Router):
- `/` — 캐릭터 목록 (홈)
- `/characters/[id]` — 캐릭터 대시보드 (Phaser 캐릭터, 능력치, 목표 목록)
- `/characters/[id]/activity/new` — 활동 로그 작성
- `/characters/[id]/goals/new` — 목표 생성
- `/activity` — 월별 활동 캘린더
- `/growth` — 성장 그래프
- `/analysis` — 일일/목표 AI 분석
- `/settings` — 설정 (폰트 선택 등)
- `/character-test` — Phaser 캐릭터 테스트 페이지

**폰트**: `FontProvider` 컴포넌트가 `localStorage`에서 선택된 폰트를 읽어 `<body>`에 CSS 변수로 적용. 선택지: Jua, Gowun Dodum, Hi Melody.

**Phaser 통합**: `PhaserCharacter.tsx`는 SSR 비호환이므로 `dynamic(() => import(...), { ssr: false })`로 로드해야 한다.

## 환경 변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `DATABASE_URL` | apps/api | PostgreSQL 연결 문자열 |
| `OLLAMA_HOST` | apps/api | Ollama API 주소 (기본: `http://host.docker.internal:11434`) |
| `LIFERPG_LLM_MODEL_DEFAULT` | apps/api | 기본 LLM 모델 (기본: `qwen2.5:7b`) |
| `LIFERPG_LLM_VERBOSE` | apps/api | `true`로 설정 시 LLM 전체 응답 로그 출력 |
| `NEXT_PUBLIC_API_URL` | apps/web | API 베이스 URL (기본: `http://localhost:3001`) |

`.env` 파일은 `apps/api/.env` 또는 루트 `.env` 모두 인식한다.

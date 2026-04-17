<!-- SOURCE FILE — 이 파일을 직접 편집하세요 -->
<!-- 수정 후 반드시 `npm run ai:sync` 를 실행해야 CLAUDE.md / AGENTS.md / .cursorrules 에 반영됩니다 -->

# AI 공통 지침

**항상 한국어로 답변한다.**

**요청 사항이 명확하지 않거나 의도를 정확히 파악하기 어려울 경우, 추측하여 진행하지 말고 반드시 재차 질문하여 정확한 의도를 확인한 후 작업을 수행한다.**

## 기술 스택

npm workspaces 모노레포. `apps/api`(NestJS, 포트 3001) + `apps/web`(Next.js, 포트 3000).

## 전체 실행 명령

```bash
npm install
npm run dev       # api + web 동시 기동
npm run dev:api   # NestJS API만 (포트 3001)
npm run dev:web   # Next.js 웹만 (포트 3000)
npm run build
```

## 코드 스타일

- **주석**: WHY가 비자명한 경우에만 1줄. WHAT 설명 주석 금지.
- **파일 책임**: 파일 하나에 관심사 하나.
- **DTO**: class-validator 데코레이터 필수 (누락 시 런타임 에러).
- **추측 금지**: 불명확하면 재질문.

## 커밋 메시지

```
<type>: <한국어 설명>
타입: feat / fix / docs / refactor / test / chore
```

## 커밋 분할 원칙

사용자가 커밋을 요청하면 한 번에 단일 커밋으로 처리하지 않는다.

1. `git status`, `git diff`, 최근 커밋 메시지 스타일을 먼저 확인한다.
2. 변경 의도와 성격을 기준으로 커밋 단위를 분리한다.
   - 예: `feat`, `fix`, `test`, `docs`, `chore` — 서로 다른 목적의 변경은 같은 커밋에 섞지 않는다.
3. 각 커밋 메시지는 "무엇을"보다 "왜"를 우선 설명한다.
4. 사용자가 "하나로 커밋"을 명시적으로 요청한 경우에만 단일 커밋으로 처리한다.
5. 분할 기준이 애매하면 추측하지 말고 사용자에게 확인 질문을 한다.

## 현재 프로젝트 도메인

**Life RPG Web** — 캐릭터 성장 기반 활동 기록 앱.

외부 의존성: PostgreSQL, Ollama(`host.docker.internal:11434`).

## 환경 변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `DATABASE_URL` | apps/api | PostgreSQL 연결 문자열 |
| `OLLAMA_HOST` | apps/api | Ollama API 주소 |
| `LIFERPG_LLM_MODEL_DEFAULT` | apps/api | 기본 LLM 모델 (기본: `qwen3:8b`) |
| `LIFERPG_LLM_MODEL_FALLBACK` | apps/api | 폴백 모델 (기본: `qwen2.5:7b`) |
| `LIFERPG_LLM_MODEL_IMAGE` | apps/api | 이미지 입력 분석 모델 (기본: `llava:7b`) |
| `LIFERPG_LLM_VERBOSE` | apps/api | `true` 시 LLM 전체 응답 로그 출력 |
| `NEXT_PUBLIC_API_URL` | apps/web | API 베이스 URL (기본: `http://localhost:3001`) |

`.env` 파일은 `apps/api/.env` 또는 루트 `.env` 모두 인식한다.

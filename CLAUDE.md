# CLAUDE.md

**항상 한국어로 답변한다.**

**요청 사항이 명확하지 않거나 의도를 정확히 파악하기 어려울 경우, 추측하여 진행하지 말고 반드시 재차 질문하여 정확한 의도를 확인한 후 작업을 수행한다.**

npm workspaces 모노레포. `apps/api`(NestJS, REST API)와 `apps/web`(Next.js, 프론트엔드)로 구성. 외부 의존성: PostgreSQL, Ollama(LLM). 두 서비스 모두 `host.docker.internal`로 접근.

세부 가이드는 각 앱의 CLAUDE.md 참조:
- `apps/api/CLAUDE.md` — NestJS API
- `apps/web/CLAUDE.md` — Next.js 웹

## 전체 실행 명령

```bash
npm install       # 루트에서 실행 (api + web 모두 설치)
npm run dev       # API 먼저 기동 후 웹 자동 기동 (concurrently)
npm run dev:api   # NestJS API만 (포트 3001, 핫리로드)
npm run dev:web   # Next.js 웹만 (포트 3000)
npm run build     # api → web 순서로 빌드
```

## 환경 변수

| 변수 | 위치 | 설명 |
|------|------|------|
| `DATABASE_URL` | apps/api | PostgreSQL 연결 문자열 |
| `OLLAMA_HOST` | apps/api | Ollama API 주소 (기본: `http://host.docker.internal:11434`) |
| `LIFERPG_LLM_MODEL_DEFAULT` | apps/api | 기본 LLM 모델 (기본: `qwen3:8b`) |
| `LIFERPG_LLM_MODEL_FALLBACK` | apps/api | 기본 모델 실패 시 재시도할 백업 모델 (기본: `qwen2.5:7b`) |
| `LIFERPG_LLM_VERBOSE` | apps/api | `true`로 설정 시 LLM 전체 응답 로그 출력 |
| `NEXT_PUBLIC_API_URL` | apps/web | API 베이스 URL (기본: `http://localhost:3001`) |

`.env` 파일은 `apps/api/.env` 또는 루트 `.env` 모두 인식한다.

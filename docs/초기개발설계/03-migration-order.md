# 마이그레이션 작업 순서

## 1. life-rpg-web 루트 .gitignore 정리

- Nest + Next 생성 시 생기는 경로 무시 ([01-gitignore.md](01-gitignore.md) 참고).
- 이미 있는 항목은 유지하고, Next 관련 `.next`, `out`, `.env*.local` 등 보강.

## 2. 모노레포 골격

- `life-rpg-web/apps/api`(NestJS), `life-rpg-web/apps/web`(Next.js) 생성.
- 생성 시 기존 git을 덮어쓰지 않도록 하고, 루트 `package.json`에서 workspace 또는 스크립트로 앱 실행.

## 3. NestJS API (apps/api)

- Common_Repo PostgreSQL 연결 (환경변수: `host.docker.internal:5432` 등).
- 스키마 이식: life-rpg의 schema.rs 기준 엔티티 + migration.
- 기존 Tauri command에 대응하는 REST 엔드포인트 구현: character, goal, activity, ability, reset, get_daily_analysis, get_goal_analysis.
- LLM: Common_Repo Ollama (`OLLAMA_HOST=http://host.docker.internal:11434`), life-rpg의 ai/client.rs 로직을 NestJS 서비스로 이식.

## 4. Next.js 앱 (apps/web)

- life-rpg의 `src/` 페이지·컴포넌트·스토어(zustand)를 참고해 Next.js로 재구성.
- `invoke()` 호출을 NestJS API HTTP 클라이언트 호출로 교체.

## 5. DevContainer 설정

- [04-devcontainer.md](04-devcontainer.md) 상세 계획대로 구성.

## 6. CI (선택)

- Next 빌드 및 (선택) NestJS 빌드/테스트로 설정.

## 7. 문서

- life-rpg-web의 README에 웹 앱 + Common_Repo DB/LLM 사용법 정리.

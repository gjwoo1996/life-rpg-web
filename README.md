# life-rpg-web

Next.js(프론트) + NestJS(API)로 마이그레이션한 life-rpg 웹 버전. DB·LLM은 **Common_Repo**(PostgreSQL, Ollama)와 연동합니다.

## 구조

- **apps/web** — Next.js (포트 3000)
- **apps/api** — NestJS REST API (포트 3001)
- **docs/** — 프로젝트 문서

## 사전 조건

- Node.js 18+
- (선택) **Common_Repo** 스택 실행 — PostgreSQL(5432), Ollama(11434) 사용 시  
  Common_Repo에서 DevContainer 또는 `docker compose`로 서비스를 먼저 띄운 뒤, 이 레포에서 개발합니다.

## 설치 및 실행

```bash
# 의존성 설치
npm install

# API (NestJS) — 터미널 1
npm run dev:api

# 웹 (Next.js) — 터미널 2
npm run dev:web

# API 실행 후 웹 실행
npm run dev
```

- 웹: http://localhost:3000  
- API: http://localhost:3001  

## 환경 변수

### API (apps/api)

- **DATABASE_URL** — PostgreSQL 연결 문자열  
  예: `postgresql://postgres:postgres@host.docker.internal:5432/postgres`  
  DevContainer에서는 `host.docker.internal`로 Common_Repo DB 접속.
- **OLLAMA_HOST** — Ollama API 주소  
  예: `http://host.docker.internal:11434`  
  (선택) **PORT** — API 포트 (기본 3001)

### 웹 (apps/web)

- **NEXT_PUBLIC_API_URL** — Nest API 베이스 URL (기본 `http://localhost:3001`)

### DB 스키마 (TypeORM)

API는 TypeORM으로 PostgreSQL에 연결합니다. 테이블이 없으면 엔티티 기준으로 생성하려면 개발 시 `apps/api/src/app.module.ts`에서 `synchronize`를 `true`로 잠시 설정한 뒤 서버를 한 번 실행할 수 있습니다. 운영 환경에서는 반드시 `synchronize: false`로 두고 TypeORM 마이그레이션을 사용하세요.

## DevContainer

이 레포에는 `.devcontainer`가 포함되어 있습니다.  
Common_Repo 스택(PostgreSQL, Ollama)이 **먼저** 호스트에서 실행 중이어야 하며, 컨테이너 안에서는 `host.docker.internal`로 접속합니다.

1. Common_Repo에서 DB·Ollama 기동
2. 이 폴더에서 "Reopen in Container" 실행
3. 컨테이너 내부에서 `npm install` 후 `npm run dev:api`, `npm run dev:web` 실행

## 문서

- [docs/00-overview.md](docs/00-overview.md) — 마이그레이션 개요
- [docs/02-repo-structure.md](docs/02-repo-structure.md) — 리포·DB 스키마
- [docs/03-migration-order.md](docs/03-migration-order.md) — 작업 순서
- [docs/04-devcontainer.md](docs/04-devcontainer.md) — DevContainer 상세

commit test
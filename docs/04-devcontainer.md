# DevContainer 설정 (상세)

life-rpg-web은 **자체적으로 PostgreSQL·Ollama를 띄우지 않고**, 이미 동작 중인 **Common_Repo 스택**에 `host.docker.internal`로 접속하는 방식으로 개발 환경을 구성한다.

---

## 4.1 전제 조건

- **Common_Repo 스택이 먼저 실행 중**이어야 함.
  - VS Code에서 Common_Repo 폴더를 연 뒤 "Reopen in Container" 또는  
    `docker compose -f .devcontainer/docker-compose.yml up -d` 로 서비스 기동.
  - Ollama(11434), PostgreSQL(5432), (선택) CloudBeaver(8978)가 호스트에 노출된 상태.
- life-rpg-web devcontainer는 **workspace 하나만** 가지며, DB/LLM은 모두 `host.docker.internal`로 접속.

---

## 4.2 디렉터리·파일 구성

```
life-rpg-web/.devcontainer/
├── devcontainer.json
├── docker-compose.yml   # workspace 서비스만 정의
├── Dockerfile           # (선택) Node LTS + 공통 도구
└── .env.example         # (선택) 루트 또는 .devcontainer용 예시
```

- `docker-compose.yml`: workspace 서비스 1개만. PostgreSQL·Ollama 서비스는 정의하지 않음.
- `devcontainer.json`: `dockerComposeFile`, `service`, `workspaceFolder`, `features`, `environment`, `forwardPorts` 등 설정.

---

## 4.3 docker-compose.yml 요점

- **서비스**: `workspace` 하나.
- **이미지**: `mcr.microsoft.com/devcontainers/base:ubuntu` 또는 Node LTS 포함 커스텀 Dockerfile.
- **볼륨**: `..:/workspaces/life-rpg-web:cached` 로 소스 마운트.
- **환경 변수** (컨테이너 내에서 Common_Repo 접속용):
  - `OLLAMA_HOST=http://host.docker.internal:11434`
  - `DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/postgres`  
    (또는 `POSTGRES_HOST=host.docker.internal`, `POSTGRES_PORT=5432`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` 조합)
- **ports**: Next.js(3000), NestJS API(예: 3001) 포트 포워딩.
- Linux에서 `host.docker.internal` 미지원 시: `extra_hosts: - "host.docker.internal:host-gateway"` 추가.

### 예시 골격

```yaml
services:
  workspace:
    image: mcr.microsoft.com/devcontainers/base:ubuntu
    command: sleep infinity
    environment:
      - OLLAMA_HOST=http://host.docker.internal:11434
      - DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/postgres
      - TZ=Asia/Seoul
    volumes:
      - ..:/workspaces/life-rpg-web:cached
    ports:
      - "3000:3000"   # Next.js
      - "3001:3001"   # NestJS API
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

---

## 4.4 devcontainer.json 요점

- **name**: 예) `"Life RPG Web Dev"`.
- **dockerComposeFile**: `"docker-compose.yml"`, **service**: `"workspace"`.
- **workspaceFolder**: `"/workspaces/life-rpg-web"`.
- **features**: Node.js LTS (`ghcr.io/devcontainers/features/node:1`, `version: "lts"`). 필요 시 `docker-outside-of-docker` 추가.
- **environment** (또는 docker-compose에서 주입): `OLLAMA_HOST`, `DATABASE_URL` 등. 비밀은 `.env`로 넘기고 `.env`는 `.gitignore`에 포함.
- **forwardPorts**: `[3000, 3001]` (Next, Nest API).
- **postCreateCommand**: `npm install` 또는 루트에서 `pnpm install` 등 패키지 설치.
- **customizations.vscode.extensions**: ESLint, Prettier, Tailwind, (선택) DB 클라이언트 등.
- **mounts**: SSH 등 필요 시 `"source=${localEnv:HOME}/.ssh,target=/home/vscode/.ssh,..."` 유지.

---

## 4.5 환경 변수 및 .env

- **루트 또는 `.devcontainer`** 에 `.env.example` 제공:
  - `OLLAMA_HOST=http://host.docker.internal:11434`
  - `DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/postgres`
  - (선택) `NEST_API_PORT=3001`, `NEXT_PUBLIC_API_URL=http://localhost:3001`
- 실제 비밀/설정은 `.env`에 두고 `.gitignore`로 제외. devcontainer는 가능하면 `docker-compose`의 `env_file: .env` 또는 `environment`로 주입.

---

## 4.6 실행 순서 및 검증

1. **Common_Repo** 에서 devcontainer 또는 compose 기동 후, 호스트에서 `curl -s http://localhost:11434/api/tags`, `nc -zv localhost 5432` 등으로 Ollama·PostgreSQL 접속 확인.
2. **life-rpg-web** 폴더를 연 뒤 "Dev Containers: Reopen in Container" 실행.
3. 컨테이너 내부에서:
   - `echo $OLLAMA_HOST` → `http://host.docker.internal:11434`
   - `curl -s $OLLAMA_HOST/api/tags` 로 Ollama 응답 확인.
   - NestJS 앱에서 `DATABASE_URL`로 PostgreSQL 연결 테스트 (migration 또는 health 엔드포인트).
4. 브라우저에서 `http://localhost:3000`(Next), `http://localhost:3001`(Nest API) 접속 확인.

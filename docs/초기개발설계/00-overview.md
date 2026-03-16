# 마이그레이션 개요

## 작업 위치 및 기존 코드

- **마이그레이션 진행 위치**: **life-rpg-web** (이 레포, 이미 `git init` 됨).
- **기존 소스**: **life-rpg** 레포는 건드리지 않고, 스키마·API·UI 참고용으로만 사용.

## 현재 구조 요약 (참고: life-rpg)

| 구분   | 현재 (life-rpg)            | 대상 (life-rpg-web)                                   |
|--------|----------------------------|-------------------------------------------------------|
| 프론트 | React + Vite (Tauri 창)    | **Next.js**                                          |
| 백엔드 | Rust (Tauri, src-tauri/)  | **NestJS**                                           |
| DB     | SQLite (rusqlite, 앱 로컬) | **PostgreSQL** (Common_Repo)                         |
| LLM    | Ollama (로컬/DevContainer) | **Ollama** (Common_Repo, host.docker.internal:11434) |

- **Common_Repo**: 애플리케이션 코드 없음. DevContainer로 PostgreSQL(5432), Ollama(11434), CloudBeaver(8978)만 제공.
- **기존 백엔드 API**: life-rpg의 `lib.rs` 기준 — character, goal, activity, ability, reset_app, AI(analyze_activity, summarize_content) 등 Tauri command들이 NestJS REST API로 재구현될 대상.

# life-rpg-web 문서

Next.js + NestJS로 마이그레이션하는 life-rpg 웹 버전 프로젝트의 계획 및 설정 문서입니다.

## 문서 목차

| 문서 | 설명 |
|------|------|
| [00-overview.md](00-overview.md) | 마이그레이션 개요, 작업 위치, 현재 구조 요약 |
| [01-gitignore.md](01-gitignore.md) | Git 무시 설정 (루트 .gitignore) |
| [02-repo-structure.md](02-repo-structure.md) | 목표 리포 구조 및 DB 스키마 |
| [03-migration-order.md](03-migration-order.md) | 마이그레이션 작업 순서 |
| [04-devcontainer.md](04-devcontainer.md) | DevContainer 설정 상세 (Common_Repo 연동) |
| [05-migration-gap-and-supplement.md](05-migration-gap-and-supplement.md) | 마이그레이션 격차 분석 및 보완 계획 (UI·API·DB) |

## 요약

- **작업 위치**: 이 레포(life-rpg-web). 기존 life-rpg 소스는 수정하지 않고 참고만 함.
- **스택**: Next.js(프론트) + NestJS(API), DB·LLM은 Common_Repo(PostgreSQL, Ollama) 사용.

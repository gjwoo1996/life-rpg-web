# 목표 리포 구조 (life-rpg-web)

## 디렉터리 구조

```
life-rpg-web/
├── .gitignore        # Nest + Next 빌드/의존성/환경 무시
├── apps/
│   ├── web/          # Next.js (프론트)
│   └── api/          # NestJS (REST API, DB, LLM 호출)
├── docs/             # 프로젝트 문서 (이 디렉터리)
├── package.json      # 루트: workspace 또는 스크립트 집합
├── .devcontainer/    # Common_Repo 연동 개발 환경
└── README.md
```

## DB 스키마

life-rpg의 `src-tauri/src/db/schema.rs`에 정의된 테이블을 PostgreSQL용으로 이식한다.

- **테이블**: character, goals, activity_logs, abilities, ability_stats, daily_analyses, goal_analyses
- **방식**: TypeORM 엔티티 + synchronize 또는 migration

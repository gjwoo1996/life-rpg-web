# CLAUDE.md — apps/api

NestJS REST API 서버 (포트 3001).

## 명령어

```bash
npm run test --workspace=apps/api                                    # 전체 테스트
npm run test --workspace=apps/api -- --testPathPattern=activity      # 특정 모듈 테스트
npm run test:e2e --workspace=apps/api                                # E2E 테스트
npm run lint --workspace=apps/api                                    # ESLint 자동 수정 포함
npx tsc -p apps/api/tsconfig.json --noEmit                          # 타입 검증
```

## 아키텍처

### 도메인 모듈 구조

각 도메인은 `module / controller / service / dto` 4파일 세트. `src/` 하위:

- `character` — 캐릭터 CRUD, XP·레벨 계산 (`xp_to_level: 1 + floor(xp/100)`)
- `goal` — 목표 CRUD, 날짜 범위 조회(`findForDate`)
- `goal-step` — 목표 하위 스텝 (goal 날짜 범위 내로 제한 검증 포함)
- `ability` — 능력치 CRUD + `AbilityStat` XP upsert (최대 100 cap)
- `activity` — 활동 로그 생성 시 Ollama 호출 → XP 반영 → 분석 트리거까지 오케스트레이션
- `analysis` — 일일/목표 분석 생성 및 저장 (Ollama 사용)
- `ollama` — LLM 통신 레이어. `prompt-builder.ts`(프롬프트 생성), `xp-rules.ts`(규칙 기반 XP 계산)로 분리
- `reset` — 개발용 전체 데이터 초기화

### 엔티티

`src/entities/`에 집중. 모든 TypeORM 엔티티가 한 디렉토리에 있으며 `index.ts`로 re-export. 각 모듈에서 `TypeOrmModule.forFeature()`로 필요한 엔티티만 주입받는다.

### 활동 생성 플로우 (`activity.service.ts::create`)

1. 능력치 목록 조회
2. Ollama 요약
3. Ollama XP 분석 (규칙 우선, 실패 시 LLM)
4. 능력치 XP 반영
5. 캐릭터 XP 반영
6. 활동 로그 저장
7. 일일 분석 재생성 (실패해도 무시)
8. 목표 분석 재생성 (실패해도 무시)

### DB

`NODE_ENV !== 'production'`에서는 TypeORM `synchronize: true` 활성화. 운영에서는 반드시 마이그레이션 사용.

### 엔티티 관계

```
Character
  ├── Goal (1:N) → GoalStep (1:N), GoalAnalysis (1:N)
  ├── ActivityLog (1:N)
  ├── Ability (1:N) → AbilityStat (1:N, XP upsert, max 100)
  └── DailyAnalysis (1:N)
```

모든 엔티티는 `src/entities/`에 집중 관리. 삭제 시 `onDelete: 'CASCADE'` 설정됨.

### Ollama 호출 규칙

- 항상 `try/catch`로 감싼다.
- 실패 시 상위 플로우를 중단하지 말고 조용히 무시하거나 폴백 처리한다 (활동 생성 7·8단계 패턴 참조).
- 프롬프트는 `prompt-builder.ts`에서만 생성한다. 서비스 레이어에서 직접 문자열 조합 금지.

### 테스트 작성 패턴

- 파일 위치: 테스트 대상과 동일 디렉토리에 `*.spec.ts`
- 외부 의존성(Ollama, DB)은 `jest.mock()` 또는 `@nestjs/testing` `TestingModule`로 격리
- `describe` → `it` 구조 사용. `test()` 사용 금지

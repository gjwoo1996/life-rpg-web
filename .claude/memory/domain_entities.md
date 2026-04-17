---
name: 도메인 엔티티
description: 현재 도메인 모델과 비즈니스 규칙 (주제 변경 시 교체)
type: project
---

<!-- 주제 변경 시 이 파일의 내용을 새 도메인 모델로 교체한다 -->

**현재 주제:** Life RPG Web

```
Character
  ├── Goal (1:N) → GoalStep (1:N), GoalAnalysis (1:N)
  ├── ActivityLog (1:N)
  ├── Ability (1:N) → AbilityStat (1:N, XP upsert, max 100)
  └── DailyAnalysis (1:N)
```

- 레벨 계산: `level = 1 + floor(xp / 100)`
- GoalStep 날짜: 부모 Goal의 startDate~endDate 범위 내로 제한
- 모든 자식 엔티티: `onDelete: 'CASCADE'`

# 마이그레이션 격차 분석 및 보완 계획

life-rpg(원본) 대비 life-rpg-web의 UI·기능·API·스키마 격차를 정리하고, 보완 작업 순서를 제안한다.

---

## 1. 요약: 원본(life-rpg) vs 현재(life-rpg-web)

| 구분 | life-rpg (원본) | life-rpg-web (현재) |
|------|-----------------|----------------------|
| **진입/캐릭터** | 단일 캐릭터. 없으면 CharacterSetup(생성) → 있으면 홈 | 다중 캐릭터 목록(/characters) + 상세(/characters/[id]) |
| **홈** | CharacterView(픽셀+레벨/XP+능력치 바), GoalForm, GoalList, ActivityLogForm, 활동 캘린더 링크 | 홈은 제목+설명+캐릭터 목록 버튼만 |
| **라우트** | /, /activity, /activity/:date, /analysis | /, /characters, /characters/[id] |
| **목표** | name, start_date, end_date, target_skill, calendar_color, 목표별 분석 | API/엔티티: title, description만. UI에 목표 기간·능력·색상 없음 |
| **활동 기록** | 오늘 날짜+내용, 저장 시 LLM 요약·XP 부여·능력치 반영 | 활동 생성 UI 없음. API는 content만, LLM/XP 연동 없음 |
| **캐릭터** | level, xp 있음. 활동 시 update_character_xp | 엔티티에 level, xp 없음 |
| **활동 로그** | date, content, summary, ai_result, xp_gained | createdAt, content만. date/summary/xp_gained 없음 |
| **능력치** | get_ability_stats(ability_id, name, xp), 활동 시 XP 누적 | ability_stats 구조 상이(value+recordedAt). 활동 생성 시 XP 누적 로직 없음 |
| **일일/목표 분석** | get_daily_analysis, get_goal_analysis | API는 있음. 프론트에 분석 페이지 없음 |
| **기타 UI** | AppHeader(메뉴), LogViewer, PixelCharacter, 초기화 | 없음 |

---

## 2. 백엔드(API·DB) 격차 및 보완

### 2.1 Character

- **격차**: 원본은 `level`, `xp` 보유 및 `update_character_xp` 호출. Nest Character 엔티티에는 `level`, `xp` 없음.
- **보완**:
  - `Character` 엔티티에 `level`, `xp` (숫자) 컬럼 추가 및 migration.
  - 활동 로그 저장 시 부여된 XP만큼 캐릭터 XP/레벨 갱신 로직 추가 (또는 능력치 XP 합산으로 레벨 계산).

### 2.2 Goal

- **격차**: 원본은 `name`, `start_date`, `end_date`, `target_skill`, `calendar_color`. Nest Goal은 `title`, `description`만 있음.
- **보완**:
  - Goal 엔티티에 `startDate`, `endDate`, `targetSkill`, `calendarColor` 추가 (기존 title/description은 name 용도로 매핑 또는 유지).
  - CreateGoalDto/UpdateGoalDto 및 GoalService를 원본 스펙에 맞게 수정.
  - 목표별 분석·캘린더 표시를 위해 목표 목록 API가 위 필드들을 반환하도록 보장.

### 2.3 Activity log

- **격차**: 원본은 `date`, `content`, `summary`, `ai_result`, `xp_gained` 및 “오늘만 허용”. 저장 시 LLM 요약·XP 분석·능력치 XP 반영. Nest는 `content`, `createdAt` 위주이며 LLM/XP 미연동.
- **보완**:
  - ActivityLog 엔티티에 `date`(날짜), `summary`, `aiResult`, `xpGained` 추가 및 migration.
  - CreateActivityLogDto에 `date` 추가. 서버에서 “오늘만 허용” 검사 (선택).
  - 활동 생성 플로우: Ollama 호출 → 요약·능력별 XP 계산 → ability_stats 및 character XP 갱신 → activity_log에 summary, ai_result, xp_gained 저장. (원본 `create_activity_log` 로직 이식)

### 2.4 Ability / AbilityStat

- **격차**: 원본 ability_stats는 (character_id, ability_id, xp) 한 행으로 능력당 총 XP. Nest AbilityStat은 `value`, `recordedAt` 구조로 되어 있어 “기록 시점별 값” 형태일 수 있음.
- **보완**:
  - 원본과 동일하게 “능력당 총 XP” 모델로 통일할지 결정. 통일 시 AbilityStat을 characterId+abilityId+xp 형태로 스키마/서비스 정리.
  - `get_ability_stats`에 대응하는 API(캐릭터별 능력명·XP 목록) 노출 및 프론트 CharacterView에서 사용.

### 2.5 Analysis

- **격차**: 일일/목표 분석 API는 존재. 다만 활동 로그에 `date`가 없으면 일일 분석이 “날짜 기준”이 아닌 createdAt 기준이 됨.
- **보완**:
  - ActivityLog에 `date` 추가 후, 일일 분석 조회/생성을 해당 `date` 기준으로 수행하도록 수정.
  - 목표 분석은 Goal 스키마 보완 후 기존 API가 목표별로 정상 동작하는지 검증.

### 2.6 Reset

- **확인**: Nest reset API가 모든 캐릭터·목표·활동·능력·분석 데이터를 삭제하는지 확인. 원본 `reset_app` 동작과 동일하게 맞춤.

---

## 3. 프론트(UI·플로우) 격차 및 보완

### 3.1 진입·캐릭터 플로우

- **격차**: 원본은 단일 캐릭터(없으면 생성 화면). 웹은 다중 캐릭터 목록/상세만 있음.
- **보완 (선택지)**:
  - **A**: 원본처럼 “현재 선택 캐릭터 1개” 기준으로 홈/목표/활동/분석을 구성. 캐릭터 목록에서 선택 시 해당 캐릭터를 “현재 캐릭터”로 두고, 없으면 캐릭터 생성(CharacterSetup) 유도.
  - **B**: 현재처럼 다중 캐릭터를 유지하되, “캐릭터 상세 = 해당 캐릭터의 홈”으로 확장해 목표·활동·분석을 모두 캐릭터 상세 안에 구성.
  - 어느 쪽이든 “캐릭터가 0명일 때 캐릭터 생성 UI”는 필수.

### 3.2 홈(메인) 화면

- **격차**: 원본 홈에는 CharacterView(픽셀 캐릭터+이름/레벨/XP+능력치 바), GoalForm, GoalList, ActivityLogForm, “활동 캘린더 보기” 링크가 있음. 웹 홈에는 없음.
- **보완**:
  - “현재 캐릭터” 또는 “캐릭터 상세”에 아래를 배치:
    - **CharacterView**: PixelCharacter(level), 이름, Lv/XP, get_ability_stats 기반 능력치 바(원본과 동일 UX).
    - **GoalForm**: name, start_date, end_date, target_skill(기존 능력 선택/직접입력), calendar_color. API가 보완된 CreateGoal 사용.
    - **GoalList**: 목표 목록(이름, 기간, target_skill, 색상). API 응답 필드에 맞게 표시.
    - **ActivityLogForm**: 오늘 날짜 표시 + content 입력. 저장 시 API에서 date 전달(오늘), LLM·XP 연동된 생성 API 호출.
    - “활동 캘린더 보기” → /activity 로 이동.

### 3.3 라우트·페이지 추가

- **/activity**: 원본 ActivityPage. 연/월 선택, 해당 월의 날짜 그리드, 날짜별 목표 색상 점, 클릭 시 /activity/[date] 이동.
- **/activity/[date]**: 원본 ActivityDayPage. 해당 날짜 활동 목록, 일일 분석(get_daily_analysis 또는 generate). API는 characterId+date 기준으로 목록/분석 제공.
- **/analysis**: 원본 AnalysisPage. 목표 목록 + 목표별 get_goal_analysis 결과 표시.

### 3.4 공통 UI 컴포넌트

- **AppHeader**: 로고/타이틀, “현재 캐릭터명·Lv”, 메뉴(로그 보기, 초기화). 초기화 시 reset API 호출 + 확인 다이얼로그.
- **LogViewer**: 웹에서는 백엔드 로그 스트리밍이 없을 수 있음. 선택 사항으로 “API 로그 엔드포인트” 또는 클라이언트 콘솔 로그만 사용. 필요 시 간단 로그 패널 추가.
- **PixelCharacter**: 원본과 동일한 픽셀 블록+레벨 표시. level prop으로 렌더링.

### 3.5 API 클라이언트(api.ts) 정리

- **Goal**: create/update 시 `name`, `startDate`, `endDate`, `targetSkill`, `calendarColor` 등 원본 스펙에 맞게 요청. (백엔드 DTO 보완 후)
- **Activity**: create 시 `characterId`, `date`, `content` 전달. 응답에 `summary`, `xpGained` 등 포함되도록 백엔드와 맞춤.
- **Character**: get 시 `level`, `xp` 포함. 목록/상세 모두 필요 시 사용.
- **Analysis**: getDaily(characterId, date), getGoal(goalId) 이미 정의됨. 실제 호출 페이지(ActivityDay, Analysis)에서 사용.

---

## 4. 보완 작업 순서 제안

1. **백엔드 스키마·API 정합성**
   - Character: level, xp 추가 및 migration.
   - Goal: startDate, endDate, targetSkill, calendarColor 추가 및 DTO/서비스 수정.
   - ActivityLog: date, summary, aiResult, xpGained 추가. CreateActivityLogDto에 date 추가.
   - AbilityStat: 원본과 동일 “능력당 총 XP” 모델로 정리(필요 시 스키마 수정).
   - 활동 생성 서비스: LLM 요약·XP 분석·능력치/캐릭터 XP 반영·일일/목표 분석 갱신 로직 구현.

2. **프론트 API 클라이언트**
   - api.ts를 위에서 변경한 DTO/응답 스펙에 맞게 수정(goal, activity, character 등).

3. **캐릭터 플로우**
   - 캐릭터 0명일 때 생성 UI(CharacterSetup). 캐릭터 선택/현재 캐릭터 개념 도입(선택지 A 또는 B).

4. **홈(메인) 화면**
   - CharacterView(PixelCharacter + 레벨/XP + 능력치 바), GoalForm, GoalList, ActivityLogForm, 활동 캘린더 링크 구현.

5. **라우트·페이지**
   - /activity (캘린더), /activity/[date] (일별 활동+일일 분석), /analysis (목표별 분석) 추가.

6. **공통 UI**
   - AppHeader(메뉴, 초기화), PixelCharacter. LogViewer는 선택.

7. **통합 테스트**
   - 캐릭터 생성 → 목표 추가 → 활동 기록(오늘) → XP/능력치/일일·목표 분석 확인. 초기화 후 재시작 확인.

---

## 5. 참고: 원본(life-rpg) 대응 관계

| 원본 (Tauri command / UI) | 웹 보완 후 |
|---------------------------|------------|
| get_character | 현재 캐릭터 1명 조회 또는 character.get(id) |
| create_character | CharacterSetup + POST /character |
| list_goals, create_goal | GoalList, GoalForm + GET/POST /goal (스펙 확장) |
| list_activity_logs, create_activity_log | ActivityLogForm, ActivityDayPage + GET/POST /activity (date, LLM, XP 연동) |
| list_abilities, get_ability_stats | CharacterView 능력치 바, GoalForm 능력 선택 + GET /ability, GET /ability/stats(또는 동일) |
| get_daily_analysis | /activity/[date] + GET /analysis/daily |
| get_goal_analysis | /analysis + GET /analysis/goal/:id |
| reset_app | AppHeader 메뉴 “초기화” + POST /reset |
| CharacterView, PixelCharacter, GoalForm, GoalList, ActivityLogForm | 홈(또는 캐릭터 상세)에 동일 구성 |
| ActivityPage, ActivityDayPage, AnalysisPage | /activity, /activity/[date], /analysis |
| AppHeader, LogViewer | AppHeader 필수, LogViewer 선택 |

이 문서는 [03-migration-order.md](03-migration-order.md) 이후 “마이그레이션 검증·보완” 단계로 활용할 수 있다.

# AI 하네스 다중 도구 공유 설계 계획

## Context

현재 AI 하네스(프롬프트·컨텍스트·워크플로우 지침)가 Claude Code 전용(`CLAUDE.md`, `.claude/`)과 Cursor 전용(`.cursor/rules/`)으로 분산되어 있어, OpenAI Codex CLI에는 지침이 전혀 없고 세 도구 간 내용이 이미 중복·불일치하기 시작함. **단일 소스로 공통 지침을 관리하고, 각 도구 전용 파일은 자동 생성**하는 구조로 전환한다.

---

## 현황 파악

| 항목 | Claude Code | Cursor | Codex CLI |
|------|------------|--------|-----------|
| 읽는 파일 | `CLAUDE.md` (계층적) | `.cursor/rules/*.mdc` | `AGENTS.md` (루트) |
| 범용 규칙 파일 | `CLAUDE.md` | `.cursorrules` (legacy 지원) | `AGENTS.md` |
| 자동화/훅 | `.claude/settings.local.json` | `alwaysApply: true` .mdc | 없음 |
| 메모리 | `.claude/memory/` | 없음 | 없음 |

**공유 가능한 내용** (세 도구 모두 알아야 함):
- 언어 원칙 (한국어), 재질문 원칙
- 기술 스택, 포트, 실행 명령
- 코딩 스타일 (주석, DTO, 파일 책임)
- 커밋 메시지 규칙 및 분할 원칙
- 도메인 개요, 환경 변수

**도구 전용 내용** (공유 불필요):
- Claude Code: 메모리 시스템 활용법 → `.claude/` 유지
- Cursor: `.mdc` 자동화 규칙 (alwaysApply) → `.cursor/rules/` 유지
- Codex CLI: Codex 전용 행동 제약

---

## 구현 계획

### Step 1: `docs/ai/` 디렉터리 구조 생성

```
docs/ai/
├── shared.md          # 공통 지침 단일 소스 (세 도구 공유)
├── claude-extra.md    # Claude Code 전용 추가 지침
├── codex-extra.md     # Codex CLI 전용 추가 지침
└── cursor-extra.md    # Cursor 전용 추가 지침

scripts/
└── ai-sync.mjs        # 생성 스크립트 (Node.js ESM)
```

### Step 2: `shared.md` 작성

현재 `CLAUDE.md` 전체 내용을 기반으로 작성. 모든 공통 섹션 포함:
- 언어·재질문 원칙
- 기술 스택 / 실행 명령
- 코드 스타일 (주석, 파일 책임, DTO, 추측 금지)
- 커밋 메시지 규칙 + 분할 원칙 (현재 `.cursor/rules/git-commit-splitting.mdc` 내용 통합)
- 도메인 개요, 환경 변수 표

### Step 3: 도구 전용 extra 파일 작성

**`claude-extra.md`**: 
- `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md` 세부 가이드 링크 안내
- 메모리 시스템(`.claude/memory/`)이 세션 간 컨텍스트를 유지함을 명시

**`codex-extra.md`**: 
- Codex CLI 전용: 파일 수정 전 반드시 현재 상태 확인 지침
- 병렬 수정 금지 (한 번에 하나씩)

**`cursor-extra.md`**:
- `.cursor/rules/` 의 `.mdc` 파일이 워크플로우 자동화를 담당함 안내
- docs 수정 시 업데이트 내역 반영 규칙 요약

### Step 4: `scripts/ai-sync.mjs` 스크립트 작성

```js
// scripts/ai-sync.mjs (Node.js ESM)
// docs/ai/shared.md + docs/ai/claude-extra.md → CLAUDE.md
// docs/ai/shared.md + docs/ai/codex-extra.md  → AGENTS.md
// docs/ai/shared.md + docs/ai/cursor-extra.md → .cursorrules
```

각 출력 파일 상단에 자동 생성 경고 주석 삽입:
```
<!-- AUTO-GENERATED from docs/ai/shared.md + docs/ai/<tool>-extra.md — DO NOT EDIT DIRECTLY -->
<!-- Edit docs/ai/shared.md or docs/ai/<tool>-extra.md, then run: npm run ai:sync -->
```

### Step 5: `package.json` 루트에 스크립트 추가

```json
"scripts": {
  "ai:sync": "node scripts/ai-sync.mjs"
}
```

### Step 6: 기존 파일 처리

| 파일 | 처리 |
|------|------|
| `CLAUDE.md` | 자동 생성으로 교체 (내용 동일, 헤더 경고 추가) |
| `AGENTS.md` | 신규 생성 (Codex CLI용) |
| `.cursorrules` | 신규 생성 (Cursor 범용 규칙 파일) |
| `.cursor/rules/*.mdc` | **유지** (워크플로우 자동화 전용, git-commit 규칙은 shared.md에도 추가) |
| `apps/api/CLAUDE.md` | **유지** (API 세부 가이드, Claude Code 전용으로 충분) |
| `apps/web/CLAUDE.md` | **유지** (Web 세부 가이드, Claude Code 전용으로 충분) |

### Step 7: `.gitignore` 처리

생성된 `CLAUDE.md`, `AGENTS.md`, `.cursorrules`는 **git 추적 유지** (각 도구가 직접 읽으므로).  
`docs/ai/` 디렉터리 전체도 git 추적 (소스가 여기에 있으므로).

---

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `docs/ai/shared.md` | 신규 생성 |
| `docs/ai/claude-extra.md` | 신규 생성 |
| `docs/ai/codex-extra.md` | 신규 생성 |
| `docs/ai/cursor-extra.md` | 신규 생성 |
| `scripts/ai-sync.mjs` | 신규 생성 |
| `CLAUDE.md` | 자동 생성본으로 교체 |
| `AGENTS.md` | 신규 생성 |
| `.cursorrules` | 신규 생성 |
| `package.json` (루트) | `ai:sync` 스크립트 추가 |

---

## 검증 방법

1. `npm run ai:sync` 실행 → `CLAUDE.md`, `AGENTS.md`, `.cursorrules` 세 파일이 생성되는지 확인
2. 생성된 세 파일의 공통 섹션 내용이 동일한지 비교
3. `CLAUDE.md`에 Claude 전용 내용(메모리 안내)이 포함되는지 확인
4. `AGENTS.md`에 Codex 전용 내용이 포함되는지 확인
5. Claude Code / Cursor에서 프로젝트 열고 컨텍스트 로드 정상 확인
6. `docs/ai/shared.md` 수정 후 `npm run ai:sync` 재실행 → 세 파일 동기화 확인

---

## 유지보수 워크플로우 (이후)

```
공통 지침 변경 필요
  → docs/ai/shared.md 수정
  → npm run ai:sync 실행
  → git add CLAUDE.md AGENTS.md .cursorrules docs/ai/shared.md
  → git commit

도구 전용 지침 변경 필요
  → docs/ai/<tool>-extra.md 수정
  → npm run ai:sync 실행
  → git commit
```

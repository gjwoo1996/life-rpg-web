<!-- Cursor 전용 추가 지침 -->

## Cursor 전용

### 자동화 규칙

`.cursor/rules/` 디렉터리의 `.mdc` 파일이 워크플로우 자동화를 담당한다:
- `git-commit-splitting.mdc` — 커밋 요청 시 자동 분할 원칙 적용 (`alwaysApply: true`)
- `docs-update-changelog.mdc` — `docs/` 수정 시 업데이트 내역 반영 트리거

### docs 수정 시 업데이트 내역 반영

`docs/` 아래 문서를 수정·추가할 때는 `docs/업데이트/`에 변경 내역을 반영한다.

버전 기준:
- **패치 (0.0.x)**: 오타·문구 수정
- **마이너 (0.x.0)**: 새 문서 추가, 섹션 구조 변경
- **메이저 (x.0.0)**: 문서 체계 전면 개편

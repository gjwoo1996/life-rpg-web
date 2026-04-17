<!-- Claude Code 전용 추가 지침 -->

## Claude Code 전용

### 세부 가이드

앱별 추가 규칙은 하위 CLAUDE.md 파일에 있다:
- `apps/api/CLAUDE.md` — NestJS 모듈 구조, Ollama 호출 규칙, 활동 생성 플로우
- `apps/web/CLAUDE.md` — Next.js API 클라이언트 패턴, SSR 제약

### 메모리 시스템

`.claude/memory/` 디렉터리에 세션 간 컨텍스트가 유지된다. 대화 시작 시 `MEMORY.md` 인덱스를 참고해 관련 메모리 파일을 읽는다.

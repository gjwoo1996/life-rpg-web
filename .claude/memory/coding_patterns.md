---
name: 코딩 패턴
description: 기술 스택(NestJS/Next.js) 패턴 및 anti-pattern (주제 무관, 변경 불필요)
type: feedback
---

## 따라야 할 패턴

- NestJS 도메인 모듈: `module / controller / service / dto` 4파일 세트
- Ollama 호출: 반드시 try/catch, 실패 시 무시 (상위 플로우 중단 금지)
- 프롬프트 생성: `prompt-builder.ts`에서만 담당
- Web API 호출: `src/lib/api.ts`를 통해서만 (직접 fetch 금지)
- SSR 비호환 라이브러리: `dynamic(..., { ssr: false })`

## 피해야 할 패턴

- 서비스 레이어에서 직접 프롬프트 문자열 조합
- Web 컴포넌트에서 `fetch()` 직접 호출
- DTO에 class-validator 데코레이터 누락

**Why:** DTO 데코레이터 누락이 실제 런타임 버그(goalId null)의 원인이 된 이력 있음.

---
name: 프로젝트 아키텍처
description: 현재 프로젝트 구조 (주제 변경 시 교체)
type: project
originSessionId: a8a5008c-8071-4fc7-814a-f63238635174
---
**현재 주제:** 일본어 학습 AI 채팅 서비스

npm workspaces 모노레포. `apps/api`(NestJS, 포트 3001) + `apps/web`(Next.js, 포트 3000).

| 서비스 | 주소 | 용도 |
|--------|------|------|
| PostgreSQL | `DATABASE_URL` 환경변수 | 대화/JLPT 분석 저장 |
| Ollama | `host.docker.internal:11434` | 채팅(qwen3:8b), 이미지 분석(llava:7b) |

**핵심 모듈:**
- `chat` — POST /chat (SSE 스트리밍), POST /chat/image (이미지+SSE), GET/DELETE /chat/history
- `jlpt` — GET /jlpt, POST /jlpt/analyze (사용자 메시지 분석 → N1~N5 판정)
- `ollama` — streamChat (qwen3:8b), streamChatWithImage (llava:7b)

**핵심 엔티티:** ChatMessage (role, content, hasImage), JlptAnalysis (level, vocabularyScore, grammarScore, readingScore, totalScore)

**핵심 흐름:** 채팅 메시지 → Ollama SSE 스트리밍 → DB 저장 → 10개마다 JLPT 자동 분석 트리거

**프론트엔드 구조:**
- 메인 페이지(`/`): 채팅 영역 + JLPT 사이드바
- SSE 클라이언트: `apps/web/src/lib/sse.ts`
- 컴포넌트: ChatBubble, StreamingBubble, ChatInput, JlptSidebar, JlptScoreBar

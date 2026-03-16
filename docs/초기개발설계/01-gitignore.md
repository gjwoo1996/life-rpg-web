# Git 무시 설정 (life-rpg-web)

## 원칙

- life-rpg-web은 이미 **git init** 되어 있음.
- Nest/Next 프로젝트 생성 시 **루트 `.gitignore`에** 빌드·의존성·환경파일이 커밋되지 않도록 추가/유지한다.

## 무시할 항목

### NestJS (apps/api)

- `dist`
- `node_modules`
- `build`
- `.env*`

### Next.js (apps/web)

- `.next`
- `out`
- `node_modules`
- `.env*.local`
- `*.tsbuildinfo`

### 공통

- `node_modules`
- `logs`
- `*.log`
- `.env`, `.env.development`, `.env.test`, `.env.production`
- `.temp`, `.tmp`

## 앱별 .gitignore

Nest/Next CLI로 앱을 생성할 때 각 앱 폴더에 별도 `.gitignore`가 생기면, 루트 `.gitignore`에서 다음처럼 일괄 무시하거나 앱별 ignore를 그대로 둔다.

- `apps/*/node_modules`
- `apps/*/.next`
- `apps/*/dist`

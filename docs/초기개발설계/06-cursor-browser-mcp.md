# Cursor IDE Browser MCP로 웹 테스트하기

이 프로젝트에서 **cursor-ide-browser** MCP를 사용해 웹 앱을 Cursor 안에서 직접 테스트할 수 있습니다.

## 1. MCP 설정

프로젝트 루트에 `.cursor/mcp.json`이 있으며, `cursor-ide-browser` 서버를 등록해 두었습니다.

```json
{
  "mcpServers": {
    "cursor-ide-browser": {}
  }
}
```

- **cursor-ide-browser**는 Cursor에 내장된 MCP라서 별도 설치 없이 위 설정만 있으면 됩니다.
- Cursor를 한 번 **재시작**한 뒤, 설정(Settings) → MCP에서 `cursor-ide-browser`가 켜져 있는지 확인하세요.

## 2. 앱 실행

브라우저로 테스트하려면 먼저 웹·API를 띄워야 합니다.

```bash
# 루트에서 (API + 웹 동시 실행)
npm run dev
```

- 웹: http://localhost:3000  
- API: http://localhost:3001  

## 3. Cursor에서 브라우저로 테스트

MCP가 활성화되면, 채팅에서 AI에게 예를 들어 다음처럼 요청할 수 있습니다.

- "http://localhost:3000 열어서 캐릭터 목록 화면 스냅샷 찍어줘"
- "localhost:3000에서 캘린더 페이지로 이동한 뒤 화면 구조 알려줘"
- "활동 페이지에서 [특정 버튼] 클릭해줘"

AI가 **browser_navigate**, **browser_snapshot**, **browser_click** 등 MCP 도구를 사용해 페이지를 열고, 구조를 보거나 클릭/입력 테스트를 진행합니다.

## 4. 참고

- 사용 가능한 도구·워크플로는 `mcps/cursor-ide-browser/INSTRUCTIONS.md`(Cursor 프로젝트 내)를 참고하면 됩니다.
- Cursor 버전에 따라 "No server found" 등 오류가 나면, [Cursor 이슈 #3878](https://github.com/getcursor/cursor/issues/3878)와 같이 내장 브라우저 MCP 쪽 이슈일 수 있으니 Cursor 업데이트 여부를 확인해 보세요.

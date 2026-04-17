const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function consumeSseStream(
  res: Response,
  onChunk: (text: string) => void,
  onDone: () => void,
): Promise<void> {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") {
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(data) as { content?: string; error?: string };
        if (parsed.content) onChunk(parsed.content);
      } catch {
        // 파싱 실패 무시
      }
    }
  }
  onDone();
}

export async function streamChatResponse(
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    await consumeSseStream(res, onChunk, onDone);
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function streamImageResponse(
  question: string,
  imageFile: File,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("question", question);

    const res = await fetch(`${API_BASE}/chat/image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    await consumeSseStream(res, onChunk, onDone);
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

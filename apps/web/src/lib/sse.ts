const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const MIN_IMAGE_DIMENSION = 800;
const DEFAULT_IMAGE_QUALITY = 0.82;
const MIN_IMAGE_QUALITY = 0.55;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("이미지 읽기에 실패했습니다."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지 디코딩에 실패했습니다."));
    image.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("이미지 변환에 실패했습니다."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

async function optimizeImageForUpload(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;

  const dataUrl = await readFileAsDataUrl(file);
  const source = await loadImage(dataUrl);
  let width = source.naturalWidth;
  let height = source.naturalHeight;

  const resizeRatio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
  width = Math.max(1, Math.round(width * resizeRatio));
  height = Math.max(1, Math.round(height * resizeRatio));

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("브라우저가 이미지 압축을 지원하지 않습니다.");

  let quality = DEFAULT_IMAGE_QUALITY;
  let attempt = 0;

  while (attempt < 6) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (blob.size <= MAX_UPLOAD_BYTES || width <= MIN_IMAGE_DIMENSION || height <= MIN_IMAGE_DIMENSION) {
      return new File([blob], "upload.jpg", { type: "image/jpeg" });
    }

    quality = Math.max(MIN_IMAGE_QUALITY, quality - 0.08);
    width = Math.max(MIN_IMAGE_DIMENSION, Math.round(width * 0.85));
    height = Math.max(MIN_IMAGE_DIMENSION, Math.round(height * 0.85));
    attempt += 1;
  }

  const fallbackBlob = await canvasToBlob(canvas, "image/jpeg", MIN_IMAGE_QUALITY);
  return new File([fallbackBlob], "upload.jpg", { type: "image/jpeg" });
}

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
  model: string | undefined,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, model }),
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
    const optimizedFile = await optimizeImageForUpload(imageFile);
    const formData = new FormData();
    formData.append("image", optimizedFile);
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

import type { ChatMessageDto } from "@/lib/api";

interface ChatBubbleProps {
  message: ChatMessageDto;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-amber-500 text-white rounded-br-sm"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
        }`}
      >
        {message.content}
        {message.hasImage && !isUser && (
          <span className="text-xs opacity-60 block mt-1">📷 이미지 분석</span>
        )}
      </div>
    </div>
  );
}

export function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-1">
        AI
      </div>
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed whitespace-pre-wrap break-words bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
        {content}
        <span className="inline-block w-1.5 h-4 bg-amber-500 ml-0.5 animate-pulse align-middle" />
      </div>
    </div>
  );
}

interface PixelCharacterProps {
  level: number;
}

function getStage(level: number): number {
  if (level < 10) return 1;
  if (level < 20) return 2;
  if (level < 30) return 3;
  if (level < 50) return 4;
  return 5;
}

export function PixelCharacter({ level }: PixelCharacterProps) {
  const stage = getStage(level);

  return (
    <div
      className="w-24 h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-amber-400/60 shadow-inner"
      title={`Stage ${stage} (Lv.${level})`}
    >
      <div
        className="w-16 h-16 rounded bg-amber-500/90 dark:bg-amber-600/90"
        style={{
          boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.15)",
        }}
      />
    </div>
  );
}

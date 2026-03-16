import { PhaserCharacter } from "./PhaserCharacter";

interface PixelCharacterProps {
  level: number;
}

function getStage(level: number): number {
  if (level < 10) return 1;
  if (level < 20) return 2;
  if (level < 30) return 3;
  if (level < 40) return 4;
  if (level < 50) return 5;
  return 6;
}

export function PixelCharacter({ level }: PixelCharacterProps) {
  const stage = getStage(level);

  return (
    <div title={`Stage ${stage} (Lv.${level})`}>
      <PhaserCharacter level={level} />
    </div>
  );
}


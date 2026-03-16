"use client";

import { useEffect, useRef } from "react";
import type Phaser from "phaser";

interface PhaserCharacterProps {
  level: number;
}

/**
 * Phaser.js 기반 도트 캐릭터 렌더링 컴포넌트.
 * 현재는 레벨에 따라 색상/크기/애니메이션 속도만 달라지는 간단한 예제 구현으로,
 * 추후 실제 스프라이트 시트(에셋)로 교체할 수 있도록 최소한의 인터페이스만 유지한다.
 */
export function PhaserCharacter({ level }: PhaserCharacterProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      if (!containerRef.current) return;

      const PhaserModule = await import("phaser");
      if (cancelled || !containerRef.current) return;

      const PhaserLocal = PhaserModule.default ?? (PhaserModule as unknown as typeof Phaser);

      // 레벨에 따른 간단한 시각 효과 값 계산
      const clampedLevel = Math.max(1, Math.min(50, level));
      const size = 24 + clampedLevel; // 기본 크기 + 레벨
      const speed = 50 + clampedLevel * 2; // 위아래 튀는 속도

      const config: Phaser.Types.Core.GameConfig = {
        type: PhaserLocal.AUTO,
        width: 96,
        height: 96,
        transparent: true,
        parent: containerRef.current,
        physics: {
          default: "arcade",
        },
        scene: {
          create(this: Phaser.Scene) {
            const cx = 48;
            const cy = 48;

            const graphics = this.add.graphics();

            function drawCharacter(yOffset: number) {
              graphics.clear();

              // 레벨에 따라 색상 단계 변경 (1~5)
              const stage =
                clampedLevel < 10
                  ? 1
                  : clampedLevel < 20
                    ? 2
                    : clampedLevel < 30
                      ? 3
                      : clampedLevel < 40
                        ? 4
                        : 5;

              const palette: Record<number, number> = {
                1: 0xfff3c4,
                2: 0xfacc15,
                3: 0xf97316,
                4: 0xf59e0b,
                5: 0xea580c,
              };

              graphics.fillStyle(palette[stage] ?? 0xfacc15, 1);

              const w = size;
              const h = size;

              // 단순한 도트 캐릭터 바디
              graphics.fillRect(cx - w / 2, cy - h / 2 + yOffset, w, h);

              // 머리
              graphics.fillStyle(0x1f2937, 1);
              graphics.fillRect(cx - w / 2, cy - h / 2 - 6 + yOffset, w, 8);

              // 눈
              graphics.fillStyle(0x111827, 1);
              graphics.fillRect(cx - 8, cy - 2 + yOffset, 4, 4);
              graphics.fillRect(cx + 4, cy - 2 + yOffset, 4, 4);
            }

            let t = 0;
            this.time.addEvent({
              delay: 16,
              loop: true,
              callback: () => {
                t += 16;
                const yOffset = Math.sin((t / 1000) * (speed / 20)) * 3;
                drawCharacter(yOffset);
              },
            });
          },
        },
      };

      // 이전 인스턴스 정리
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      gameRef.current = new PhaserLocal.Game(config);
    }

    setup();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [level]);

  return (
    <div className="w-24 h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-amber-400/60 shadow-inner">
      <div
        ref={containerRef}
        className="w-24 h-24"
        aria-label={`Phaser 캐릭터 (Lv.${level})`}
      />
    </div>
  );
}


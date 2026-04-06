/** 규칙 기반 XP 계산 (life-rpg ai/rules.rs 이식) - LLM 호출 없이 패턴 매칭으로 XP 반환 */

export function tryRuleBased(content: string): Record<string, number> | null {
  const lower = content.toLowerCase();

  // "단어 N개" / "N개 단어"
  const wordMatch = lower.match(/(\d+)\s*개?\s*단어|단어\s*(\d+)\s*개?/);
  if (wordMatch) {
    const n = parseInt(wordMatch[1] || wordMatch[2] || '0', 10);
    if (n > 0) {
      const xp = Math.max(1, Math.floor(n * 0.1));
      return {
        intelligence: xp,
        discipline: Math.floor(xp / 2),
        focus: 0,
        knowledge: Math.floor(xp / 2),
        health: 0,
      };
    }
  }

  // "N시간 공부" / 공부·학습·study
  const hourMatch = lower.match(/(\d+)\s*시간/);
  if (
    hourMatch &&
    (lower.includes('공부') ||
      lower.includes('학습') ||
      lower.includes('study'))
  ) {
    const n = parseInt(hourMatch[1] || '0', 10);
    if (n > 0) {
      const xp = Math.max(1, n * 2);
      return {
        intelligence: xp,
        discipline: xp,
        focus: Math.floor(xp / 2),
        knowledge: xp,
        health: 0,
      };
    }
  }

  // "N분" 운동 / exercise
  if (lower.includes('운동') || lower.includes('exercise')) {
    const minMatch = lower.match(/(\d+)\s*분/);
    if (minMatch) {
      const n = parseInt(minMatch[1] || '0', 10);
      if (n > 0) {
        const xp = Math.max(1, Math.floor(n / 10));
        return {
          intelligence: 0,
          discipline: Math.floor(xp / 2),
          focus: 0,
          knowledge: 0,
          health: xp,
        };
      }
    }
  }

  return null;
}

export function filterToAbilities(
  m: Record<string, number>,
  abilityNames: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const name of abilityNames) {
    out[name] = m[name] ?? 0;
  }
  return out;
}

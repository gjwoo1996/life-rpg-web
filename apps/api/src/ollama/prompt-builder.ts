/** 모든 LLM 프롬프트 생성 로직 (순수 함수) */
export class PromptBuilder {
  /** 일일 분석 프롬프트 (life-rpg ai/prompt.rs build_daily_analysis_prompt) */
  static buildDailyAnalysis(activitiesText: string): string {
    return `The following are the user's activity logs for one day. Write a brief 2-3 sentence analysis of the day (what was done, progress, or encouragement). 반드시 한국어로만 작성하세요. 일본어·중국어를 사용하지 마세요. Reply in Korean only.

Formatting: Write each sentence on a new line. Use line breaks between sentences so the answer is easy to read. Do not output one long continuous line.

Activities:
${activitiesText}
Analysis:`;
  }

  /** 목표 분석 프롬프트 (life-rpg ai/prompt.rs build_goal_analysis_prompt) */
  static buildGoalAnalysis(
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
  ): string {
    const prevBlock = previousContext
      ? `Previous summary/context:\n${previousContext}\n\n`
      : '';
    const activities = activitiesText || '(No activities yet)';
    return `Analyze progress toward this goal and give brief feedback.
Goal: ${goalName}
Target skill/ability: ${targetAbility}
${prevBlock}Recent activities:
${activities}

Write 2-4 sentences: progress so far, what to improve, and encouragement. 반드시 한국어로만 작성하세요. 일본어·중국어를 사용하지 마세요. Reply in Korean only. No prefix or label.

Formatting: Write each sentence on a new line. Use line breaks between sentences for readability. Do not output one long continuous line.`;
  }

  /** 사용자 정의 목표 분석 프롬프트 템플릿에 플레이스홀더 치환 */
  static buildGoalAnalysisFromTemplate(
    template: string,
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
  ): string {
    return template
      .replace(/\{\{goalName\}\}/g, goalName)
      .replace(/\{\{targetAbility\}\}/g, targetAbility)
      .replace(/\{\{previousContext\}\}/g, previousContext)
      .replace(
        /\{\{activitiesText\}\}/g,
        activitiesText || '(No activities yet)',
      );
  }

  /** 고정 구조 목표 분석 프롬프트 (백엔드 고정 + 사용자 추가 지시) */
  static buildGoalAnalysisFixed(
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
    userInstruction: string | null,
  ): string {
    const prevBlock = previousContext
      ? `이전 분석 요약:\n${previousContext}\n\n`
      : '';
    const activities = activitiesText || '(아직 활동 없음)';
    const userBlock = userInstruction?.trim()
      ? `\n추가로 다음을 반영해 주세요: ${userInstruction.trim()}\n\n`
      : '';
    return `목표: ${goalName}
스킬/능력: ${targetAbility}

${prevBlock}기간 내 활동:
${activities}
${userBlock}위 내용을 바탕으로 진행 상황, 개선점, 격려를 2~4문장 한국어로 작성해 주세요. 문장마다 줄바꿈 해 주세요.`;
  }
}

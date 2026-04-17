/** 모든 LLM 프롬프트 생성 로직 (순수 함수) */
export class PromptBuilder {
  /** 일일 분석 프롬프트 (life-rpg ai/prompt.rs build_daily_analysis_prompt) */
  static buildDailyAnalysis(activitiesText: string): string {
    return `당신은 일본어 공부를 돕는 학습 코치입니다.
아래는 사용자의 하루 활동 로그입니다. 무엇을 공부했는지, 어떤 진전이 있었는지, 다음에 무엇을 보완하면 좋은지 2~3문장으로 짧게 분석해 주세요.

출력 규칙:
- 설명과 피드백은 한국어로 작성합니다.
- 로그에 등장한 일본어 단어, 문장, 문법명은 필요한 경우 원문 그대로 인용할 수 있습니다.
- 문장마다 줄바꿈하고, 접두어·라벨 없이 바로 답변합니다.

활동 로그:
${activitiesText}

일일 분석:`;
  }

  /** 목표 분석 프롬프트 (life-rpg ai/prompt.rs build_goal_analysis_prompt) */
  static buildGoalAnalysis(
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
  ): string {
    const prevBlock = previousContext
      ? `이전 분석 요약:\n${previousContext}\n\n`
      : '';
    const activities = activitiesText || '(아직 활동 없음)';
    return `당신은 일본어 공부 목표를 점검하는 학습 코치입니다.
목표: ${goalName}
집중 영역: ${targetAbility}

${prevBlock}최근 활동:
${activities}

출력 규칙:
- 진행 상황, 보완점, 격려를 2~4문장으로 작성합니다.
- 설명은 한국어로 작성합니다.
- 일본어 단어, 예문, 활용형이 필요하면 일본어 원문을 그대로 포함할 수 있습니다.
- 문장마다 줄바꿈하고, 접두어·라벨 없이 바로 답변합니다.`;
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
    return `당신은 일본어 공부 목표를 함께 점검하는 학습 코치입니다.
목표: ${goalName}
스킬/능력: ${targetAbility}

${prevBlock}기간 내 활동:
${activities}
${userBlock}위 내용을 바탕으로 진행 상황, 개선점, 격려를 2~4문장으로 작성해 주세요.
설명은 한국어로 작성하고, 필요한 일본어 단어·예문·활용형은 원문 그대로 포함할 수 있습니다.
문장마다 줄바꿈해 주세요.`;
  }

  static buildJapaneseWordExplanation(term: string): string {
    return `당신은 일본어 공부 어시스트입니다.
아래 단어를 학습자에게 설명해 주세요.

대상 단어: ${term}

출력 형식:
[의미]
한국어로 핵심 의미를 설명

[뉘앙스]
비슷한 표현과 차이를 한국어로 설명

[예문]
일본어 예문 2개

[포인트]
암기 팁이나 주의점 2개 이내

규칙:
- 설명은 한국어로 작성합니다.
- 단어, 예문, 활용형은 일본어로 작성합니다.
- 불필요한 서론 없이 위 섹션만 출력합니다.`;
  }

  static buildJapaneseGrammarExplanation(
    grammar: string,
    learnerSentence?: string,
  ): string {
    const learnerBlock = learnerSentence?.trim()
      ? `\n학습자 문장: ${learnerSentence.trim()}\n`
      : '\n';
    return `당신은 일본어 문법 튜터입니다.
다음 문법 표현을 설명해 주세요.

문법 항목: ${grammar}${learnerBlock}
출력 형식:
[핵심 설명]
한국어로 문법 의미와 쓰임 설명

[형태]
접속 형태나 활용 규칙을 한국어로 설명

[예문]
일본어 예문 2개

[주의]
헷갈리기 쉬운 포인트를 한국어로 설명

규칙:
- 설명은 한국어로 작성합니다.
- 문법 형태, 예문, 활용형은 일본어로 작성합니다.
- 불필요한 서론 없이 위 섹션만 출력합니다.`;
  }

  static buildJapaneseExampleGeneration(
    expression: string,
    level = 'JLPT N4~N3',
  ): string {
    return `당신은 일본어 예문 생성 도우미입니다.
다음 표현을 학습자가 익히도록 예문을 만들어 주세요.

표현: ${expression}
난이도: ${level}

출력 형식:
[예문]
일본어 예문 3개

[해석]
각 예문의 한국어 해석

[패턴]
예문에서 반복되는 표현 포인트를 한국어로 2문장 이내 설명

규칙:
- 예문은 일본어로 작성합니다.
- 해석과 설명은 한국어로 작성합니다.
- 불필요한 서론 없이 위 섹션만 출력합니다.`;
  }

  static buildJapaneseCorrection(
    learnerSentence: string,
    intendedMeaning?: string,
  ): string {
    const meaningBlock = intendedMeaning?.trim()
      ? `\n의도한 뜻: ${intendedMeaning.trim()}`
      : '';
    return `당신은 일본어 첨삭 튜터입니다.
아래 학습자 문장을 교정해 주세요.

학습자 문장: ${learnerSentence}${meaningBlock}

출력 형식:
[교정 문장]
자연스러운 일본어 문장

[왜 고쳤는지]
한국어로 핵심 이유 설명

[대안]
비슷하게 쓸 수 있는 일본어 표현 1~2개

규칙:
- 교정 문장과 대안 표현은 일본어로 작성합니다.
- 설명은 한국어로 작성합니다.
- 불필요한 서론 없이 위 섹션만 출력합니다.`;
  }

  static buildJapaneseRoleplay(
    situation: string,
    learnerLevel = '초급',
  ): string {
    return `당신은 일본어 회화 롤플레이 파트너입니다.
아래 상황으로 짧은 회화 연습을 만들어 주세요.

상황: ${situation}
학습자 수준: ${learnerLevel}

출력 형식:
[상황 설명]
한국어로 한 문장 설명

[대화]
일본어 4턴 대화

[표현 포인트]
중요 표현 3개를 한국어로 설명

규칙:
- 대화는 일본어로 작성합니다.
- 설명은 한국어로 작성합니다.
- 불필요한 서론 없이 위 섹션만 출력합니다.`;
  }
}

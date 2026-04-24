/** 모든 LLM 프롬프트 생성 로직 (순수 함수) */
export class PromptBuilder {
  static buildJlptAnalysis(userMessagesText: string): string {
    return `당신은 일본어 능력 평가 전문가입니다.
아래는 학습자가 일본어 학습 채팅에서 작성한 메시지 전체입니다.

학습자 메시지:
${userMessagesText}

위 내용을 분석하여 학습자의 JLPT 수준을 평가하고 아래 JSON 형식으로만 응답하세요.

응답 형식:
{
  "level": "N3",
  "vocabularyScore": 60,
  "grammarScore": 55,
  "readingScore": 50,
  "totalScore": 55,
  "detail": "한국어로 2~3문장 분석 설명"
}

평가 기준:
- vocabularyScore: 사용 어휘의 다양성과 정확성 (0~100)
- grammarScore: 문법 구조의 복잡성과 정확성 (0~100)
- readingScore: 문장 구성과 독해 수준 반영 (0~100)
- totalScore: 세 점수의 평균
- level: totalScore 기준 N5(0~39), N4(40~54), N3(55~69), N2(70~84), N1(85~100)

JSON 외 다른 텍스트는 절대 포함하지 마세요.`;
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

  static buildJapaneseReadingAnalysis(): string {
    return `이 이미지에 있는 일본어 텍스트를 한 줄씩 분석해주세요.

각 줄마다 아래 형식으로 작성하세요:

[원문]
원래 일본어 문장

[후리가나]
한자에 후리가나를 괄호로 표시 (예: 日本語(にほんご))

[해석]
한국어 번역

[주요 단어]
・단어1 (읽기): 한국어 의미
・단어2 (읽기): 한국어 의미

---

규칙:
- 이미지의 모든 줄을 빠짐없이 분석합니다.
- 주요 단어는 학습에 도움이 되는 것 2~4개만 선정합니다.
- 불필요한 서론 없이 위 형식만 반복 출력합니다.`;
  }
}

import { PromptBuilder } from './prompt-builder';

describe('PromptBuilder', () => {
  it('builds daily analysis prompts for a Japanese study coach', () => {
    const prompt = PromptBuilder.buildDailyAnalysis('今日は て형 연습을 했다.');

    expect(prompt).toContain('일본어 공부를 돕는 학습 코치');
    expect(prompt).toContain('설명과 피드백은 한국어로 작성');
    expect(prompt).toContain('로그에 등장한 일본어 단어');
  });

  it('builds Japanese correction prompts with fixed sections', () => {
    const prompt = PromptBuilder.buildJapaneseCorrection(
      '私は昨日学校に行きます。',
      '어제 학교에 갔어요',
    );

    expect(prompt).toContain('[교정 문장]');
    expect(prompt).toContain('[왜 고쳤는지]');
    expect(prompt).toContain('[대안]');
    expect(prompt).toContain('설명은 한국어로 작성합니다.');
  });
});

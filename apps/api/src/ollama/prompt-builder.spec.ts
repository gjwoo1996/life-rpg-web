import { PromptBuilder } from './prompt-builder';

describe('PromptBuilder', () => {
  it('builds JLPT analysis prompts with JSON format instructions', () => {
    const prompt = PromptBuilder.buildJlptAnalysis('今日は て형 연습을 했다.');

    expect(prompt).toContain('일본어 능력 평가 전문가');
    expect(prompt).toContain('vocabularyScore');
    expect(prompt).toContain('grammarScore');
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

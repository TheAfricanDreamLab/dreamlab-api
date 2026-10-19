import { BlockAuthoringSchema, InteractiveBlockAuthoring, ItemAuthoringSchema } from '@dreamlab/contracts';
import { checkBlock, gradeQuiz, isSettled } from './modules/player/grading';

const block = (b: unknown) => BlockAuthoringSchema.parse(b) as InteractiveBlockAuthoring;

const choice = block({
  id: 'symptom',
  type: 'choice',
  prompt: 'Which is the root cause?',
  options: [
    { id: 'a', text: 'Tomatoes rot', correct: false, feedback: 'That is what you see, not why.' },
    { id: 'b', text: 'No shade at the market', correct: true, feedback: 'Yes: heat speeds spoilage.' },
  ],
  explanation: 'Root causes explain the symptom.',
});

const multi = block({
  id: 'pick-two',
  type: 'choice',
  multiple: true,
  prompt: 'Which are evidence?',
  options: [
    { id: 'a', text: 'Sales records', correct: true },
    { id: 'b', text: 'A hunch', correct: false },
    { id: 'c', text: 'Customer interviews', correct: true },
  ],
  explanation: 'Evidence can be checked.',
});

const order = block({
  id: 'steps',
  type: 'order',
  prompt: 'Order the steps',
  items: [
    { id: 'define', text: 'Define' },
    { id: 'diagnose', text: 'Diagnose' },
    { id: 'generate', text: 'Generate' },
  ],
  explanation: 'Define before you diagnose.',
});

const match = block({
  id: 'terms',
  type: 'match',
  prompt: 'Match',
  pairs: [
    { id: 'symptom', left: 'Symptom', right: 'What you see' },
    { id: 'cause', left: 'Cause', right: 'Why it happens' },
  ],
  explanation: 'x',
});

describe('checkBlock', () => {
  it('marks a right single choice and reveals the explanation and solution', () => {
    const r = checkBlock(choice, { type: 'choice', optionIds: ['b'] }, 0);
    expect(r).toMatchObject({ correct: true, feedback: 'Yes: heat speeds spoilage.', explanation: 'Root causes explain the symptom.', solution: { optionIds: ['b'] }, canRetry: false });
  });

  it('gives feedback on a wrong answer but keeps the solution until the second try', () => {
    const first = checkBlock(choice, { type: 'choice', optionIds: ['a'] }, 0);
    expect(first).toMatchObject({ correct: false, feedback: 'That is what you see, not why.', explanation: null, solution: null, canRetry: true });
    expect(isSettled(first)).toBe(false);
    const second = checkBlock(choice, { type: 'choice', optionIds: ['a'] }, 1);
    expect(second).toMatchObject({ correct: false, solution: { optionIds: ['b'] }, canRetry: false });
    expect(isSettled(second)).toBe(true);
  });

  it('needs every right option of a multiple choice', () => {
    expect(checkBlock(multi, { type: 'choice', optionIds: ['a'] }, 0)).toMatchObject({ correct: false, feedback: 'Close. There is at least one more right answer.' });
    expect(checkBlock(multi, { type: 'choice', optionIds: ['a', 'c'] }, 0).correct).toBe(true);
  });

  it('rejects two picks on a single choice and unknown options', () => {
    expect(() => checkBlock(choice, { type: 'choice', optionIds: ['a', 'b'] }, 0)).toThrow('Pick one option.');
    expect(() => checkBlock(choice, { type: 'choice', optionIds: ['z'] }, 0)).toThrow();
  });

  it('checks order and says how many are in place', () => {
    expect(checkBlock(order, { type: 'order', itemIds: ['define', 'generate', 'diagnose'] }, 0)).toMatchObject({ correct: false, feedback: '1 of 3 are in the right place.' });
    expect(checkBlock(order, { type: 'order', itemIds: ['define', 'diagnose', 'generate'] }, 0).correct).toBe(true);
    expect(() => checkBlock(order, { type: 'order', itemIds: ['define', 'define', 'generate'] }, 0)).toThrow();
  });

  it('checks matches', () => {
    expect(checkBlock(match, { type: 'match', matches: { symptom: 'cause', cause: 'symptom' } }, 0)).toMatchObject({ correct: false, feedback: '0 of 2 pairs are right.' });
    expect(checkBlock(match, { type: 'match', matches: { symptom: 'symptom', cause: 'cause' } }, 0).correct).toBe(true);
  });

  it('accepts a reflection with enough words and refuses a short one', () => {
    const reflection = block({ id: 'mine', type: 'reflection', prompt: 'Your problem?', minWords: 5 });
    expect(() => checkBlock(reflection, { type: 'reflection', text: 'too short' }, 0)).toThrow(/at least 5 words/);
    expect(checkBlock(reflection, { type: 'reflection', text: 'Traders in my area lose stock' }, 0)).toMatchObject({ correct: null, feedback: 'Saved to your journal.' });
  });

  it('returns the scenario outcome', () => {
    const scenario = block({
      id: 'market',
      type: 'scenario',
      situation: 'Sales fell.',
      prompt: 'First move?',
      options: [
        { id: 'ask', text: 'Ask buyers', outcome: 'You learn why.', best: true },
        { id: 'cut', text: 'Cut prices', outcome: 'Margins vanish.' },
      ],
    });
    expect(checkBlock(scenario, { type: 'scenario', optionId: 'cut' }, 0).outcome).toEqual({ text: 'Margins vanish.', best: false });
  });

  it('refuses an answer of the wrong type', () => {
    expect(() => checkBlock(choice, { type: 'order', itemIds: ['a', 'b'] }, 0)).toThrow(/expects a choice answer/);
  });
});

describe('gradeQuiz', () => {
  const quiz = ItemAuthoringSchema.parse({
    key: 'quiz-1',
    type: 'quiz',
    title: 'Check',
    minutes: 5,
    payload: { intro: 'Go', passPct: 70, maxAttempts: 2, questions: [choice, order, match] },
  });
  if (quiz.type !== 'quiz') throw new Error('not a quiz');

  it('scores, passes and reveals solutions on a pass', () => {
    const g = gradeQuiz(quiz, { symptom: { type: 'choice', optionIds: ['b'] }, steps: { type: 'order', itemIds: ['define', 'diagnose', 'generate'] }, terms: { type: 'match', matches: { symptom: 'symptom', cause: 'cause' } } }, 1);
    expect(g).toMatchObject({ scorePct: 100, passed: true });
    expect(g.results.every((r) => r.solution !== null)).toBe(true);
  });

  it('hides solutions on a fail while attempts remain, and shows them on the last attempt', () => {
    const answers = { symptom: { type: 'choice' as const, optionIds: ['a'] }, steps: { type: 'order' as const, itemIds: ['define', 'diagnose', 'generate'] }, terms: { type: 'match' as const, matches: { symptom: 'cause', cause: 'symptom' } } };
    const failed = gradeQuiz(quiz, answers, 1);
    expect(failed).toMatchObject({ scorePct: 33, passed: false });
    expect(failed.results.every((r) => r.solution === null && r.explanation === null)).toBe(true);
    expect(failed.results[0]!.feedback).toBe('That is what you see, not why.');
    expect(gradeQuiz(quiz, answers, 0).results.every((r) => r.solution !== null)).toBe(true);
  });

  it('needs every question answered', () => {
    expect(() => gradeQuiz(quiz, { symptom: { type: 'choice', optionIds: ['b'] } }, 1)).toThrow(/Answer every question/);
  });
});

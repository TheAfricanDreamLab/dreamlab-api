import type { CourseContent } from '@lib/rpc';
import { courseFinalScore, programmeScore } from './modules/grading/course-score';

const item = (id: string, type: string, gradeWeight: number) => ({ id, key: id, type, title: id, minutes: 10, required: true, gradeWeight });
const content = {
  modules: [{ id: 'm1', key: 'm1', position: 1, title: 'M', summary: '', weekNo: 1, items: [item('lesson', 'lesson', 0), item('quiz-1', 'quiz', 30), item('canvas', 'assignment', 40), item('quiz-2', 'quiz', 30)] }],
} as unknown as CourseContent;

describe('course final score', () => {
  it('waits until every weighted quiz and assignment has a score', () => {
    expect(courseFinalScore(content, new Map([['quiz-1', 100], ['quiz-2', 80]]))).toBeNull();
  });

  it('weights each score by its gradeWeight', () => {
    // (100×30 + 75×40 + 80×30) / 100
    expect(courseFinalScore(content, new Map([['quiz-1', 100], ['canvas', 75], ['quiz-2', 80]]))).toBe(84);
    expect(courseFinalScore(content, new Map([['quiz-1', 67], ['canvas', 50], ['quiz-2', 33]]))).toBe(50);
  });

  it('has no score for a course with nothing weighted', () => {
    const plain = { modules: [{ ...content.modules[0]!, items: [item('lesson', 'lesson', 0)] }] } as unknown as CourseContent;
    expect(courseFinalScore(plain, new Map())).toBeNull();
  });
});

describe('Programme Score', () => {
  it('weights course scores by credit hours, over the courses that have one', () => {
    expect(programmeScore([{ credits: 5, score: 80 }, { credits: 10, score: 65 }, { credits: 5, score: null }])).toEqual({ programmeScore: 70, scoredCredits: 15, totalCredits: 20 });
  });

  it('is null until a course has a final score', () => {
    expect(programmeScore([{ credits: 5, score: null }])).toEqual({ programmeScore: null, scoredCredits: 0, totalCredits: 5 });
    expect(programmeScore([])).toEqual({ programmeScore: null, scoredCredits: 0, totalCredits: 0 });
  });
});

import { CourseAuthoringSchema, isInteractiveBlock, ProgramAuthoringSchema, toDeliveryContent } from '@dreamlab/contracts';
import { DATASETS } from './modules/seed/datasets';
import { dreamLabCourseOutlines } from './seed/content';

const dataset = DATASETS['dream-lab-test'];

describe('dream-lab-test dataset', () => {
  it.each(dataset.courses.map((c) => [c.slug, c] as const))('%s matches the course schema', (_slug, course) => {
    expect(CourseAuthoringSchema.safeParse(course).error?.issues ?? []).toEqual([]);
  });

  it('defines the programme over courses that exist, totalling 100 credits', () => {
    const programme = ProgramAuthoringSchema.parse(dataset.programs[0]);
    const slugs = new Set(dataset.courses.map((c) => c.slug));
    for (const phase of programme.phases) for (const c of phase.courses) expect(slugs).toContain(c.slug);
    const credits =
      programme.phases.reduce((n, ph) => n + (ph.chooseN ? ph.chooseN * Math.max(0, ...ph.courses.map((c) => c.creditHours)) : ph.courses.reduce((m, c) => m + c.creditHours, 0)), 0) +
      programme.capstoneStages.reduce((n, s) => n + s.creditHours, 0);
    expect(credits).toBe(100);
    expect(programme.phases.reduce((n, ph) => n + ph.weightPct, 0)).toBe(100);
  });

  it('has every course in full, keeping what each outline promised', () => {
    const outlines = new Map(dreamLabCourseOutlines.map((o) => [o.slug, o]));
    expect(dataset.courses.filter((c) => !c.modules?.length).map((c) => c.slug)).toEqual([]);
    for (const c of dataset.courses) {
      const outline = outlines.get(c.slug);
      if (!outline) continue;
      expect([c.slug, c.title, c.creditHours, c.practicalOutput, c.outcomes]).toEqual([outline.slug, outline.title, outline.creditHours, outline.practicalOutput, outline.outcomes]);
      const assignment = c.modules!.flatMap((m) => m.items).find((i) => i.type === 'assignment');
      expect([c.slug, assignment?.type === 'assignment' && assignment.payload.practicalOutput]).toEqual([c.slug, outline.practicalOutput]);
    }
  });

  it.each(dataset.courses.map((c) => [c.slug, c] as const))('%s opens every lesson by teaching, with a video, before any question', (_slug, raw) => {
    const course = CourseAuthoringSchema.parse(raw);
    for (const item of course.modules!.flatMap((m) => m.items)) {
      if (item.type !== 'lesson') continue;
      const blocks = item.payload.steps.flatMap((s) => s.blocks);
      expect([item.key, isInteractiveBlock(item.payload.steps[0]!.blocks[0]!)]).toEqual([item.key, false]);
      expect([item.key, blocks.some((b) => b.type === 'video')]).toEqual([item.key, true]);
    }
  });

  it.each(dataset.courses.map((c) => [c.slug, c] as const))('%s never delivers answers, feedback or outcomes to learners', (_slug, raw) => {
    const course = CourseAuthoringSchema.parse(raw);
    for (const item of course.modules!.flatMap((m) => m.items)) {
      const json = JSON.stringify(toDeliveryContent(item, 'seed-test'));
      // Keys, not words: an option may legitimately be called "best" or "correct".
      expect(json).not.toMatch(/"(correct|feedback|explanation|outcome|best|afterword)":/);
    }
  });
});

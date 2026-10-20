import { CourseAuthoringSchema, isInteractiveBlock, ProgramAuthoringSchema, toDeliveryContent } from '@dreamlab/contracts';
import { DATASETS } from './modules/seed/datasets';

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

  it('has one full course; the rest are outlines', () => {
    const full = dataset.courses.filter((c) => c.modules?.length);
    expect(full.map((c) => c.slug)).toEqual(['problem-solving']);
  });

  it('opens every lesson by teaching, with a video, before any question', () => {
    const course = CourseAuthoringSchema.parse(dataset.courses.find((c) => c.slug === 'problem-solving'));
    expect(course.trailer).toBeDefined();
    for (const item of course.modules!.flatMap((m) => m.items)) {
      if (item.type !== 'lesson') continue;
      const blocks = item.payload.steps.flatMap((s) => s.blocks);
      expect([item.key, isInteractiveBlock(item.payload.steps[0]!.blocks[0]!)]).toEqual([item.key, false]);
      expect([item.key, blocks.some((b) => b.type === 'video')]).toEqual([item.key, true]);
    }
  });

  it('never delivers answers, feedback or outcomes to learners', () => {
    const course = CourseAuthoringSchema.parse(dataset.courses.find((c) => c.slug === 'problem-solving'));
    for (const item of course.modules!.flatMap((m) => m.items)) {
      const json = JSON.stringify(toDeliveryContent(item, 'seed-test'));
      expect(json).not.toMatch(/"correct"|"feedback"|"explanation"|"outcome"|"best"|"afterword"/);
    }
  });
});

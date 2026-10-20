import { fullDreamLabCourses } from './courses';
import { dreamLabCourseOutlines } from './dream-lab-courses';
import { problemSolving } from './problem-solving';

export { problemSolving } from './problem-solving';
export { dreamLabCourseOutlines } from './dream-lab-courses';
export { dreamLabProgramme } from './dream-lab-programme';
export { fullDreamLabCourses } from './courses';

const full = new Map(fullDreamLabCourses.map((c) => [c.slug, c]));

/** Every Dream Lab course, in programme order: the full version where one exists, else the outline. */
export const allCourses = [problemSolving, ...dreamLabCourseOutlines.map((o) => full.get(o.slug) ?? o)].map((c) =>
  // Every Dream Lab course is taught by the same faculty.
  c.instructors?.length ? c : { ...c, instructors: problemSolving.instructors },
);

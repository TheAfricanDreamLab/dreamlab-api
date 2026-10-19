import { dreamLabCourseOutlines } from './dream-lab-courses';
import { problemSolving } from './problem-solving';

export { problemSolving } from './problem-solving';
export { dreamLabCourseOutlines } from './dream-lab-courses';
export { dreamLabProgramme } from './dream-lab-programme';

/** Every Dream Lab course: the full Problem Solving course first, then the coming-soon outlines. */
export const allCourses = [problemSolving, ...dreamLabCourseOutlines];

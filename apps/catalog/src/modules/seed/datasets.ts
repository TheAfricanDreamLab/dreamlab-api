import { allCourses, dreamLabProgramme } from '../../seed/content';
import type { CatalogDataset } from './catalog-seed.service';

/**
 * Seed datasets, chosen with CATALOG_SEED. `dream-lab-test` is test content for staging and
 * development: The African Dream Lab programme, the full Problem Solving course and the other
 * courses as outlines. Production loads none; its courses are provisioned separately.
 */
export const DATASETS: Record<'dream-lab-test', CatalogDataset> = {
  'dream-lab-test': {
    name: 'dream-lab-test',
    courses: allCourses,
    programs: [dreamLabProgramme],
    featured: ['problem-solving'],
  },
};

import type { CourseAuthoring } from '@dreamlab/contracts';
import { artificialIntelligence } from './artificial-intelligence';
import { characterAndEthics } from './character-and-ethics';
import { collaboration } from './collaboration';
import { communication } from './communication';
import { contentCreation } from './content-creation';
import { criticalThinking } from './critical-thinking';
import { digitalMarketing } from './digital-marketing';
import { emotionalIntelligence } from './emotional-intelligence';
import { financialIntelligence } from './financial-intelligence';
import { negotiation } from './negotiation';
import { personalBranding } from './personal-branding';
import { systemsThinking } from './systems-thinking';

/** The twelve Dream Lab courses after Problem Solving, in full (each expands its outline). */
export const fullDreamLabCourses: CourseAuthoring[] = [
  criticalThinking,
  emotionalIntelligence,
  characterAndEthics,
  systemsThinking,
  communication,
  negotiation,
  financialIntelligence,
  personalBranding,
  collaboration,
  contentCreation,
  artificialIntelligence,
  digitalMarketing,
];

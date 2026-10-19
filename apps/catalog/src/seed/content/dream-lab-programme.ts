import type { ProgramAuthoring } from '@dreamlab/contracts';

/*
 * The African Dream Lab: 15 weeks, 100 credits.
 *   Life Architecture        weeks 1–4    25 credits (25%)  five courses × 5
 *   Builder’s Architecture   weeks 5–8    20 credits (20%)  five courses × 4
 *   Elective                 weeks 9–10   10 credits (10%)  choose one of three
 *   Dream Residency          weeks 11–14  45 credits (45%)  seven graded capstone stages
 *   Final Assessment         week 15      reviews, Final Demonstration, Dream Score, graduation
 */

export const dreamLabProgramme: ProgramAuthoring = {
  slug: 'the-african-dream-lab',
  title: 'The African Dream Lab',
  subtitle: 'Fifteen weeks to build the mind, the skills and the first real version of your dream.',
  description:
    "The African Dream Lab is a 15-week, 100-credit programme for young African builders and changemakers. It is run by the African Dream Network and was born from the TADIS conference.\n\nThe Lab follows one path: **Knowledge → Skill → Application → Artifact → Evidence**. Every course ends in a named Practical Output, and those outputs build your portfolio and your Dream Score.\n\n- **Life Architecture** (weeks 1–4, 25 credits): Problem Solving, Critical Thinking, Emotional Intelligence, Character Formation and Ethics, and Systems Thinking and Formulation. Together their outputs form your Life Architecture Blueprint.\n- **Builder’s Architecture** (weeks 5–8, 20 credits): Communication, Negotiation, Financial Intelligence, Personal Branding and Collaboration.\n- **Elective** (weeks 9–10, 10 credits): one of Content Creation, Artificial Intelligence or Digital Marketing.\n- **Dream Residency** (weeks 11–14, 45 credits): seven graded capstone stages that take your dream from a statement to a tested, demonstrated prototype, with a mentor alongside you.\n- **Final Assessment** (week 15): final reviews, the Final Demonstration event, your Dream Score and the graduation decision.\n\nThe Lab is blended. Each week has two virtual sessions, on **Tuesday and Thursday from 9:00 to 10:30 PM WAT**, and one physical session on **Saturday from 8:30 to 10:30 AM**. Between sessions you learn online, at your own pace, on your phone or computer.\n\nAdmission is selective and scholarships are available.",
  provider: 'The African Dream Lab',
  programType: 'cohort_program',
  deliveryMode: 'blended',
  features: ['admissions', 'scholarships', 'programme_score', 'competency_score', 'capstone', 'portfolio', 'graduation_checklist', 'mentorship'],
  cover: { from: '#0A0F1E', to: '#D8A84E', symbol: '✶' },
  phases: [
    {
      key: 'life-architecture',
      name: 'Life Architecture',
      summary:
        'Weeks 1–4. The habits of mind every builder needs: solving real problems, thinking critically, managing emotions, acting with character and seeing whole systems. Five courses of 5 credits each, whose outputs form your Life Architecture Blueprint.',
      weekFrom: 1,
      weekTo: 4,
      weightPct: 25,
      chooseN: null,
      courses: [
        { slug: 'problem-solving', creditHours: 5, required: true },
        { slug: 'critical-thinking', creditHours: 5, required: true },
        { slug: 'emotional-intelligence', creditHours: 5, required: true },
        { slug: 'character-and-ethics', creditHours: 5, required: true },
        { slug: 'systems-thinking', creditHours: 5, required: true },
      ],
    },
    {
      key: 'builders-architecture',
      name: "Builder’s Architecture",
      summary:
        'Weeks 5–8. The skills to build with and through other people: communicating, negotiating, managing money, building a personal brand and collaborating in teams. Five courses of 4 credits each.',
      weekFrom: 5,
      weekTo: 8,
      weightPct: 20,
      chooseN: null,
      courses: [
        { slug: 'communication', creditHours: 4, required: true },
        { slug: 'negotiation', creditHours: 4, required: true },
        { slug: 'financial-intelligence', creditHours: 4, required: true },
        { slug: 'personal-branding', creditHours: 4, required: true },
        { slug: 'collaboration', creditHours: 4, required: true },
      ],
    },
    {
      key: 'elective',
      name: 'Elective',
      summary:
        'Weeks 9–10. Go deep on one practical, in-demand skill. Choose exactly one of Content Creation, Artificial Intelligence or Digital Marketing (10 credits). Your choice must be approved before week 9.',
      weekFrom: 9,
      weekTo: 10,
      weightPct: 10,
      chooseN: 1,
      courses: [
        { slug: 'content-creation', creditHours: 10, required: false },
        { slug: 'artificial-intelligence', creditHours: 10, required: false },
        { slug: 'digital-marketing', creditHours: 10, required: false },
      ],
    },
    {
      key: 'dream-residency',
      name: 'Dream Residency',
      summary:
        'Weeks 11–14. Your capstone. With a mentor alongside you, you take your dream through seven graded stages, from a clear Dream Statement to a tested prototype and a Final Demonstration. 45 credits, earned through the capstone stages.',
      weekFrom: 11,
      weekTo: 14,
      weightPct: 45,
      chooseN: null,
      courses: [],
    },
    {
      key: 'final-assessment',
      name: 'Final Assessment',
      summary:
        'Week 15. Final reviews of your portfolio and capstone, the Final Demonstration event before an invited panel, finalisation of your Dream Score, and the graduation decision.',
      weekFrom: 15,
      weekTo: 15,
      weightPct: 0,
      chooseN: null,
      courses: [],
    },
  ],
  capstoneStages: [
    {
      name: 'Dream Definition',
      outputDocument: 'Dream Statement',
      creditHours: 5,
      summary: 'Define the dream you will pursue: the problem it answers, who it serves, why you are the person to build it and what success looks like in a year. Builds on your Problem Definition Canvas and Life Architecture Blueprint.',
    },
    {
      name: 'Research and Validation',
      outputDocument: 'Validation Report',
      creditHours: 5,
      summary: 'Test your assumptions with real people and real evidence: interviews, observation, market and context research. Show whether the need is real, how big it is and who else is working on it.',
    },
    {
      name: 'Solution Design',
      outputDocument: 'Solution Blueprint',
      creditHours: 7,
      summary: 'Design your solution: how it works, who it is for, what it costs, how it reaches people and which assumptions remain riskiest. Includes options considered and the reasons for your choice.',
    },
    {
      name: 'Prototype and Build',
      outputDocument: 'Prototype and Build Log',
      creditHours: 10,
      summary: 'Build the first real version: a product, service, pilot, campaign or programme that people can actually use. Keep a build log of decisions, problems and changes along the way.',
    },
    {
      name: 'Testing and Iteration',
      outputDocument: 'Testing and Iteration Report',
      creditHours: 6,
      summary: 'Put your prototype in front of real users, measure what happens against thresholds set in advance, and improve it through at least two rounds of iteration.',
    },
    {
      name: 'Sustainability and Impact',
      outputDocument: 'Sustainability and Impact Plan',
      creditHours: 5,
      summary: 'Show how your dream will last and how you will know it is working: the business or funding model, the team, the risks, and the impact measures you will track.',
    },
    {
      name: 'Final Demonstration',
      outputDocument: 'Demonstration Deck and Showcase',
      creditHours: 7,
      summary: 'Demonstrate your work at the Final Demonstration event in week 15: a live presentation and showcase of your prototype, your evidence and your plan, assessed by an invited panel.',
    },
  ],
  graduationRequirements: [
    { key: 'credits_earned', label: 'Earn all 100 credits across the four phases' },
    { key: 'life_architecture_blueprint', label: 'Submit an approved Life Architecture Blueprint' },
    { key: 'builders_outputs', label: "Complete all five Builder’s Architecture Practical Outputs" },
    { key: 'approved_elective', label: 'Complete an approved elective and its Practical Output' },
    { key: 'residency_completion', label: 'Complete all seven Dream Residency stages and their output documents' },
    { key: 'conduct_and_attendance', label: 'Meet the Lab standards for conduct and attendance' },
    { key: 'complete_portfolio', label: 'Submit a complete portfolio of Practical Outputs and evidence' },
    { key: 'final_assessment', label: 'Pass the final assessment and review' },
    { key: 'final_demonstration', label: 'Present at the Final Demonstration event' },
    { key: 'post_lab_action_plan', label: 'Submit a 12-month post-Lab action plan' },
  ],
  calendar: [
    { weekNo: 1, phase: 'Life Architecture', focus: 'Orientation; Problem Solving; Critical Thinking begins', majorOutput: 'Problem Definition Canvas (first draft)' },
    { weekNo: 2, phase: 'Life Architecture', focus: 'Problem Solving completed; Critical Thinking', majorOutput: 'Problem Definition Canvas; Argument Audit' },
    { weekNo: 3, phase: 'Life Architecture', focus: 'Emotional Intelligence; Character Formation and Ethics', majorOutput: 'Emotional Intelligence Growth Plan; Personal Values Charter' },
    { weekNo: 4, phase: 'Life Architecture', focus: 'Systems Thinking and Formulation; Life Architecture review', majorOutput: 'System Map and Leverage Brief; Life Architecture Blueprint' },
    { weekNo: 5, phase: "Builder’s Architecture", focus: 'Communication', majorOutput: 'Signature Talk' },
    { weekNo: 6, phase: "Builder’s Architecture", focus: 'Negotiation; Financial Intelligence begins', majorOutput: 'Negotiation Plan and Debrief' },
    { weekNo: 7, phase: "Builder’s Architecture", focus: 'Financial Intelligence; Personal Branding', majorOutput: 'Personal and Venture Financial Plan; Personal Brand Kit' },
    { weekNo: 8, phase: "Builder’s Architecture", focus: "Collaboration; Builder’s Architecture review; elective selection", majorOutput: 'Team Charter; approved elective choice' },
    { weekNo: 9, phase: 'Elective', focus: 'Elective: Content Creation, Artificial Intelligence or Digital Marketing', majorOutput: 'Elective project plan' },
    { weekNo: 10, phase: 'Elective', focus: 'Elective project completed', majorOutput: 'Elective Practical Output' },
    { weekNo: 11, phase: 'Dream Residency', focus: 'Dream Definition; Research and Validation begins; mentor matching', majorOutput: 'Dream Statement' },
    { weekNo: 12, phase: 'Dream Residency', focus: 'Research and Validation; Solution Design', majorOutput: 'Validation Report; Solution Blueprint' },
    { weekNo: 13, phase: 'Dream Residency', focus: 'Prototype and Build', majorOutput: 'Prototype and Build Log' },
    { weekNo: 14, phase: 'Dream Residency', focus: 'Testing and Iteration; Sustainability and Impact; demonstration rehearsal', majorOutput: 'Testing and Iteration Report; Sustainability and Impact Plan' },
    { weekNo: 15, phase: 'Final Assessment', focus: 'Final reviews; Final Demonstration event; Dream Score finalisation; graduation decision', majorOutput: 'Demonstration Deck and Showcase; 12-month post-Lab action plan' },
  ],
};

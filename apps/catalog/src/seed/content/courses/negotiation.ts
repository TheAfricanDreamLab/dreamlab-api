import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Negotiation: the second Builder’s Architecture course of The African Dream Lab (week 6, 4 credits).
 *
 * Spine: Prepare → Understand interests → Create options → Claim fairly → Hold steady → Debrief.
 * Recurring cast, all fictional:
 *   Kofi    a freelance graphic designer in Accra, negotiating fees with clients
 *   Fatou   founder of a small fashion label in Dakar, negotiating with a boutique chain
 *   Amina   a tomato trader in Kano, negotiating with a truck owner and her market line
 *   Tunde   product manager at a Lagos fintech, weighing a job offer
 *   Wanjiru operations lead at a Nairobi matatu SACCO, negotiating with the county
 *   Uwase   secretary of a village borehole committee in Rwanda’s Eastern Province
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Prepare
// ---------------------------------------------------------------------------

const modulePrepare: Module = {
  key: 'prepare',
  title: 'Prepare: goals, walk-away and alternatives',
  summary:
    'See how often you already negotiate, why most people either give in or fight, and how preparation changes that. Learn to set a target, a walk-away point and your best alternative before you sit down.',
  weekNo: 6,
  items: [
    {
      key: 'everyday-negotiation',
      type: 'lesson',
      title: 'You negotiate every day',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Negotiation',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to Negotiation. Last week you learnt to communicate so people understand and act. This week you will learn to reach agreements when people want different things.\n\nYou negotiate far more than you think: a price at the market, rent with a landlord, a fee with a client, a deadline with your team, chores with your family, a permit with an official. Most people do it without a plan. They either give too much away to keep the peace, or damage the relationship trying to win.\n\nBy the end of the week you will have a **Negotiation Plan and Debrief**: a plan for a real negotiation in your life or venture, and an honest account of what happened when you carried it out.\n\nStart with this short clip from Harvard Business Review.",
              },
              {
                id: 'welcome-video',
                type: 'video',
                provider: 'youtube',
                videoId: '4HzZXoOPObg',
                title: 'What the Best Negotiators Do Differently',
                channel: 'Harvard Business Review',
                durationS: 69,
                caption: "A one-minute clip from Harvard Business Review. As you watch, note one habit you already have and one you don’t.",
              },
            ],
          },
          {
            id: 'your-negotiations',
            title: 'Where you negotiate',
            blocks: [
              {
                id: 'negotiation-poll',
                type: 'poll',
                prompt: 'Which kind of negotiation do you face most often?',
                options: [
                  { id: 'buying', text: 'Buying or selling: prices, suppliers, customers' },
                  { id: 'work', text: 'Work: pay, fees, roles, deadlines' },
                  { id: 'housing', text: 'Housing: rent, landlords, roommates' },
                  { id: 'family', text: 'Family: money, responsibilities, decisions' },
                  { id: 'community', text: 'Community: committees, officials, groups' },
                  { id: 'team', text: 'Team: who does what in a project or venture' },
                ],
                afterword:
                  "Every one of these is a negotiation: two or more people who need each other’s agreement to get what they want. The same tools work in all of them.",
              },
            ],
          },
          {
            id: 'three-styles',
            title: 'Soft, hard or principled',
            blocks: [
              {
                id: 'styles-text',
                type: 'text',
                body: "In their book *Getting to Yes* (1981), Roger Fisher and William Ury of the Harvard Negotiation Project described two common ways people negotiate, and a better third way.\n\n- **Soft:** treat the other side as friends, make concessions to keep the relationship, avoid conflict. You often end up feeling used.\n- **Hard:** treat the other side as opponents, demand concessions, dig in. You may win this time, but you damage the relationship and often reach no deal at all.\n- **Principled:** be soft on the people and firm on the problem. Focus on what each side really needs, look for options that work for both, and use fair standards to decide.",
              },
              {
                id: 'styles-framework',
                type: 'framework',
                title: 'Four principles from Getting to Yes',
                steps: [
                  { label: 'Separate the people from the problem', detail: 'Respect the person; work together on the issue.' },
                  { label: 'Focus on interests, not positions', detail: 'Ask why each side wants what it says it wants.' },
                  { label: 'Invent options for mutual gain', detail: 'Look for deals that make both sides better off before deciding.' },
                  { label: 'Insist on objective criteria', detail: 'Use fair standards, such as market prices or precedent, rather than pressure.' },
                ],
              },
            ],
          },
          {
            id: 'kofi-style',
            title: 'Kofi’s first client',
            blocks: [
              {
                id: 'kofi-choice',
                type: 'choice',
                prompt: 'Kofi (fictional), a freelance designer in Accra, is asked to design a logo for a restaurant. The owner says, “I can only pay GH₵500.” Kofi usually charges GH₵1,500. Which response is most principled?',
                multiple: false,
                options: [
                  { id: 'soft', text: '“Okay, no problem. I’ll do it for 500.”', correct: false, feedback: 'Soft. Kofi keeps the client but undervalues his work, and will resent the job.' },
                  { id: 'hard', text: '“1,500 or nothing. Take it or leave it.”', correct: false, feedback: 'Hard. He may lose a client who could have become a regular.' },
                  { id: 'principled', text: '“Help me understand what you need the logo for. Then let’s look at what we can do for the budget, or how to spread the cost.”', correct: true, feedback: 'Yes. Kofi stays friendly, asks about interests, and keeps both his price and the relationship open.' },
                  { id: 'walk', text: 'Leave without replying.', correct: false, feedback: 'He learns nothing, and the client may have had more room than he thought.' },
                ],
                explanation:
                  "Principled does not mean splitting the difference. It means understanding what the other side needs, then looking for a deal that respects both sides’ interests. Perhaps the owner needs the logo now but could pay more after opening, or needs only a simple version first.",
              },
            ],
          },
          {
            id: 'market',
            title: 'Every market is a classroom',
            blocks: [
              {
                id: 'market-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/A_woman_pricing.jpg/1280px-A_woman_pricing.jpg',
                alt: 'A person in a bright patterned dress stands at a market stall piled with red onions, carrots, cucumbers and cabbages, while another person walks past in the background. The photo is taken at a tilt.',
                caption: 'Agreeing a price at a vegetable stall. Many of us learnt to negotiate before we could spell the word.',
                credit: 'Photo: Justmee3001 / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'market-match',
                type: 'match',
                prompt: 'Match each everyday moment to the negotiation skill it already uses.',
                pairs: [
                  { id: 'walk', left: 'Walking towards the next stall when the price is too high', right: 'Knowing your alternative' },
                  { id: 'regular', left: '“I buy from you every week. Give me a better price.”', right: 'Using the relationship as value' },
                  { id: 'bundle', left: '“If I take three, will you add one free?”', right: 'Creating options' },
                  { id: 'compare', left: '“The woman over there sells the same for less.”', right: 'Using objective criteria' },
                ],
                explanation:
                  "You already have the instincts. This course turns them into a deliberate method you can use with landlords, clients, partners and officials, where the stakes are higher and the relationships last longer.",
              },
            ],
          },
          {
            id: 'confidence',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'confidence-scale',
                type: 'scale',
                prompt: 'How confident are you negotiating something important, such as pay, rent or a contract?',
                minLabel: 'I avoid it',
                maxLabel: 'Very confident',
                afterword:
                  "Many people avoid negotiating because it feels rude, risky or awkward. Preparation is the cure. You will rate yourself again after your real negotiation.",
              },
              {
                id: 'jfk-quote',
                type: 'quote',
                text: 'Let us never negotiate out of fear. But let us never fear to negotiate.',
                attribution: 'John F. Kennedy, inaugural address (1961)',
              },
              {
                id: 'choose-reflection',
                type: 'reflection',
                prompt: 'Choose a real negotiation you will carry out in the next ten days for your Practical Output. Who is it with, what is it about, and why does it matter to you?',
                guidance: 'Pick something real but manageable: a price with a supplier, a fee with a client, rent, a role in your team, a request to an official. Avoid anything where you or someone else could be put at risk.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'walk-away-and-alternatives',
      type: 'lesson',
      title: 'Your walk-away point and your best alternative',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'batna-intro',
            title: 'Power comes from your alternatives',
            blocks: [
              {
                id: 'batna-text',
                type: 'text',
                body: "The most important question in any negotiation is one you answer before it starts: **what will I do if we don’t agree?**\n\nFisher and Ury called the answer your **BATNA**: your *Best Alternative To a Negotiated Agreement*. If your BATNA is strong, you can negotiate calmly and walk away when a deal is bad. If it is weak, you are more likely to accept anything. Watch the explanation below.",
              },
              {
                id: 'batna-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'FSyABLfStXE',
                title: 'Alternatives and BATNA in Interest Based Negotiation - Noam Ebner',
                channel: 'Noam Ebner: Negotiation, Conflict Resolution & ADR',
                durationS: 346,
                caption: "Negotiation teacher Noam Ebner explains alternatives and BATNA. Listen for the difference between your alternatives in general and your *best* one.",
              },
            ],
          },
          {
            id: 'terms',
            title: 'Four numbers to know',
            blocks: [
              {
                id: 'batna-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Target', definition: 'The ambitious but realistic result you aim for. Set it before you start, based on research.' },
                  { term: 'Walk-away point', definition: 'The worst deal you will accept. Beyond it, you are better off with your BATNA. Also called the reservation point.' },
                  { term: 'BATNA', definition: 'Best Alternative To a Negotiated Agreement: what you will actually do if there is no deal.' },
                  { term: 'ZOPA', definition: 'Zone Of Possible Agreement: the overlap between your walk-away point and theirs. If there is no overlap, no deal is possible on these terms.' },
                ],
              },
              {
                id: 'kofi-example',
                type: 'example',
                title: 'Kofi prepares',
                body: "Kofi has been offered a three-month contract designing social media posts for a growing juice brand in Accra.\n\n- **Target:** GH₵4,000 a month, based on what two designer friends charge for similar work.\n- **BATNA:** keep his current mix of small clients, which brings in about GH₵2,500 a month, and pitch to a cosmetics brand that has shown interest.\n- **Walk-away point:** GH₵3,000 a month. Below that, the contract would take too much time from clients who pay better per hour.\n\nKofi does not know the juice brand’s walk-away point, but he guesses their BATNA is hiring an agency, which would cost them much more. (All figures are fictional.)",
              },
            ],
          },
          {
            id: 'identify-batna',
            title: 'Spot the BATNA',
            blocks: [
              {
                id: 'batna-choice',
                type: 'choice',
                prompt: 'Tunde (fictional) has a job offer from a Lagos bank. Which of these is his BATNA?',
                multiple: false,
                options: [
                  { id: 'hope', text: 'Hoping the bank will raise the offer', correct: false, feedback: 'That is a hope about this negotiation, not an alternative to it.' },
                  { id: 'stay', text: 'Staying in his current fintech role, where he has been promised a review in three months', correct: true, feedback: 'Yes. It is what he will actually do if he does not accept the bank’s offer.' },
                  { id: 'dream', text: 'A dream job abroad he has not applied for', correct: false, feedback: 'An alternative must be real and available. One he has not pursued does not count yet.' },
                  { id: 'salary', text: 'The salary he wants', correct: false, feedback: 'That is his target, not his alternative.' },
                ],
                explanation:
                  "A BATNA is concrete and available: what you will really do tomorrow if you walk away. If you are not sure what yours is, you are not ready to negotiate.",
              },
            ],
          },
          {
            id: 'improve-batna',
            title: 'Improve your BATNA first',
            blocks: [
              {
                id: 'improve-reveal',
                type: 'reveal',
                prompt: 'Tunde’s BATNA is weak: his current job is unhappy and the review is vague. What could he do *before* negotiating with the bank?',
                body: "Strengthen it. He could ask his current manager for a firm date and criteria for the review. He could apply to one or two other companies to see what the market offers. He could talk to people in similar roles to learn real salary ranges.\n\nThe best time to improve your BATNA is before the negotiation starts. Each improvement makes you calmer at the table, and calm negotiators make better decisions.",
              },
              {
                id: 'lowball-scenario',
                type: 'scenario',
                situation:
                  "Kofi meets the juice brand’s marketing manager. She says: “We love your work. We can offer GH₵2,200 a month. That’s our budget.”\n\nKofi’s walk-away point is GH₵3,000.",
                prompt: 'What should Kofi do?',
                options: [
                  {
                    id: 'accept',
                    text: 'Accept. A contract is a contract, and she might not ask again.',
                    outcome: "Kofi takes the job and turns down the cosmetics pitch to make time. By month two he is earning less than before, working longer hours, and resentful. He has accepted a deal worse than his BATNA.",
                    best: false,
                  },
                  {
                    id: 'explore',
                    text: 'Stay warm, say that figure is well below what similar work costs, ask what the brand most needs from the contract, and explore whether scope or timing could change.',
                    outcome: "The manager admits that what matters most is three strong posts a week for the launch month. Kofi proposes a smaller scope at GH₵3,200 a month, with a bonus if engagement targets are met. She agrees to take it to her director. Kofi has kept the relationship and stayed above his walk-away point.",
                    best: true,
                  },
                  {
                    id: 'storm',
                    text: 'Say that the offer is insulting and leave.',
                    outcome: "Kofi protects his price but closes the door. He never learns that the budget had more room for a smaller scope.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'prep-steps',
            title: 'A preparation routine',
            blocks: [
              {
                id: 'prep-order',
                type: 'order',
                prompt: 'Put Kofi’s preparation steps in a sensible order.',
                items: [
                  { id: 'goal', text: 'Decide what he really wants from the deal, beyond the money' },
                  { id: 'research', text: 'Research what similar work pays' },
                  { id: 'batna', text: 'Work out his BATNA and try to improve it' },
                  { id: 'walkaway', text: 'Set his walk-away point from his BATNA' },
                  { id: 'target', text: 'Set an ambitious, realistic target' },
                  { id: 'their-side', text: 'Think through the other side’s interests and alternatives' },
                ],
                explanation:
                  "Your walk-away point comes from your BATNA: never accept a deal worse than what you can get elsewhere. Your target comes from research, not from fear. And no plan is complete until you have thought hard about the other side.",
              },
            ],
          },
          {
            id: 'your-numbers',
            title: 'Your numbers',
            blocks: [
              {
                id: 'numbers-reflection',
                type: 'reflection',
                prompt: 'For the negotiation you chose, write your target, your BATNA and your walk-away point. Then guess the other side’s BATNA. What could you do this week to strengthen your own?',
                guidance: 'If the negotiation is not about money, describe the target and walk-away in other terms: dates, roles, responsibilities or conditions.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'prepare-quiz',
      type: 'quiz',
      title: 'Module quiz: Prepare',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on negotiation styles, BATNA, walk-away points and preparation. You need 70% to pass and can retake it as many times as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-batna-meaning',
            type: 'choice',
            prompt: 'What does BATNA stand for?',
            multiple: false,
            options: [
              { id: 'a', text: 'Best Alternative To a Negotiated Agreement', correct: true },
              { id: 'b', text: 'Basic Agreement That Neither Accepts', correct: false, feedback: 'Not quite. Think about what you will do if there is no deal.' },
              { id: 'c', text: 'Bottom And Top Negotiation Amounts', correct: false, feedback: 'Those are your walk-away point and target.' },
              { id: 'd', text: 'Best Answer To a Negotiator’s Argument', correct: false, feedback: 'BATNA is about your options away from the table.' },
            ],
            explanation: 'Your BATNA is what you will actually do if this negotiation fails. It sets your walk-away point.',
          },
          {
            id: 'q-terms-match',
            type: 'match',
            prompt: 'Uwase’s committee is negotiating a yearly maintenance contract with a pump mechanic. Match each item to its term.',
            pairs: [
              { id: 'target', left: 'A full year of maintenance for RWF 120,000', right: 'Target' },
              { id: 'walk', left: 'Nothing above RWF 180,000 for the year', right: 'Walk-away point' },
              { id: 'batna', left: 'Pay a mechanic from the next district for each repair', right: 'BATNA' },
              { id: 'zopa', left: 'The range between the mechanic’s lowest price and the committee’s highest', right: 'ZOPA' },
            ],
            explanation: 'The committee’s walk-away comes from what its BATNA would cost. If the mechanic’s lowest price is above RWF 180,000, there is no ZOPA. (All figures are fictional.)',
          },
          {
            id: 'q-styles',
            type: 'choice',
            prompt: 'Which description fits principled negotiation?',
            multiple: false,
            options: [
              { id: 'a', text: 'Give way to keep the peace', correct: false, feedback: 'That is soft negotiation.' },
              { id: 'b', text: 'Dig in and demand concessions', correct: false, feedback: 'That is hard negotiation.' },
              { id: 'c', text: 'Be soft on the people and firm on the problem', correct: true },
              { id: 'd', text: 'Always split the difference', correct: false, feedback: 'Splitting the difference ignores interests and fairness.' },
            ],
            explanation: 'Principled negotiation respects people, focuses on interests, creates options and uses fair standards.',
          },
          {
            id: 'q-improve',
            type: 'choice',
            prompt: 'Which of these would strengthen a job seeker’s BATNA? Select all that apply.',
            multiple: true,
            options: [
              { id: 'apply', text: 'Applying to two other companies', correct: true },
              { id: 'research', text: 'Learning what similar roles pay', correct: true, feedback: 'Strictly, research sharpens your target. But knowing the market also tells you what alternatives are realistic.' },
              { id: 'review', text: 'Getting a firm promotion date from a current employer', correct: true },
              { id: 'pretend', text: 'Pretending to have another offer', correct: false, feedback: 'Bluffing is risky and can destroy trust if discovered. Build a real alternative instead.' },
            ],
            explanation: 'A real, improved alternative gives you calm at the table. A bluff gives you risk.',
          },
          {
            id: 'q-below',
            type: 'choice',
            prompt: 'A client’s final offer is below your walk-away point. What should you usually do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Accept, because any deal is better than none', correct: false, feedback: 'Not if your BATNA is better. That is exactly what the walk-away point protects.' },
              { id: 'b', text: 'Politely decline and use your BATNA, unless new information changes your walk-away point', correct: true },
              { id: 'c', text: 'Insult the offer to show strength', correct: false, feedback: 'Damaging the relationship gains nothing.' },
              { id: 'd', text: 'Lower your walk-away point on the spot', correct: false, feedback: 'Moving it under pressure is how people end up with deals they regret.' },
            ],
            explanation: 'Decide your walk-away point before you start, and only change it for new information, never for pressure.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Create and claim value
// ---------------------------------------------------------------------------

const moduleValue: Module = {
  key: 'create-and-claim-value',
  title: 'Create and claim value',
  summary:
    'Look beneath positions to the interests that drive them, invent options that make both sides better off, and then claim your share fairly with anchors, concessions and objective criteria.',
  weekNo: 6,
  items: [
    {
      key: 'interests',
      type: 'lesson',
      title: 'Interests, not positions',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'interests-intro',
            title: 'Why, not what',
            blocks: [
              {
                id: 'interests-text',
                type: 'text',
                body: "A **position** is what someone says they want: “I want 20% off.” “I need it by Monday.” An **interest** is *why* they want it: cash flow, a promise to their own boss, fear of being cheated, pride.\n\nPositions often clash. Interests often don’t. When you understand the interests on both sides, you can find deals that positions would never reveal. William Ury, co-author of *Getting to Yes*, explains.",
              },
              {
                id: 'interests-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'MuJyDRgONls',
                title: 'Getting to Yes: Interests vs. Positions',
                channel: 'William Ury',
                durationS: 252,
                caption: "William Ury on the difference between positions and interests. Listen for the question he asks to move from one to the other.",
              },
            ],
          },
          {
            id: 'orange',
            title: 'The orange',
            blocks: [
              {
                id: 'orange-reveal',
                type: 'reveal',
                prompt: 'A classic teaching story: two sisters argue over one orange. Both say, “I need the whole orange.” They finally cut it in half. What did they miss?',
                body: "One sister wanted the juice to drink. The other wanted the peel to bake a cake. Each could have had **all** of what she needed. By arguing over positions (“the orange”), they each got half.\n\nThe story is simple on purpose. In real negotiations, interests are harder to see, but the lesson holds: before you split anything, ask what each side will do with it.",
              },
              {
                id: 'interests-match',
                type: 'match',
                prompt: 'Fatou (fictional) is negotiating with a boutique chain in Dakar. Match each position to the interest that might lie behind it.',
                pairs: [
                  { id: 'consign', left: 'Boutique: “We only take new labels on consignment.”', right: 'They don’t want to risk cash on stock that may not sell' },
                  { id: 'margin', left: 'Boutique: “We need a 50% margin.”', right: 'Their rent and staff costs are high' },
                  { id: 'cash', left: 'Fatou: “I need payment within two weeks.”', right: 'She must pay her tailors and fabric supplier every fortnight' },
                  { id: 'brand', left: 'Fatou: “My label must be displayed separately.”', right: 'She wants customers to recognise and return to her brand' },
                ],
                explanation:
                  "Look at the interests side by side. The boutique fears unsold stock; Fatou fears cash shortages. A deal that pays Fatou quickly for what sells, and lets the boutique return what doesn’t, might meet both. You cannot see that from the positions alone.",
              },
            ],
          },
          {
            id: 'fabric-market',
            title: 'Asking why',
            blocks: [
              {
                id: 'fabric-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Balogun_Market%2C_Lagos_Island.jpg/1280px-Balogun_Market%2C_Lagos_Island.jpg',
                alt: 'A view from above of a busy market street lined with stalls under red and green metal roofs, with clothes hanging on display, umbrellas and many people walking.',
                caption: 'Balogun Market on Lagos Island, Nigeria, a busy centre for clothing and fabric. Every stall is a negotiation waiting to happen.',
                credit: 'Photo: Yellowcrunchy / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'questions-choice',
                type: 'choice',
                prompt: 'Which questions help uncover the boutique buyer’s interests? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'why', text: '“Help me understand why consignment works best for you.”', correct: true, feedback: 'Yes. An open “why” question about their position.' },
                  { id: 'worry', text: '“What worries you most about stocking a new label?”', correct: true, feedback: 'Yes. Fears are interests too, and often the most important ones.' },
                  { id: 'success', text: '“What would make this a great season for your shop?”', correct: true, feedback: 'Yes. It invites them to describe what they are trying to achieve.' },
                  { id: 'demand', text: '“Why can’t you just pay upfront like everyone else?”', correct: false, feedback: 'This is a challenge dressed as a question. It will make the buyer defend the position, not explain it.' },
                ],
                explanation:
                  "Good interest questions are open, curious and about the other side’s goals and worries. Then listen, and summarise, just as you practised in Communication.",
              },
            ],
          },
          {
            id: 'own-interests',
            title: 'Your own interests too',
            blocks: [
              {
                id: 'own-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Know your own interests',
                body: "It is easy to fix on one number and forget why you want it. Before Fatou negotiates, she lists her interests: steady cash flow, her brand being visible, learning which styles sell in which neighbourhood, and a partner who will grow with her.\n\nSome of those are worth more to her than a few percentage points of margin. Knowing that lets her trade wisely.",
              },
              {
                id: 'interests-scale',
                type: 'scale',
                prompt: 'In your chosen negotiation, how well do you understand what the other side really wants, and why?',
                minLabel: 'Hardly at all',
                maxLabel: 'Very well',
                afterword:
                  "If your answer is low, you have found your most important preparation task. Talk to people who know them, look at their situation, and plan your opening questions.",
              },
            ],
          },
          {
            id: 'your-interests',
            title: 'Map the interests',
            blocks: [
              {
                id: 'interests-reflection',
                type: 'reflection',
                prompt: 'For your negotiation, write each side’s position and at least three interests behind it, including fears. Then write two open questions you will ask to test your guesses about their interests.',
                guidance: 'Rank your own interests from most to least important. You will use the ranking to decide what you can trade.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'creating-options',
      type: 'lesson',
      title: 'Grow the pie before you slice it',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'options-intro',
            title: 'More than one thing to talk about',
            blocks: [
              {
                id: 'options-text',
                type: 'text',
                body: "Many negotiations feel like a tug of war over one thing: the price. Every naira or cedi you gain, they lose. That is called **distributive** bargaining, and sometimes it is unavoidable.\n\nBut most real deals involve more than one issue: price, timing, quantity, quality, risk, payment terms, credit, recognition, future work. When there are several issues, you can trade between them and make both sides better off. That is **integrative** bargaining, or growing the pie.",
              },
              {
                id: 'options-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'm6Dgq-p4Tsc',
                title: 'Negotiation tutorial - Integrative bargaining tactics (Expanding the pie)',
                channel: '365 Financial Analyst',
                durationS: 314,
                caption: "A short tutorial on integrative bargaining. Note each tactic it names for expanding the pie, then look for one you could use in your own negotiation.",
              },
            ],
          },
          {
            id: 'trade',
            title: 'Trade on differences',
            blocks: [
              {
                id: 'trade-framework',
                type: 'framework',
                title: 'Where extra value hides',
                steps: [
                  { label: 'Different priorities', detail: 'Give what is cheap for you and valuable for them, and ask for the reverse.' },
                  { label: 'Different timing', detail: 'One side needs it now, the other can wait. One needs cash today, the other can pay more later.' },
                  { label: 'Different views of risk', detail: 'Share risk with bonuses, trials or returns, so the side more worried about risk is protected.' },
                  { label: 'Different forecasts', detail: 'If you disagree about what will happen, make part of the deal depend on what actually happens.' },
                  { label: 'Adding issues', detail: 'Bring in something new: training, recognition, referrals, a longer relationship.' },
                ],
              },
              {
                id: 'amina-example',
                type: 'example',
                title: 'Amina and the truck owner',
                body: "Amina (fictional) wants a lower transport price from the truck owner who brings tomatoes from Kura to Kano. He refuses: fuel is expensive.\n\nInstead of fighting over the price, they talk about interests. He hates driving back half-empty. She hates the crushed bottom layer from deep stacking. They agree: he carries her tomatoes in shallow crates at the same price, and Amina finds him a return load of grain from a trader in her market each week. He earns more per trip; she loses less stock. Neither gave up anything on price.",
              },
            ],
          },
          {
            id: 'options-check',
            title: 'Spot the integrative move',
            blocks: [
              {
                id: 'integrative-choice',
                type: 'choice',
                prompt: 'Kofi and the juice brand are stuck: he wants GH₵4,000 a month, they say GH₵3,000 is their limit. Which proposal grows the pie?',
                multiple: false,
                options: [
                  { id: 'split', text: '“Let’s split the difference at 3,500.”', correct: false, feedback: 'Quick, but it only divides the pie. Neither side’s other interests are used.' },
                  { id: 'bonus', text: '“3,000 a month, plus a bonus if engagement doubles by month three, and permission to show the work in my portfolio.”', correct: true, feedback: 'Yes. The bonus shares risk, and the portfolio rights cost the brand nothing but are valuable to Kofi.' },
                  { id: 'insist', text: '“4,000 is my price. My work is worth it.”', correct: false, feedback: 'It may be worth it, but repeating a position does not move a negotiation.' },
                  { id: 'give', text: '“Fine, 3,000.”', correct: false, feedback: 'Kofi concedes without getting anything in return.' },
                ],
                explanation:
                  "Look for things that are **cheap to give and valuable to receive**. A portfolio credit costs the brand nothing. A performance bonus means they only pay more if Kofi delivers more, which addresses their fear of paying for results they don’t get.",
              },
            ],
          },
          {
            id: 'criteria',
            title: 'Fair standards',
            blocks: [
              {
                id: 'criteria-text',
                type: 'text',
                body: "When you do have to divide something, avoid a contest of wills. Agree a fair standard instead: the market price, what similar organisations pay, a published rate, an expert’s valuation, past practice. Fisher and Ury called these **objective criteria**.\n\nA standard lets the other side say yes without feeling they lost. “That’s the going rate” is easier to accept than “because I said so”.",
              },
              {
                id: 'county-scenario',
                type: 'scenario',
                situation:
                  "Wanjiru (fictional) is negotiating with a county transport officer about a no-parking trial at the Westlands stage from 5 to 8 p.m. The officer says: “Traders who park there will complain to the MCA. I can’t risk it.”",
                prompt: 'What should Wanjiru propose?',
                options: [
                  {
                    id: 'press',
                    text: 'Insist that the law is on the SACCO’s side and threaten to go to the press.',
                    outcome: "The officer becomes defensive and refers the matter upwards, where it stalls for months. Wanjiru may be right about the law, but she has turned a potential ally into an opponent.",
                    best: false,
                  },
                  {
                    id: 'trial',
                    text: 'Acknowledge the risk, and propose a four-week trial with an agreed measure (evening waiting times), a meeting with the traders first, and an easy way to end it if complaints are serious.',
                    outcome: "The officer relaxes. A short, measured trial with an exit protects him from blame and gives him evidence to show the MCA. The traders get a loading bay nearby. The trial goes ahead.",
                    best: true,
                  },
                  {
                    id: 'give-up',
                    text: 'Thank the officer and drop the request.',
                    outcome: "The relationship stays friendly, but nothing changes for passengers. The officer’s real interest, avoiding blame, was never explored.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-options',
            title: 'Your options',
            blocks: [
              {
                id: 'options-reflection',
                type: 'reflection',
                prompt: 'List at least four issues in your negotiation besides the main one. Then write two possible packages that trade between issues so both sides gain. Note one objective standard you could use if you have to divide something.',
                guidance: 'Use your interest ranking: what is cheap for you to give and valuable for them? What do you value that costs them little?',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'anchors-and-concessions',
      type: 'lesson',
      title: 'Anchors, offers and concessions',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'anchor-intro',
            title: 'The first number matters',
            blocks: [
              {
                id: 'anchor-text',
                type: 'text',
                body: "Once you have grown the pie, you still need to agree how to share it. Here, one force is surprisingly strong: the **anchor**.\n\nAn anchor is the first number put on the table. Research on negotiation has found that first offers often pull the final agreement towards them, because both sides adjust from that starting point. Watch the two short clips below.",
              },
              {
                id: 'anchor-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'wJxIMUwUe98',
                title: 'Negotiation basics: Using anchoring',
                channel: 'Chicago Booth Review',
                durationS: 72,
                caption: "A one-minute explanation of anchoring from Chicago Booth Review. Notice when making the first offer helps you.",
              },
              {
                id: 'bias-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'JLeyIdWv2Q8',
                title: 'The Anchoring Bias: Why The First Offer Matters',
                channel: 'Sprouts',
                durationS: 241,
                caption: "An animated explainer on the anchoring bias. Watch for how it can work against you, as well as for you.",
              },
            ],
          },
          {
            id: 'first-offer',
            title: 'Should you go first?',
            blocks: [
              {
                id: 'first-offer-choice',
                type: 'choice',
                prompt: 'When is it usually wise to make the first offer?',
                multiple: false,
                options: [
                  { id: 'never', text: 'Never. Always let them go first.', correct: false, feedback: 'Waiting can be wise when you know little, but “never” gives away the power of the anchor.' },
                  { id: 'prepared', text: 'When you have researched the value well and can justify an ambitious number', correct: true, feedback: 'Yes. A well-prepared, justified anchor sets the frame in your favour.' },
                  { id: 'always', text: 'Always, with the most extreme number you can think of', correct: false, feedback: 'An anchor with no justification can insult the other side and end the talk.' },
                  { id: 'random', text: 'It makes no difference', correct: false, feedback: 'Research suggests it often does.' },
                ],
                explanation:
                  "Go first when you know the value well. Make your anchor ambitious but defensible, and give a reason with it. If you know very little, it can be wiser to ask questions and let them speak first, while you guard against their anchor.",
              },
              {
                id: 'counter-anchor-tip',
                type: 'callout',
                tone: 'tip',
                title: 'If they anchor first',
                body: "Don’t let their number become the centre of the conversation. Don’t argue it point by point. Calmly say it is far from what you expected, restate the fair standard you are using, and put your own well-researched number on the table soon.",
              },
            ],
          },
          {
            id: 'concessions',
            title: 'How to concede',
            blocks: [
              {
                id: 'buckets-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Items_for_sale_at_Kariakoo_Market_2012.jpg',
                alt: 'Inside a large market hall, stacks of colourful plastic buckets, basins and baskets fill the floor in front of two staircases, with advertising banners on either side.',
                caption: 'Items for sale at Kariakoo Market in Dar es Salaam, Tanzania. Wholesale buyers here negotiate on quantity, timing and credit, not only price.',
                credit: 'Photo: Development Planning Unit, University College London / Wikimedia Commons, CC BY 2.0',
              },
              {
                id: 'concessions-framework',
                type: 'framework',
                title: 'Concession habits of good negotiators',
                steps: [
                  { label: 'Leave room', detail: 'Start ambitious enough that you have something to give.' },
                  { label: 'Trade, don’t gift', detail: '“If you can do X, I can do Y.” Never give something for nothing.' },
                  { label: 'Shrink your steps', detail: 'Make each concession smaller than the last. It signals you are nearing your limit.' },
                  { label: 'Label it', detail: 'Say what a concession costs you, so it is valued, not just pocketed.' },
                  { label: 'Watch the walk-away', detail: 'Never concede past it under pressure.' },
                ],
              },
            ],
          },
          {
            id: 'concession-order',
            title: 'A concession pattern',
            blocks: [
              {
                id: 'concession-order-block',
                type: 'order',
                prompt: 'Kofi’s target is GH₵4,000 and his walk-away is GH₵3,000. Put his offers in the order a skilled negotiator would make them.',
                items: [
                  { id: 'open', text: 'Opens at GH₵4,200, explaining what similar contracts pay' },
                  { id: 'first', text: '“If you can sign for three months, I can do GH₵3,800.”' },
                  { id: 'second', text: '“If you add portfolio rights, GH₵3,600.”' },
                  { id: 'final', text: '“GH₵3,500 with the engagement bonus is the best I can do.”' },
                ],
                explanation:
                  "Each step is smaller than the last (400, then 200, then 100), and each is traded for something. The shrinking steps tell the other side he is near his limit, without him having to say so. He finishes above his walk-away point.",
              },
            ],
          },
          {
            id: 'anchor-scale',
            title: 'Your comfort with asking',
            blocks: [
              {
                id: 'ask-scale',
                type: 'scale',
                prompt: 'How comfortable are you stating an ambitious first number out loud and then staying quiet?',
                minLabel: 'Very uncomfortable',
                maxLabel: 'Very comfortable',
                afterword:
                  "Silence after an offer is powerful and uncomfortable. Practise saying your number aloud, with its reason, to a friend. Then stop talking. The first person to fill the silence often concedes.",
              },
              {
                id: 'anchor-reflection',
                type: 'reflection',
                prompt: 'Write your opening offer for your negotiation, with the reason you will give for it. Then plan three concessions: what you will give at each step, and what you will ask for in return.',
                guidance: 'Make each step smaller than the last, and keep the final one above your walk-away point. Write the exact words you will say for your opening.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'role-play-discussion',
      type: 'discussion',
      title: 'Role play: Amina and the truck owner',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Pair up with a classmate (in your Saturday session or on a call). One of you plays Amina, the tomato trader; the other plays Musa, the truck owner. Each of you should read only your own brief below, then negotiate for ten minutes.\n\n**Amina’s brief:** You pay ₦40,000 per trip today. You want to pay less, and you want your tomatoes packed in shallow crates. A trader in your Kano market needs sacks of fertiliser taken out to Kura each week.\n\n**Musa’s brief:** Fuel costs have risen and you cannot go below ₦40,000 per trip. You usually drive back from Kano empty. You would like more regular customers.\n\nThen post here:\n\n1. What deal did you reach, if any?\n2. Which interests came out, and when?\n3. Who anchored first, and how did it shape the talk?\n4. What would you do differently?\n\nReply to at least one other pair. Compare your deals: who grew the pie, and how?",
        guidance: 'Stay in role, be realistic, and do not read your partner’s brief. All names and figures are fictional. The goal is to learn, not to win.',
        minWords: 80,
      },
    },
    {
      key: 'value-quiz',
      type: 'quiz',
      title: 'Module quiz: Create and claim value',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on interests, options, anchors and concessions. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-position-interest',
            type: 'choice',
            prompt: 'A landlord says: “Rent must go up by a third.” Which is most likely an interest behind this position?',
            multiple: false,
            options: [
              { id: 'a', text: '“Rent must go up by a third.”', correct: false, feedback: 'That is the position itself.' },
              { id: 'b', text: 'He needs to cover a rise in his own loan repayments', correct: true },
              { id: 'c', text: 'The tenant is unreasonable', correct: false, feedback: 'That is a judgement, not an interest.' },
              { id: 'd', text: 'A one-third increase', correct: false, feedback: 'Still the position.' },
            ],
            explanation: 'Interests answer “why?”. If the landlord needs steady cash for his loan, a longer lease or rent paid in advance might meet that need with a smaller increase.',
          },
          {
            id: 'q-integrative',
            type: 'choice',
            prompt: 'Which of these are ways to grow the pie? Select all that apply.',
            multiple: true,
            options: [
              { id: 'priorities', text: 'Trading things you value differently', correct: true },
              { id: 'timing', text: 'Using differences in timing, such as paying more later', correct: true },
              { id: 'risk', text: 'Sharing risk with a bonus or a trial', correct: true },
              { id: 'split', text: 'Splitting the difference on price', correct: false, feedback: 'Splitting divides the pie; it does not grow it.' },
            ],
            explanation: 'Value hides in differences: priorities, timing, risk, forecasts and extra issues.',
          },
          {
            id: 'q-criteria',
            type: 'match',
            prompt: 'Match each situation to a fair objective standard.',
            pairs: [
              { id: 'rent', left: 'Agreeing rent for a shop', right: 'Rents for similar shops on the same street' },
              { id: 'fee', left: 'Setting a design fee', right: 'What experienced designers charge for similar work' },
              { id: 'car', left: 'Buying a used car', right: 'An independent mechanic’s inspection and recent sale prices' },
              { id: 'salary', left: 'Negotiating a salary', right: 'Published pay ranges for the role and city' },
            ],
            explanation: 'Fair standards let both sides agree without either feeling they gave in to pressure.',
          },
          {
            id: 'q-concessions',
            type: 'order',
            prompt: 'Put these concessions in the order a skilled seller would make them.',
            items: [
              { id: 'c1', text: 'Drops the price by 10%, in return for a larger order' },
              { id: 'c2', text: 'Drops a further 5%, in return for payment upfront' },
              { id: 'c3', text: 'Drops a final 2%, in return for a referral' },
            ],
            explanation: 'Shrinking steps, each traded for something, signal that the seller is nearing their limit.',
          },
          {
            id: 'q-anchor',
            type: 'choice',
            prompt: 'A buyer opens with a very low offer for Fatou’s dresses. What is Fatou’s best response?',
            multiple: false,
            options: [
              { id: 'a', text: 'Argue about the offer line by line', correct: false, feedback: 'This keeps their number at the centre of the conversation.' },
              { id: 'b', text: 'Calmly say it is far from what she expected, explain the standard she uses, and put her own justified number on the table', correct: true },
              { id: 'c', text: 'Meet them halfway immediately', correct: false, feedback: 'Halfway from an extreme anchor is still a poor deal.' },
              { id: 'd', text: 'Accept to avoid conflict', correct: false, feedback: 'That rewards the anchor.' },
            ],
            explanation: 'Don’t let an extreme anchor set the frame. Re-anchor with your own well-reasoned number.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Hard moments and real negotiations
// ---------------------------------------------------------------------------

const moduleHard: Module = {
  key: 'hard-moments',
  title: 'Pressure, culture and the real thing',
  summary:
    'Recognise and calmly answer common pressure tactics, negotiate respectfully across age, status and culture, then plan, carry out and honestly debrief a real negotiation.',
  weekNo: 6,
  items: [
    {
      key: 'pressure-tactics',
      type: 'lesson',
      title: 'Handling pressure and hard bargainers',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'pressure-intro',
            title: 'When the other side plays hard',
            blocks: [
              {
                id: 'pressure-text',
                type: 'text',
                body: "Not everyone you meet will negotiate on principle. Some people use pressure: false deadlines, anger, “take it or leave it”, last-minute demands. These tactics work because they make you react before you think.\n\nThe defence is not to out-bully them. It is to recognise the tactic, slow down, and return to your preparation: your interests, your walk-away point and your BATNA.",
              },
              {
                id: 'pressure-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'MtDZu9JvwVc',
                title: 'Learn How To Counter Hard Bargaining Tactics',
                channel: 'Huthwaite International',
                durationS: 227,
                caption: "A short guide from the training firm Huthwaite International on dealing with hard bargaining. Listen for the role of preparation, conditional proposals and questions.",
              },
            ],
          },
          {
            id: 'balcony',
            title: 'Go to the balcony',
            blocks: [
              {
                id: 'balcony-text',
                type: 'text',
                body: "William Ury describes a simple move for heated moments: **go to the balcony**. Imagine stepping away from the stage onto a balcony where you can watch the negotiation calmly from above.\n\nIn practice, that means pausing before you react: “Let me make sure I understand.” “I need to think about that overnight.” “Can we take ten minutes?” A pause costs you nothing and takes away the tactic’s power.",
              },
              {
                id: 'tactics-match',
                type: 'match',
                prompt: 'Match each pressure tactic to a calm response.',
                pairs: [
                  { id: 'deadline', left: '“This offer expires at 5 p.m. today.”', right: '“If this is a good deal today, it will still be a good deal after I check it. When can we speak tomorrow?”' },
                  { id: 'take-it', left: '“Take it or leave it.”', right: 'Check it against your walk-away point, and if it is below, politely leave it' },
                  { id: 'nibble', left: 'After agreeing, they add: “And of course you’ll include delivery.”', right: '“Happy to discuss delivery. What would you add to the deal in return?”' },
                  { id: 'good-bad', left: 'One person is friendly, the other aggressive', right: 'Name the pattern gently and keep talking about interests with both' },
                  { id: 'anger', left: 'Shouting and banging the table', right: 'Stay calm, let them finish, summarise, and suggest a short break' },
                ],
                explanation:
                  "Notice that none of the responses attack the other person. You are firm on the problem and calm with the people. Once a tactic is named or calmly declined, it usually stops working.",
              },
            ],
          },
          {
            id: 'deadline-scenario-step',
            title: 'The five o’clock deadline',
            blocks: [
              {
                id: 'deadline-scenario',
                type: 'scenario',
                situation:
                  "Tunde is negotiating his job offer with the bank’s HR manager. He asked for a higher salary than offered. She replies: “I’ve pushed as far as I can. If you don’t sign by 5 p.m. today, we’ll offer the role to the next candidate.” It is 3 p.m.",
                prompt: 'What should Tunde do?',
                options: [
                  {
                    id: 'sign',
                    text: 'Sign immediately, before he loses the offer.',
                    outcome: "Tunde has the job, but he never checked whether the offer was above his walk-away point or whether the deadline was real. He wonders for months what he left on the table.",
                    best: false,
                  },
                  {
                    id: 'balcony',
                    text: 'Thank her, ask a question to understand the deadline (“What’s driving the 5 p.m. timing?”), compare the offer calmly with his BATNA, and ask for one other thing that matters to him, such as an earlier salary review.',
                    outcome: "The manager explains that the hiring panel meets tomorrow morning. Tunde confirms the offer is above his walk-away point and asks for a six-month review. She agrees. He signs at 4:30, calm and clear.",
                    best: true,
                  },
                  {
                    id: 'counter-threat',
                    text: 'Say that if she won’t meet his number, he’ll tell everyone the bank underpays.',
                    outcome: "The manager withdraws the offer. A threat has turned a negotiation into a fight he could not win.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'ethics',
            title: 'Firm, not dirty',
            blocks: [
              {
                id: 'ethics-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Your own tactics',
                body: "Some tactics cross ethical lines: lying about facts, inventing other offers, exploiting someone’s desperation, or bribing an official to speed a permit. They may win one deal, but they destroy trust, which is the most valuable thing a builder has, and some are crimes.\n\nYou can keep information private without lying. “I’m not able to share that” is honest. “I have another offer” when you don’t is not.",
              },
              {
                id: 'tactics-poll',
                type: 'poll',
                prompt: 'Which pressure tactic do you find hardest to handle?',
                options: [
                  { id: 'deadline', text: 'Tight deadlines' },
                  { id: 'anger', text: 'Anger or shouting' },
                  { id: 'take-it', text: '“Take it or leave it”' },
                  { id: 'silence', text: 'Long silences' },
                  { id: 'status', text: 'Someone using their age or status' },
                  { id: 'guilt', text: 'Guilt or emotional appeals' },
                ],
                afterword:
                  "Whatever you chose, the same three moves help: pause before you react, name what you see calmly, and return to interests and your walk-away point. Practise your exact words for the one you find hardest.",
              },
            ],
          },
          {
            id: 'your-pressure-plan',
            title: 'Prepare for pressure',
            blocks: [
              {
                id: 'pressure-reflection',
                type: 'reflection',
                prompt: 'Which pressure tactic might the other side use in your negotiation? Write the exact words you will use to respond, and how you will “go to the balcony” if you feel rushed or angry.',
                guidance: 'Write a phrase you can say naturally, such as “Let me make sure I understand,” or “I’d like to sleep on that.” Practise saying it aloud.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'across-differences',
      type: 'lesson',
      title: 'Negotiating across age, status and culture',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'culture-intro',
            title: 'Same words, different meanings',
            blocks: [
              {
                id: 'culture-text',
                type: 'text',
                body: "The person across the table may be older or younger than you, more or less senior, from another ethnic group, another country or another generation. Each difference can change what counts as polite, how directly people say no, and how fast trust is built.\n\nThe researcher Erin Meyer describes one difference that matters a great deal: how much meaning is carried in the words themselves, and how much is left for the listener to read between the lines.",
              },
              {
                id: 'culture-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'r-uUUMxt390',
                title: 'Low Context vs  High Context Societies',
                channel: 'Erin Meyer',
                durationS: 235,
                caption: "Erin Meyer explains low-context and high-context communication. As you watch, think about the people you will negotiate with. Where would they sit, and where do you?",
              },
            ],
          },
          {
            id: 'context-terms',
            title: 'Reading between the lines',
            blocks: [
              {
                id: 'context-terms-block',
                type: 'key_terms',
                terms: [
                  { term: 'Low-context communication', definition: 'Messages are explicit and literal. Good communication means saying exactly what you mean.' },
                  { term: 'High-context communication', definition: 'Much meaning lies in tone, relationship, setting and what is left unsaid. Good communication means reading between the lines.' },
                  { term: 'Face', definition: 'A person’s dignity and standing in front of others. Causing someone to lose face can end a negotiation.' },
                  { term: 'Indirect no', definition: '“We will see,” “Let me consult,” or a long silence may mean no, especially when saying it directly would be rude.' },
                ],
              },
              {
                id: 'stereotype-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Patterns, not boxes',
                body: "Cultural patterns describe tendencies in groups, never rules about individuals. A young Lagos founder and her grandmother in the same family may communicate very differently. Use these ideas to ask better questions, not to predict what any one person will do.",
              },
            ],
          },
          {
            id: 'uwase-elder',
            title: 'Uwase and the elder',
            blocks: [
              {
                id: 'elder-scenario',
                type: 'scenario',
                situation:
                  "Uwase, in her late twenties, must persuade a respected elder who owns land beside the borehole to allow a small fenced area for a new drainage soak-pit. In the first meeting he listens politely, then says: “It is a good idea. We will see.” Two weeks pass with no answer.",
                prompt: 'What should Uwase do next?',
                options: [
                  {
                    id: 'push',
                    text: 'Return and ask him directly for a yes or no by Friday.',
                    outcome: "The elder feels cornered. To protect his standing, he says no. A direct demand has forced the answer she least wanted.",
                    best: false,
                  },
                  {
                    id: 'relationship',
                    text: 'Ask someone he respects, such as the village leader or his son, how he sees the request, and visit again to ask what concerns he has, perhaps about his land or his cattle.',
                    outcome: "Through his son, Uwase learns he fears the fence will block his cattle’s path to water. She returns with a new plan that includes a gate and a trough for his animals. He agrees, and tells others it was partly his idea.",
                    best: true,
                  },
                  {
                    id: 'wait',
                    text: 'Take “we will see” as a yes and start building.',
                    outcome: "The elder is offended that work began without his clear consent. The committee must stop, and Uwase loses trust that will take months to rebuild.",
                    best: false,
                  },
                ],
              },
              {
                id: 'elephants-proverb',
                type: 'quote',
                text: 'When two elephants fight, it is the grass that suffers.',
                attribution: 'African proverb',
              },
            ],
          },
          {
            id: 'respect-choice-step',
            title: 'Respectful moves',
            blocks: [
              {
                id: 'kariakoo-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Kariakoo_market_dar_es_salaam_2.jpg/1280px-Kariakoo_market_dar_es_salaam_2.jpg',
                alt: 'An open market area in front of pink apartment buildings, with vendors seated beside tables of cabbages and tomatoes under colourful umbrellas, and shoppers walking past.',
                caption: 'Kariakoo market in Dar es Salaam, Tanzania. In many markets, relationships built over years matter as much as any single price.',
                credit: 'Photo: Moongateclimber / Wikimedia Commons, public domain',
              },
              {
                id: 'respect-choice',
                type: 'choice',
                prompt: 'You are a young founder negotiating with a much older, senior official. Which moves are likely to help? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'greet', text: 'Greeting properly and using their title', correct: true, feedback: 'Yes. Respect at the start makes firmness later easier to accept.' },
                  { id: 'advice', text: 'Asking for their advice on how the request could work', correct: true, feedback: 'Yes. It invites them to shape the solution, which protects face.' },
                  { id: 'private', text: 'Raising disagreements privately rather than in front of their staff', correct: true, feedback: 'Yes. It lets them change position without losing face.' },
                  { id: 'correct', text: 'Correcting their facts publicly to show you know more', correct: false, feedback: 'Even if you are right, public correction can make them dig in to protect their standing.' },
                ],
                explanation:
                  "Respect and firmness are not opposites. You can honour someone’s age and position while still holding to your interests and your walk-away point. Often, respect is what makes firmness possible.",
              },
            ],
          },
          {
            id: 'your-differences',
            title: 'Your counterpart',
            blocks: [
              {
                id: 'differences-reflection',
                type: 'reflection',
                prompt: 'What differences of age, status, culture or gender lie between you and the other side in your negotiation? How might each affect how they say yes or no, and how will you adjust your approach without giving up your interests?',
                guidance: 'Think about who else might influence the decision, how they may signal “no” indirectly, and how you can protect their face if you disagree.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'hard-quiz',
      type: 'quiz',
      title: 'Module quiz: Pressure, culture and the real thing',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on pressure tactics, ethics and negotiating across differences. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-balcony',
            type: 'choice',
            prompt: 'What does William Ury mean by “go to the balcony”?',
            multiple: false,
            options: [
              { id: 'a', text: 'Leave the negotiation for good', correct: false, feedback: 'It is a pause, not an exit.' },
              { id: 'b', text: 'Step back mentally, pause, and look at the situation calmly before reacting', correct: true },
              { id: 'c', text: 'Speak louder so everyone can hear', correct: false, feedback: 'That escalates rather than calms.' },
              { id: 'd', text: 'Bring in a more senior negotiator', correct: false, feedback: 'Sometimes useful, but that is not what the phrase means.' },
            ],
            explanation: 'A pause takes away the power of pressure tactics and lets you return to your preparation.',
          },
          {
            id: 'q-tactics',
            type: 'match',
            prompt: 'Match each tactic to its name.',
            pairs: [
              { id: 'nibble', left: 'A small extra demand after the deal is agreed', right: 'The nibble' },
              { id: 'deadline', left: '“Sign today or lose the offer”', right: 'A pressure deadline' },
              { id: 'good-bad', left: 'One negotiator friendly, the other harsh', right: 'Good cop, bad cop' },
              { id: 'take-it', left: '“This is my final offer, no discussion”', right: 'Take it or leave it' },
            ],
            explanation: 'Naming a tactic, even just to yourself, is the first step to defusing it.',
          },
          {
            id: 'q-ethics',
            type: 'choice',
            prompt: 'Which of these is honest when you want to keep information private?',
            multiple: false,
            options: [
              { id: 'a', text: '“I have another offer,” when you do not', correct: false, feedback: 'That is a lie, and it can destroy trust if discovered.' },
              { id: 'b', text: '“I’m not able to share that right now.”', correct: true },
              { id: 'c', text: 'Inventing a lower budget than you really have', correct: false, feedback: 'Misrepresenting facts is deception.' },
              { id: 'd', text: 'Claiming a rule exists that does not', correct: false, feedback: 'That is deception too.' },
            ],
            explanation: 'You can keep things private without lying. Trust is a builder’s most valuable asset.',
          },
          {
            id: 'q-indirect',
            type: 'choice',
            prompt: 'In a high-context setting, a partner says, “That will be very difficult.” What might this mean?',
            multiple: false,
            options: [
              { id: 'a', text: 'Yes, with some effort', correct: false, feedback: 'Possibly, but in high-context settings it is often a polite no.' },
              { id: 'b', text: 'It may be a polite no, so explore their concerns gently', correct: true },
              { id: 'c', text: 'They are asking you to push harder', correct: false, feedback: 'Pushing may force a firm, public no.' },
              { id: 'd', text: 'Nothing; ignore it', correct: false, feedback: 'You would miss an important signal.' },
            ],
            explanation: 'Listen for indirect signals, and respond by exploring concerns, often privately or through trusted people.',
          },
          {
            id: 'q-respect',
            type: 'choice',
            prompt: 'Which statements about respect and firmness are true? Select all that apply.',
            multiple: true,
            options: [
              { id: 'both', text: 'You can be respectful to a person and firm on your interests at the same time', correct: true },
              { id: 'face', text: 'Protecting the other side’s face can make it easier for them to agree', correct: true },
              { id: 'pattern', text: 'Cultural patterns are tendencies, not rules about individuals', correct: true },
              { id: 'give', text: 'Respecting elders means accepting whatever they offer', correct: false, feedback: 'Respect shapes how you negotiate, not whether you hold to your interests.' },
            ],
            explanation: 'Soft on the people, firm on the problem, across every kind of difference.',
          },
        ],
      },
    },
    {
      key: 'negotiation-plan-debrief',
      type: 'assignment',
      title: 'Practical Output: your Negotiation Plan and Debrief',
      minutes: 50,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: a **Negotiation Plan and Debrief** for a real negotiation in your life or venture.\n\nIn part one, the **plan**, you prepare as a skilled negotiator would: your goals and interests, your target, walk-away point and BATNA, the other side’s likely interests and alternatives, options that could grow the pie, your opening and concessions, the pressure you expect, and how you will handle differences between you.\n\nIn part two, the **debrief**, you carry out the negotiation and report honestly on what happened: the outcome, what worked, what did not, and what you learnt. A negotiation that ends without a deal can still earn full marks if your plan was sound and your debrief is honest and insightful.\n\nChoose a negotiation that is real but safe. Do not put yourself or anyone else at risk, and do not share private details of the other person without their consent; use a first name or a role instead. A faculty reviewer will grade your submission against the rubric below.",
        practicalOutput: 'Negotiation Plan and Debrief',
        steps: [
          'Confirm the real negotiation you chose at the start of the week. If it fell through, choose another that can happen within ten days.',
          'Gather your journal entries: numbers, interests, options, opening and concessions, pressure plan and differences.',
          'Write part one, the plan, using the template below. Finish it before the negotiation.',
          'If you can, practise your opening and your hardest moment with a classmate or friend.',
          'Carry out the negotiation. Take brief notes straight afterwards while you remember the details.',
          'Write part two, the debrief, honestly: what happened, what worked, what did not, and why.',
          'Note what you will do differently next time, and one habit you will keep.',
          'Submit both parts together.',
        ],
        rubric: [
          {
            id: 'preparation',
            criterion: 'Preparation and numbers',
            description: 'Sets a researched target, a walk-away point clearly based on a real BATNA, and describes steps taken to strengthen the BATNA.',
          },
          {
            id: 'interests',
            criterion: 'Interests on both sides',
            description: 'Identifies positions and the interests behind them on both sides, including fears, and plans open questions to test assumptions.',
          },
          {
            id: 'options',
            criterion: 'Options and fair standards',
            description: 'Proposes at least two packages that trade across issues to grow the pie, and names an objective standard for dividing value.',
          },
          {
            id: 'tactics',
            criterion: 'Offers, concessions and pressure',
            description: 'Plans a justified opening, a concession pattern that trades rather than gifts and stays above the walk-away point, and calm responses to likely pressure tactics.',
          },
          {
            id: 'respect',
            criterion: 'Relationship and differences',
            description: 'Shows awareness of differences of age, status, culture or gender, and plans to protect the relationship and the other side’s face while staying firm on interests. No unethical tactics.',
          },
          {
            id: 'debrief',
            criterion: 'Honest debrief',
            description: 'Describes what actually happened, compares it with the plan, and draws specific, honest lessons, including mistakes, for next time.',
          },
        ],
        template:
          "NEGOTIATION PLAN AND DEBRIEF\n\nPART ONE: THE PLAN\n\n1. The negotiation\nWho it is with (first name or role), what it is about, when and where.\n\n2. My goals and interests\nWhat I want and why, ranked from most to least important.\n\n3. My numbers\nTarget:\nWalk-away point:\nBATNA, and what I did to strengthen it:\n\n4. The other side\nTheir likely position, interests (including fears) and BATNA.\nThe open questions I will ask.\n\n5. Options and standards\nAt least two packages that trade across issues.\nThe objective standard I will use.\n\n6. Opening and concessions\nMy opening offer and the reason I will give.\nMy planned concessions, and what I will ask for in return.\n\n7. Pressure and differences\nTactics I expect, and the words I will use.\nDifferences between us, and how I will adjust.\n\nPART TWO: THE DEBRIEF\n\n8. What happened\nThe outcome, and the key moments.\n\n9. What worked and what did not\nCompared with my plan.\n\n10. What I learnt\nOne thing I will do differently, and one habit I will keep.",
        minWords: 300,
      },
    },
    {
      key: 'final-quiz',
      type: 'quiz',
      title: 'Final course quiz',
      minutes: 15,
      required: true,
      gradeWeight: 30,
      payload: {
        intro:
          "Nine questions across the whole course: preparation, interests, options, anchors and concessions, pressure and differences. Most follow a new case.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-batna',
            type: 'choice',
            prompt: 'New case: Nomsa (fictional) runs a small catering business in Durban. A conference centre wants her to cater a three-day event. If she says no, she will cater two weddings she has been offered for the same weekend. What is her BATNA?',
            multiple: false,
            options: [
              { id: 'a', text: 'The price she hopes the conference centre will pay', correct: false, feedback: 'That is her target.' },
              { id: 'b', text: 'Catering the two weddings', correct: true },
              { id: 'c', text: 'Getting the conference centre to agree', correct: false, feedback: 'That is the negotiation itself, not the alternative to it.' },
              { id: 'd', text: 'Taking the weekend off', correct: false, feedback: 'Possible, but she has a better alternative available.' },
            ],
            explanation: 'Her BATNA is the best real alternative: the two weddings. Her walk-away point for the conference comes from what those weddings would earn her.',
          },
          {
            id: 'f-walkaway',
            type: 'choice',
            prompt: 'The weddings would earn Nomsa R30,000 in profit for the weekend. Ignoring other factors, what should her walk-away point for the conference be?',
            multiple: false,
            options: [
              { id: 'a', text: 'Any profit above zero', correct: false, feedback: 'Then she would be worse off than with the weddings.' },
              { id: 'b', text: 'About R30,000 profit, adjusted for anything else she values, such as future conference work', correct: true },
              { id: 'c', text: 'Whatever the conference centre offers first', correct: false, feedback: 'That hands control to their anchor.' },
              { id: 'd', text: 'Double the wedding profit', correct: false, feedback: 'That may be a good target, but it is not her walk-away point.' },
            ],
            explanation: 'Your walk-away point comes from your BATNA. Other interests, such as a long-term client, can shift it, but only by your own deliberate choice. (All figures are fictional.)',
          },
          {
            id: 'f-interests',
            type: 'match',
            prompt: 'Match each of the conference centre’s positions to a likely interest.',
            pairs: [
              { id: 'price', left: '“We can only pay R250 per head.”', right: 'Their client has a fixed budget' },
              { id: 'menu', left: '“The menu must be approved two weeks ahead.”', right: 'They need to check it meets guests’ dietary needs' },
              { id: 'staff', left: '“Your staff must wear our uniforms.”', right: 'They want the event to look like one seamless service' },
              { id: 'insurance', left: '“You must have insurance.”', right: 'They fear being blamed if something goes wrong' },
            ],
            explanation: 'Each position hides a need. Once Nomsa sees them, she can find options, such as a simpler menu that meets the budget.',
          },
          {
            id: 'f-grow',
            type: 'choice',
            prompt: 'Which proposal from Nomsa grows the pie?',
            multiple: false,
            options: [
              { id: 'a', text: '“Let’s meet halfway on the price per head.”', correct: false, feedback: 'That divides the pie.' },
              { id: 'b', text: '“I can meet R250 per head with a two-course lunch instead of three, if you sign me for your next two conferences too.”', correct: true },
              { id: 'c', text: '“R350 per head or I walk.”', correct: false, feedback: 'A position, not an option.' },
              { id: 'd', text: '“Fine, R250.”', correct: false, feedback: 'A concession with nothing in return.' },
            ],
            explanation: 'Adjust scope to fit their budget, and add an issue (future work) that is valuable to her and costs them little.',
          },
          {
            id: 'f-anchor',
            type: 'choice',
            prompt: 'Nomsa has researched rates well. Should she make the first offer?',
            multiple: false,
            options: [
              { id: 'a', text: 'Yes, with an ambitious, justified number', correct: true },
              { id: 'b', text: 'No, never go first', correct: false, feedback: 'When you know the value well, going first lets you set the frame.' },
              { id: 'c', text: 'Yes, with an extreme number and no reason', correct: false, feedback: 'An unjustified anchor can end the talk.' },
              { id: 'd', text: 'It does not matter', correct: false, feedback: 'First offers often pull the final deal towards them.' },
            ],
            explanation: 'A well-researched, justified first offer anchors the talk in her favour.',
          },
          {
            id: 'f-concessions',
            type: 'order',
            prompt: 'Put Nomsa’s concessions in the order a skilled negotiator would make them.',
            items: [
              { id: 'c1', text: 'Drops R40 per head in return for a 50% deposit' },
              { id: 'c2', text: 'Drops R20 per head in return for a simpler dessert' },
              { id: 'c3', text: 'Drops R10 per head in return for a testimonial for her website' },
            ],
            explanation: 'Each step is smaller than the last and traded for something.',
          },
          {
            id: 'f-pressure',
            type: 'choice',
            prompt: 'The events manager says: “Another caterer will do it for less. Decide in the next hour.” What should Nomsa do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Drop her price immediately', correct: false, feedback: 'She would be reacting to pressure, not deciding.' },
              { id: 'b', text: 'Pause, ask what the other caterer is offering for that price, compare the current offer with her BATNA, and decide calmly', correct: true },
              { id: 'c', text: 'Accuse the manager of lying', correct: false, feedback: 'Even if it is a bluff, accusation damages the relationship.' },
              { id: 'd', text: 'Hang up without a word', correct: false, feedback: 'She learns nothing and may lose a good deal.' },
            ],
            explanation: 'Go to the balcony, ask questions, and check against your BATNA. Her two weddings mean she does not need to accept a bad deal.',
          },
          {
            id: 'f-ethics',
            type: 'choice',
            prompt: 'Which of these are ethical ways for Nomsa to strengthen her position? Select all that apply.',
            multiple: true,
            options: [
              { id: 'real', text: 'Confirming the wedding bookings in writing', correct: true },
              { id: 'standard', text: 'Bringing published catering rates from the area', correct: true },
              { id: 'private', text: 'Saying “I’d rather not share my costs”', correct: true },
              { id: 'fake', text: 'Claiming a third wedding offer she does not have', correct: false, feedback: 'That is a lie, and lies discovered destroy trust.' },
            ],
            explanation: 'Strengthen your real alternatives and use fair standards. Keep things private if you wish, but don’t invent facts.',
          },
          {
            id: 'f-debrief',
            type: 'order',
            prompt: 'Put the full negotiation cycle in order.',
            items: [
              { id: 'prepare', text: 'Prepare: interests, BATNA, walk-away and target' },
              { id: 'explore', text: 'Explore interests with open questions' },
              { id: 'create', text: 'Create options that grow the pie' },
              { id: 'claim', text: 'Claim value with a justified anchor and traded concessions' },
              { id: 'debrief', text: 'Debrief honestly and learn' },
            ],
            explanation: 'Prepare, explore, create, claim, debrief. The debrief is what turns one negotiation into a skill you keep.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const negotiation: CourseAuthoring = {
  slug: 'negotiation',
  title: 'Negotiation',
  subtitle: 'Prepare well, understand the other side and reach agreements that last.',
  description:
    "You negotiate more than you think: with suppliers and customers, landlords and employers, partners, family and officials. Most people do it without a plan, and either give too much away or damage the relationship trying not to.\n\nIn this course you will learn to prepare for a negotiation properly: knowing your goals, your walk-away point and your alternatives; understanding the other side’s interests, not just their position; and creating options that make both sides better off. You will practise anchoring, making and asking for concessions, handling pressure tactics and hard bargainers, and negotiating respectfully across differences of age, status and culture, from market haggling to contract talks.\n\nRole plays with classmates, drawn from realistic African business and community situations, let you practise safely before it counts.\n\nYour Practical Output is a **Negotiation Plan and Debrief**: a written plan for a real negotiation in your life or venture, followed by an honest debrief of what happened and what you learnt.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 4,
  outcomes: [
    'Prepare for any negotiation with clear goals, a walk-away point and strong alternatives.',
    'Uncover the interests behind positions and create options that benefit both sides.',
    'Use and respond to anchors, concessions and common pressure tactics.',
    'Negotiate respectfully across differences of age, status and culture.',
    'Plan, conduct and honestly debrief a real negotiation.',
  ],
  skills: ['Negotiation planning', 'Interest-based bargaining', 'Persuasion', 'Conflict resolution', 'Deal structuring', 'Relationship management'],
  audience: 'Founders, freelancers, employees and community leaders who want to get fairer deals without damaging relationships.',
  prerequisites: 'Communication recommended.',
  practicalOutput: 'Negotiation Plan and Debrief',
  cover: {
    from: '#2A1A3D',
    to: '#7B5EA7',
    symbol: '◐',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Makola_Market_Entrance%2C_Accra%2C_Ghana.JPG/1280px-Makola_Market_Entrance%2C_Accra%2C_Ghana.JPG',
    imageAlt: 'Traders and shoppers crowd the street in front of a yellow building with a large sign reading Welcome to Makola Market.',
    imageCredit: 'Photo: Benggriff / Wikimedia Commons, CC BY-SA 3.0',
  },
  trailer: {
    provider: 'youtube',
    videoId: '4HzZXoOPObg',
    title: 'What the Best Negotiators Do Differently',
    channel: 'Harvard Business Review',
    durationS: 69,
  },
  instructors: [
    {
      name: 'The African Dream Lab Faculty',
      title: 'Builder’s Architecture faculty',
      bio: 'The Builder’s Architecture faculty of The African Dream Lab brings together founders, communicators, negotiators and practitioners from across the continent. They teach the skills to build with and through other people. The Lab is run by the African Dream Network and grew out of the TADIS conference.',
    },
  ],
  modules: [modulePrepare, moduleValue, moduleHard],
};

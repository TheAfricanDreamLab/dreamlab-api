import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Problem Solving: the flagship Life Architecture course of The African Dream Lab (week 1, 5 credits).
 *
 * Spine: Define → Diagnose → Generate → Decide → Do. Recurring cast, all fictional:
 *   Amina   a tomato trader in Kano losing stock to spoilage
 *   Kwame   a university student in Kumasi, volunteering at a junior high school with falling attendance
 *   Wanjiru operations lead at a Nairobi matatu SACCO
 *   Tunde   product manager at a Lagos fintech whose savings app rollout failed
 *   Fatou   founder of a small fashion label in Dakar
 *   Uwase   secretary of a village borehole committee in Rwanda’s Eastern Province
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Define: what a problem really is
// ---------------------------------------------------------------------------

const moduleDefine: Module = {
  key: 'define',
  title: 'Define: what a problem really is',
  summary:
    'Learn to tell a problem from a symptom and from a solution in disguise, and write a problem statement sharp enough to act on. Most failed projects solved the wrong problem well. This module is how you avoid that.',
  weekNo: 1,
  items: [
    {
      key: 'why-problem-solving',
      type: 'lesson',
      title: 'Why problem solving comes first',
      minutes: 24,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to the Lab',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to Problem Solving, the first course of The African Dream Lab.\n\nEverything you build in the next fifteen weeks starts here. A venture, a community project, a campaign, a career move: each one is a response to a problem. If you see the problem clearly, the rest of the work gets easier. If you see it wrongly, even brilliant effort is wasted.\n\nThis course is short, practical and built around your own life. By the end you will have a **Problem Definition Canvas**: one page that explains a real problem you care about, its causes, your options and the experiment you will run next.\n\nStart with the talk below. It is about why your generation, and the problems you choose to take on, matter.",
              },
              {
                id: 'welcome-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'kcEIsbO0ivA',
                title: "Fred Swaniker: The leaders who ruined Africa, and the generation who can fix it",
                channel: "TED",
                durationS: 811,
                caption: "Fred Swaniker, founder of the African Leadership Academy, on the leaders who held the continent back and the generation who can move it forward. Watch for why he thinks leadership matters most where institutions are weak. As you watch, ask yourself: which problems around me are waiting for someone to lead?",
              },
            ],
          },
          {
            id: 'confidence',
            title: "Where you are starting from",
            blocks: [
              {
                id: 'confidence-scale',
                type: 'scale',
                prompt: 'Be honest. How confident are you today at solving messy, real-world problems, the kind with no answer at the back of the book?',
                minLabel: 'I often feel stuck',
                maxLabel: 'Very confident',
                afterword:
                  "Wherever you are is fine. Problem solving is not a talent you either have or lack. It is a set of habits you can practise. You will rate yourself again at the end of the course.",
              },
            ],
          },
          {
            id: 'meet-amina',
            title: 'Meet Amina',
            blocks: [
              {
                id: 'amina-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Tomatoes_on_sale_at_the_Monday_Market_in_Kakuri%2C_Kaduna_06.jpg/1280px-Tomatoes_on_sale_at_the_Monday_Market_in_Kakuri%2C_Kaduna_06.jpg",
                alt: "Tomatoes laid out in small heaps on sacking on the ground, with more piled high in plastic buckets in the foreground.",
                caption: "Tomatoes on sale at the Monday Market in Kakuri, Kaduna, Nigeria. Amina is a fictional trader; markets like this are real.",
                credit: "Photo: Kambai Akau / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'amina-story',
                type: 'callout',
                tone: 'story',
                title: 'Amina, tomato trader, Kano',
                body: "Amina sells tomatoes at a large vegetable market in Kano. She buys from farmers’ trucks early in the morning and sells through the day to households, food sellers and restaurant buyers.\n\nIn the hot season she throws away a painful share of her stock. Tomatoes split, soften and rot before she can sell them. By her own rough count, on a bad week she loses about three baskets in every ten.\n\nHer cousin tells her: “You need a cold room. Everybody knows that.” A cold room would cost more than Amina earns in a year.",
              },
              {
                id: 'amina-reveal',
                type: 'reveal',
                prompt: 'Before you read on: is “Amina needs a cold room” a description of her problem? Think about it, then tap.',
                body: "No. “Amina needs a cold room” is a **solution**. It may even be a good one. But it skips the question of *why* her tomatoes spoil and *what* she is really trying to achieve.\n\nAmina’s problem is closer to this: she is losing a large part of her stock before she can sell it, and that loss eats her profit. Once you say it that way, many more answers appear. You will follow Amina through this course and watch those answers appear.",
              },
            ],
          },
          {
            id: 'spine',
            title: 'The five moves',
            blocks: [
              {
                id: 'spine-framework',
                type: 'framework',
                title: 'The Dream Lab problem-solving spine',
                steps: [
                  { label: 'Define', detail: 'Say clearly what the problem is, for whom, and how big it is, without hiding a solution inside it.' },
                  { label: 'Diagnose', detail: 'Gather evidence and dig beneath the symptoms to the causes you can actually influence.' },
                  { label: 'Generate', detail: 'Go wide. Produce many possible responses before you fall in love with one.' },
                  { label: 'Decide', detail: 'Choose with clear criteria, honest trade-offs and an eye on what can be undone.' },
                  { label: 'Do', detail: 'Run the smallest useful experiment, learn from it and loop back.' },
                ],
              },
              {
                id: 'spine-choice',
                type: 'choice',
                prompt: 'Amina is thinking of borrowing money to build a cold room this month. Which moves is she skipping?',
                multiple: true,
                options: [
                  { id: 'define', text: 'Define', correct: true, feedback: 'Yes. She has not yet said exactly what she is trying to fix, or how big the loss really is.' },
                  { id: 'diagnose', text: 'Diagnose', correct: true, feedback: 'Yes. She does not yet know why the tomatoes spoil. Heat? Rough handling? Unsold stock sitting too long?' },
                  { id: 'generate', text: 'Generate', correct: true, feedback: 'Yes. A cold room is one idea. She has not looked for others.' },
                  { id: 'do', text: 'Do', correct: false, feedback: 'Building a cold room is the “Do” step. That is the one she is rushing towards, not skipping.' },
                ],
                explanation:
                  "Amina is jumping straight from a feeling to a big, expensive action. That is the most common pattern in failed projects everywhere, from market stalls to multinationals. The spine slows you down at the start so that you can move fast and safely later.",
              },
            ],
          },
          {
            id: 'what-is-a-problem',
            title: 'A problem is a gap',
            blocks: [
              {
                id: 'gap-text',
                type: 'text',
                body: "Here is the working definition we will use all course:\n\n**A problem is a gap between how things are and how they should be, that matters to someone.**\n\nThree parts. A *current state* (Amina loses about three baskets in ten). A *desired state* (she loses very little). And *someone it matters to* (Amina, her family, the farmers she buys from, the customers who pay more when supply is wasted).\n\nIf you cannot describe all three, you do not have a problem yet. You have a complaint, a worry or an idea.",
              },
              {
                id: 'gap-choice',
                type: 'choice',
                prompt: 'Which of these is a problem in the sense we just defined?',
                multiple: false,
                options: [
                  { id: 'complaint', text: '“Kumasi is too hot.”', correct: false, feedback: 'This is a complaint. There is no clear desired state, and nobody can act on “too hot” as stated.' },
                  { id: 'idea', text: '“Our school should get tablets.”', correct: false, feedback: 'This is an idea, a solution looking for a problem. What gap would tablets close?' },
                  {
                    id: 'gap',
                    text: '“About a third of JHS 2 pupils at our school miss class on Thursdays, and they are falling behind in maths.”',
                    correct: true,
                    feedback: 'Yes. There is a current state, an implied desired state (pupils attend and keep up) and people it matters to.',
                  },
                  { id: 'worry', text: '“I am worried about young people’s future.”', correct: false, feedback: 'A real and important worry, but too wide to act on. Which young people? Which part of their future?' },
                ],
                explanation:
                  "Complaints, ideas and worries are useful starting points. They point at something. The work of the **Define** move is to turn them into a gap you can see, measure and close.",
              },
            ],
          },
          {
            id: 'your-world',
            title: 'Your starting point',
            blocks: [
              {
                id: 'domain-poll',
                type: 'poll',
                prompt: 'Which of these is closest to the problem you most want to work on during the Lab?',
                options: [
                  { id: 'venture', text: 'A problem my business or venture idea could solve' },
                  { id: 'community', text: 'A problem in my community or neighbourhood' },
                  { id: 'education', text: 'A problem in a school, university or training space' },
                  { id: 'work', text: 'A problem at my workplace or in an organisation I belong to' },
                  { id: 'public', text: 'A public service or policy problem' },
                  { id: 'personal', text: 'A personal or family problem I want to solve properly' },
                ],
                afterword:
                  "Every one of these is valid. The tools in this course work the same way on a market stall, a ministry or a family budget. What matters is that you pick something real, that you care about, and that you can reach the people involved.",
              },
            ],
          },
          {
            id: 'name-it',
            title: 'Name your problem',
            blocks: [
              {
                id: 'name-it-text',
                type: 'text',
                body: "Throughout this course you will work on one real problem. Each lesson adds a piece, and the pieces become your Problem Definition Canvas.\n\nDo not worry about getting it perfect now. You will sharpen it many times. Pick something:\n\n- you care about enough to work on for two weeks;\n- that affects real people you can talk to;\n- small enough that you could make progress, big enough to matter.",
              },
              {
                id: 'name-it-reflection',
                type: 'reflection',
                prompt: 'In a few sentences, describe a real problem in your community, venture or organisation that you would like to work on. Who does it affect, and what do you see happening?',
                guidance: 'Write it the way you would explain it to a friend. Messy is fine. This goes into your journal and you will come back to it.',
                minWords: 30,
              },
            ],
          },
          {
            id: 'wrap',
            title: 'Key idea',
            blocks: [
              {
                id: 'wrap-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Slow at the start, fast at the end',
                body: "Good problem solvers spend more time than you expect on understanding the problem, and less time than you expect fixing it. The understanding is what makes the fix small, cheap and right.",
              },
              {
                id: 'wrap-proverb',
                type: 'quote',
                text: 'However long the night, the dawn will break.',
                attribution: 'African proverb',
              },
            ],
          },
        ],
      },
    },
    {
      key: 'problem-symptom-solution',
      type: 'lesson',
      title: 'Problem, symptom or solution in disguise?',
      minutes: 17,
      required: true,
      payload: {
        steps: [
          {
            id: 'three-things',
            title: 'Three things people call “the problem”',
            blocks: [
              {
                id: 'three-things-text',
                type: 'text',
                body: "When people say “the problem is…”, they usually mean one of three different things. Learning to tell them apart is the single most useful habit in this course.",
              },
              {
                id: 'tomato-video',
                type: 'video',
                provider: 'youtube',
                videoId: '_oM_MZ1hTGc',
                title: "Reducing Postharvest Loss in Nigeria - Tomatoes",
                channel: "Global Alliance for Improved Nutrition (GAIN)",
                durationS: 328,
                caption: "A short film from Nigeria on tomatoes lost between the farm and the market. As you watch, sort what you see into three piles: the visible signs (spoilt tomatoes), the problem (lost food and income) and what might be causing it. Amina is fictional. This problem is real.",
              },
              {
                id: 'three-things-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Symptom', definition: 'What you can see or feel on the surface. Rotting tomatoes. Empty classroom seats. Angry passengers. Real, but not the whole story.' },
                  { term: 'Problem', definition: 'The gap that matters: between how things are and how they should be, for someone. Amina losing a large share of stock and profit.' },
                  { term: 'Root cause', definition: 'A deeper reason the gap exists that, if changed, would shrink the problem. Tomatoes packed in deep baskets crush each other in the heat.' },
                  {
                    term: 'Solution in disguise',
                    definition: 'An answer dressed up as a problem. “We need a cold room.” “The problem is we don’t have an app.” It closes your mind before you have understood anything.',
                  },
                ],
              },
            ],
          },
          {
            id: 'sort-amina',
            title: 'Sort what Amina hears',
            blocks: [
              {
                id: 'baskets-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Baskets_of_freshly_harvested_tomatoes_at_Pambeguwa_perishable_market_05.jpg/1280px-Baskets_of_freshly_harvested_tomatoes_at_Pambeguwa_perishable_market_05.jpg",
                alt: "Rows of tall woven baskets heaped with tomatoes and topped with leaves at an open-air market, with traders, motorcycles and a minibus behind them.",
                caption: "Baskets of freshly harvested tomatoes at Pambeguwa market in northern Nigeria. Look at how deep they are, then read what the older trader says below.",
                credit: "Photo: Friday musa / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'sort-example',
                type: 'example',
                title: 'Voices at the market',
                body: "Over one morning Amina hears four things from people around her stall:\n\n- Her cousin: “You need a cold room.”\n- A customer: “Your tomatoes are soft by midday.”\n- Amina herself: “I lose too much stock to make a decent profit in the hot season.”\n- An older trader: “It’s those deep baskets. The bottom layer gets crushed and cooks in the sun.”",
              },
              {
                id: 'sort-match',
                type: 'match',
                prompt: 'Match each statement to what it really is.',
                pairs: [
                  { id: 'cold-room', left: '“You need a cold room.”', right: 'Solution in disguise' },
                  { id: 'soft', left: '“Your tomatoes are soft by midday.”', right: 'Symptom' },
                  { id: 'lose-stock', left: '“I lose too much stock to make a decent profit.”', right: 'Problem' },
                  { id: 'baskets', left: '“The deep baskets crush the bottom layer in the sun.”', right: 'Possible root cause' },
                ],
                explanation:
                  "Notice that the most useful statement for Amina’s next step is the older trader’s. It points at a cause she can test cheaply. Also notice it is only a *possible* root cause until she checks it. In the next module you will learn how.",
              },
            ],
          },
          {
            id: 'app-disguise',
            title: 'Spot the disguise',
            blocks: [
              {
                id: 'app-choice',
                type: 'choice',
                prompt: 'The head teacher at Kwame’s partner school in Kumasi says: “Our problem is that we don’t have a school app to send parents attendance alerts.” What is this?',
                multiple: false,
                options: [
                  { id: 'problem', text: 'A clear problem statement', correct: false, feedback: 'It sounds like one, but look again: it names a specific product. The real gap is pupils missing school, and an app is one way to respond to it.' },
                  { id: 'symptom', text: 'A symptom', correct: false, feedback: 'The symptom would be what is visible, such as empty seats on Thursdays. This statement describes a missing tool, not something observed.' },
                  { id: 'solution', text: 'A solution in disguise', correct: true, feedback: 'Exactly. “We don’t have X” is almost always a solution wearing a problem’s clothes.' },
                  { id: 'root', text: 'A root cause', correct: false, feedback: 'Pupils were missing school long before apps existed. A missing app cannot be the reason they stay away.' },
                ],
                explanation:
                  "A useful test: **if the statement names a product, tool, building or programme, it is probably a solution in disguise.** Ask: “If we had that, what would be different?” The answer to that question is closer to the real problem. Here: parents would know sooner when children are absent. Is that the gap? Maybe. Maybe parents already know, and something else keeps children home.",
              },
            ],
          },
          {
            id: 'why-dangerous',
            title: 'Why disguises are dangerous',
            blocks: [
              {
                id: 'danger-reveal',
                type: 'reveal',
                prompt: 'Why might starting from a solution in disguise be risky, even if the solution turns out to be good? Think of two reasons before you tap.',
                body: "**It hides all the other options.** If the problem is “we need a cold room”, the only question left is how to get one.\n\n**It turns you into a defender instead of a learner.** You start collecting evidence that you were right, rather than finding out what is true.\n\n**It wastes scarce money.** In many communities, money for projects comes once. Spending it on the wrong fix can mean there is nothing left for the right one.\n\n**It ignores the people affected.** A solution chosen before you listen is a solution chosen *for* people, not *with* them.",
              },
              {
                id: 'donor-context',
                type: 'callout',
                tone: 'context',
                title: 'When funding comes with a solution attached',
                body: "Across the continent, many projects start because funding is available for a particular solution: solar panels, tablets, a new building, an app. The funding is welcome, but notice the risk. If the money defines the solution, the community’s real problem can get lost. A strong problem statement is how you keep the conversation honest, even with funders.",
              },
            ],
          },
          {
            id: 'tunde-scenario',
            title: 'Tunde’s rollout',
            blocks: [
              {
                id: 'tunde-scenario-block',
                type: 'scenario',
                situation:
                  "Tunde is a product manager at a fintech in Lagos. Six weeks ago the company launched a savings app for market traders. Sign-ups were good, but almost nobody is saving through it.\n\nIn the Monday meeting the CEO says: “The onboarding is too long. That’s the problem. Tunde, rebuild onboarding this sprint.”",
                prompt: 'What should Tunde do first?',
                options: [
                  {
                    id: 'rebuild',
                    text: 'Start rebuilding onboarding immediately. The CEO knows the product.',
                    outcome: "Two weeks later onboarding is shorter. Sign-ups rise a little. Savings stay flat. The team has spent a sprint fixing something that was not stopping traders from saving. Morale drops.",
                    best: false,
                  },
                  {
                    id: 'survey',
                    text: 'Send an in-app survey asking traders whether onboarding is too long.',
                    outcome: "Most traders who answer say “yes, a bit long”. But the survey only asked about onboarding, so that is all it could tell Tunde. He still does not know why people who finished onboarding are not saving.",
                    best: false,
                  },
                  {
                    id: 'reframe',
                    text: 'Ask the team: “What gap are we trying to close?” Then spend two days at a market watching traders use the app and asking about their last week of saving.',
                    outcome: "At the market Tunde learns that most traders already save daily with an informal collector who comes to their stall. The app asks them to walk to an agent to deposit cash. The real gap is not onboarding. It is that saving through the app is harder than the habit they already have. The team now works on the right problem.",
                    best: true,
                  },
                  {
                    id: 'refuse',
                    text: 'Tell the CEO, in front of the team, that he is wrong.',
                    outcome: "The CEO gets defensive and the meeting becomes about who is right, not what is true. Tunde may be correct, but he has made it harder to find out.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'spot-many',
            title: 'Spot them all',
            blocks: [
              {
                id: 'spot-choice',
                type: 'choice',
                prompt: 'Which of these are solutions in disguise? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'borehole', text: '“The village needs a new borehole pump.”', correct: true, feedback: 'Yes. It names a thing to buy. Why does the current one keep failing?' },
                  { id: 'matatu', text: '“Evening commuters at our stage wait over 40 minutes for a matatu.”', correct: false, feedback: 'This is a real, observable gap. No solution is hidden inside it.' },
                  { id: 'training', text: '“Our staff need more training.”', correct: true, feedback: 'Yes. Training is a solution. What are staff doing, or not doing, that causes harm?' },
                  { id: 'marketing', text: '“The problem is we haven’t done enough marketing.”', correct: true, feedback: 'Yes. “Not enough X” is the classic disguise. Maybe people know about you and still don’t buy.' },
                  { id: 'dakar', text: '“Half of Fatou’s online orders are returned because the sizes don’t fit.”', correct: false, feedback: 'This is a clear, measurable problem with no fix built in.' },
                ],
                explanation:
                  "Watch for the phrases **“we need…”**, **“we don’t have…”**, **“not enough…”** and **“the problem is lack of…”**. They feel like problems but they are answers. Translate each one by asking: “What would be different if we had it?”",
              },
            ],
          },
          {
            id: 'check-yours',
            title: 'Check your own',
            blocks: [
              {
                id: 'check-yours-reflection',
                type: 'reflection',
                prompt: 'Look back at the problem you named in the last lesson. Is it a problem, a symptom or a solution in disguise? Rewrite it as a gap: how things are now, how they should be, and who it matters to.',
                guidance: 'If your first version named a product, programme or building, ask “what would be different if we had it?” and write that instead.',
                minWords: 30,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'problem-statements',
      type: 'lesson',
      title: 'Writing a sharp problem statement',
      minutes: 19,
      required: true,
      payload: {
        steps: [
          {
            id: 'anatomy',
            title: 'Anatomy of a problem statement',
            blocks: [
              {
                id: 'anatomy-text',
                type: 'text',
                body: "A problem statement is one to three sentences that anyone could read and understand what is wrong, for whom, and why it matters. It is the first box on your canvas, and everything else hangs from it.\n\nA good statement has five parts.",
              },
              {
                id: 'statement-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'w7l8qEj1JX0',
                title: "How to define a problem statement in design thinking | Design thinking process",
                channel: "Canva",
                durationS: 339,
                caption: "A short guide to defining a problem statement, from a design-thinking point of view. Compare its advice with the five parts below: who, what gap, where and when, how much, and why it matters.",
              },
              {
                id: 'anatomy-framework',
                type: 'framework',
                title: 'The five parts',
                steps: [
                  { label: 'Who', detail: 'The specific people affected. Not “youth” but “first-year students at two Kumasi universities who rent rooms off campus”.' },
                  { label: 'What gap', detail: 'What is happening now compared with what should be happening.' },
                  { label: 'Where and when', detail: 'The place and moments the problem shows up. Hot season? Mondays? After 6 p.m.?' },
                  { label: 'How much', detail: 'Size it, even roughly. How many people, how often, how much money or time lost.' },
                  { label: 'Why it matters', detail: 'The consequence. What happens if nobody fixes this?' },
                ],
              },
            ],
          },
          {
            id: 'weak-strong',
            title: 'Weak and strong',
            blocks: [
              {
                id: 'weak-strong-example',
                type: 'example',
                title: 'Amina’s statement, before and after',
                body: "**Weak:** “Tomato traders in Kano need cold storage.”\n\n**Strong:** “During the hot season, from March to June, I lose roughly three baskets of tomatoes in every ten I buy before I can sell them. That loss wipes out most of my profit in those months, and I have had to borrow from my savings group twice this year to restock.”\n\nThe strong version names who (Amina), the gap (stock lost before sale), when (hot season), how much (about three in ten, by her estimate) and why it matters (lost profit and debt). It does not mention cold rooms at all.",
              },
              {
                id: 'weak-strong-reveal',
                type: 'reveal',
                prompt: 'Amina’s “three in ten” is her own rough estimate. Is it a problem to put a rough number in a problem statement?',
                body: "No. A rough number is far better than no number, as long as you say where it came from. “By my own count” is honest. Later, in the Diagnose module, Amina will check it by keeping a simple loss record for two weeks. The number may change. That is the point: a number gives you something to test.",
              },
            ],
          },
          {
            id: 'order-writing',
            title: 'Build one step by step',
            blocks: [
              {
                id: 'order-steps',
                type: 'order',
                prompt: 'Put these steps for writing a problem statement in a sensible order.',
                items: [
                  { id: 'observe', text: 'Observe the situation and talk to people affected' },
                  { id: 'who', text: 'Name the specific people who carry the problem' },
                  { id: 'gap', text: 'Describe the gap between now and how it should be' },
                  { id: 'size', text: 'Estimate how big it is and how often it happens' },
                  { id: 'matters', text: 'Say why it matters and what happens if nothing changes' },
                  { id: 'strip', text: 'Read it back and remove any solution hiding inside it' },
                ],
                explanation:
                  "You start from real observation, not from a desk. The final step matters most. Solutions sneak in while you write. Always read your statement back and ask: “Have I already decided the answer?”",
              },
            ],
          },
          {
            id: 'pick-strongest',
            title: 'Pick the strongest',
            blocks: [
              {
                id: 'strongest-choice',
                type: 'choice',
                prompt: 'Kwame is drafting a problem statement for the junior high school he volunteers at in Kumasi. Which draft is strongest?',
                multiple: false,
                options: [
                  { id: 'a', text: '“Education in Ghana is in crisis.”', correct: false, feedback: 'Far too broad. Nobody, including Kwame, can act on “education in Ghana”.' },
                  { id: 'b', text: '“The school needs a feeding programme to improve attendance.”', correct: false, feedback: 'A solution in disguise. Feeding might help, but Kwame does not yet know why pupils are absent.' },
                  {
                    id: 'c',
                    text: '“In the last term, about a third of JHS 2 pupils missed most Thursday lessons. Thursday is the main market day. Their maths scores have dropped below the rest of the class, and the BECE exam is next year.”',
                    correct: true,
                    feedback: 'Yes. Specific people, a clear gap, a time pattern, a rough size and a consequence. No solution built in.',
                  },
                  { id: 'd', text: '“Some pupils don’t come to school because their parents don’t care.”', correct: false, feedback: 'This blames people and jumps to a cause without evidence. Many parents care deeply and still face hard choices.' },
                ],
                explanation:
                  "Option C does something clever: it mentions the market-day pattern without claiming it is the cause. That gives Kwame a lead to investigate, not a conclusion. Good problem statements describe what you see, not what you assume.",
              },
            ],
          },
          {
            id: 'whats-missing',
            title: 'What is missing?',
            blocks: [
              {
                id: 'missing-choice',
                type: 'choice',
                prompt: 'A friend’s statement reads: “Young people in Nairobi can’t find jobs.” Which parts of a strong statement are missing? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'who', text: 'A specific “who”', correct: true, feedback: 'Yes. Which young people? Graduates? School leavers in Kibera? Young women in tech?' },
                  { id: 'size', text: 'How much or how often', correct: true, feedback: 'Yes. How long do they search? How many apply for each opening?' },
                  { id: 'why', text: 'Why it matters', correct: true, feedback: 'Yes. It feels obvious, but naming the consequence (debt, lost skills, frustration) sharpens what success looks like.' },
                  { id: 'solution', text: 'A proposed solution', correct: false, feedback: 'A problem statement should *not* contain a solution. Leaving it out is correct.' },
                  { id: 'gap', text: 'Any sense of a gap at all', correct: false, feedback: 'There is a gap here: young people want jobs and don’t have them. It’s just too vague to act on.' },
                ],
                explanation:
                  "Vague statements feel safe because nobody can argue with them. But they cannot guide action. Each part you add narrows the problem until you can see where to start.",
              },
            ],
          },
          {
            id: 'scope',
            title: 'Too big, too small',
            blocks: [
              {
                id: 'scope-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Find the right size',
                body: "If your problem is too big (“unemployment in Africa”), you will feel overwhelmed and nothing you test will show a result. If it is too small (“the market toilet door squeaks”), solving it will not change much.\n\nAim for a problem where a small team could see real progress in three months. You can always zoom out later.",
              },
              {
                id: 'scope-scale',
                type: 'scale',
                prompt: 'Think about the problem you are working on. How specific is it right now?',
                minLabel: 'Very broad',
                maxLabel: 'Sharp and specific',
                afterword:
                  "Most people start broad. That is normal. The next step will help you narrow it using the five parts.",
              },
            ],
          },
          {
            id: 'wrong-problem-cost',
            title: 'The cost of the wrong problem',
            blocks: [
              {
                id: 'pump-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Flickr_-_usaid.africa_-_Water_pump.jpg/1280px-Flickr_-_usaid.africa_-_Water_pump.jpg",
                alt: "A woman carrying a baby on her back works a community hand pump while a girl fills a basin and children play nearby.",
                caption: "A community hand pump. When a pump like this breaks, families may have to walk much further for water.",
                credit: "Photo: USAID Africa Bureau / Wikimedia Commons, public domain",
              },
              {
                id: 'uwase-caution',
                type: 'callout',
                tone: 'caution',
                title: 'A new pump for the wrong problem',
                body: "Uwase is secretary of the borehole committee in a village in Rwanda’s Eastern Province. The hand pump had broken down four times in a year. Each time, families walked an hour to the valley stream for water.\n\nThe committee’s statement was: “We need a new pump.” They raised money and replaced it. Within months it broke again.\n\nThe real problem, as you will see later, was not the pump. It was that the committee had no money set aside for small repairs, so minor faults became major breakdowns. A sharper problem statement would have saved a year of savings.",
              },
            ],
          },
          {
            id: 'draft-yours',
            title: 'Draft your statement',
            blocks: [
              {
                id: 'draft-reflection',
                type: 'reflection',
                prompt: 'Write a problem statement for your own problem using the five parts: who, what gap, where and when, how much, and why it matters. Keep it to three sentences or fewer.',
                guidance: 'Use rough numbers if you have them and say where they come from (“by my estimate”, “from the class register”). Then read it back and remove any solution hiding inside.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'wrong-problem-discussion',
      type: 'discussion',
      title: 'Discussion: when the wrong problem got solved',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Share a real example, from your community, school, workplace or the news, where time or money went into solving the wrong problem.\n\nIn your post, answer three questions:\n\n1. What was the visible symptom, and what fix was chosen?\n2. What do you think the real problem was?\n3. How might a sharper problem statement have changed what happened?\n\nThen reply to at least two classmates. Ask a question that helps them see their example more clearly, or suggest a stronger problem statement.",
        guidance: 'Be respectful when your example involves real people or organisations. Describe what happened, not who was foolish. We all solve the wrong problem sometimes.',
        minWords: 80,
      },
    },
    {
      key: 'define-quiz',
      type: 'quiz',
      title: 'Module quiz: Define',
      minutes: 8,
      required: true,
      gradeWeight: 6,
      payload: {
        intro:
          "Six questions on problems, symptoms, disguised solutions and problem statements. You need 70% to pass and you can retake it as many times as you like. Read each explanation, even when you get it right.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-definition',
            type: 'choice',
            prompt: 'Which definition of a problem do we use in this course?',
            multiple: false,
            options: [
              { id: 'a', text: 'Anything that makes people unhappy', correct: false, feedback: 'Unhappiness is a signal, but it is not specific enough to act on.' },
              { id: 'b', text: 'A gap between how things are and how they should be, that matters to someone', correct: true },
              { id: 'c', text: 'Something that needs money to fix', correct: false, feedback: 'Many problems need no money at all, and assuming they do pushes you towards expensive solutions.' },
              { id: 'd', text: 'A question that has one correct answer', correct: false, feedback: 'Real-world problems usually have many possible responses, not one right answer.' },
            ],
            explanation: 'Current state, desired state and someone it matters to. If any of the three is missing, keep defining.',
          },
          {
            id: 'q-disguise',
            type: 'choice',
            prompt: 'A youth group says: “Our problem is that we don’t have a website.” What is the best next question to ask them?',
            multiple: false,
            options: [
              { id: 'a', text: '“Which web designer will you use?”', correct: false, feedback: 'That accepts the solution before anyone knows what it is for.' },
              { id: 'b', text: '“If you had a website, what would be different?”', correct: true },
              { id: 'c', text: '“How much money do you have?”', correct: false, feedback: 'Budget matters later. First find out what the website is meant to change.' },
              { id: 'd', text: '“Why don’t you use social media instead?”', correct: false, feedback: 'That swaps one solution in disguise for another.' },
            ],
            explanation: 'Asking what would be different translates a disguised solution back into the gap it was meant to close. Perhaps the real problem is that new members cannot find them, or that sponsors do not trust them.',
          },
          {
            id: 'q-match-types',
            type: 'match',
            prompt: 'Match each statement about a Nairobi matatu stage to its type.',
            pairs: [
              { id: 'symptom', left: 'Passengers shouting at the stage marshal every evening', right: 'Symptom' },
              { id: 'problem', left: 'Evening commuters wait over 40 minutes, so many arrive home after dark', right: 'Problem' },
              { id: 'cause', left: 'Most vehicles are stuck in town traffic and return late for the evening rush', right: 'Possible root cause' },
              { id: 'disguise', left: '“We need more matatus on this route.”', right: 'Solution in disguise' },
            ],
            explanation: 'The shouting is what you see. The long wait is the gap. Vehicles returning late is one possible cause to check. “More matatus” might not help at all if the new ones also get stuck in the same traffic.',
          },
          {
            id: 'q-parts',
            type: 'choice',
            prompt: 'Which of these belong in a strong problem statement? Select all that apply.',
            multiple: true,
            options: [
              { id: 'who', text: 'Who is affected', correct: true },
              { id: 'size', text: 'A rough sense of how big it is', correct: true },
              { id: 'matters', text: 'Why it matters', correct: true },
              { id: 'fix', text: 'The fix you prefer', correct: false, feedback: 'Leave the fix out. It belongs in a later box of the canvas.' },
              { id: 'when', text: 'Where and when it happens', correct: true },
            ],
            explanation: 'Who, what gap, where and when, how much, and why it matters. No solution.',
          },
          {
            id: 'q-order',
            type: 'order',
            prompt: 'Put these in the order of the problem-solving spine.',
            items: [
              { id: 'define', text: 'Define' },
              { id: 'diagnose', text: 'Diagnose' },
              { id: 'generate', text: 'Generate' },
              { id: 'decide', text: 'Decide' },
              { id: 'do', text: 'Do' },
            ],
            explanation: 'Define → Diagnose → Generate → Decide → Do. In practice you loop: what you learn in Do often sends you back to Define with a sharper statement.',
          },
          {
            id: 'q-rough-number',
            type: 'choice',
            prompt: 'Kwame has no official data, only his own count from three weeks of registers. What should he do in his problem statement?',
            multiple: false,
            options: [
              { id: 'a', text: 'Leave numbers out until he has official data', correct: false, feedback: 'Then his statement has no size at all, and nobody can tell if things improve.' },
              { id: 'b', text: 'Use his count and say where it came from', correct: true },
              { id: 'c', text: 'Round it up so the problem sounds more urgent', correct: false, feedback: 'Exaggerating destroys trust the moment someone checks.' },
              { id: 'd', text: 'Use a national statistic instead', correct: false, feedback: 'A national figure may say nothing about this school. Local evidence beats borrowed evidence.' },
            ],
            explanation: 'An honest rough number, with its source, gives you something to test and improve. That is better than precision you do not have.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Diagnose: evidence and root causes
// ---------------------------------------------------------------------------

const moduleDiagnose: Module = {
  key: 'diagnose',
  title: 'Diagnose: evidence and root causes',
  summary:
    'Learn to ask questions that reveal the truth, observe before you assume, dig to root causes with the 5 Whys and the fishbone, and weigh evidence honestly: data against anecdote, and base rates against loud stories.',
  weekNo: 1,
  items: [
    {
      key: 'better-questions',
      type: 'lesson',
      title: 'Asking better questions',
      minutes: 30,
      required: true,
      payload: {
        steps: [
          {
            id: 'questions-matter',
            title: 'Your questions shape your answers',
            blocks: [
              {
                id: 'questions-text',
                type: 'text',
                body: "Diagnosis starts with people. Before any spreadsheet, you need to hear from the people who live with the problem.\n\nBut people are kind. If you ask “Would you use my idea?”, most will say yes to be polite. If you ask “Don’t you think the baskets are the problem?”, many will agree because you seem to want them to. The answers you get depend on the questions you ask.",
              },
              {
                id: 'users-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'z1iF1c8w5Lg',
                title: "How To Talk To Users | Startup School",
                channel: "Y Combinator",
                durationS: 1051,
                caption: "Y Combinator’s talk on how to talk to users. It is aimed at start-up founders, but the advice works for any problem. Listen for how often it comes back to asking about real past behaviour rather than opinions about your idea. It runs about 17 minutes, so on slow data you may prefer to finish this lesson first and watch later.",
              },
              {
                id: 'questions-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Open question', definition: 'Invites a story or explanation. “Tell me about…”, “How do you…”, “What happened when…”' },
                  { term: 'Closed question', definition: 'Has a yes/no or short answer. Useful for checking facts, poor for discovering.' },
                  { term: 'Leading question', definition: 'Pushes the person towards the answer you expect. “Don’t you agree that…?”' },
                  { term: 'Past-behaviour question', definition: 'Asks what someone actually did, not what they might do. “The last time this happened, what did you do?”' },
                ],
              },
            ],
          },
          {
            id: 'match-questions',
            title: 'Name the question',
            blocks: [
              {
                id: 'questions-match',
                type: 'match',
                prompt: 'Kwame is preparing to talk to parents about Thursday absences. Match each question to its type.',
                pairs: [
                  { id: 'open', left: '“How does a typical Thursday go in your household?”', right: 'Open question' },
                  { id: 'closed', left: '“Does your child attend school on Thursdays?”', right: 'Closed question' },
                  { id: 'leading', left: '“Isn’t it true that market work is more important to you than school?”', right: 'Leading question' },
                  { id: 'past', left: '“Last Thursday, where was your child at ten in the morning?”', right: 'Past-behaviour question' },
                ],
                explanation:
                  "The leading question is also disrespectful. It assumes the parent does not value school, which will make them defensive. The past-behaviour question is the most powerful. It asks about something real that happened, so the answer is hard to bend.",
              },
            ],
          },
          {
            id: 'past-not-future',
            title: 'Ask about the past, not the future',
            blocks: [
              {
                id: 'past-insight',
                type: 'callout',
                tone: 'insight',
                title: 'People are poor at predicting themselves',
                body: "“Would you pay for this?” is a question about an imagined future. People answer it with hope and politeness.\n\n“What did you spend on this last month?” is a question about the past. People answer it with memory. Memory is not perfect, but it is far more reliable than prediction.",
              },
              {
                id: 'past-choice',
                type: 'choice',
                prompt: 'Amina wants to know if customers would pay a little more for firmer tomatoes. Which question will give her the most reliable answer?',
                multiple: false,
                options: [
                  { id: 'would', text: '“Would you pay more for better tomatoes?”', correct: false, feedback: 'Almost everyone says yes to this, and many will not actually pay. It asks about an imagined future.' },
                  { id: 'agree', text: '“You’d agree my tomatoes are the best in the market, wouldn’t you?”', correct: false, feedback: 'A leading question. She will hear flattery, not information.' },
                  {
                    id: 'last-time',
                    text: '“The last time you bought tomatoes somewhere other than my stall, why did you choose that trader?”',
                    correct: true,
                    feedback: 'Yes. It asks about a real decision, and the answer will reveal what customers actually value: price, firmness, credit, friendship or convenience.',
                  },
                  { id: 'price', text: '“Is ₦200 more per basket too expensive?”', correct: false, feedback: 'Closed and hypothetical. It also anchors on a number Amina chose before she knows what matters to customers.' },
                ],
                explanation:
                  "Good diagnostic questions ask about real past decisions, invite stories, and do not reveal the answer you are hoping for. If you finish an interview and feel flattered, you probably asked the wrong questions.",
              },
            ],
          },
          {
            id: 'observe',
            title: 'Watch, don’t only ask',
            blocks: [
              {
                id: 'kejetia-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Modern_market_hall_of_Kejetia_market.jpg/1280px-Modern_market_hall_of_Kejetia_market.jpg",
                alt: "A vast market hall with a colourful patterned roof, stalls on several levels and crowds of shoppers on the floor below.",
                caption: "Inside the new Kejetia Market building in Kumasi, Ghana.",
                credit: "Photo: Afus199620 / Wikimedia Commons, CC0",
              },
              {
                id: 'observe-text',
                type: 'text',
                body: "Some of the best evidence comes from simply watching. People often do things they would never think to mention because those things feel normal to them.\n\nKwame spends one Thursday morning at the school gate and then walks to the market. He notices that many absent pupils are not selling. They are minding younger siblings while their mothers sell. Nobody had mentioned siblings in any conversation.",
              },
              {
                id: 'observe-reveal',
                type: 'reveal',
                prompt: 'Why do you think no parent mentioned the younger siblings when Kwame asked about absences?',
                body: "Because to them it was not a reason. It was just how Thursdays work. People explain the unusual and leave out the ordinary. Observation catches the ordinary. That is why you should watch as well as ask, and why the best interviews include “Can you show me?”",
              },
            ],
          },
          {
            id: 'kwame-scenario',
            title: 'A polite yes',
            blocks: [
              {
                id: 'polite-yes',
                type: 'scenario',
                situation:
                  "Kwame has an idea: a small paid crèche near the market on Thursdays, so older siblings can go to school. He asks a mother at her stall: “Would you use a crèche for your little one on market days?”\n\nShe smiles warmly and says: “Yes, that would be very good. God bless you.”",
                prompt: 'What should Kwame make of this?',
                options: [
                  {
                    id: 'proof',
                    text: 'This is strong evidence. He should start finding a location for the crèche.',
                    outcome: "Kwame spends three weeks and some of his savings setting up. On the first Thursday, two children come. The mothers were being kind. They also already trust a grandmother or neighbour, and they cannot spare even a small fee.",
                    best: false,
                  },
                  {
                    id: 'dig',
                    text: 'Treat it as a polite signal and follow up: “Who looks after him on market days now? What does that cost you? What would worry you about leaving him somewhere new?”',
                    outcome: "The mother explains that her neighbour’s daughter usually minds the baby, but that girl is also missing school. Cost and trust both come up. Kwame learns more in five minutes than the “yes” gave him, and his idea starts to change shape.",
                    best: true,
                  },
                  {
                    id: 'ignore',
                    text: 'Ignore the answer. People always say yes, so interviews are useless.',
                    outcome: "Kwame stops talking to parents and goes back to his own assumptions. He loses the most important source of evidence he has. Interviews are not useless. Badly framed questions are.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'respect',
            title: 'Asking with respect',
            blocks: [
              {
                id: 'respect-context',
                type: 'callout',
                tone: 'context',
                title: 'Who you ask, and how',
                body: "In many communities, going straight to households without greeting a chief, an assembly member, an imam or pastor, or a market association leader can close doors. Ask who should know you are there.\n\nThink about who can speak freely. Young women may say more in a group of other women than in front of elders. Traders may not talk during the busy morning rush but will happily talk at closing time. Language matters too: an interview in Hausa, Twi, Kiswahili or Wolof will reach places English cannot.\n\nAnd respect people’s time. If you take an hour, offer something back, even if it is only your notes or the results.",
              },
              {
                id: 'respect-poll',
                type: 'poll',
                prompt: 'When you have asked people about a problem or idea before, what usually happened?',
                options: [
                  { id: 'agree', text: 'They mostly agreed with me' },
                  { id: 'surprised', text: 'They told me things that surprised me' },
                  { id: 'hard', text: 'It was hard to get honest answers' },
                  { id: 'never', text: 'I have not really asked anyone yet' },
                ],
                afterword:
                  "If people mostly agreed with you, look at your questions. Were they open? Were they about the past? If you have not asked anyone yet, you are in good company. Most people skip this step. This week you will not.",
              },
            ],
          },
          {
            id: 'your-questions',
            title: 'Write your questions',
            blocks: [
              {
                id: 'questions-reflection',
                type: 'reflection',
                prompt: 'Write three open, past-focused questions you could ask people affected by your problem. Then write one thing you could observe directly, without asking anyone.',
                guidance: 'Check each question: Is it open? Is it about something that really happened? Does it hide the answer you want? Plan to ask at least three people before the end of the week.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'five-whys',
      type: 'lesson',
      title: 'The 5 Whys',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'intro-whys',
            title: 'Keep asking why',
            blocks: [
              {
                id: 'whys-text',
                type: 'text',
                body: "The 5 Whys is the simplest root-cause tool there is. You state the problem, ask “why does this happen?”, and then ask “why?” of the answer. Keep going, usually about five times, until you reach a cause you could actually change.\n\nThe method comes from Toyota’s manufacturing tradition, where it was used to trace faults on the factory floor back to their source. It works just as well on a market stall or a school register.",
              },
              {
                id: 'whys-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'SrlYkx41wEE',
                title: "Clarifying the '5 Whys' Problem-Solving Method",
                channel: "Lean Enterprise Institute",
                durationS: 200,
                caption: "The Lean Enterprise Institute, which studies and teaches Toyota’s methods, clarifies what the 5 Whys is for and how it is meant to be used. Watch for the ways it can go wrong when used carelessly, then compare them with the traps later in this lesson.",
              },
              {
                id: 'whys-example',
                type: 'example',
                title: 'Amina’s first pass',
                body: "**Problem:** Amina loses about three baskets in ten during the hot season.\n\n1. *Why?* The tomatoes go soft and split before she sells them.\n2. *Why?* The bottom of each basket is crushed and gets hot.\n3. *Why?* The tomatoes travel and sit in deep raffia baskets, stacked high, from the farm to her stall.\n4. *Why?* Deep baskets are what the farmers and transporters have always used, and they cost almost nothing.\n5. *Why?* Nobody along the chain is paid for the condition of the tomatoes, only for the number of baskets.\n\nNotice how the problem moves from “heat” to “packaging” to “how everyone gets paid”. Each level opens different solutions.",
              },
            ],
          },
          {
            id: 'order-chain',
            title: 'Rebuild the chain',
            blocks: [
              {
                id: 'chain-order',
                type: 'order',
                prompt: 'Uwase’s committee did a 5 Whys on the borehole. Put their chain in order, from the problem down to the deepest cause.',
                items: [
                  { id: 'no-water', text: 'Families go without safe water for weeks at a time' },
                  { id: 'pump-broken', text: 'The hand pump breaks down and stays broken' },
                  { id: 'not-repaired', text: 'Small faults are not repaired when they first appear' },
                  { id: 'no-money', text: 'There is no money in the fund to pay the mechanic or buy parts' },
                  { id: 'no-fees', text: 'Most households stopped paying the monthly water fee last year' },
                ],
                explanation:
                  "Now look where the chain ends: not at the pump, but at fee collection. Replacing the pump, the committee’s first plan, treats the second link and leaves the deeper three untouched. That is why the new pump broke too.",
              },
            ],
          },
          {
            id: 'where-to-stop',
            title: 'Where to stop',
            blocks: [
              {
                id: 'stop-reveal',
                type: 'reveal',
                prompt: 'If you keep asking why, you often end up at something like “poverty” or “the government”. Is that the root cause you should work on?',
                body: "Usually not. Those may be true, but they are too big for you to act on directly. **Stop at the deepest cause you can influence.**\n\nFor Uwase, “households stopped paying fees” is something the committee can work on. “Rural poverty” is real, but it is not where their next experiment lives. You can note the big cause on your canvas as context, then work at the level where you have power.",
              },
              {
                id: 'stop-choice',
                type: 'choice',
                prompt: 'Which link in Amina’s chain is the best place for her to start working?',
                multiple: false,
                options: [
                  { id: 'heat', text: 'The heat of the Kano hot season', correct: false, feedback: 'Real, but she cannot change the weather. She can only change how her tomatoes are handled in it.' },
                  {
                    id: 'baskets',
                    text: 'How tomatoes are packed and stacked on the way to and at her stall',
                    correct: true,
                    feedback: 'Yes. This is deep enough to matter and close enough to her that she can test changes next week.',
                  },
                  { id: 'payment', text: 'How the whole tomato supply chain pays people', correct: false, feedback: 'This may be the deepest cause, but changing it alone is beyond Amina for now. It might be a later goal, with other traders.' },
                  { id: 'soft', text: 'The tomatoes going soft', correct: false, feedback: 'That is the symptom she started from. Treating it directly (selling soft tomatoes faster) helps a little but leaves the cause in place.' },
                ],
                explanation:
                  "The best starting point is often in the middle of the chain: deep enough that fixing it removes a real cause, near enough that you can act now. Keep the deeper causes visible. They tell you where to go next.",
              },
            ],
          },
          {
            id: 'whys-traps',
            title: 'The traps',
            blocks: [
              {
                id: 'traps-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Three ways the 5 Whys goes wrong',
                body: "1. **Blaming people.** “Why? Because the driver is lazy.” Stop. Ask instead why the system lets a tired or careless person cause harm.\n2. **Following one chain only.** Most problems have several causes. If you only ever follow the first answer, you miss the others. The fishbone, in the next lesson, fixes this.\n3. **Guessing at every link.** Each answer should be checked. “Because households stopped paying” is a claim. Uwase checked it against the fee book.",
              },
              {
                id: 'blame-choice',
                type: 'choice',
                prompt: 'Wanjiru asks why evening passengers at her SACCO’s stage wait so long. Which answer is the weakest link to put in a 5 Whys chain?',
                multiple: false,
                options: [
                  { id: 'traffic', text: 'Vehicles get stuck in town traffic after their 4 p.m. trip', correct: false, feedback: 'This is checkable with trip times. It is a reasonable link.' },
                  { id: 'lazy', text: 'Drivers are lazy and take long breaks', correct: true, feedback: 'Yes, this is the weakest. It blames character, cannot easily be tested, and hides the real question: what makes breaks long? Fuel queues? No toilet at the terminus? Pay per trip that makes some trips pointless?' },
                  { id: 'schedule', text: 'The dispatch schedule sends most vehicles out at the same time', correct: false, feedback: 'This is a system cause you can check in the dispatch book. A strong link.' },
                  { id: 'fuel', text: 'Several vehicles queue for fuel between 5 and 6 p.m.', correct: false, feedback: 'Observable and checkable. A good link.' },
                ],
                explanation:
                  "When a “why” lands on a person’s character, ask one more why about the system around them. People respond to the rules, pay and pressures they work within. Change those, and behaviour changes.",
              },
            ],
          },
          {
            id: 'your-whys',
            title: 'Your 5 Whys',
            blocks: [
              {
                id: 'whys-reflection',
                type: 'reflection',
                prompt: 'Run a 5 Whys on your own problem. Start with your problem statement and write each “why?” answer on a new line. Mark which link you think is the best place to start working.',
                guidance: 'Ask why about systems, not people. Next to each link, note whether it is checked (you have evidence) or a guess. Guesses are fine for now; they become questions to investigate.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'fishbone',
      type: 'lesson',
      title: 'Fishbone: many causes at once',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'fishbone-intro',
            title: 'Problems have more than one cause',
            blocks: [
              {
                id: 'fishbone-text',
                type: 'text',
                body: "The 5 Whys digs deep along one line. The **fishbone diagram** spreads wide. It was developed by the Japanese quality expert Kaoru Ishikawa, and it is named for its shape.\n\nYou write the problem at the head of the fish. Each big bone is a category of cause. Along each bone you list the possible causes in that category. When you finish, you can see the whole skeleton of the problem at once, not just the first cause that came to mind.",
              },
              {
                id: 'fishbone-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'mLvizyDFLQ4',
                title: "How to create cause-and-effect diagrams",
                channel: "Harvard Online",
                durationS: 197,
                caption: "A three-minute walkthrough of building a cause-and-effect (fishbone) diagram. Watch how the categories push a team to look beyond the first cause that comes to mind.",
              },
              {
                id: 'fishbone-framework',
                type: 'framework',
                title: 'Six bones for real-world problems',
                steps: [
                  { label: 'People', detail: 'Skills, habits, motivation, who is involved and who is missing.' },
                  { label: 'Process', detail: 'How the work is done: steps, schedules, hand-offs, rules of thumb.' },
                  { label: 'Tools and tech', detail: 'Equipment, phones, apps, vehicles, containers, power supply.' },
                  { label: 'Place', detail: 'Location, weather, distance, roads, the layout of the space.' },
                  { label: 'Money', detail: 'Prices, costs, how people are paid, access to credit.' },
                  { label: 'Rules and norms', detail: 'Laws, policies, permits, and the unwritten customs of “how things are done here”.' },
                ],
              },
            ],
          },
          {
            id: 'sort-causes',
            title: 'Build Wanjiru’s fishbone',
            blocks: [
              {
                id: 'matatu-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Matatu_bus.jpg/1280px-Matatu_bus.jpg",
                alt: "A brightly painted orange matatu minibus with a conductor standing in its open doorway, turning on a busy city street.",
                caption: "A matatu in Nairobi, Kenya. These privately owned minibuses carry a large share of the city’s commuters.",
                credit: "Photo: Francis Akuka for the Wikimedia Foundation / Wikimedia Commons, CC0",
              },
              {
                id: 'wanjiru-story',
                type: 'callout',
                tone: 'story',
                title: 'Wanjiru, matatu SACCO, Nairobi',
                body: "Wanjiru runs operations for a matatu SACCO serving a busy commuter route out of Nairobi’s city centre. Complaints are rising: in the evening rush, passengers at the town stage wait 40 minutes or more. Some give up and pay for a more expensive ride. The SACCO is losing riders.\n\nHer team meets and lists every possible cause they can think of.",
              },
              {
                id: 'fishbone-match',
                type: 'match',
                prompt: 'Put each of the team’s causes on the right bone.',
                pairs: [
                  { id: 'people', left: 'New drivers do not know the shortcut back from the far end of the route', right: 'People' },
                  { id: 'process', left: 'Dispatch sends vehicles in the order they arrive, with no evening schedule', right: 'Process' },
                  { id: 'tools', left: 'Three vehicles are often off the road waiting for spare parts', right: 'Tools and tech' },
                  { id: 'place', left: 'Roadworks near the terminus block the return lane', right: 'Place' },
                  { id: 'money', left: 'Owners earn the same per trip at noon as at 6 p.m., so some vehicles rest in the evening', right: 'Money' },
                  { id: 'rules', left: 'County rules limit how many vehicles may wait at the stage', right: 'Rules and norms' },
                ],
                explanation:
                  "Look at the Money bone. Owners are paid the same for a quiet noon trip as for a packed evening one, so there is little reason to be on the road in the hardest hours. Causes like this rarely come up in a 5 Whys that starts with “why is the driver late?”. The fishbone makes you look.",
              },
            ],
          },
          {
            id: 'prioritise',
            title: 'Which causes matter most?',
            blocks: [
              {
                id: 'prioritise-text',
                type: 'text',
                body: "A full fishbone can have twenty causes. You cannot test them all. Pick the few to investigate first by asking three questions of each cause:\n\n- **How often?** Does it happen every day or once a month?\n- **How big?** If it happens, how much of the problem does it explain?\n- **Can we act?** Is it within our power to change, or test, soon?\n\nThen check the top two or three with evidence before you call them root causes.",
              },
              {
                id: 'check-choice',
                type: 'choice',
                prompt: 'Which of Wanjiru’s possible causes could her team check with evidence they already have or could collect this week? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'dispatch', text: 'Dispatch order, using the stage’s dispatch book', correct: true, feedback: 'Yes. The book shows departure times. They can see if evening gaps follow from the dispatch pattern.' },
                  { id: 'spares', text: 'Vehicles off the road, using the SACCO’s maintenance records', correct: true, feedback: 'Yes. They can count how many evenings had vehicles missing.' },
                  { id: 'resting', text: 'Owners resting vehicles, by counting active vehicles at 6 p.m. for a week', correct: true, feedback: 'Yes. Direct observation at the stage settles this quickly.' },
                  { id: 'attitude', text: 'Passengers’ general opinion of matatus in Kenya', correct: false, feedback: 'Interesting, but it does not explain the waiting time at this stage, and it is hard to check cheaply.' },
                ],
                explanation:
                  "A good diagnosis uses the evidence that is closest and cheapest first: records you already keep, and things you can count with your own eyes. Expensive studies come later, if at all.",
              },
            ],
          },
          {
            id: 'blame-scenario',
            title: 'The easy answer',
            blocks: [
              {
                id: 'drivers-scenario',
                type: 'scenario',
                situation:
                  "At the next SACCO meeting, the chairman says: “We all know the real cause. It’s the drivers. They waste time. Let’s fine any driver who returns late.” Several members nod.\n\nWanjiru’s week of counting showed something else: on most evenings, four or five vehicles were simply not working after 5 p.m.",
                prompt: 'What should Wanjiru do?',
                options: [
                  {
                    id: 'agree',
                    text: 'Go along with the fines. The chairman has the most influence.',
                    outcome: "Fines are introduced. Drivers are angry, and two good ones leave for another SACCO. Evening waits do not change, because the main cause was missing vehicles, not slow drivers.",
                    best: false,
                  },
                  {
                    id: 'evidence',
                    text: 'Thank the chairman, then share her count: “On most evenings, four or five vehicles weren’t running. Can we look at why before we decide on fines?”',
                    outcome: "The room goes quiet, then the conversation changes. An owner admits evening trips are not worth it to him at the current fare split. The meeting ends by agreeing to test an evening bonus for two weeks. Nobody was blamed, and the real cause is on the table.",
                    best: true,
                  },
                  {
                    id: 'argue',
                    text: 'Tell the meeting that blaming drivers is lazy thinking.',
                    outcome: "She is right about the thinking, but the chairman hears an insult. The meeting becomes a fight about respect, and her evidence is never discussed.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-fishbone',
            title: 'Your fishbone',
            blocks: [
              {
                id: 'fishbone-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Do it on paper',
                body: "Draw your fishbone on paper or in the dust if you have to. It is quicker than any app and works without data. Take a photo for your portfolio.",
              },
              {
                id: 'fishbone-reflection',
                type: 'reflection',
                prompt: 'Build a fishbone for your own problem. List at least one possible cause under four or more of the six bones: People, Process, Tools and tech, Place, Money, Rules and norms. Then circle the two you most want to check, and say how you would check them.',
                guidance: 'Did anything appear that your 5 Whys missed? Money and Rules are the bones people most often forget.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'data-and-anecdotes',
      type: 'lesson',
      title: 'Data, anecdotes and base rates',
      minutes: 19,
      required: true,
      payload: {
        steps: [
          {
            id: 'loud-story',
            title: 'The loudest story',
            blocks: [
              {
                id: 'lagos-market-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/IThe_biggest_market_in_West_Africa%2C_dumota_Market%2C_Lagos.jpg/1280px-IThe_biggest_market_in_West_Africa%2C_dumota_Market%2C_Lagos.jpg",
                alt: "A packed market street seen from above, with crowds of shoppers, umbrellas, clothes on mannequins and yellow minibuses inching through.",
                caption: "Idumota Market, Lagos, Nigeria.",
                credit: "Photo: Sir Demo / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'loud-text',
                type: 'text',
                body: "Back in Lagos, Tunde has heard plenty of stories about the savings app. A popular trader posted a long voice note on WhatsApp saying the app “stole” her money. It was shared hundreds of times.\n\nTunde checks. Her deposit was delayed by a day, then arrived. Meanwhile, the app’s own records show something nobody is talking about: of every ten traders who signed up, about seven never made a second deposit.\n\nOne story is loud. The pattern is quiet. Both matter, but they tell you different things.",
              },
              {
                id: 'loud-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Anecdote', definition: 'A single story or case. Vivid and useful for ideas, but it may not be typical.' },
                  { term: 'Data', definition: 'Many observations recorded the same way, so you can see patterns.' },
                  { term: 'Base rate', definition: 'How common something is in the whole group. Before you judge any one case, ask how often this happens in general.' },
                  { term: 'Sample', definition: 'The people or cases you actually looked at. If your sample is odd, your conclusions will be odd too.' },
                ],
              },
            ],
          },
          {
            id: 'base-rate',
            title: 'Think in base rates',
            blocks: [
              {
                id: 'base-rate-choice',
                type: 'choice',
                prompt: 'In Tunde’s fictional figures, 2,000 traders signed up. 60 complained about the delayed-deposit issue online. 1,400 never made a second deposit. Which conclusion is best supported?',
                multiple: false,
                options: [
                  { id: 'delay', text: 'Delayed deposits are the main reason traders stop using the app', correct: false, feedback: 'Only 60 of 2,000 complained about delays. Even if every one of them stopped, that explains a small part of the 1,400.' },
                  {
                    id: 'second',
                    text: 'Something stops most traders before their second deposit, and the team does not yet know what',
                    correct: true,
                    feedback: 'Yes. The base rate tells Tunde where the big problem is (no second deposit) and honestly admits the cause is still unknown.',
                  },
                  { id: 'fine', text: 'The app is basically working, because only 60 people complained', correct: false, feedback: 'Silence is not satisfaction. 1,400 people left without complaining.' },
                  { id: 'trader', text: 'The popular trader is spreading lies and should be ignored', correct: false, feedback: 'Her story contains real information about trust and delays. Ignore her and you lose that. Just do not let it set the whole agenda.' },
                ],
                explanation:
                  "Before you act on a story, ask: **out of how many?** Sixty angry people feel like a crisis. Fourteen hundred quiet ones are the actual crisis. Anecdotes tell you *what kinds* of things go wrong. Base rates tell you *how much* each one matters.",
              },
            ],
          },
          {
            id: 'quick-poll',
            title: 'Your instinct',
            blocks: [
              {
                id: 'evidence-poll',
                type: 'poll',
                prompt: 'When you are deciding something important, what usually convinces you most?',
                options: [
                  { id: 'story', text: 'A powerful story from someone I trust' },
                  { id: 'numbers', text: 'Numbers and records' },
                  { id: 'experience', text: 'My own past experience' },
                  { id: 'crowd', text: 'What most people around me think' },
                ],
                afterword:
                  "Each of these is a real kind of evidence, and each can mislead. Stories are vivid but can be rare. Numbers can be badly collected. Your experience is a sample of one. The crowd can be wrong together. Strong problem solvers use several kinds and check them against each other.",
              },
            ],
          },
          {
            id: 'borehole-data',
            title: 'What the fee book said',
            blocks: [
              {
                id: 'borehole-example',
                type: 'example',
                title: 'Uwase checks the story',
                body: "Many committee members were sure the pump kept breaking because children played with the handle. Several people had seen it happen.\n\nUwase put two records side by side: the repair log and the fee book. The pattern was clear. Breakdowns that lasted more than a week all came in months when the fund was nearly empty. In months with money, the mechanic was called on the first day and repairs took a day or two.\n\nChildren may well play with the handle. But the *length* of the breakdowns, the thing that really hurt families, followed the money.",
              },
            ],
          },
          {
            id: 'survivors',
            title: 'Who did you ask?',
            blocks: [
              {
                id: 'survivorship-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'P9WFpVsRtQg',
                title: "Survivorship Bias",
                channel: "Eddie Woo",
                durationS: 369,
                caption: "Teacher Eddie Woo explains survivorship bias with a classic example. Keep it in mind for Kwame’s questionnaire below: whose answers are missing from the evidence?",
              },
              {
                id: 'survivor-scenario',
                type: 'scenario',
                situation:
                  "To understand Thursday absences, Kwame hands out a short questionnaire in class on a Thursday. Thirty pupils fill it in. Most say they come to school on Thursdays because school is important, and that absent pupils “just don’t care”.",
                prompt: 'How much should Kwame trust these results about why pupils are absent?',
                options: [
                  {
                    id: 'trust',
                    text: 'A lot. Thirty answers is a decent sample.',
                    outcome: "Kwame concludes absent pupils lack motivation and starts planning a motivational talk. He has not heard from a single absent pupil. The talk is given to the pupils who were already there.",
                    best: false,
                  },
                  {
                    id: 'biased',
                    text: 'Very little. He only asked the pupils who were present, so he has heard nothing from the absent ones.',
                    outcome: "Exactly. Kwame visits five absent pupils’ homes the next week. Every one of them wants to be at school. Their reasons are siblings, errands, and one pupil who has no school shoes that fit. His sample had left out everyone he needed to hear from.",
                    best: true,
                  },
                  {
                    id: 'more',
                    text: 'Some, but he should repeat the questionnaire in more classes to get a bigger sample.',
                    outcome: "Kwame collects 200 answers, all from pupils who were present. A bigger sample of the wrong people only makes the wrong answer look more convincing.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'biases',
            title: 'Four traps in evidence',
            blocks: [
              {
                id: 'biases-match',
                type: 'match',
                prompt: 'Match each trap to the example that shows it.',
                pairs: [
                  { id: 'survivorship', left: 'Survivorship bias', right: 'Learning why pupils skip school by asking only the pupils who came' },
                  { id: 'confirmation', left: 'Confirmation bias', right: 'The chairman noticing every late driver and none of the parked vehicles' },
                  { id: 'recency', left: 'Recency bias', right: 'Deciding the app is failing because of one viral voice note this week' },
                  { id: 'correlation', left: 'Mistaking correlation for cause', right: 'Noticing that stalls with radios sell more, and buying a radio to boost sales' },
                ],
                explanation:
                  "You cannot remove these biases from your mind, but you can catch them. Ask: Who is missing from my evidence? Am I only noticing what I already believe? Am I reacting to the most recent thing? Could something else explain both patterns? (Busier stalls can afford radios; the radio may not cause the sales.)",
              },
            ],
          },
          {
            id: 'cheap-evidence',
            title: 'Evidence on a small budget',
            blocks: [
              {
                id: 'cheap-context',
                type: 'callout',
                tone: 'context',
                title: 'You probably have more data than you think',
                body: "You do not need a survey firm. Much useful evidence is already lying around: a trader’s notebook, mobile money statements, a school register, a SACCO dispatch book, a WhatsApp group’s message history, church or mosque attendance, a clinic’s appointment book. A week of tally marks on paper, counted the same way each day, can settle arguments that have gone on for years.",
              },
              {
                id: 'cheap-choice',
                type: 'choice',
                prompt: 'Amina wants to check her “three in ten” estimate and find out where the losses happen. Which are good, cheap ways to gather evidence? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'tally', text: 'Keep a daily tally of baskets bought, sold and thrown away for two weeks', correct: true, feedback: 'Yes. Simple, cheap and directly measures the problem.' },
                  { id: 'layers', text: 'Sort one spoilt basket and note whether the damage is mostly at the bottom, middle or top', correct: true, feedback: 'Yes. This directly tests the crushing theory in ten minutes.' },
                  { id: 'neighbours', text: 'Ask three neighbouring traders to keep the same tally, to compare', correct: true, feedback: 'Yes. Comparing stalls shows whether her losses are normal or unusual.' },
                  { id: 'national', text: 'Search online for a national figure on tomato losses and use that instead', correct: false, feedback: 'A national figure, even a good one, cannot tell Amina what is happening at her stall or why.' },
                  { id: 'ask-cousin', text: 'Ask her cousin, who is sure it is all about the heat', correct: false, feedback: 'One confident opinion is not evidence, and her cousin has already decided the answer.' },
                ],
                explanation:
                  "The best evidence is close to the problem, cheap to collect, and recorded the same way every time. Two weeks of honest tallies will tell Amina more than any report.",
              },
            ],
          },
          {
            id: 'your-evidence',
            title: 'Your evidence',
            blocks: [
              {
                id: 'evidence-scale',
                type: 'scale',
                prompt: 'How strong is the evidence behind your problem statement right now?',
                minLabel: 'Mostly my opinion',
                maxLabel: 'Solid, checked evidence',
                afterword: "Whatever you rated, the next step is the same: find one cheap way to make it stronger this week.",
              },
              {
                id: 'evidence-reflection',
                type: 'reflection',
                prompt: 'List the evidence you have for your problem so far, and label each piece as an anecdote, data, or your own opinion. Then name one cheap way to collect better evidence this week, and who might be missing from what you have.',
                guidance: 'Remember survivorship bias: whose voice have you not heard yet?',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'diagnose-quiz',
      type: 'quiz',
      title: 'Module quiz: Diagnose',
      minutes: 8,
      required: true,
      gradeWeight: 6,
      payload: {
        intro:
          "Seven questions on questioning, root causes and evidence. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-best-question',
            type: 'choice',
            prompt: 'Fatou wants to understand why customers return dresses bought online. Which question is most useful?',
            multiple: false,
            options: [
              { id: 'a', text: '“Would you buy from us again?”', correct: false, feedback: 'A future, hypothetical question. Answers will be polite.' },
              { id: 'b', text: '“Was the dress too small?”', correct: false, feedback: 'Closed and leading. It assumes the answer before she hears it.' },
              { id: 'c', text: '“Tell me what happened when the dress arrived and you tried it on.”', correct: true },
              { id: 'd', text: '“Don’t you think our sizes are standard?”', correct: false, feedback: 'Leading. The customer will either agree or feel attacked.' },
            ],
            explanation: 'An open question about a real past event lets the customer tell the story: perhaps the size chart was confusing, the fabric had no stretch, or the colour looked different on screen.',
          },
          {
            id: 'q-five-whys-stop',
            type: 'choice',
            prompt: 'When should you stop asking “why?” in a 5 Whys?',
            multiple: false,
            options: [
              { id: 'a', text: 'Always after exactly five', correct: false, feedback: 'Five is a rule of thumb. Sometimes three is enough, sometimes you need seven.' },
              { id: 'b', text: 'When you reach a cause deep enough to matter that you can actually influence', correct: true },
              { id: 'c', text: 'When you reach poverty or government', correct: false, feedback: 'Those are often true but usually too big to act on directly. Note them, then work at a level you can change.' },
              { id: 'd', text: 'When you find someone to blame', correct: false, feedback: 'Blame ends thinking. Ask why the system allowed it instead.' },
            ],
            explanation: 'Stop at the deepest cause you can influence, and keep the deeper ones visible as context.',
          },
          {
            id: 'q-fishbone',
            type: 'match',
            prompt: 'Match each cause of falling attendance at Kwame’s partner school to its fishbone category.',
            pairs: [
              { id: 'money', left: 'Families lose a day’s trading income if an older child is not minding siblings', right: 'Money' },
              { id: 'place', left: 'The school is a 50-minute walk from the main market', right: 'Place' },
              { id: 'process', left: 'Absences are recorded but nobody follows up with families', right: 'Process' },
              { id: 'rules', left: 'It is expected locally that older girls look after younger children', right: 'Rules and norms' },
            ],
            explanation: 'The norm about older girls minding children is easy to miss because it feels normal. The fishbone’s Rules and norms bone is there to make you look for exactly this kind of cause.',
          },
          {
            id: 'q-base-rate',
            type: 'choice',
            prompt: 'A clinic manager hears three dramatic complaints in a week about long queues and wants to hire more staff. What is the best first question?',
            multiple: false,
            options: [
              { id: 'a', text: '“How quickly can we hire?”', correct: false, feedback: 'That jumps straight to a solution.' },
              { id: 'b', text: '“Out of how many patients, and how long do most people actually wait?”', correct: true },
              { id: 'c', text: '“Who are these complainers?”', correct: false, feedback: 'The complainers may be right. The question is how typical their experience is.' },
              { id: 'd', text: '“Can we ignore three complaints?”', correct: false, feedback: 'Complaints are useful signals. They just need to be weighed against the base rate.' },
            ],
            explanation: 'Three stories are a reason to look, not a conclusion. The base rate (typical waits across all patients) shows whether the queue problem is common, when it happens, and how big it is.',
          },
          {
            id: 'q-survivorship',
            type: 'choice',
            prompt: 'A youth hub surveys its current members to learn why young people drop out of its programme. What is the main flaw?',
            multiple: false,
            options: [
              { id: 'a', text: 'The survey is too short', correct: false, feedback: 'Length is not the main issue.' },
              { id: 'b', text: 'It only hears from people who did not drop out', correct: true },
              { id: 'c', text: 'Members might be busy', correct: false, feedback: 'True but minor.' },
              { id: 'd', text: 'Surveys never work', correct: false, feedback: 'Surveys can work well. This one is asking the wrong people.' },
            ],
            explanation: 'This is survivorship bias. To learn why people leave, you must find and talk to people who left.',
          },
          {
            id: 'q-observation',
            type: 'choice',
            prompt: 'Why is observation valuable alongside interviews? Select all that apply.',
            multiple: true,
            options: [
              { id: 'ordinary', text: 'People often leave out things that feel normal to them', correct: true },
              { id: 'polite', text: 'What people do is not shaped by politeness the way their answers are', correct: true },
              { id: 'replace', text: 'It means you never need to talk to anyone', correct: false, feedback: 'Observation shows what happens. Conversation explains why. You need both.' },
              { id: 'cheap', text: 'It is often cheap and needs no data connection', correct: true },
            ],
            explanation: 'Kwame only discovered the younger siblings by watching. Observation and conversation check each other.',
          },
          {
            id: 'q-diagnose-order',
            type: 'order',
            prompt: 'Put these diagnosis activities in a sensible order for a new problem.',
            items: [
              { id: 'talk', text: 'Talk to and observe people affected' },
              { id: 'fishbone', text: 'Map possible causes widely with a fishbone' },
              { id: 'pick', text: 'Pick the two or three most likely, important causes' },
              { id: 'check', text: 'Check those causes against records or counts' },
              { id: 'confirm', text: 'Name the root cause you will work on' },
            ],
            explanation: 'Listen first, map widely, narrow down, check with evidence, then commit. Skipping the checking step is how “obvious” causes like lazy drivers end up in the plan.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Generate: options
// ---------------------------------------------------------------------------

const moduleGenerate: Module = {
  key: 'generate',
  title: 'Generate: going wide before you go deep',
  summary:
    'Produce many possible responses before choosing one. Beat first-idea fixation, reframe problems as “How might we…” questions, use constraints as fuel and borrow ideas from other fields and places.',
  weekNo: 2,
  items: [
    {
      key: 'go-wide',
      type: 'lesson',
      title: 'Go wide before you go deep',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'two-modes',
            title: 'Two modes of thinking',
            blocks: [
              {
                id: 'modes-text',
                type: 'text',
                body: "You now understand your problem far better than when you started. The temptation is to grab the first good idea and run. Resist it for one more lesson.\n\nCreative problem solving moves between two modes. **Divergent thinking** opens up: many ideas, no judging. **Convergent thinking** closes down: compare, choose, commit. Both matter. The mistake is doing them at the same time, killing each idea the moment it appears.",
              },
              {
                id: 'brainstorm-video',
                type: 'video',
                provider: 'youtube',
                videoId: '2B7aCIuEDxk',
                title: "7 Rules for the Perfect Brainstorming Session",
                channel: "IDEO U",
                durationS: 324,
                caption: "IDEO, one of the design firms that popularised these methods, shares its rules for a good brainstorm. Listen especially for “defer judgement” and “go for quantity”: both are about keeping divergent and convergent thinking apart.",
              },
              {
                id: 'modes-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Divergent thinking', definition: 'Generating many different options without judging them yet.' },
                  { term: 'Convergent thinking', definition: 'Narrowing options down using criteria, to choose what to do.' },
                  { term: 'First-idea fixation', definition: 'Getting stuck on the first solution that comes to mind, so you stop seeing others. Psychologists study a version of this called the Einstellung effect.' },
                ],
              },
            ],
          },
          {
            id: 'fixation-poll',
            title: 'Your habit',
            blocks: [
              {
                id: 'ideas-poll',
                type: 'poll',
                prompt: 'When you face a problem, how many genuinely different solutions do you usually consider before choosing?',
                options: [
                  { id: 'one', text: 'One. I usually know what to do.' },
                  { id: 'two-three', text: 'Two or three' },
                  { id: 'four-nine', text: 'Four to nine' },
                  { id: 'ten', text: 'Ten or more' },
                ],
                afterword:
                  "Most people consider one or two. That is not laziness; it is how minds save energy. But your first idea is usually the most obvious one, which means everyone else has had it too. Pushing past it is where originality starts.",
              },
            ],
          },
          {
            id: 'spot-fixation',
            title: 'Spot the fixation',
            blocks: [
              {
                id: 'fixation-choice',
                type: 'choice',
                prompt: 'Which of these is the clearest sign of first-idea fixation?',
                multiple: false,
                options: [
                  { id: 'details', text: 'Spending your brainstorm on the details of the first idea: its name, its colour, its price', correct: true, feedback: 'Yes. When you are polishing one idea before you have others, you have stopped generating.' },
                  { id: 'silly', text: 'Writing down some ideas that seem silly', correct: false, feedback: 'Silly ideas are a healthy sign. They often contain the seed of a good one.' },
                  { id: 'combine', text: 'Combining two ideas into a new one', correct: false, feedback: 'Combining is a great divergent move.' },
                  { id: 'pause', text: 'Taking a break and coming back with fresh eyes', correct: false, feedback: 'Breaks help you escape fixation, not fall into it.' },
                ],
                explanation:
                  "Fixation feels like progress because you are busy. The test: have you got at least ten genuinely different options on the page? If not, you are probably polishing, not generating.",
              },
            ],
          },
          {
            id: 'amina-list',
            title: 'Amina’s ten ideas',
            blocks: [
              {
                id: 'amina-ideas',
                type: 'example',
                title: 'Beyond the cold room',
                body: "Amina sits with two other traders after closing. Their rule: no judging for fifteen minutes. They come up with:\n\n1. Use shallow plastic crates instead of deep baskets\n2. Put a shade cloth over the stall\n3. Buy smaller amounts more often\n4. Sell softer tomatoes early and cheaply to food sellers\n5. Sort tomatoes on arrival and sell the ripest first\n6. Share one cold room among twenty traders\n7. Sell overripe tomatoes to a woman who makes tomato paste\n8. Dry the excess in the sun and sell dried tomatoes in the rainy season\n9. Ask transporters to bring tomatoes at night when it is cooler\n10. Take pre-orders from restaurants by phone so stock moves faster\n\nThe cold room has become one idea in ten, and a shared one at that.",
              },
              {
                id: 'ideas-match',
                type: 'match',
                prompt: 'Each idea attacks the problem in a different way. Match the idea to its approach.',
                pairs: [
                  { id: 'crates', left: 'Shallow crates instead of deep baskets', right: 'Stop the damage happening' },
                  { id: 'preorders', left: 'Pre-orders from restaurants by phone', right: 'Sell faster, before damage sets in' },
                  { id: 'dried', left: 'Sun-drying the excess', right: 'Turn waste into a different product' },
                  { id: 'smaller', left: 'Buying smaller amounts more often', right: 'Change how much stock is at risk' },
                ],
                explanation:
                  "Good idea lists cover different *approaches*, not ten versions of the same one. If all your ideas are variations of “keep tomatoes cooler”, ask: what if I sold faster instead? What if I bought less? What if waste became a product?",
              },
            ],
          },
          {
            id: 'session-order',
            title: 'Run an idea session',
            blocks: [
              {
                id: 'notes-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Brainstorming_Customer_Feedback_%281%29.jpg/1280px-Brainstorming_Customer_Feedback_%281%29.jpg",
                alt: "Hands arranging handwritten sticky notes into rows on a wooden table, beside a notebook, a pen and a pad of yellow notes.",
                caption: "Ideas on sticky notes can be moved, grouped and combined, which makes them ideal for an idea session.",
                credit: "Photo: Steveonmz / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'session-order-block',
                type: 'order',
                prompt: 'Put the steps of a good idea session in order.',
                items: [
                  { id: 'frame', text: 'Agree the question you are generating ideas for' },
                  { id: 'solo', text: 'Everyone writes ideas silently on their own for a few minutes' },
                  { id: 'share', text: 'Share all ideas without judging any of them' },
                  { id: 'build', text: 'Build on and combine ideas (“yes, and…”)' },
                  { id: 'cluster', text: 'Group similar ideas into clusters' },
                  { id: 'select', text: 'Choose a few promising ones to explore further' },
                ],
                explanation:
                  "The silent solo step matters more than it looks. When a group starts by talking, the loudest or most senior person’s idea tends to shape everything after it. Writing first gives quieter people, and quieter ideas, a fair chance.",
              },
            ],
          },
          {
            id: 'silly-scale',
            title: 'Permission to be strange',
            blocks: [
              {
                id: 'silly-scale-block',
                type: 'scale',
                prompt: 'How comfortable are you sharing an idea that might sound silly in front of others?',
                minLabel: 'Very uncomfortable',
                maxLabel: 'Completely comfortable',
                afterword:
                  "If you scored low, you are not alone, and it is worth knowing. In many classrooms and workplaces, a wrong answer has been punished. In idea generation, the “wrong” answer is often a stepping stone. Writing alone first is one way to give yourself permission.",
              },
            ],
          },
          {
            id: 'your-ten',
            title: 'Your ten',
            blocks: [
              {
                id: 'ten-reflection',
                type: 'reflection',
                prompt: 'List at least ten possible responses to the root cause you identified in your problem. No judging. Include at least three that seem strange, expensive or impossible.',
                guidance: 'Number them. Try to cover different approaches: prevent the problem, reduce its impact, change who carries it, turn it into an opportunity.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'how-might-we',
      type: 'lesson',
      title: 'Reframing: “How might we…?”',
      minutes: 17,
      required: true,
      payload: {
        steps: [
          {
            id: 'hmw-intro',
            title: 'Turn the problem into a question',
            blocks: [
              {
                id: 'hmw-text',
                type: 'text',
                body: "A problem statement describes what is wrong. A **How might we** question turns it into an invitation to create.\n\n- *How* assumes there is a way.\n- *Might* says it is fine to try ideas that may not work.\n- *We* says this is shared work.\n\nThe phrase is widely used by design teams around the world because it is simple and it works. The skill is getting the size of the question right.",
              },
              {
                id: 'hmw-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'sRGk5oKXgCk',
                title: "DESIGN SPRINT - HOW MIGHT WE | Aj&Smart",
                channel: "AJ&Smart",
                durationS: 382,
                caption: "Design-sprint agency AJ&Smart shows how a team turns problems into How might we questions. Notice how each question keeps the problem in view but leaves the answer open.",
              },
              {
                id: 'hmw-reveal',
                type: 'reveal',
                prompt: 'Wanjiru writes “How might we build a new terminal for our SACCO?” What is wrong with it? Think, then tap.',
                body: "It is a solution in disguise wearing a question mark. The only answers it allows are kinds of terminal.\n\nA better version comes from her problem: *How might we cut evening waiting time at our town stage to under 15 minutes?* That allows schedules, bonuses, spare-parts deals, a second pick-up point and many other ideas, including, perhaps, a terminal.",
              },
            ],
          },
          {
            id: 'hmw-size',
            title: 'Not too wide, not too narrow',
            blocks: [
              {
                id: 'intersection-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/KiXX_matatu_at_a_busy_Nairobi_intersection.jpg/1280px-KiXX_matatu_at_a_busy_Nairobi_intersection.jpg",
                alt: "A matatu covered in bold graffiti-style artwork turns at a city intersection beside billboards and traffic lights.",
                caption: "A matatu at a busy intersection in Nairobi, Kenya.",
                credit: "Photo: Lebu Ayiga / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'hmw-choice',
                type: 'choice',
                prompt: 'Which is the best-sized How might we question for Wanjiru?',
                multiple: false,
                options: [
                  { id: 'wide', text: '“How might we fix transport in Nairobi?”', correct: false, feedback: 'Too wide. It is a worthy goal, but no idea from a single SACCO could answer it.' },
                  { id: 'narrow', text: '“How might we get Driver Otieno to return by 5 p.m.?”', correct: false, feedback: 'Too narrow, and it blames one person for a system problem.' },
                  { id: 'solution', text: '“How might we get funding for ten more matatus?”', correct: false, feedback: 'A solution in disguise. More vehicles might help, or they might just park in the evening like the others.' },
                  {
                    id: 'right',
                    text: '“How might we make the evening rush the most rewarding time for our vehicles to be on the road?”',
                    correct: true,
                    feedback: 'Yes. It targets the root cause (owners resting vehicles in the evening), allows many solutions, and is something the SACCO can act on.',
                  },
                ],
                explanation:
                  "A good How might we question is **anchored in the root cause** and **open to many answers**. A quick test: can you think of five very different ideas for it in a minute? If you can only think of one, it is too narrow. If you cannot think of a first step, it is too wide.",
              },
            ],
          },
          {
            id: 'reframe-moves',
            title: 'Five ways to reframe',
            blocks: [
              {
                id: 'reframe-text',
                type: 'text',
                body: "If you are stuck, ask the question a different way. Each reframe shows the problem from a new angle and produces new ideas.",
              },
              {
                id: 'reframe-match',
                type: 'match',
                prompt: 'Kwame tries five reframes of his school’s attendance problem. Match each reframe to the move it uses.',
                pairs: [
                  { id: 'flip', left: '“How might we make Thursday the day pupils least want to miss?”', right: 'Flip it: turn the problem into its opposite' },
                  { id: 'user', left: '“How might we help mothers at the market who need childcare on Thursdays?”', right: 'Change whose problem it is' },
                  { id: 'time', left: '“How might we make sure missed Thursday lessons can be caught up later?”', right: 'Change the time or place' },
                  { id: 'zoom', left: '“How might we help the whole community support children’s schooling on market days?”', right: 'Zoom out' },
                  { id: 'constraint', left: '“How might we solve this if the school had no money at all?”', right: 'Add or remove a constraint' },
                ],
                explanation:
                  "Notice the second reframe. The pupils’ attendance problem is partly the mothers’ childcare problem. Solving it for the mothers might solve it for the pupils too. Changing whose problem it is often reveals the most surprising ideas.",
              },
            ],
          },
          {
            id: 'reframe-scenario-step',
            title: 'Reframe in the room',
            blocks: [
              {
                id: 'reframe-scenario',
                type: 'scenario',
                situation:
                  "Kwame presents to the school’s parent–teacher association. A teacher says: “Our question is simple. How do we force parents to send their children on Thursdays? Maybe fines.”\n\nSome parents look at the floor. Others look angry.",
                prompt: 'How should Kwame respond?',
                options: [
                  {
                    id: 'fines',
                    text: 'Support the idea of fines. Attendance is the law.',
                    outcome: "Several parents stop coming to PTA meetings. The few who could pay fines do; the rest keep their children home and avoid the school. Kwame loses the trust he needs.",
                    best: false,
                  },
                  {
                    id: 'reframe',
                    text: 'Offer a reframe: “What if we asked: how might we make Thursdays work for families who need help at the market?” Then invite ideas from parents first.',
                    outcome: "The mood shifts. A market mother suggests a rota where grandmothers mind the youngest children at the church hall. A teacher offers to move the hardest maths lesson from Thursday to Tuesday. The PTA leaves with three ideas to test, and parents feel like partners.",
                    best: true,
                  },
                  {
                    id: 'silent',
                    text: 'Say nothing. It is the teacher’s school.',
                    outcome: "The fines idea goes into the minutes without challenge. Kwame keeps the peace, but he lets a poorly framed question decide the meeting.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-hmw',
            title: 'Your questions',
            blocks: [
              {
                id: 'hmw-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Write several, then pick one',
                body: "Write at least three How might we questions for your problem. Use at least two of the reframe moves. Then choose the one that best combines your root cause with room for many answers. That question goes on your canvas.",
              },
              {
                id: 'hmw-reflection',
                type: 'reflection',
                prompt: 'Write three How might we questions for your problem, each using a different reframe. Mark the one you will carry forward and say why.',
                guidance: 'Check each one: Is it anchored in your root cause? Can you think of five different ideas for it? Does it avoid naming a solution?',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'constraints-analogies',
      type: 'lesson',
      title: 'Constraints and analogies',
      minutes: 22,
      required: true,
      payload: {
        steps: [
          {
            id: 'constraints-fuel',
            title: 'Constraints are fuel',
            blocks: [
              {
                id: 'constraints-text',
                type: 'text',
                body: "Unreliable power. Expensive data. Little capital. Cash economies. Long distances. It is easy to see these only as obstacles.\n\nBut constraints also force creativity. When you cannot do the expensive, obvious thing, you have to find the clever, simple one. Many of the most useful innovations from the continent were shaped by exactly these limits.",
              },
              {
                id: 'shake-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'YrZTho_o_is',
                title: "Embrace the Shake | Phil Hansen | TED Talks",
                channel: "TED",
                durationS: 601,
                caption: "Artist Phil Hansen developed a tremor that stopped him drawing the way he had trained to. Watch how a limit he could not remove became the source of his best work. Then think about the limits on your own problem.",
              },
              {
                id: 'mpesa-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg/1280px-M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg",
                alt: "A woman stands at the barred counter of a small shop painted with M-PESA and Equity Agent signs, talking to the smiling agent inside.",
                caption: "An M-PESA mobile money and bank agent in Nairobi, Kenya.",
                credit: "Photo: Fiona Graham / Wikimedia Commons, CC BY-SA 2.0",
              },
              {
                id: 'mpesa-context',
                type: 'callout',
                tone: 'context',
                title: 'Built for the phones people had',
                body: "When Kenya’s M-Pesa launched in 2007, most people did not have smartphones or bank accounts. So it was built on simple text menus that worked on any phone, and on a network of small shops where agents turned cash into mobile money and back again.\n\nThe constraints of no smartphones, no banks nearby and a cash economy did not stop the idea. They shaped it, and the shape is a large part of why it spread.",
              },
            ],
          },
          {
            id: 'constraint-choice-step',
            title: 'Design for the constraint',
            blocks: [
              {
                id: 'constraint-choice',
                type: 'choice',
                prompt: 'Kwame wants to help pupils catch up on missed Thursday maths. Most families have one shared basic phone, data is costly and power is unreliable. Which ideas fit these constraints? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'video', text: 'An app with HD video lessons', correct: false, feedback: 'Video needs a smartphone, lots of data and charging. It fights every constraint.' },
                  { id: 'sheets', text: 'Printed one-page worksheets collected from the class prefect on Friday', correct: true, feedback: 'Yes. No power, no data, no phone needed.' },
                  { id: 'sms', text: 'A weekly SMS with three practice questions, answered by text', correct: true, feedback: 'Yes. Works on any phone and costs very little.' },
                  { id: 'buddies', text: 'Study buddies: a pupil who attended explains the lesson to one who missed it', correct: true, feedback: 'Yes. Uses no technology at all, and the explaining pupil learns too.' },
                  { id: 'laptops', text: 'Give each pupil a laptop', correct: false, feedback: 'Far beyond the budget, and it does not solve power or data.' },
                ],
                explanation:
                  "Treat your constraints as design rules, not excuses. Write them down: *must work on a basic phone, must cost under ₵10 a month per pupil, must work without power*. Then generate ideas that obey the rules. You will often find the simplest ideas are the strongest.",
              },
            ],
          },
          {
            id: 'analogies',
            title: 'Borrow from elsewhere',
            blocks: [
              {
                id: 'analogy-text',
                type: 'text',
                body: "The second power tool is **analogy**: finding someone, somewhere, who has already solved a problem with the same shape, and borrowing their idea.\n\nAsk: *Who else has this kind of problem?* Amina’s problem is “perishable stock that loses value fast”. Who else has that? Fish sellers. Bakers. Florists. Pharmacies with expiry dates. Each has tricks she could borrow: ice and insulated boxes, selling yesterday’s stock at a discount, pre-orders, and “first in, first out” shelving.",
              },
              {
                id: 'analogy-match',
                type: 'match',
                prompt: 'Match each problem to a field with a similar problem that it could borrow from.',
                pairs: [
                  { id: 'tomato', left: 'Amina: tomatoes that spoil within days', right: 'Fish sellers who keep their catch fresh with ice and insulated boxes' },
                  { id: 'matatu', left: 'Wanjiru: too few vehicles on the road at rush hour', right: 'Ride-hailing apps that pay drivers more when demand is high' },
                  { id: 'returns', left: 'Fatou: online dresses returned because they do not fit', right: 'Tailors who take a few key measurements before cutting' },
                  { id: 'borehole', left: 'Uwase: no money saved for repairs', right: 'Rotating savings groups where members pay in small, regular amounts' },
                ],
                explanation:
                  "Analogies work best when you describe the problem in general terms first. “Not enough matatus” has no analogy. “Supply does not show up when demand peaks” has dozens: ride-hailing, electricity tariffs, airline pricing, even market traders who raise prices at festival time.",
              },
            ],
          },
          {
            id: 'savings-group',
            title: 'Uwase borrows an idea',
            blocks: [
              {
                id: 'borehole-scenario',
                type: 'scenario',
                situation:
                  "Uwase’s committee now knows the real cause: households stopped paying the monthly water fee, so there is no money for repairs. Families say the fee is due on one day each month, when they often have no cash.\n\nUwase notices that most women in the village belong to an *ikimina*, a savings group, where members contribute small amounts every week without fail.",
                prompt: 'Which idea makes the best use of this analogy?',
                options: [
                  {
                    id: 'enforce',
                    text: 'Keep the monthly fee and ask the village leader to enforce it more strictly',
                    outcome: "Some households pay out of fear, many do not. Relations between the committee and families sour. The analogy has not been used at all.",
                    best: false,
                  },
                  {
                    id: 'weekly',
                    text: 'Copy the ikimina pattern: a small weekly contribution, collected at the existing savings-group meetings by a trusted member',
                    outcome: "The weekly amount is small enough to find. It is collected where people already gather, by someone they trust. Within two months the repair fund has money in it for the first time in a year. The committee borrowed a habit that already worked instead of inventing a new one.",
                    best: true,
                  },
                  {
                    id: 'ngo',
                    text: 'Ask the NGO that installed the pump to pay for all future repairs',
                    outcome: "The NGO says its funding for the area has ended. The village is back where it started, now with months lost waiting for a reply.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-constraints',
            title: 'Your constraints and analogies',
            blocks: [
              {
                id: 'constraints-reflection',
                type: 'reflection',
                prompt: 'Write down two real constraints on your problem (money, power, data, time, distance, rules). Then describe your problem in general terms and name one other field that has solved a problem with the same shape. Generate two new ideas: one designed around a constraint, one borrowed through the analogy.',
                guidance: 'Add the two new ideas to your list of ten from the earlier lesson.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'borrow-discussion',
      type: 'discussion',
      title: 'Discussion: borrow a brilliant idea',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Describe a clever solution you have seen in one place or field: your town, another country, a different industry, nature, a family habit.\n\nThen suggest how it could be borrowed to solve a *different* problem. It could be your own problem, or a classmate’s from the earlier discussion.\n\nFinish your post with your current How might we question so classmates can suggest analogies for you. Reply to at least two classmates with an analogy they could borrow.",
        guidance: 'Describe the problem shape in general terms (“perishable stock”, “supply missing at peak times”) so others can see the connection.',
        minWords: 80,
      },
    },
    {
      key: 'generate-quiz',
      type: 'quiz',
      title: 'Module quiz: Generate',
      minutes: 7,
      required: true,
      gradeWeight: 6,
      payload: {
        intro: "Five questions on generating options. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-diverge',
            type: 'choice',
            prompt: 'What is the main reason to separate divergent and convergent thinking?',
            multiple: false,
            options: [
              { id: 'a', text: 'Judging ideas while generating them kills options before they can develop', correct: true },
              { id: 'b', text: 'Divergent thinking is more important', correct: false, feedback: 'Both matter equally. You need to choose eventually.' },
              { id: 'c', text: 'It makes meetings shorter', correct: false, feedback: 'It often does, but that is a side effect.' },
              { id: 'd', text: 'Convergent thinking should be done by managers only', correct: false, feedback: 'Everyone affected should have a voice in choosing, too.' },
            ],
            explanation: 'Generate first, judge later. An idea that sounds silly in minute two may become the best idea by minute ten, after someone builds on it.',
          },
          {
            id: 'q-hmw',
            type: 'choice',
            prompt: 'Fatou’s problem: half of her online dress orders are returned because they do not fit. Which How might we question is best?',
            multiple: false,
            options: [
              { id: 'a', text: '“How might we stop selling online?”', correct: false, feedback: 'That abandons the opportunity instead of solving the problem.' },
              { id: 'b', text: '“How might we help online customers choose a size that fits the first time?”', correct: true },
              { id: 'c', text: '“How might we build a 3D body-scanning app?”', correct: false, feedback: 'A solution in disguise, and an expensive one.' },
              { id: 'd', text: '“How might we transform African fashion?”', correct: false, feedback: 'Inspiring, but far too wide to guide her next step.' },
            ],
            explanation: 'Option B is anchored in the problem and open to many answers: better size charts, a quick video call fitting, adjustable designs, tailor-measured pre-orders, a “try two sizes” option.',
          },
          {
            id: 'q-constraints',
            type: 'choice',
            prompt: 'Which statement about constraints is most accurate?',
            multiple: false,
            options: [
              { id: 'a', text: 'Constraints should be removed before you start generating ideas', correct: false, feedback: 'You rarely can, and you would lose a useful design rule.' },
              { id: 'b', text: 'Constraints can be treated as design rules that push you towards simpler, more fitting ideas', correct: true },
              { id: 'c', text: 'Constraints only matter in poor communities', correct: false, feedback: 'Every project has constraints: time, money, skills, rules.' },
              { id: 'd', text: 'Constraints mean the problem cannot be solved', correct: false, feedback: 'Constraints shape solutions; they rarely make them impossible.' },
            ],
            explanation: 'M-Pesa worked on basic phones because most people only had basic phones. Designing around a constraint often produces the idea that spreads.',
          },
          {
            id: 'q-analogy',
            type: 'match',
            prompt: 'Match each general problem shape to a field that could offer an analogy.',
            pairs: [
              { id: 'perishable', left: 'Stock that loses value within days', right: 'Bakeries' },
              { id: 'peak', left: 'Supply that does not show up at peak demand', right: 'Ride-hailing' },
              { id: 'trust', left: 'Strangers who need to trust each other to trade', right: 'Market associations that vouch for members' },
              { id: 'small-payments', left: 'People who struggle to pay one large amount', right: 'Rotating savings groups' },
            ],
            explanation: 'Describing the problem in general terms is what unlocks analogies. Once you name the shape, you can ask who else has faced it.',
          },
          {
            id: 'q-session',
            type: 'choice',
            prompt: 'Why should group idea sessions usually start with silent, individual writing? Select all that apply.',
            multiple: true,
            options: [
              { id: 'loud', text: 'It stops the loudest or most senior voice from shaping every idea', correct: true },
              { id: 'quiet', text: 'It gives quieter people a fair chance to contribute', correct: true },
              { id: 'more', text: 'It usually produces a wider range of ideas', correct: true },
              { id: 'judge', text: 'It lets each person judge their own ideas before sharing', correct: false, feedback: 'The opposite. The point is to get ideas down without judging them.' },
            ],
            explanation: 'Silent writing first, then sharing without judging, then building. Simple structure, much better ideas.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 4 · Decide and Do: deciding and testing
// ---------------------------------------------------------------------------

const moduleDecide: Module = {
  key: 'decide-and-test',
  title: 'Decide and Do: choosing and testing',
  summary:
    'Choose between options with clear criteria and honest trade-offs. Tell reversible decisions from irreversible ones, imagine failure before it happens, and design the smallest experiment that will teach you something real.',
  weekNo: 2,
  items: [
    {
      key: 'criteria-trade-offs',
      type: 'lesson',
      title: 'Criteria and trade-offs',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'meet-fatou',
            title: 'Fatou’s three roads',
            blocks: [
              {
                id: 'atelier-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Atelier_de_couture%2C_Medina%2C_Dakar%2C_S%C3%A9n%C3%A9gal.jpg/1280px-Atelier_de_couture%2C_Medina%2C_Dakar%2C_S%C3%A9n%C3%A9gal.jpg",
                alt: "A crowded tailoring workshop where several tailors work at sewing machines, surrounded by stacks and rolls of colourful printed fabric.",
                caption: "A tailoring workshop in the Medina, Dakar, Senegal. Fatou’s studio is fictional; workshops like this are real.",
                credit: "Photo: Julien saison / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'fatou-story',
                type: 'callout',
                tone: 'story',
                title: 'Fatou, fashion founder, Dakar',
                body: "Fatou designs and sells dresses that mix wax prints with modern cuts. She works from a small studio in Dakar with two tailors. Sales are growing, mostly through Instagram and WhatsApp, and she has saved enough to make one big move this year. She has three options:\n\n- **A.** Open a small boutique in a busy shopping area.\n- **B.** Invest in online sales: better photos, a clear size guide and a delivery partner.\n- **C.** Bid for a contract to make uniforms for a hotel group.\n\nEveryone has an opinion. Her mother says the boutique. Her friends say online. Her accountant says the contract.",
              },
              {
                id: 'matrix-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'xO7xJ1sTyPI',
                title: "Decision Matrix Analysis: How to Make a Good Decision by Weighing Up Different Factors",
                channel: "Mindtools Kineo",
                durationS: 124,
                caption: "A two-minute introduction to decision matrix analysis: listing options, scoring them against weighted factors and adding up the totals. You will build one for Fatou in a moment.",
              },
            ],
          },
          {
            id: 'gut-check',
            title: "Your gut answer",
            blocks: [
              {
                id: 'fatou-poll',
                type: 'poll',
                prompt: 'Before any analysis: which option does your gut say Fatou should choose?',
                options: [
                  { id: 'a', text: 'A: the boutique' },
                  { id: 'b', text: 'B: online sales' },
                  { id: 'c', text: 'C: the hotel contract' },
                ],
                afterword:
                  "Hold on to your gut answer. By the end of this lesson you will see whether a clearer method agrees with it. Gut feeling is not wrong. It is just hard to explain, check or improve.",
              },
            ],
          },
          {
            id: 'criteria',
            title: 'Choose your criteria first',
            blocks: [
              {
                id: 'criteria-text',
                type: 'text',
                body: "A good decision starts with **criteria**: the things that matter in choosing. Decide them *before* you score your options, or you will quietly pick criteria that favour the option you already like.\n\nCommon criteria include impact on the problem, cost, speed, how feasible it is with your skills, risk, and fit with your values. Not all criteria matter equally, so you give each a **weight**.",
              },
              {
                id: 'criteria-choice',
                type: 'choice',
                prompt: 'Which of these are good criteria for Fatou’s decision? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'cash', text: 'How much cash it needs up front', correct: true, feedback: 'Yes. Relevant and measurable.' },
                  { id: 'returns', text: 'How much it reduces her returns problem', correct: true, feedback: 'Yes. It links the decision back to a problem she has already diagnosed.' },
                  { id: 'control', text: 'How much creative control she keeps over designs', correct: true, feedback: 'Yes. A value that matters to her brand. Criteria can include values, not just money.' },
                  { id: 'mother', text: 'Whether her mother approves', correct: false, feedback: 'Her mother’s view may be wise, but “approval” is a person, not a criterion. Ask what her mother is worried about, such as risk, and use that.' },
                  { id: 'good', text: 'How good it is', correct: false, feedback: 'Too vague to score. Good in what way? That is what the other criteria are for.' },
                ],
                explanation:
                  "Strong criteria are **relevant** to your goal, **specific** enough to score, and **different from each other** so you do not count the same thing twice.",
              },
            ],
          },
          {
            id: 'matrix',
            title: 'The decision matrix',
            blocks: [
              {
                id: 'matrix-example',
                type: 'example',
                title: 'Fatou’s matrix',
                body: "Fatou picks four criteria and weights them out of 10. Then she scores each option from 1 (poor) to 5 (excellent). These numbers are hers, not facts about the world.\n\n- **Growth potential** (weight 4): Boutique 3, Online 5, Contract 3\n- **Cash needed, lower is better** (weight 3): Boutique 1, Online 4, Contract 3\n- **Creative control** (weight 2): Boutique 5, Online 5, Contract 1\n- **Risk, lower is better** (weight 1): Boutique 2, Online 4, Contract 3\n\nEach score is multiplied by its weight, and the results are added up.",
              },
              {
                id: 'matrix-choice',
                type: 'choice',
                prompt: 'Work it out. What is the weighted total for option B, online sales?',
                multiple: false,
                options: [
                  { id: 'eighteen', text: '18', correct: false, feedback: 'That is the unweighted total (5+4+5+4). Multiply each score by its weight first.' },
                  { id: 'thirty-four', text: '34', correct: false, feedback: 'Close. Check each one: 5×4, 4×3, 5×2, 4×1.' },
                  { id: 'forty-six', text: '46', correct: true, feedback: 'Yes: 5×4 = 20, 4×3 = 12, 5×2 = 10, 4×1 = 4. Total 46.' },
                  { id: 'fifty', text: '50', correct: false, feedback: 'Too high. Check the risk line: 4 × 1 = 4.' },
                ],
                explanation:
                  "For comparison: the boutique scores 3×4 + 1×3 + 5×2 + 2×1 = 27, and the contract scores 3×4 + 3×3 + 1×2 + 3×1 = 26. Online sales wins clearly *with these weights*. The matrix does not make the decision for Fatou. It makes her reasoning visible, so she and others can question it.",
              },
            ],
          },
          {
            id: 'matrix-order',
            title: 'Build one yourself',
            blocks: [
              {
                id: 'matrix-steps',
                type: 'order',
                prompt: 'Put the steps of building a decision matrix in order.',
                items: [
                  { id: 'options', text: 'List the options you are choosing between' },
                  { id: 'criteria', text: 'Agree the criteria that matter' },
                  { id: 'weights', text: 'Give each criterion a weight' },
                  { id: 'score', text: 'Score each option against each criterion' },
                  { id: 'total', text: 'Multiply and add up the totals' },
                  { id: 'sense', text: 'Sense-check: does the result feel wrong, and if so, why?' },
                ],
                explanation:
                  "The last step is the most important. If the winner feels wrong, do not ignore the feeling and do not ignore the matrix. Ask what the feeling knows that the matrix does not. Often it is a missing criterion.",
              },
            ],
          },
          {
            id: 'trade-offs',
            title: 'Every choice gives something up',
            blocks: [
              {
                id: 'trade-off-reveal',
                type: 'reveal',
                prompt: 'Online sales won Fatou’s matrix. What is she giving up by choosing it? Think of at least two things, then tap.',
                body: "- The steady, predictable income the hotel contract would bring.\n- The presence and prestige of a physical shop, where customers can touch fabric and try on dresses.\n- The face-to-face relationships her mother’s generation built their businesses on.\n\nNaming trade-offs out loud is not weakness. It shows you understand the decision, and it tells you what to watch. If cash flow gets tight, Fatou knows the contract was the safer road and can revisit it.",
              },
              {
                id: 'gut-caution',
                type: 'callout',
                tone: 'caution',
                title: 'A matrix can hide a gut feeling',
                body: "It is easy to fiddle the weights until your favourite option wins. Protect yourself: set the weights before scoring, and then test them. If changing one weight by a single point changes the winner, the decision is closer than it looks. Treat it as a close call and gather more evidence.",
              },
            ],
          },
          {
            id: 'your-criteria',
            title: 'Your criteria',
            blocks: [
              {
                id: 'criteria-reflection',
                type: 'reflection',
                prompt: 'Pick the three most promising ideas from your list. Write down three or four criteria that matter for your problem and give each a weight. Score each idea from 1 to 5 and work out the totals. Does the result match your gut? What trade-off comes with the winner?',
                guidance: 'Include at least one criterion about the people affected, not only about cost or speed. These three ideas and their trade-offs go on your canvas.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'doors-and-premortems',
      type: 'lesson',
      title: 'One-way doors, two-way doors and the pre-mortem',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'doors',
            title: 'Can you walk back through?',
            blocks: [
              {
                id: 'doors-text',
                type: 'text',
                body: "Not every decision deserves the same care. Amazon founder Jeff Bezos popularised a simple way to tell them apart: **one-way doors** and **two-way doors**.\n\nA two-way door is reversible. If you walk through and do not like what you find, you can come back. Most decisions are like this. Make them quickly, learn, and adjust.\n\nA one-way door is hard or impossible to reverse: signing a long lease, spending all your savings, firing someone, publishing a child’s photo online. Slow down for these.",
              },
              {
                id: 'doors-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'rxsdOQa_QkM',
                title: "Jeff Bezos explains one-way door decisions and two-way door decisions",
                channel: "Startup Archive",
                durationS: 191,
                caption: "Jeff Bezos explains one-way and two-way door decisions in his own words. As you watch, think of one decision in your own life that felt like a one-way door but could have been tried first.",
              },
            ],
          },
          {
            id: 'doors-check',
            title: "Spot the two-way doors",
            blocks: [
              {
                id: 'doors-choice',
                type: 'choice',
                prompt: 'Which of Amina’s possible decisions are two-way doors, easy to reverse? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'crates', text: 'Trying plastic crates for half her stock for two weeks', correct: true, feedback: 'Yes. If crates do not help, she goes back to baskets. The cost is small.' },
                  { id: 'shade', text: 'Putting up a shade cloth over her stall', correct: true, feedback: 'Yes. Cheap, quick and easy to take down.' },
                  { id: 'loan', text: 'Taking a two-year loan to build her own cold room', correct: false, feedback: 'This is a one-way door. Once built and borrowed for, she is committed even if it does not solve the problem.' },
                  { id: 'preorder', text: 'Testing phone pre-orders with three restaurants', correct: true, feedback: 'Yes. She can stop any time.' },
                  { id: 'exclusive', text: 'Signing an exclusive three-year deal with one farmer', correct: false, feedback: 'One-way. It locks in her supply and price for years.' },
                ],
                explanation:
                  "Here is the trick: **turn one-way doors into two-way doors wherever you can.** Instead of building a cold room, rent space in a shared one for a month. Instead of a three-year deal, agree one season. You keep the learning and lose most of the risk.",
              },
            ],
          },
          {
            id: 'speed-poll',
            title: 'How you decide',
            blocks: [
              {
                id: 'speed-poll-block',
                type: 'poll',
                prompt: 'Which is closer to your own habit?',
                options: [
                  { id: 'fast', text: 'I decide fast, sometimes too fast on big things' },
                  { id: 'slow', text: 'I think a long time, sometimes too long on small things' },
                  { id: 'depends', text: 'It depends on my mood more than on the decision' },
                  { id: 'others', text: 'I usually let others decide' },
                ],
                afterword:
                  "The doors idea helps every type. Fast deciders: slow down at one-way doors. Slow deciders: speed up at two-way doors, because the cost of waiting is often higher than the cost of a reversible mistake. And if you usually let others decide, the next lesson is a cheap way to test your own ideas.",
              },
            ],
          },
          {
            id: 'premortem',
            title: 'Imagine it has already failed',
            blocks: [
              {
                id: 'premortem-text',
                type: 'text',
                body: "A post-mortem asks why something died, after it died. A **pre-mortem**, an idea from the psychologist Gary Klein, does it beforehand.\n\nBefore you commit, gather your team and say: *“Imagine it is six months from now. Our plan has failed badly. What went wrong?”* Everyone writes reasons on their own, then shares.\n\nIt works because it gives people permission to voice doubts. In a normal meeting, raising problems can sound disloyal. In a pre-mortem, finding problems is the task.",
              },
              {
                id: 'premortem-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'SPnKKSuvyfY',
                title: "Gary Klein: How to Frame a Pre-Mortem So It Actually Works",
                channel: "Capital Allocators with Ted Seides",
                durationS: 160,
                caption: "The psychologist Gary Klein, who developed the pre-mortem, explains how to frame one so that people actually voice their doubts.",
              },
              {
                id: 'premortem-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Pre-mortem', definition: 'Imagining a plan has already failed, then listing the reasons why, so you can prevent them.' },
                  { term: 'Reversible decision', definition: 'A two-way door: you can undo it at low cost if it does not work.' },
                  { term: 'Irreversible decision', definition: 'A one-way door: hard or impossible to undo, so it deserves more care and evidence.' },
                ],
              },
            ],
          },
          {
            id: 'contract-scenario',
            title: 'The three-year contract',
            blocks: [
              {
                id: 'rwanda-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/A_view_of_Nyabarongo_river.jpg/1280px-A_view_of_Nyabarongo_river.jpg",
                alt: "Green hills and a river valley lined with trees and fields, with a few houses and a dirt road in the foreground.",
                caption: "The Nyabarongo river valley in Kamonyi district, Rwanda.",
                credit: "Photo: Doltography / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'contract-scenario-block',
                type: 'scenario',
                situation:
                  "Uwase’s new weekly collection is working and the repair fund is growing. A pump supplier visits the committee with an offer: a three-year maintenance contract, paid up front, that would use almost all the money in the fund. The salesman is friendly and says the price goes up next week.\n\nSeveral members want to sign today.",
                prompt: 'What should Uwase suggest?',
                options: [
                  {
                    id: 'sign',
                    text: 'Sign today. A contract means the problem is solved for three years.',
                    outcome: "The fund is emptied. Eight months later, the supplier’s local mechanic moves away, and repairs now take weeks again. The contract is hard to cancel. The committee walked through a one-way door in a hurry.",
                    best: false,
                  },
                  {
                    id: 'premortem',
                    text: 'Run a ten-minute pre-mortem: “Imagine it’s next year and this contract was a disaster. Why?” Then ask the supplier for a one-year trial instead.',
                    outcome: "Members list worries: the supplier going out of business, a slow mechanic, no money left for emergencies. The supplier agrees to a one-year deal at a slightly higher yearly price. The committee keeps half its fund in reserve. A one-way door has become a two-way door.",
                    best: true,
                  },
                  {
                    id: 'reject',
                    text: 'Reject the offer outright. Salespeople cannot be trusted.',
                    outcome: "The committee avoids the risk but also loses a possibly useful option. A blanket rule replaced a good decision process.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'match-doors',
            title: 'Match the response',
            blocks: [
              {
                id: 'doors-match',
                type: 'match',
                prompt: 'Match each situation to the best response.',
                pairs: [
                  { id: 'cheap-reversible', left: 'A cheap, reversible choice between two stall layouts', right: 'Decide quickly and learn from what happens' },
                  { id: 'big-irreversible', left: 'Spending all your savings on equipment', right: 'Slow down, gather evidence and run a pre-mortem' },
                  { id: 'convert', left: 'A long lease on a shop you are not sure about', right: 'Look for a shorter or trial version first' },
                  { id: 'pressure', left: 'A seller who says the price rises tomorrow', right: 'Treat the deadline as pressure, not information' },
                ],
                explanation:
                  "Artificial deadlines are a classic way to push people through one-way doors. A real opportunity will usually survive a day of thinking. If it cannot, ask yourself why the seller needs you to decide so fast.",
              },
            ],
          },
          {
            id: 'your-premortem',
            title: 'Your pre-mortem',
            blocks: [
              {
                id: 'premortem-reflection',
                type: 'reflection',
                prompt: 'Take the idea that won your decision matrix. Imagine it is six months from now and it has failed. Write at least four reasons why it failed. Then say whether your idea is a one-way or a two-way door, and how you could make it more reversible.',
                guidance: 'Be honest and specific. “It didn’t work” is not a reason. “Traders didn’t trust a stranger to collect their money” is.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'smallest-experiment',
      type: 'lesson',
      title: 'The smallest useful experiment',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-test',
            title: 'Test before you build',
            blocks: [
              {
                id: 'test-text',
                type: 'text',
                body: "You have a chosen idea. You are fairly sure it will work. Now find out if you are right, as cheaply and quickly as possible.\n\nThe **smallest useful experiment** is the cheapest, fastest test that would actually change what you do next. Small enough to run this week. Useful enough that the result matters.\n\nEvery idea rests on assumptions. An experiment tests the riskiest one first.",
              },
              {
                id: 'mvp-video',
                type: 'video',
                provider: 'youtube',
                videoId: '1FoCbbbcYT8',
                title: "Eric Ries-Building the Minimum Viable Product",
                channel: "Entrepreneurship.org",
                durationS: 205,
                caption: "Eric Ries, author of The Lean Startup, on the minimum viable product: the smallest thing you can build to start learning. Compare his idea with the smallest useful experiment described here.",
              },
              {
                id: 'test-framework',
                type: 'framework',
                title: 'An experiment in five lines',
                steps: [
                  { label: 'We believe', detail: 'The change you will make, and for whom. “Using shallow crates for half my stock…”' },
                  { label: 'Will result in', detail: 'The outcome you expect. “…will mean fewer tomatoes spoil before sale.”' },
                  { label: 'We will test it by', detail: 'What you will actually do, at what scale. “Crates for five baskets’ worth, baskets for five, for two weeks.”' },
                  { label: 'We will measure', detail: 'One clear number. “Number of tomatoes thrown away from each group, counted each evening.”' },
                  { label: 'It worked if', detail: 'The threshold, decided in advance. “Crate losses are at least half of basket losses.”' },
                ],
              },
            ],
          },
          {
            id: 'threshold',
            title: 'Decide what success means first',
            blocks: [
              {
                id: 'aerial-market-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg/1280px-Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg",
                alt: "An aerial view of a large open-air market where hundreds of baskets and crates of red tomatoes are spread across the ground among crowds of traders.",
                caption: "A busy tomato market in Lagos, seen from above. Look closely and you can see tomatoes in both baskets and crates.",
                credit: "Photo: Ayorinde Ogundele / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'threshold-reveal',
                type: 'reveal',
                prompt: 'Why should Amina decide her success threshold before the experiment starts, not after she sees the results?',
                body: "Because after you see results, you will want to believe your idea worked. If crates cut losses by only a little, it is tempting to say “that’s still good!” Deciding the threshold first keeps you honest. It also helps you decide what to do next: above the line, scale up; below it, rethink.",
              },
              {
                id: 'measure-choice',
                type: 'choice',
                prompt: 'Which is the best success measure for Amina’s crate experiment?',
                multiple: false,
                options: [
                  { id: 'feel', text: 'Whether the crates feel better', correct: false, feedback: 'Feelings matter but cannot be compared fairly. Two weeks later she will not remember how the baskets felt.' },
                  { id: 'customers', text: 'Whether customers like the crates', correct: false, feedback: 'Interesting, but not her problem. Her problem is spoilage.' },
                  {
                    id: 'count',
                    text: 'The number of tomatoes thrown away from crates compared with baskets, counted each evening',
                    correct: true,
                    feedback: 'Yes. One number, measured the same way each day, comparing the new approach with the old under the same conditions.',
                  },
                  { id: 'profit', text: 'Her total profit for the year', correct: false, feedback: 'Too slow and affected by too many other things. She would wait a year and still not know if crates helped.' },
                ],
                explanation:
                  "A good measure is **directly linked to the problem**, **quick to collect** and **compared with something**, here the baskets she still uses for the other half of her stock. That comparison is what turns a trial into an experiment.",
              },
            ],
          },
          {
            id: 'small-useful',
            title: 'Small and useful',
            blocks: [
              {
                id: 'small-choice',
                type: 'choice',
                prompt: 'What makes an experiment “smallest useful”? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'riskiest', text: 'It tests the riskiest assumption first', correct: true, feedback: 'Yes. Test the thing most likely to sink the idea.' },
                  { id: 'cheap', text: 'It costs little enough that failure would not hurt much', correct: true, feedback: 'Yes. Cheap failure is a gift. It buys knowledge.' },
                  { id: 'decision', text: 'Its result would change what you do next', correct: true, feedback: 'Yes. If no result would change your plans, it is not an experiment, it is a ritual.' },
                  { id: 'perfect', text: 'It uses the full, finished version of the solution', correct: false, feedback: 'The opposite. Use the roughest version that can still teach you something.' },
                  { id: 'proves', text: 'It is designed to prove you were right', correct: false, feedback: 'An experiment should be able to prove you wrong. That is the point.' },
                ],
                explanation:
                  "The question to ask is: *What is the least I can do to learn the most important thing?* Usually that is far less than you think.",
              },
            ],
          },
          {
            id: 'test-types',
            title: 'Ways to test cheaply',
            blocks: [
              {
                id: 'test-types-match',
                type: 'match',
                prompt: 'Match each idea to the cheapest useful way to test it.',
                pairs: [
                  { id: 'concierge', left: 'Kwame’s study-buddy idea for missed lessons', right: 'Run it by hand for one class for three Thursdays before building any system' },
                  { id: 'preorder', left: 'Fatou’s made-to-measure dress line', right: 'Post it on WhatsApp and take paid pre-orders before making any' },
                  { id: 'pilot', left: 'Wanjiru’s evening bonus for vehicle owners', right: 'Try it on one route for two weeks and compare waiting times' },
                  { id: 'paper', left: 'Tunde’s new deposit flow in the app', right: 'Show traders paper sketches of the screens and watch them try to use them' },
                ],
                explanation:
                  "Doing it by hand, taking pre-orders, running a pilot with one group and testing paper sketches are four of the most useful experiments there are. None of them needs funding. All of them can be done in a week or two.",
              },
            ],
          },
          {
            id: 'tunde-test',
            title: 'Tunde’s next move',
            blocks: [
              {
                id: 'tunde-test-scenario',
                type: 'scenario',
                situation:
                  "Tunde now believes traders stop saving because walking to an agent to deposit cash is harder than paying the daily collector who comes to their stall. His idea: partner with trusted collectors so traders can deposit at their stall, through the collector, into the app.\n\nHis engineers say building this properly would take three months.",
                prompt: 'What is Tunde’s smallest useful experiment?',
                options: [
                  {
                    id: 'build',
                    text: 'Build the full collector feature over three months, then launch it to everyone',
                    outcome: "Three months and much of the budget later, the feature launches. It turns out collectors do not want to carry cash for the app without a bigger commission. Nobody asked them. The team learnt the most important lesson as late and as expensively as possible.",
                    best: false,
                  },
                  {
                    id: 'manual',
                    text: 'Find two collectors at one market. For three weeks, they collect as usual and a team member enters the deposits into the app by hand each evening. Measure how many traders make a second deposit.',
                    outcome: "Within a week Tunde learns that traders love it, and that collectors need a better commission to take part. By week three, second deposits in the pilot group are far higher than in the rest of the app. He goes back to the engineers with evidence, a clear design and a commission model. Cost: a few weeks of one person’s evenings.",
                    best: true,
                  },
                  {
                    id: 'survey',
                    text: 'Survey 500 traders asking if they would use a collector feature',
                    outcome: "Most say yes. Tunde still does not know if they will actually deposit, or if collectors will take part. A survey about the future cannot test behaviour.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'cheap-tests-context',
            title: 'Testing where you are',
            blocks: [
              {
                id: 'cheap-tests',
                type: 'callout',
                tone: 'context',
                title: 'Tools you already have',
                body: "A WhatsApp Business catalogue can test whether anyone wants a product. A mobile money pre-order tests whether they will pay, which is far stronger evidence than a “yes”. One street, one class, one route or one market day is a perfectly good pilot. A notebook and a pen are a perfectly good measuring system.",
              },
            ],
          },
          {
            id: 'your-experiment',
            title: 'Design your experiment',
            blocks: [
              {
                id: 'experiment-reflection',
                type: 'reflection',
                prompt: 'Design the smallest useful experiment for your chosen idea using the five lines: We believe… Will result in… We will test it by… We will measure… It worked if… Add when you will start and what you will do if it fails.',
                guidance: 'This becomes the “next experiment” and “how we will know it worked” boxes of your canvas. Can you start it within seven days, for almost no money?',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'decide-quiz',
      type: 'quiz',
      title: 'Module quiz: Decide and Do',
      minutes: 8,
      required: true,
      gradeWeight: 6,
      payload: {
        intro: "Six questions on criteria, trade-offs, reversible decisions and experiments. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-criteria-first',
            type: 'choice',
            prompt: 'Why should you set your criteria and weights before scoring options?',
            multiple: false,
            options: [
              { id: 'a', text: 'So you do not unconsciously pick criteria that favour the option you already like', correct: true },
              { id: 'b', text: 'Because it is faster', correct: false, feedback: 'Speed is not the main reason.' },
              { id: 'c', text: 'Because weights never change', correct: false, feedback: 'You can revisit weights, but do it openly and check whether the winner changes.' },
              { id: 'd', text: 'So you can skip the sense-check', correct: false, feedback: 'The sense-check is always worth doing.' },
            ],
            explanation: 'Fixing criteria first protects you from your own bias. It also makes your reasoning easier for others to trust.',
          },
          {
            id: 'q-weighted',
            type: 'choice',
            prompt: 'An option scores 4 on a criterion weighted 3, and 2 on a criterion weighted 5. What is its weighted total?',
            multiple: false,
            options: [
              { id: 'a', text: '6', correct: false, feedback: 'That adds the scores only. Multiply each by its weight.' },
              { id: 'b', text: '14', correct: false, feedback: 'Check the multiplication: 4 × 3 and 2 × 5.' },
              { id: 'c', text: '22', correct: true },
              { id: 'd', text: '40', correct: false, feedback: 'That multiplies everything together. Multiply each pair, then add.' },
            ],
            explanation: '4 × 3 = 12 and 2 × 5 = 10. 12 + 10 = 22.',
          },
          {
            id: 'q-doors',
            type: 'match',
            prompt: 'Match each decision to its type.',
            pairs: [
              { id: 'menu', left: 'Changing the price on a WhatsApp catalogue for a week', right: 'Two-way door: decide fast' },
              { id: 'lease', left: 'Signing a five-year lease on a shop', right: 'One-way door: slow down' },
              { id: 'trial', left: 'Turning a five-year lease into a six-month trial', right: 'Making a one-way door reversible' },
            ],
            explanation: 'Most decisions are two-way doors. Save your careful thinking for the few that are not, and try to turn those into trials.',
          },
          {
            id: 'q-premortem',
            type: 'choice',
            prompt: 'What makes a pre-mortem useful?',
            multiple: false,
            options: [
              { id: 'a', text: 'It predicts exactly what will go wrong', correct: false, feedback: 'Nobody can predict exactly. It surfaces risks you can prepare for.' },
              { id: 'b', text: 'It makes raising doubts the task, so people share concerns they would otherwise keep quiet', correct: true },
              { id: 'c', text: 'It replaces the need to test', correct: false, feedback: 'It improves your plan; it does not replace evidence.' },
              { id: 'd', text: 'It is done after a project fails', correct: false, feedback: 'That is a post-mortem. A pre-mortem is done before.' },
            ],
            explanation: 'By imagining failure has already happened, the pre-mortem turns doubts from disloyalty into contribution.',
          },
          {
            id: 'q-experiment-order',
            type: 'order',
            prompt: 'Put the five lines of an experiment in order.',
            items: [
              { id: 'believe', text: 'We believe…' },
              { id: 'result', text: 'Will result in…' },
              { id: 'test', text: 'We will test it by…' },
              { id: 'measure', text: 'We will measure…' },
              { id: 'worked', text: 'It worked if…' },
            ],
            explanation: 'Change, expected outcome, the test itself, the measure, and the threshold decided in advance.',
          },
          {
            id: 'q-best-test',
            type: 'choice',
            prompt: 'A student wants to start a lunch delivery service for office workers in Accra. Which is the smallest useful experiment?',
            multiple: false,
            options: [
              { id: 'a', text: 'Build a delivery app and hire five riders', correct: false, feedback: 'Expensive and slow, and it tests everything at once.' },
              { id: 'b', text: 'Ask 100 people on social media if they would order', correct: false, feedback: 'Answers about the future are unreliable. People say yes and do not order.' },
              { id: 'c', text: 'Take paid mobile money pre-orders from one office for one week and deliver by hand', correct: true },
              { id: 'd', text: 'Write a full business plan first', correct: false, feedback: 'Plans are useful, but this one would rest on untested guesses.' },
            ],
            explanation: 'Paid pre-orders test real demand; one office keeps it small; delivering by hand tests the service before any technology is built.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 5 · Problem solving with people, and the Problem Definition Canvas
// ---------------------------------------------------------------------------

const canvasTemplate = [
  'PROBLEM DEFINITION CANVAS',
  '',
  '1. Problem statement',
  'Who is affected, what the gap is, where and when it shows up, how big it is, and why it matters. No solution inside.',
  '',
  '2. Who is affected, and how much',
  'The specific groups affected, how many people, how often, and what it costs them in money, time, health or dignity.',
  '',
  '3. Evidence',
  'What you observed, who you spoke to (how many, and who), and any records or counts. Label anecdotes, data and opinion.',
  '',
  '4. Root causes',
  'Your 5 Whys chain and the main bones of your fishbone. Mark the root cause you will work on, and how you checked it.',
  '',
  '5. Constraints',
  'Money, time, power, data, distance, rules, skills. The design rules any solution must respect.',
  '',
  '6. How might we…?',
  'The one question you are answering.',
  '',
  '7. Three candidate solutions and their trade-offs',
  'Option A: … Gains: … Gives up: …',
  'Option B: … Gains: … Gives up: …',
  'Option C: … Gains: … Gives up: …',
  'Your criteria, weights and totals, and which option you chose.',
  '',
  '8. Stakeholders and ethics',
  'Who has power or interest, who must be involved, and who could be harmed. What you will do about it.',
  '',
  '9. Next experiment',
  'We believe… Will result in… We will test it by… Starting on…',
  '',
  '10. How we will know it worked',
  'We will measure… It worked if… If it fails we will…',
].join('\n');

const modulePeople: Module = {
  key: 'people',
  title: 'Problem solving with people',
  summary:
    'Real problems live among people with different power, interests and risks. Map your stakeholders, think through who could be harmed, tell your problem story well, and bring everything together in your Problem Definition Canvas.',
  weekNo: 2,
  items: [
    {
      key: 'stakeholders',
      type: 'lesson',
      title: 'Stakeholders, power and incentives',
      minutes: 29,
      required: true,
      payload: {
        steps: [
          {
            id: 'who-is-involved',
            title: 'Problems belong to people',
            blocks: [
              {
                id: 'stakeholders-text',
                type: 'text',
                body: "A **stakeholder** is anyone who affects your problem, is affected by it, or could block or support a solution.\n\nThe first borehole plan in Uwase’s village failed partly because the committee thought only about the pump. But the water point involved many people: the women and girls who fetch most of the water, households paying the fee, cattle keepers whose animals drank at the trough, the village leader, sector officials, the mechanic in the next town, and the NGO that installed the pump years ago.\n\nEach of them sees the problem differently. Each of them wants something.",
              },
              {
                id: 'listen-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'chXsLtHqfdM',
                title: "Ernesto Sirolli: Want to help someone? Shut up and listen!",
                channel: "TED",
                durationS: 1030,
                caption: "Ernesto Sirolli tells the story of an aid project in Zambia that went badly wrong, and what it taught him about listening to the people you want to help. Watch it with Uwase’s borehole committee in mind. It runs about 17 minutes.",
              },
              {
                id: 'stakeholder-reveal',
                type: 'reveal',
                prompt: 'Of everyone in that list, who do you think had the most to gain from fixing the borehole, and the least say in the committee? Think, then tap.',
                body: "The women and girls who walk to the stream when the pump fails. They carry the heaviest cost: hours of walking, missed school, risk on the path. In many villages they are also under-represented on water committees.\n\nThis pattern is common everywhere: the people who carry a problem most are often not the people who make decisions about it. Good problem solvers go looking for them.",
              },
            ],
          },
          {
            id: 'grid',
            title: 'The power and interest grid',
            blocks: [
              {
                id: 'meeting-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Rwanda_Spark_Community_Meeting.jpg/1280px-Rwanda_Spark_Community_Meeting.jpg",
                alt: "A row of women, several holding small children, sit outdoors with raised fists at the start of a community meeting, with misty hills behind.",
                caption: "A community group in Rwanda opens its weekly meeting. The people who carry a problem most deserve a real voice in solving it.",
                credit: "Photo: Bet240 / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'grid-framework',
                type: 'framework',
                title: 'Power and interest grid',
                steps: [
                  { label: 'High power, high interest', detail: 'Work closely with them. Involve them in decisions. They can make or break your solution.' },
                  { label: 'High power, low interest', detail: 'Keep them satisfied. Brief them, do not overload them, and make sure nothing surprises them.' },
                  { label: 'Low power, high interest', detail: 'Keep them informed and involved. They often hold the best knowledge, and they deserve a voice.' },
                  { label: 'Low power, low interest', detail: 'Keep an eye on them. Their position may change.' },
                ],
              },
              {
                id: 'grid-match',
                type: 'match',
                prompt: 'Place Uwase’s stakeholders on the grid.',
                pairs: [
                  { id: 'leader', left: 'The village leader, who must approve any new fee arrangement', right: 'High power, high interest' },
                  { id: 'sector', left: 'The sector official, who rarely visits but controls water-point permits', right: 'High power, low interest' },
                  { id: 'women', left: 'The women and girls who fetch water every day', right: 'Low power, high interest' },
                  { id: 'trader', left: 'A shopkeeper who uses a private tank and rarely uses the pump', right: 'Low power, low interest' },
                ],
                explanation:
                  "Placing people on the grid is a judgement, not a fact, and it can change. One goal of good problem solving is to move the people who carry the problem, here the women and girls, towards more power. Uwase did this by asking the savings-group leaders, most of them women, to run the weekly collection.",
              },
            ],
          },
          {
            id: 'incentives',
            title: 'Follow the incentives',
            blocks: [
              {
                id: 'incentives-text',
                type: 'text',
                body: "People respond to what they gain or lose. If a solution asks someone to do more work with no benefit, expect resistance, however good the idea.\n\nRemember Wanjiru’s SACCO: owners were paid the same per trip at noon and at 6 p.m., so the evening rush was not worth their while. And Tunde’s collectors would not carry cash for the app without a fair commission. In both cases, the solution only worked once the incentives made sense for everyone involved.",
              },
              {
                id: 'elephants',
                type: 'quote',
                text: 'When elephants fight, it is the grass that suffers.',
                attribution: 'African proverb',
              },
            ],
          },
          {
            id: 'cattle-scenario',
            title: 'The cattle keeper',
            blocks: [
              {
                id: 'cattle-scenario-block',
                type: 'scenario',
                situation:
                  "At a village meeting about the new weekly water contribution, a respected cattle keeper stands up. “My animals have drunk from that trough for years. Now I must pay every week? I will not.” Others murmur in agreement. His cattle use far more water than any household.",
                prompt: 'What is the best way for the committee to respond?',
                options: [
                  {
                    id: 'exempt',
                    text: 'Exempt him to avoid conflict. He is respected.',
                    outcome: "The meeting calms down, but other households notice. Within weeks, several say: “If he doesn’t pay, why should we?” The collection starts to fall apart.",
                    best: false,
                  },
                  {
                    id: 'listen',
                    text: 'Ask what would make the arrangement fair to him, and explore a separate rate for livestock, perhaps paid after market sales when he has cash',
                    outcome: "The cattle keeper explains that his cash comes in lumps after he sells animals, not weekly. The committee agrees a livestock rate paid monthly after market day. He becomes a supporter and helps persuade other cattle keepers. Listening to his incentives turned a blocker into an ally.",
                    best: true,
                  },
                  {
                    id: 'ban',
                    text: 'Ban his cattle from the trough',
                    outcome: "The conflict escalates. The cattle keeper goes to the village leader, and the whole new arrangement is put on hold while the dispute is settled.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'missing-voices',
            title: 'Who is missing?',
            blocks: [
              {
                id: 'missing-choice',
                type: 'choice',
                prompt: 'Kwame has spoken to the head teacher, two teachers and ten pupils who attend on Thursdays. Whose voices are still missing? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'absent', text: 'Pupils who are absent on Thursdays', correct: true, feedback: 'Yes. They are the heart of the problem, and survivorship bias kept them out.' },
                  { id: 'mothers', text: 'Mothers who trade at the market', correct: true, feedback: 'Yes. Their childcare needs turned out to be a root cause.' },
                  { id: 'grandmothers', text: 'Grandmothers and neighbours who already mind children', correct: true, feedback: 'Yes. They are part of any childcare solution, and part of the current system.' },
                  { id: 'head', text: 'The head teacher', correct: false, feedback: 'Kwame has already spoken to the head teacher.' },
                ],
                explanation:
                  "A useful habit: for every stakeholder list, ask *“Who carries this problem, and have I heard from them directly?”* If the answer is no, your diagnosis is not finished.",
              },
            ],
          },
          {
            id: 'your-stakeholders',
            title: 'Map your stakeholders',
            blocks: [
              {
                id: 'stakeholders-poll',
                type: 'poll',
                prompt: 'For your own problem, which stakeholder group do you think will be hardest to win over?',
                options: [
                  { id: 'leaders', text: 'Leaders or officials with power' },
                  { id: 'affected', text: 'The people affected, because they have been let down before' },
                  { id: 'funders', text: 'Funders or investors' },
                  { id: 'peers', text: 'My own team, family or peers' },
                  { id: 'competitors', text: 'People who benefit from things staying as they are' },
                ],
                afterword:
                  "Whichever you chose, the approach is the same: understand what they gain and lose, and design so that they gain enough to say yes. Watch especially for the last group. Every problem that has lasted a long time is usually benefiting someone.",
              },
              {
                id: 'stakeholders-reflection',
                type: 'reflection',
                prompt: 'List at least six stakeholders for your problem. Place each on the power and interest grid. For the two most important, write what they gain and lose from your chosen solution. Who carries the problem most, and how will you involve them?',
                guidance: 'Include people who could block your idea, not only those who will love it.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'ethics',
      type: 'lesson',
      title: 'Ethics: who carries the risk?',
      minutes: 31,
      required: true,
      payload: {
        steps: [
          {
            id: 'good-intentions',
            title: 'Good intentions are not enough',
            blocks: [
              {
                id: 'intentions-text',
                type: 'text',
                body: "Most harm caused by problem solvers is not caused by bad people. It is caused by good people who did not think about who carries the risk.\n\nA fix that helps most people can still hurt some. A test that is cheap for you can be costly for the people you test it on. Before you act, ask five questions.",
              },
              {
                id: 'single-story-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'D9Ihs241zeg',
                title: "Chimamanda Ngozi Adichie: The Danger of a Single Story | TED",
                channel: "TED",
                durationS: 1156,
                caption: "Novelist Chimamanda Ngozi Adichie on the danger of a single story. Watch for how one-dimensional stories strip people of dignity, then ask how your own project will describe the people it serves. It runs about 19 minutes and is worth every one.",
              },
              {
                id: 'ethics-framework',
                type: 'framework',
                title: 'Five ethics questions',
                steps: [
                  { label: 'Who benefits?', detail: 'Who gains if this works? Is it the people who carry the problem, or someone else?' },
                  { label: 'Who carries the cost?', detail: 'Who pays, works harder, takes the risk or loses something, even if the plan succeeds?' },
                  { label: 'Did they agree?', detail: 'Have the people affected understood and agreed, freely, without pressure?' },
                  { label: 'What could go wrong?', detail: 'What unintended consequences could follow, and for whom?' },
                  { label: 'Would I accept it?', detail: 'Would I accept this if it were done to my own family?' },
                ],
              },
            ],
          },
          {
            id: 'nothing-about-us',
            title: 'Nothing about us without us',
            blocks: [
              {
                id: 'nothing-quote',
                type: 'quote',
                text: 'Nothing about us without us.',
                attribution: 'Slogan of the disability rights movement',
              },
              {
                id: 'nothing-text',
                type: 'text',
                body: "The disability rights movement made this slogan famous, and it applies to every problem in this course. Solutions designed *for* people, without them, are often wrong and sometimes harmful. Solutions designed *with* them are more likely to work and to last.",
              },
            ],
          },
          {
            id: 'data-scenario',
            title: 'Tunde’s data question',
            blocks: [
              {
                id: 'ikorodu-image',
                type: 'image',
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/IWORO_MARKET_DAY_IN_IKORODU_LAGOS_STATE%2C_NIGERIA.jpg/1280px-IWORO_MARKET_DAY_IN_IKORODU_LAGOS_STATE%2C_NIGERIA.jpg",
                alt: "A busy open-air market under dozens of large colourful umbrellas, with traders and shoppers between the stalls and houses behind.",
                caption: "Market day in Ikorodu, Lagos State, Nigeria.",
                credit: "Photo: Azzawaady / Wikimedia Commons, CC BY-SA 4.0",
              },
              {
                id: 'data-scenario-block',
                type: 'scenario',
                situation:
                  "The collector pilot is a success. Now Tunde’s company has months of detailed records of traders’ daily deposits. A lending company offers to pay well for that data so it can offer traders loans. The sales director says: “The traders agreed to our terms and conditions. It’s legal. Let’s do it.”\n\nMost traders accepted those terms by tapping “I agree” on a screen they did not read.",
                prompt: 'What should Tunde argue for?',
                options: [
                  {
                    id: 'sell',
                    text: 'Share the data. It is legal and could get traders access to loans.',
                    outcome: "Traders start receiving aggressive loan offers they did not ask for. Word spreads in the market that the app “sells your business to moneylenders”. Deposits fall faster than they rose. Trust took months to earn and a week to lose.",
                    best: false,
                  },
                  {
                    id: 'consent',
                    text: 'Only share data for traders who clearly opt in, after a plain explanation in their language of what is shared, with whom, and what they get',
                    outcome: "Fewer traders’ data is shared, and the deal is smaller. But those who opt in understand it and many appreciate the loan offers. The app’s reputation for respect grows, and so do deposits. Ethical choices are often also good long-term business.",
                    best: true,
                  },
                  {
                    id: 'never',
                    text: 'Refuse ever to discuss data sharing',
                    outcome: "Tunde protects traders from one risk but also closes off an option some traders might genuinely want. A better answer would put the choice in their hands.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'red-flags',
            title: 'Spot the red flags',
            blocks: [
              {
                id: 'red-flags-choice',
                type: 'choice',
                prompt: 'Kwame is preparing to promote his study-buddy programme. Which of his plans raise ethical red flags? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'photos', text: 'Posting photos of pupils on social media without asking their parents', correct: true, feedback: 'Yes. Children cannot give consent, and parents have not. A photo online is a one-way door.' },
                  { id: 'absent-list', text: 'Sharing a list of pupils with the most absences in the WhatsApp group of all parents', correct: true, feedback: 'Yes. This shames children and families publicly, and could expose difficult home situations.' },
                  { id: 'promise', text: 'Telling funders that the programme “guarantees” better exam results', correct: true, feedback: 'Yes. He has no evidence for a guarantee. Overclaiming misleads funders and sets families up for disappointment.' },
                  { id: 'share-results', text: 'Sharing the pilot results, without names, with the PTA', correct: false, feedback: 'This is good practice: it gives back to the community and protects identities.' },
                  { id: 'ask-pupils', text: 'Asking pupils what they liked and disliked about the programme', correct: false, feedback: 'This is good practice, and it gives pupils a voice in improving it.' },
                ],
                explanation:
                  "Common red flags: using images or data without consent, exposing vulnerable people, overclaiming results, and testing on people who cannot say no. A simple check before any action: *Could this embarrass, endanger or mislead anyone?*",
              },
            ],
          },
          {
            id: 'unintended',
            title: 'Unintended consequences',
            blocks: [
              {
                id: 'unintended-example',
                type: 'example',
                title: 'When the crates worked',
                body: "Amina’s crate experiment worked. Her losses dropped sharply. Then she noticed something: the young porters who carried baskets from trucks to stalls were earning less, because crates were lighter and traders carried them themselves.\n\nAmina had not done anything wrong. But she now knew her solution moved a cost onto someone else. She and two other traders agreed to keep paying porters to unload, and the porters started cleaning and stacking crates for a small fee. A new problem, noticed early, solved together.",
              },
              {
                id: 'unintended-scale',
                type: 'scale',
                prompt: 'When you plan something, how often do you stop to think about who might be harmed, even if things go well?',
                minLabel: 'Rarely',
                maxLabel: 'Every time',
                afterword:
                  "Few people do this automatically. It is a habit, and like all habits it gets easier with practice. The ethics box on your canvas is there to make you practise.",
              },
            ],
          },
          {
            id: 'your-ethics',
            title: 'Your ethics check',
            blocks: [
              {
                id: 'ethics-reflection',
                type: 'reflection',
                prompt: 'Run the five ethics questions on your chosen solution and experiment. Who benefits? Who carries the cost? Have they agreed? What could go wrong, and for whom? Would you accept it for your own family? Write one change you will make as a result.',
                guidance: 'If you cannot think of anyone who might be harmed, ask someone affected by the problem. They often can.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'problem-story',
      type: 'lesson',
      title: 'Telling the problem story',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-story',
            title: 'Problems need champions',
            blocks: [
              {
                id: 'story-text',
                type: 'text',
                body: "You will rarely solve a real problem alone. You will need a team, a leader’s approval, a funder’s money or a community’s trust. To get them, you must explain the problem so clearly that others care about it as much as you do.\n\nMost people pitch their solution first. Strong problem solvers tell the problem story first. When people understand the problem, they help you find and improve the solution. When they only hear the solution, they argue about it.",
              },
              {
                id: 'story-video',
                type: 'video',
                provider: 'youtube',
                videoId: '9JrRQ1oQWQk',
                title: "Nancy Duarte: How to Tell a Story",
                channel: "Stanford Graduate School of Business",
                durationS: 181,
                caption: "Presentation expert Nancy Duarte on telling a story that moves people to act. Notice how she links the shape of a story to persuasion, then compare it with the problem story structure in the next step.",
              },
              {
                id: 'together-quote',
                type: 'quote',
                text: 'If you want to go fast, go alone. If you want to go far, go together.',
                attribution: 'African proverb',
              },
            ],
          },
          {
            id: 'story-order',
            title: 'The shape of a problem story',
            blocks: [
              {
                id: 'story-order-block',
                type: 'order',
                prompt: 'Put the parts of a two-minute problem story in a strong order.',
                items: [
                  { id: 'person', text: 'A real person or moment that makes the problem human' },
                  { id: 'size', text: 'How big the problem is, with your evidence' },
                  { id: 'cause', text: 'What is really causing it, and how you know' },
                  { id: 'test', text: 'What you are going to test, and how you will know it worked' },
                  { id: 'ask', text: 'A clear, specific ask of your listener' },
                ],
                explanation:
                  "Start with a person to make people care, use evidence to make them trust you, explain the cause to show you understand, describe the test to show you are careful, and finish with an ask so they know how to help. Without the ask, a good story ends in applause and nothing else.",
              },
            ],
          },
          {
            id: 'opening',
            title: 'The first sentence',
            blocks: [
              {
                id: 'opening-choice',
                type: 'choice',
                prompt: 'Kwame has two minutes with the district education officer. Which opening is strongest?',
                multiple: false,
                options: [
                  { id: 'solution', text: '“I have an exciting study-buddy app idea I’d like to tell you about.”', correct: false, feedback: 'Solution first. The officer will start judging the app before she understands why it matters.' },
                  { id: 'stats', text: '“Education is the foundation of national development.”', correct: false, feedback: 'True and forgettable. It tells her nothing she does not already know.' },
                  {
                    id: 'person',
                    text: '“Every Thursday, Ama, who is thirteen, minds her baby brother at the market instead of sitting her maths lesson. A third of her class does the same.”',
                    correct: true,
                    feedback: 'Yes. A real person, a specific moment, and a sense of scale, all in two sentences.',
                  },
                  { id: 'apology', text: '“Sorry to take your time, I know you’re very busy.”', correct: false, feedback: 'Polite, but it uses your best seconds to suggest your message is not important.' },
                ],
                explanation:
                  "The first sentence decides whether someone keeps listening. A specific person in a specific moment is almost always stronger than a general statement. (If you use a real person’s story, get their permission and change their name if needed.)",
              },
            ],
          },
          {
            id: 'audiences',
            title: 'Know your audience',
            blocks: [
              {
                id: 'audience-match',
                type: 'match',
                prompt: 'The same problem story needs a different emphasis for different listeners. Match each audience to what they most need to hear.',
                pairs: [
                  { id: 'elders', left: 'Community elders', right: 'Respect for how things are done, and who has been consulted' },
                  { id: 'investor', left: 'An investor', right: 'The size of the opportunity and how the venture will make money' },
                  { id: 'official', left: 'A government official', right: 'How it fits their mandate and what it asks of them' },
                  { id: 'affected', left: 'The people affected', right: 'What changes for them, what it costs them, and that their voice shaped it' },
                ],
                explanation:
                  "Your evidence and your root cause stay the same. What changes is what you lead with and what you ask for. Before any conversation, ask yourself: *What does this person care about, and what can they actually do for me?*",
              },
            ],
          },
          {
            id: 'canvas-preview',
            title: 'Your canvas comes together',
            blocks: [
              {
                id: 'canvas-framework',
                type: 'framework',
                title: 'The Problem Definition Canvas',
                steps: [
                  { label: 'Problem statement', detail: 'Who, what gap, where and when, how much, why it matters.' },
                  { label: 'Who and how much', detail: 'The people affected and what it costs them.' },
                  { label: 'Evidence', detail: 'What you saw, heard and counted.' },
                  { label: 'Root causes', detail: 'Your 5 Whys and fishbone, and the cause you will work on.' },
                  { label: 'Constraints', detail: 'The design rules any solution must respect.' },
                  { label: 'Three options', detail: 'Candidate solutions with their trade-offs, and your choice.' },
                  { label: 'Stakeholders and ethics', detail: 'Who must be involved, and who could be harmed.' },
                  { label: 'Next experiment', detail: 'The smallest useful test, starting within a week.' },
                  { label: 'How you will know', detail: 'Your measure and success threshold, decided in advance.' },
                ],
              },
              {
                id: 'canvas-reveal',
                type: 'reveal',
                prompt: 'Look at the canvas boxes. How many have you already drafted in your journal during this course?',
                body: "Probably all of them. Every reflection you wrote built a piece: your problem statement in Module 1, your evidence and root causes in Module 2, your ideas and How might we question in Module 3, your criteria, pre-mortem and experiment in Module 4, and your stakeholders and ethics check in this module. The assignment asks you to bring them together, sharpen them and make them fit on one page.",
              },
            ],
          },
          {
            id: 'your-story',
            title: 'Your 60-second story',
            blocks: [
              {
                id: 'story-reflection',
                type: 'reflection',
                prompt: 'Write a 60-second problem story for your problem, about 150 words. Start with a person or moment, give the size and evidence, name the root cause, say what you will test, and end with a specific ask. Name who you would tell it to.',
                guidance: 'Read it aloud and time it. You will use this story at the Saturday session and again in your Dream Residency.',
                minWords: 100,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'peer-review-discussion',
      type: 'discussion',
      title: 'Discussion: peer review your problem',
      minutes: 20,
      required: true,
      payload: {
        prompt:
          "Before you submit your canvas, get feedback from your peers.\n\nPost three things:\n\n1. Your current problem statement.\n2. The root cause you plan to work on, and the evidence behind it.\n3. Your next experiment in one or two sentences.\n\nThen give feedback to at least two classmates using these questions:\n\n- Is their problem statement a real gap, or is a solution hiding inside it?\n- Do you understand who is affected and how much?\n- Is their root cause backed by evidence, or still a guess?\n- Could their experiment start within a week, and would the result change what they do next?\n\nEnd each reply with one specific suggestion.",
        guidance: 'Be kind, be specific, be helpful. “Great work!” helps nobody. “Your statement says ‘lack of a website’, which might be a solution in disguise. What would a website change?” helps a lot.',
        minWords: 100,
      },
    },
    {
      key: 'people-quiz',
      type: 'quiz',
      title: 'Module quiz: Problem solving with people',
      minutes: 6,
      required: true,
      gradeWeight: 6,
      payload: {
        intro: "Five questions on stakeholders, ethics and the problem story. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-stakeholder',
            type: 'choice',
            prompt: 'Which is the best definition of a stakeholder?',
            multiple: false,
            options: [
              { id: 'a', text: 'Someone who has invested money in the project', correct: false, feedback: 'Investors are one kind of stakeholder, but far from the only kind.' },
              { id: 'b', text: 'Anyone who affects the problem, is affected by it, or could block or support a solution', correct: true },
              { id: 'c', text: 'The leader of the community', correct: false, feedback: 'Leaders are important stakeholders, but not the only ones.' },
              { id: 'd', text: 'People who agree with your solution', correct: false, feedback: 'People who disagree are stakeholders too, often the most important ones to understand.' },
            ],
            explanation: 'The definition is wide on purpose. Problem solvers get into trouble by forgetting people, not by including too many.',
          },
          {
            id: 'q-grid',
            type: 'choice',
            prompt: 'A group has low power but high interest in your problem. How should you treat them?',
            multiple: false,
            options: [
              { id: 'a', text: 'Ignore them; they cannot block you', correct: false, feedback: 'They often know the problem best, and ignoring them is how solutions fail on the ground.' },
              { id: 'b', text: 'Keep them informed and involved, and look for ways to give them more voice', correct: true },
              { id: 'c', text: 'Only contact them once the solution is built', correct: false, feedback: 'Too late. Their knowledge is most useful during diagnosis.' },
              { id: 'd', text: 'Give them the final decision on everything', correct: false, feedback: 'Their voice matters, but high-power stakeholders also need to be engaged.' },
            ],
            explanation: 'Low-power, high-interest groups often carry the problem. Uwase gave the women and girls more power by putting savings-group leaders in charge of collection.',
          },
          {
            id: 'q-ethics',
            type: 'choice',
            prompt: 'Which of these are good ethical practices when testing a solution in a community? Select all that apply.',
            multiple: true,
            options: [
              { id: 'consent', text: 'Explaining the test in plain language and getting people to agree freely', correct: true },
              { id: 'names', text: 'Removing names when sharing results', correct: true },
              { id: 'return', text: 'Sharing what you learnt with the people who took part', correct: true },
              { id: 'overclaim', text: 'Telling funders the results are guaranteed, to secure the money', correct: false, feedback: 'Overclaiming misleads funders and the community, and destroys trust when it falls short.' },
              { id: 'children', text: 'Posting children’s photos to show impact, as long as the project is good', correct: false, feedback: 'A good project does not replace consent. Ask parents or guardians first.' },
            ],
            explanation: 'Consent, privacy, honesty and giving back. These are not extras. They are part of solving the problem well.',
          },
          {
            id: 'q-story-order',
            type: 'order',
            prompt: 'Put the parts of a problem story in order.',
            items: [
              { id: 'person', text: 'A real person or moment' },
              { id: 'size', text: 'Size and evidence' },
              { id: 'cause', text: 'The root cause' },
              { id: 'test', text: 'What you will test' },
              { id: 'ask', text: 'A specific ask' },
            ],
            explanation: 'People first, then evidence, cause, test and ask. Problem before solution.',
          },
          {
            id: 'q-incentives',
            type: 'choice',
            prompt: 'Wanjiru’s evening bonus worked when fines did not. What does this best illustrate?',
            multiple: false,
            options: [
              { id: 'a', text: 'Drivers respond better to kindness', correct: false, feedback: 'Perhaps, but the deeper point is about what the system rewards.' },
              { id: 'b', text: 'Solutions work when they make the desired behaviour worthwhile for the people asked to do it', correct: true },
              { id: 'c', text: 'Money solves every problem', correct: false, feedback: 'Money was the right lever here because the root cause was about pay. It is not always.' },
              { id: 'd', text: 'Fines never work', correct: false, feedback: 'Too general. Fines failed here because they targeted the wrong cause.' },
            ],
            explanation: 'Follow the incentives. Owners were rationally resting vehicles in the evening. Change what the evening pays, and behaviour changes.',
          },
        ],
      },
    },
    {
      key: 'problem-definition-canvas',
      type: 'assignment',
      title: 'Practical Output: your Problem Definition Canvas',
      minutes: 90,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: a one-page **Problem Definition Canvas** for a real problem in your own community, venture or organisation.\n\nYour canvas should show that you can define a problem without hiding a solution inside it, diagnose its root causes with evidence, generate and weigh real options, think about the people involved, and design an experiment you could start within a week.\n\nYou have already drafted most of it in your journal. Now bring it together, sharpen it and make it fit on one page. Your canvas joins your Dream Lab portfolio, and many learners carry it into their Dream Residency in week 11.\n\nA faculty reviewer will grade it against the rubric below and give you written feedback.",
        practicalOutput: 'Problem Definition Canvas',
        steps: [
          'Choose the problem you worked on through the course. If it changed along the way, use the sharper version.',
          'Open your journal and gather your reflections: problem statement, evidence, 5 Whys, fishbone, ideas, How might we question, criteria, pre-mortem, experiment, stakeholders and ethics check.',
          'Talk to at least three people affected by the problem, if you have not already, and add what you learnt to your evidence.',
          'Fill in every section of the template below. Keep each section short: a page is the target, not a minimum.',
          'Read your problem statement one last time and remove any solution hiding inside it.',
          'Check that your next experiment can start within seven days, costs very little, and has a success threshold decided in advance.',
          'Optionally attach a photo of your hand-drawn fishbone or stakeholder grid.',
          'Submit, then note in your journal the date you will start your experiment.',
        ],
        rubric: [
          {
            id: 'problem-statement',
            criterion: 'Clear problem statement',
            description: 'States who is affected, the gap, where and when, how big it is and why it matters, in three sentences or fewer, with no solution hidden inside.',
          },
          {
            id: 'evidence',
            criterion: 'Evidence and honesty',
            description: 'Draws on direct conversations with and observation of people affected, plus records or counts where possible. Labels anecdotes, data and opinion honestly, and notes whose voices are still missing.',
          },
          {
            id: 'root-causes',
            criterion: 'Root-cause diagnosis',
            description: 'Uses the 5 Whys and a fishbone to go beyond symptoms. Names a root cause that is deep enough to matter and close enough to act on, and explains how it was checked.',
          },
          {
            id: 'options',
            criterion: 'Options and trade-offs',
            description: 'Presents three genuinely different candidate solutions with honest trade-offs, uses clear criteria to choose, and explains the choice.',
          },
          {
            id: 'people-ethics',
            criterion: 'People and ethics',
            description: 'Identifies key stakeholders, including those who carry the problem and those who could block a solution, and addresses who could be harmed and how consent will be handled.',
          },
          {
            id: 'experiment',
            criterion: 'Next experiment',
            description: 'Describes a small, cheap experiment that can start within a week, tests the riskiest assumption, and has a clear measure and success threshold set in advance.',
          },
        ],
        template: canvasTemplate,
        minWords: 250,
      },
    },
    {
      key: 'final-quiz',
      type: 'quiz',
      title: 'Final course quiz',
      minutes: 18,
      required: true,
      gradeWeight: 30,
      payload: {
        intro:
          "Twelve questions across the whole course: Define, Diagnose, Generate, Decide and Do, and working with people. Several questions follow a new case.\n\nYou need 75% to pass and can retake it as often as you like. Take your time and read the explanations.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-statement',
            type: 'choice',
            prompt: 'New case: Zainab runs a small solar-charging kiosk in a town in northern Ghana. She says: “My problem is that I need a bigger battery.” What is this?',
            multiple: false,
            options: [
              { id: 'a', text: 'A clear problem statement', correct: false, feedback: 'It names a product. What would a bigger battery change?' },
              { id: 'b', text: 'A solution in disguise', correct: true },
              { id: 'c', text: 'A root cause', correct: false, feedback: 'A battery cannot be the cause of a gap she has not described yet.' },
              { id: 'd', text: 'A symptom', correct: false, feedback: 'A symptom is something observed, such as customers leaving. This is a proposed fix.' },
            ],
            explanation: 'Ask: “If you had a bigger battery, what would be different?” Perhaps she turns customers away in the evenings, which is the real gap, and perhaps there are other ways to close it.',
          },
          {
            id: 'f-case-question',
            type: 'choice',
            prompt: 'Zainab wants to understand why customers leave without charging. Which question should she ask them?',
            multiple: false,
            options: [
              { id: 'a', text: '“Would you come more often if I had a bigger battery?”', correct: false, feedback: 'Hypothetical and leading. It assumes the answer.' },
              { id: 'b', text: '“The last time you left without charging, what happened?”', correct: true },
              { id: 'c', text: '“Do you like my kiosk?”', correct: false, feedback: 'Closed and invites politeness.' },
              { id: 'd', text: '“Isn’t the other kiosk too expensive?”', correct: false, feedback: 'Leading, and about a competitor rather than her own customers.' },
            ],
            explanation: 'A past-behaviour question about a real event. She might learn the queue is too long at 6 p.m., or that phones take too long to charge, or that customers had no cash.',
          },
          {
            id: 'f-case-whys',
            type: 'order',
            prompt: 'Zainab’s 5 Whys. Put the chain in order from problem to deepest cause.',
            items: [
              { id: 'leave', text: 'Customers leave without charging their phones' },
              { id: 'queue', text: 'The queue after 5 p.m. is over an hour long' },
              { id: 'slots', text: 'She can only charge eight phones at a time' },
              { id: 'day', text: 'Phones are not brought in during the day, when panels have spare capacity' },
              { id: 'work', text: 'Most customers work on farms all day and can only come in the evening' },
            ],
            explanation: 'The chain ends with when customers can come, not battery size. That opens new ideas: a morning drop-off and evening pick-up service, perhaps with numbered tags, using the spare daytime capacity she already has.',
          },
          {
            id: 'f-fishbone',
            type: 'match',
            prompt: 'Match each cause in Zainab’s fishbone to its bone.',
            pairs: [
              { id: 'tools', left: 'Only eight charging cables', right: 'Tools and tech' },
              { id: 'process', left: 'First come, first served, with no booking or drop-off', right: 'Process' },
              { id: 'money', left: 'Customers are paid weekly and run out of cash by Friday', right: 'Money' },
              { id: 'place', left: 'The kiosk is beside a road with no shade to wait in', right: 'Place' },
            ],
            explanation: 'Several causes on different bones combine to make the evening queue. The fishbone stops her fixing only the first one that comes to mind.',
          },
          {
            id: 'f-base-rate',
            type: 'choice',
            prompt: 'One angry customer posts on Facebook that Zainab’s kiosk “damaged” his phone. In her records, she has charged around 3,000 phones this year with no other complaints. What is the best response?',
            multiple: false,
            options: [
              { id: 'a', text: 'Panic and stop charging older phones', correct: false, feedback: 'That reacts to one story and ignores the base rate.' },
              { id: 'b', text: 'Ignore it completely', correct: false, feedback: 'The story may contain useful information, and a public complaint deserves a respectful reply.' },
              { id: 'c', text: 'Take the complaint seriously, check what happened with that phone, and weigh it against the base rate of thousands of safe charges', correct: true },
              { id: 'd', text: 'Reply publicly that he is lying', correct: false, feedback: 'This damages trust whatever the truth is.' },
            ],
            explanation: 'Anecdotes tell you what can go wrong; base rates tell you how often. Use both.',
          },
          {
            id: 'f-hmw',
            type: 'choice',
            prompt: 'Which How might we question best fits Zainab’s root cause?',
            multiple: false,
            options: [
              { id: 'a', text: '“How might we raise money for a bigger battery?”', correct: false, feedback: 'A solution in disguise.' },
              { id: 'b', text: '“How might we use our spare daytime charging capacity for customers who can only come in the evening?”', correct: true },
              { id: 'c', text: '“How might we bring electricity to all of northern Ghana?”', correct: false, feedback: 'Far too wide for one kiosk.' },
              { id: 'd', text: '“How might we make customers come during the day?”', correct: false, feedback: 'It fights the root cause (they work all day) instead of designing around it.' },
            ],
            explanation: 'Anchored in the root cause, open to many answers, and within her power.',
          },
          {
            id: 'f-diverge',
            type: 'choice',
            prompt: 'Which of these are good divergent-thinking practices? Select all that apply.',
            multiple: true,
            options: [
              { id: 'quantity', text: 'Aiming for at least ten ideas before judging any', correct: true },
              { id: 'silent', text: 'Writing silently first in a group', correct: true },
              { id: 'analogy', text: 'Asking who else has a problem with the same shape', correct: true },
              { id: 'judge', text: 'Dropping any idea that sounds expensive as soon as it is said', correct: false, feedback: 'Judging too early kills ideas that could be made cheaper or combined.' },
              { id: 'boss', text: 'Letting the most experienced person speak first to set the direction', correct: false, feedback: 'This tends to anchor everyone on one idea.' },
            ],
            explanation: 'Quantity, silence first, analogies, constraints and reframes all widen the field. Judging comes later.',
          },
          {
            id: 'f-matrix',
            type: 'choice',
            prompt: 'Zainab scores a drop-off service 5 on impact (weight 3), 4 on cost (weight 2) and 3 on ease (weight 1). What is its weighted total?',
            multiple: false,
            options: [
              { id: 'a', text: '12', correct: false, feedback: 'That adds the raw scores. Multiply each by its weight first.' },
              { id: 'b', text: '23', correct: false, feedback: 'Check: 5×3, 4×2 and 3×1.' },
              { id: 'c', text: '26', correct: true },
              { id: 'd', text: '60', correct: false, feedback: 'Multiply each score by its own weight, then add.' },
            ],
            explanation: '5×3 = 15, 4×2 = 8 and 3×1 = 3. 15 + 8 + 3 = 26.',
          },
          {
            id: 'f-doors',
            type: 'choice',
            prompt: 'Zainab is offered a two-year lease on a second kiosk. What is the best approach?',
            multiple: false,
            options: [
              { id: 'a', text: 'Sign quickly before someone else does', correct: false, feedback: 'A two-year lease is a one-way door. Speed is the wrong instinct here.' },
              { id: 'b', text: 'Run a pre-mortem and look for a shorter trial or a way to test demand first', correct: true },
              { id: 'c', text: 'Refuse, because expansion is always risky', correct: false, feedback: 'A blanket rule replaces thinking. It might be a good opportunity.' },
              { id: 'd', text: 'Ask friends to vote on it', correct: false, feedback: 'Their views may help, but this needs evidence and a careful look at what could go wrong.' },
            ],
            explanation: 'Slow down at one-way doors, and try to turn them into two-way doors.',
          },
          {
            id: 'f-experiment',
            type: 'choice',
            prompt: 'Which is the smallest useful experiment for the drop-off service?',
            multiple: false,
            options: [
              { id: 'a', text: 'Buy fifty lockers and a booking app', correct: false, feedback: 'Expensive and slow, and it tests everything at once.' },
              { id: 'b', text: 'For two weeks, accept morning drop-offs from ten regular customers using numbered paper tags, and count how many use it again in week two', correct: true },
              { id: 'c', text: 'Ask customers if they would like a drop-off service', correct: false, feedback: 'Answers about the future are unreliable.' },
              { id: 'd', text: 'Wait until she can afford to do it properly', correct: false, feedback: 'Waiting teaches nothing.' },
            ],
            explanation: 'Cheap, quick, real behaviour, and a clear measure: repeat use. If customers do not come back, she learns that before spending anything.',
          },
          {
            id: 'f-ethics',
            type: 'choice',
            prompt: 'Customers will leave their phones with Zainab all day. Which ethical risks should she plan for? Select all that apply.',
            multiple: true,
            options: [
              { id: 'privacy', text: 'Privacy: phones contain messages, photos and mobile money', correct: true },
              { id: 'loss', text: 'Loss or theft, and who pays if a phone goes missing', correct: true },
              { id: 'clarity', text: 'Making sure customers clearly understand the terms before handing over a phone', correct: true },
              { id: 'none', text: 'None: it is just phone charging', correct: false, feedback: 'Even simple services move risk onto customers. Holding someone’s phone all day is a serious responsibility.' },
            ],
            explanation: 'Who carries the risk? Here, customers do. Zainab can reduce it with sealed bags, a simple record book, clear terms and a promise about what happens if something goes wrong.',
          },
          {
            id: 'f-spine',
            type: 'match',
            prompt: 'Match each of Zainab’s actions to the move of the spine it belongs to.',
            pairs: [
              { id: 'define', left: 'Rewriting “I need a bigger battery” as a gap with numbers', right: 'Define' },
              { id: 'diagnose', left: 'Asking customers about the last time they left without charging', right: 'Diagnose' },
              { id: 'generate', left: 'Listing twelve ideas, including ones borrowed from laundries and tailors', right: 'Generate' },
              { id: 'decide', left: 'Scoring three options against impact, cost and ease', right: 'Decide' },
              { id: 'do', left: 'Running a two-week drop-off trial with paper tags', right: 'Do' },
            ],
            explanation: 'Define → Diagnose → Generate → Decide → Do. Zainab never bought the bigger battery. She found a better answer using capacity she already had. That is what this course is for.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const problemSolving: CourseAuthoring = {
  slug: 'problem-solving',
  title: 'Problem Solving',
  subtitle: 'See the real problem, find its roots, and test your way to a solution that works.',
  description:
    "Most failed projects did not fail for lack of effort. They solved the wrong problem, or the right problem in the wrong way. This course teaches you to avoid both.\n\nYou will learn a simple, powerful spine for any problem: **Define → Diagnose → Generate → Decide → Do**. You will learn to tell a problem from its symptoms and from a solution in disguise, to ask questions that reveal the truth, to dig to root causes with the 5 Whys and the fishbone, to generate many options before choosing, to decide with clear criteria, and to test ideas with small, cheap experiments before you spend real money.\n\nYou will learn by doing. Every lesson is a set of short steps, and every idea is tested straight away with a question, a scenario or a reflection on your own life. You will follow a cast of builders across the continent: Amina, a tomato trader in Kano; Kwame, a student in Kumasi; Wanjiru at a Nairobi matatu SACCO; Tunde at a Lagos fintech; Fatou, a fashion founder in Dakar; and Uwase, who keeps her Rwandan village’s borehole running.\n\nThroughout, you will work on a real problem from your own community or venture. Your reflections build, step by step, into your Practical Output: a one-page **Problem Definition Canvas** that you can act on the week you finish.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 5,
  outcomes: [
    'Tell a real problem apart from its symptoms and from a solution in disguise, and write a sharp problem statement.',
    'Gather honest evidence through good questions, observation and simple records, and weigh anecdotes against base rates.',
    'Find root causes using the 5 Whys and the fishbone diagram, and choose a cause you can act on.',
    'Generate many options using divergent thinking, How might we questions, constraints and analogies.',
    'Choose between options with weighted criteria and honest trade-offs, and treat reversible and irreversible decisions differently.',
    'Design the smallest useful experiment, with a measure and success threshold set in advance.',
    'Map stakeholders, power and incentives, check who carries the risk, and tell a compelling problem story.',
  ],
  skills: [
    'Problem framing',
    'Root-cause analysis',
    '5 Whys',
    'Fishbone diagrams',
    'Evidence gathering',
    'Creative thinking',
    'Decision making',
    'Experiment design',
    'Stakeholder mapping',
    'Ethical reasoning',
  ],
  audience:
    'Ambitious young builders and changemakers, roughly 18 to 30, who want to solve real problems in their communities, ventures or organisations. Especially valuable if you have an idea you are excited about and want to be sure it answers a real need. Designed to work well on a phone and on a slow connection.',
  prerequisites: 'None. You need curiosity, a real problem you care about, and the willingness to talk to people affected by it.',
  practicalOutput: 'Problem Definition Canvas',
  cover: {
    from: '#0A3D29',
    to: '#1F9D6B',
    symbol: '◆',
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Baskets_of_freshly_harvested_tomatoes_at_Pambeguwa_perishable_market_05.jpg/1280px-Baskets_of_freshly_harvested_tomatoes_at_Pambeguwa_perishable_market_05.jpg",
    imageAlt: "Rows of tall woven baskets heaped with tomatoes and topped with leaves at an open-air market, with traders, motorcycles and a minibus behind them.",
    imageCredit: "Photo: Friday musa / Wikimedia Commons, CC BY-SA 4.0",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'crjU5hu2fag',
    title: "William Kamkwamba: How I harnessed the wind",
    channel: "TED",
    durationS: 356,
  },
  instructors: [
    {
      name: 'The African Dream Lab Faculty',
      title: 'Life Architecture faculty',
      bio: 'The Life Architecture faculty of The African Dream Lab brings together educators, founders, community organisers and practitioners from across the continent. They teach the habits of mind every builder needs, starting with how to see a problem clearly. The Lab is run by the African Dream Network and grew out of the TADIS conference.',
    },
  ],
  modules: [moduleDefine, moduleDiagnose, moduleGenerate, moduleDecide, modulePeople],
};

import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Financial Intelligence: a Builder’s Architecture course of The African Dream Lab (weeks 6–7, 4 credits).
 *
 * General financial education, not personal financial advice. Recurring cast, all fictional:
 *   Kofi    a 23-year-old graduate in Accra on his first salary (Ghanaian cedi)
 *   Halima  runs a small tailoring shop in Kaduna, selling ready-to-wear Ankara shirts (Nigerian naira)
 *   Njeri   runs a fresh-juice kiosk in Nairobi’s city centre (Kenyan shilling)
 * Every number in a case is part of that fictional case, never a real statistic, price or rate.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Your money: budgets and cash flow
// ---------------------------------------------------------------------------

const modulePersonal: Module = {
  key: 'personal-money',
  title: 'Your money: budgets and cash flow',
  summary:
    'Start with your own money. Build a budget that fits real African family life, track where your cash actually goes, and plan for irregular income and emergencies.',
  weekNo: 6,
  items: [
    {
      key: 'budget-basics',
      type: 'lesson',
      title: 'Money is a tool: building a budget',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-money',
            title: 'Why money skills come first',
            blocks: [
              {
                id: 'why-money-text',
                type: 'text',
                body: "Welcome to Financial Intelligence.\n\nMany good ventures do not fail because the idea was wrong. They fail because the money ran out, was mixed with family money, or was never really understood. The same is true of personal plans: a course you could not finish, a move you could not afford, a debt that grew quietly.\n\nFinancial intelligence is not about being rich or loving numbers. It is the ability to **read, plan and decide with money**, so that money serves your dream instead of steering it.\n\nWe start with the simplest tool there is: a budget. Watch this short explainer of one popular way to split your income.",
              },
              {
                id: 'why-money-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'LKxOamnP8J4',
                title: 'Budgeting and the 50:30:20 rule | Financial mathematics (TX TEKS) | Khan Academy',
                channel: 'Khan Academy',
                durationS: 191,
                caption: "Khan Academy explains the 50:30:20 rule: needs, wants and savings. Watch for the three buckets, then ask yourself whether the split would work for your own income and responsibilities. You will adapt it in a moment.",
              },
              {
                id: 'why-money-disclaimer',
                type: 'callout',
                tone: 'context',
                title: 'General education, not personal advice',
                body: "This course teaches general money skills. It is not personal financial advice. Prices, interest rates, taxes and rules differ by country and change over time. Before a big decision, such as a loan or an investment, check current terms and, where you can, speak to a qualified, licensed adviser.",
              },
            ],
          },
          {
            id: 'money-today',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'money-today-scale',
                type: 'scale',
                prompt: 'Be honest. At the end of most months, how well do you know where your money went?',
                minLabel: 'No idea',
                maxLabel: 'I know almost every cedi',
                afterword:
                  "Most people start in the middle or lower. That is normal, and it is not a character flaw. Nobody is born knowing this. You will rate yourself again at the end of the course.",
              },
            ],
          },
          {
            id: 'meet-kofi',
            title: 'Meet Kofi',
            blocks: [
              {
                id: 'kofi-story',
                type: 'callout',
                tone: 'story',
                title: 'Kofi, junior analyst, Accra',
                body: "Kofi is 23. Six months ago he started his first salaried job in Accra, taking home **GH₵ 3,000** a month after tax.\n\nIt felt like a lot. Yet by the 20th of every month his account is almost empty. He pays rent, sends money to his mother in Cape Coast, buys data, eats out with colleagues and helps his younger sister with school costs. He does not know how much goes where.\n\n“I earn more than ever,” he says, “and I feel broker than ever.”",
              },
              {
                id: 'kofi-reveal',
                type: 'reveal',
                prompt: 'Before you read on: is Kofi’s problem that he does not earn enough?',
                body: "Maybe, one day. But right now he cannot tell, because he does not know where his money goes. A budget is not a punishment. It is a **plan for your money before the month starts**, so you decide where it goes instead of finding out afterwards.\n\nUntil Kofi has a plan and a record, “I need a raise” is a solution in disguise.",
              },
            ],
          },
          {
            id: 'needs-wants',
            title: 'Needs, wants and savings',
            blocks: [
              {
                id: 'needs-wants-text',
                type: 'text',
                body: "The 50:30:20 rule splits take-home pay into three buckets:\n\n- **Needs (about 50%)**: things you must pay to live and work. Rent, basic food, transport to work, essential bills.\n- **Wants (about 30%)**: things that make life better but could be cut. Eating out, new clothes, entertainment.\n- **Savings and debt repayment (about 20%)**: money for your future self. An emergency fund, savings goals, paying down debt.\n\nFor Kofi, that would be roughly GH₵ 1,500 for needs, GH₵ 900 for wants and GH₵ 600 for savings.",
              },
              {
                id: 'needs-wants-match',
                type: 'match',
                prompt: 'Match each of Kofi’s spending items to the best way to plan for it.',
                pairs: [
                  { id: 'rent', left: 'His share of the rent for a shared flat', right: 'Need' },
                  { id: 'waakye', left: 'Friday evening food and drinks with colleagues', right: 'Want' },
                  { id: 'emergency', left: 'A small amount put aside every month for emergencies', right: 'Saving' },
                  { id: 'mother', left: 'Money he sends his mother every month', right: 'Family support: its own planned line' },
                ],
                explanation:
                  "Family support does not fit neatly into a rule written for other places. For many young Africans it is not optional and not a “want”. The healthiest approach is to give it its own line, agree an amount you can sustain, and plan around it, rather than letting it drain the month unseen.",
              },
            ],
          },
          {
            id: 'adapt-rule',
            title: 'Make the rule fit your life',
            blocks: [
              {
                id: 'adapt-context',
                type: 'callout',
                tone: 'context',
                title: 'Budgets in real families',
                body: "Across the continent, a first salary often supports more than one person. Siblings’ fees, a parent’s medicine, a contribution to a wedding or funeral. These are acts of love and duty, and they are also real costs.\n\nA rule like 50:30:20 is a starting point, not a law. What matters is that every cedi, naira or shilling has a job **before** the month begins.",
              },
              {
                id: 'adapt-choice',
                type: 'choice',
                prompt: 'Kofi sends GH₵ 500 a month to his mother and his sister’s school costs average GH₵ 200 a month. What is the wisest way to handle this in his budget?',
                multiple: false,
                options: [
                  { id: 'ignore', text: 'Leave it out of the budget, because family money is private', correct: false, feedback: 'Leaving it out is exactly why his money vanishes. Private is fine; invisible is not.' },
                  { id: 'cut', text: 'Stop sending money until he has saved GH₵ 10,000', correct: false, feedback: 'That may break trust and cause real hardship at home. A good budget works with your responsibilities, not against them.' },
                  {
                    id: 'plan',
                    text: 'Put GH₵ 700 in its own “family” line, then fit needs, wants and savings into what remains',
                    correct: true,
                    feedback: 'Yes. Planning it first makes it predictable for him and for his family, and shows clearly what is left to work with.',
                  },
                  { id: 'wants', text: 'Count it as part of his “wants”, since it is a choice', correct: false, feedback: 'For most families it does not feel like a choice, and treating it as a want hides how much of his income is already committed.' },
                ],
                explanation:
                  "Once family support is planned, Kofi can see the real picture: GH₵ 2,300 left for everything else. That may mean fewer Friday outings, or a conversation at home about a sustainable amount. Either way, he is deciding, not drifting.",
              },
            ],
          },
          {
            id: 'build-steps',
            title: 'Build a budget in five moves',
            blocks: [
              {
                id: 'build-framework',
                type: 'framework',
                title: 'A budget that works',
                steps: [
                  { label: 'Know your income', detail: 'Use take-home pay, after tax and deductions. If your income varies, use a cautious figure from your lowest recent months.' },
                  { label: 'List fixed commitments', detail: 'Rent, transport, family support, loan repayments: the things that come every month whatever you do.' },
                  { label: 'Pay your future self', detail: 'Decide your saving amount before the spending starts, even if it is small.' },
                  { label: 'Plan flexible spending', detail: 'Food, data, outings, clothes. Give each a ceiling.' },
                  { label: 'Check and adjust', detail: 'Compare plan with reality every week or month. A budget is a living document.' },
                ],
              },
              {
                id: 'build-order',
                type: 'order',
                prompt: 'Put Kofi’s budgeting steps in a sensible order.',
                items: [
                  { id: 'income', text: 'Write down his take-home pay: GH₵ 3,000' },
                  { id: 'fixed', text: 'List rent, transport and the GH₵ 700 family line' },
                  { id: 'save', text: 'Set aside his saving amount for the month' },
                  { id: 'flexible', text: 'Share what is left between food, data and outings' },
                  { id: 'review', text: 'At month end, compare the plan with what really happened' },
                ],
                explanation:
                  "Notice that saving comes **before** flexible spending. If you save “whatever is left”, there is rarely anything left. Paying your future self first is one of the oldest and most reliable money habits.",
              },
            ],
          },
          {
            id: 'your-budget',
            title: 'Your first budget',
            blocks: [
              {
                id: 'your-budget-reflection',
                type: 'reflection',
                prompt: 'Sketch a simple monthly budget for yourself. Write your take-home income (or allowance), your fixed commitments including any family support, a saving amount, and ceilings for flexible spending.',
                guidance: 'Rough numbers are fine. If you have no regular income yet, budget your allowance or a typical month. This becomes the personal half of your Financial Plan.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'track-cash-flow',
      type: 'lesson',
      title: 'Tracking cash flow honestly',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-track',
            title: 'A budget is a plan. Tracking is the truth.',
            blocks: [
              {
                id: 'why-track-text',
                type: 'text',
                body: "A budget tells you what you intend to do. Tracking tells you what you actually did. You need both.\n\n**Cash flow** is simply money coming in and money going out over a period of time. When more goes out than comes in, you are running a cash deficit, and something (savings, borrowing, or a worried phone call home) has to cover it.\n\nIn this short talk, a behavioural scientist explains why strict budgets often fail, and what to try instead.",
              },
              {
                id: 'why-track-video',
                type: 'video',
                provider: 'youtube',
                videoId: '_7J1JVCxWJM',
                title: "Can't stick to a budget? Try these tweaks instead | Your Money and Your Mind",
                channel: 'TED',
                durationS: 241,
                caption: "Behavioural scientist Wendy De La Rosa on why sticking to a budget is hard, and small changes that help. Listen for ideas that would work with mobile money and cash, not just bank cards.",
              },
            ],
          },
          {
            id: 'leaks',
            title: 'Kofi’s 30-day record',
            blocks: [
              {
                id: 'leaks-example',
                type: 'example',
                title: 'What Kofi found',
                body: "Kofi agrees to write down every spend for 30 days, using his mobile money statement and a note on his phone for cash. At the end of the month he adds it up:\n\n- Rent share: GH₵ 900\n- Family line (mother and sister): GH₵ 700\n- Trotro and ride-hailing: GH₵ 380, of which GH₵ 210 was ride-hailing on late nights\n- Food and groceries: GH₵ 520\n- Lunch bought near the office: GH₵ 260\n- Data and airtime: GH₵ 150\n- Friday outings: GH₵ 310\n- Saved: GH₵ 0\n\nTotal: GH₵ 3,220. That is GH₵ 220 more than he earned. He covered the gap by borrowing from a colleague.",
              },
              {
                id: 'leaks-choice',
                type: 'choice',
                prompt: 'Which items are the most promising places for Kofi to look first? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'ride', text: 'Late-night ride-hailing (GH₵ 210)', correct: true, feedback: 'Yes. A large, flexible cost. Leaving earlier twice a week, or sharing rides, could cut it a lot.' },
                  { id: 'lunch', text: 'Lunch bought near the office (GH₵ 260)', correct: true, feedback: 'Yes. Small daily spends add up. Bringing food two or three days a week changes the month.' },
                  { id: 'outings', text: 'Friday outings (GH₵ 310)', correct: true, feedback: 'Yes. He need not stop, but a ceiling makes it a choice instead of a leak.' },
                  { id: 'rent', text: 'Rent share (GH₵ 900)', correct: false, feedback: 'Rent is large but fixed for now. He could revisit it when the lease ends, but it is not a quick win.' },
                  { id: 'family', text: 'Family line (GH₵ 700)', correct: false, feedback: 'He planned this deliberately. If it becomes unsustainable, that is a respectful conversation, not a quick cut.' },
                ],
                explanation:
                  "Look first at **flexible** spending that is large or frequent. Small daily amounts are easy to ignore and hard to see without a record. That is exactly what tracking is for.",
              },
            ],
          },
          {
            id: 'cash-words',
            title: 'The words you need',
            blocks: [
              {
                id: 'cash-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Income', definition: 'Money that comes in: salary, allowance, sales, gifts, side gigs.' },
                  { term: 'Expense', definition: 'Money that goes out to pay for something.' },
                  { term: 'Cash flow', definition: 'The movement of money in and out over a period. Positive when more comes in than goes out.' },
                  { term: 'Irregular income', definition: 'Income that changes from month to month, common for traders, freelancers and creatives.' },
                  { term: 'Emergency fund', definition: 'Savings kept aside, easy to reach, only for genuine emergencies such as illness or a lost job.' },
                ],
              },
              {
                id: 'irregular-reveal',
                type: 'reveal',
                prompt: 'If your income is different every month, how can you budget at all? Think about it, then tap.',
                body: "Budget on your **lowest normal month**, not your best. In good months, the extra goes first to your emergency fund and savings, not to new spending. In thin months, that buffer carries you.\n\nSome people with irregular income pay themselves a steady “salary” from a separate holding account or wallet, topping it up in good months and drawing it down in bad ones.",
              },
            ],
          },
          {
            id: 'njeri-scenario',
            title: 'Njeri’s big month',
            blocks: [
              {
                id: 'njeri-big-month',
                type: 'scenario',
                situation:
                  "Before she opened her juice kiosk, Njeri earned money catering for events in Nairobi. Her income was uneven: some months KSh 15,000, some months KSh 60,000.\n\nIn December she catered three weddings and earned **KSh 90,000**, her best month ever. January usually brings almost no events.",
                prompt: 'What should Njeri do with the December money?',
                options: [
                  {
                    id: 'spend',
                    text: 'Celebrate. She worked hard and deserves a new phone and a holiday trip home.',
                    outcome: "She enjoys December. In January there are no events, rent is due and school fees for her younger brother arrive. She borrows from a digital lender at a high cost and spends February repaying it.",
                    best: false,
                  },
                  {
                    id: 'split',
                    text: 'Decide in advance: cover January and February’s basic needs first, add to her emergency fund, then allow herself a planned treat.',
                    outcome: "January is quiet but calm. She pays rent and fees on time and still enjoys a modest celebration. She starts to see her income as a yearly pattern, not a monthly surprise.",
                    best: true,
                  },
                  {
                    id: 'lend',
                    text: 'Lend most of it to a cousin who promises to pay it back with interest in March.',
                    outcome: "The cousin means well but his business has a slow quarter too. March comes and goes. Njeri has neither the money nor an easy way to ask for it.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'track-method',
            title: 'Choose your tool',
            blocks: [
              {
                id: 'track-poll',
                type: 'poll',
                prompt: 'Which tracking method will you use for the next 30 days?',
                options: [
                  { id: 'notebook', text: 'A small notebook I carry everywhere' },
                  { id: 'phone-note', text: 'A note or spreadsheet on my phone' },
                  { id: 'statement', text: 'My mobile money and bank statements, reviewed weekly' },
                  { id: 'app', text: 'A budgeting app' },
                ],
                afterword:
                  "The best tool is the one you will actually use. Statements are powerful because they record digital spending automatically, but cash leaves no trace, so pair them with a quick note for cash spends.",
              },
              {
                id: 'emergency-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Start an emergency fund, however small',
                body: "An emergency fund turns a crisis into an inconvenience. Many people aim, over time, for a few months of essential costs. If that feels impossible, start with one week’s essentials. Keep it somewhere you can reach quickly but will not dip into casually: a separate wallet, a locked savings account or a savings group.",
              },
            ],
          },
          {
            id: 'track-plan',
            title: 'Your tracking plan',
            blocks: [
              {
                id: 'track-reflection',
                type: 'reflection',
                prompt: 'Describe how you will track your money for the next 30 days: which tool, when you will record, and when you will review. Then name one flexible spend you suspect is a leak.',
                guidance: 'Be specific: “Every night before bed I will…”. Your 30-day record will feed into the twelve-month budget in your Financial Plan.',
                minWords: 30,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'personal-money-quiz',
      type: 'quiz',
      title: 'Module quiz: your money',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on budgets, tracking and irregular income. You need 70% to pass and can retake it as often as you like. Read each explanation, even when you get it right.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-budget-purpose',
            type: 'choice',
            prompt: 'What is a budget, in the sense used in this course?',
            multiple: false,
            options: [
              { id: 'a', text: 'A record of what you spent last month', correct: false, feedback: 'That is tracking. A budget looks forward.' },
              { id: 'b', text: 'A plan for your money, made before the month starts', correct: true },
              { id: 'c', text: 'A list of things you are not allowed to buy', correct: false, feedback: 'A budget gives every amount a job. It can include treats.' },
              { id: 'd', text: 'Something only people with high incomes need', correct: false, feedback: 'The smaller the income, the more each unit matters.' },
            ],
            explanation: 'A budget plans; tracking records. Comparing the two each month is how you learn and improve.',
          },
          {
            id: 'q-503020',
            type: 'choice',
            prompt: 'Using the 50:30:20 rule on a take-home income of ₦200,000, how much goes to savings and debt repayment?',
            multiple: false,
            options: [
              { id: 'a', text: '₦20,000', correct: false, feedback: 'That is 10%. Check the percentage again.' },
              { id: 'b', text: '₦40,000', correct: true },
              { id: 'c', text: '₦60,000', correct: false, feedback: 'That is 30%, the wants bucket.' },
              { id: 'd', text: '₦100,000', correct: false, feedback: 'That is 50%, the needs bucket.' },
            ],
            explanation: '20% of ₦200,000 is ₦40,000. Needs would be about ₦100,000 and wants about ₦60,000. Remember the rule is a starting point to adapt, not a law.',
          },
          {
            id: 'q-irregular',
            type: 'choice',
            prompt: 'A freelance designer’s income ranges from KSh 20,000 to KSh 70,000 a month. Which income figure should she build her basic budget on?',
            multiple: false,
            options: [
              { id: 'a', text: 'KSh 70,000, her best month', correct: false, feedback: 'Budgeting on your best month guarantees shortfalls in ordinary months.' },
              { id: 'b', text: 'Her average, KSh 45,000', correct: false, feedback: 'Better, but averages hide thin months that still need paying for.' },
              { id: 'c', text: 'A cautious figure close to her lowest normal month', correct: true },
              { id: 'd', text: 'She cannot budget with irregular income', correct: false, feedback: 'She can, and she needs it more than most.' },
            ],
            explanation: 'Budget on a cautious figure. Extra income in good months goes first to the emergency fund and savings, which then carries the thin months.',
          },
          {
            id: 'q-order-budget',
            type: 'order',
            prompt: 'Put the five budgeting moves in order.',
            items: [
              { id: 'income', text: 'Know your take-home income' },
              { id: 'fixed', text: 'List fixed commitments' },
              { id: 'save', text: 'Pay your future self' },
              { id: 'flexible', text: 'Plan flexible spending' },
              { id: 'adjust', text: 'Check and adjust' },
            ],
            explanation: 'Saving comes before flexible spending, so it actually happens. Checking and adjusting closes the loop.',
          },
          {
            id: 'q-match-terms',
            type: 'match',
            prompt: 'Match each term to its meaning.',
            pairs: [
              { id: 'cash-flow', left: 'Cash flow', right: 'Money moving in and out over a period' },
              { id: 'emergency', left: 'Emergency fund', right: 'Easy-to-reach savings kept for genuine emergencies' },
              { id: 'expense', left: 'Expense', right: 'Money paid out for something' },
              { id: 'deficit', left: 'Cash deficit', right: 'More money going out than coming in' },
            ],
            explanation: 'These four ideas are the vocabulary of every budget, from a student’s allowance to a company’s accounts.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Venture numbers: costs, prices and break-even
// ---------------------------------------------------------------------------

const moduleVenture: Module = {
  key: 'venture-numbers',
  title: 'Venture numbers: costs, prices and break-even',
  summary:
    'Separate personal and venture money, understand fixed and variable costs, set prices that cover them, and calculate the break-even point every builder should know by heart.',
  weekNo: 6,
  items: [
    {
      key: 'separate-money',
      type: 'lesson',
      title: 'Separate the money',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'one-pot',
            title: 'The one-pot problem',
            blocks: [
              {
                id: 'one-pot-text',
                type: 'text',
                body: "Many small businesses run on one pot of money. Sales go into the same pocket, wallet or account as the owner’s personal money. School fees come out of the till. Stock is bought with the rent money.\n\nIt feels simple. It is actually very hard: you cannot tell whether the business makes a profit, you cannot plan, and lenders or investors cannot trust your numbers.\n\nThis short video from a payments company lists practical ways to keep the two apart. Some tools it mentions are American, but the principles travel.",
              },
              {
                id: 'one-pot-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'qhuhfxS0WlA',
                title: '8 Ways to Separate Business From Personal Finances',
                channel: 'Square',
                durationS: 198,
                caption: "Eight ways to separate business and personal money. As you watch, translate each tip into your context: a separate mobile money wallet or line, a separate notebook, a fixed salary for yourself.",
              },
            ],
          },
          {
            id: 'meet-halima',
            title: 'Meet Halima',
            blocks: [
              {
                id: 'halima-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/A_Nigerian_seamstress.jpg',
                alt: 'Two people work at treadle sewing machines in a crowded workshop, one feeding blue patterned fabric through the machine, with bags and garments hanging behind them.',
                caption: 'Seamstresses at work in a Nigerian workshop. Halima is a fictional tailor; shops like this are real.',
                credit: 'Photo: Sinachworld / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'halima-story',
                type: 'callout',
                tone: 'story',
                title: 'Halima, tailor, Kaduna',
                body: "Halima has run a tailoring shop in Kaduna for three years. She sells ready-to-wear Ankara shirts and takes custom orders. Customers love her work and she is busy most weeks.\n\nAll the money goes into one drawer and one mobile money wallet. She pays her apprentice, buys fabric, pays her children’s school fees and helps relatives, all from the same place.\n\nAt the end of each month there is never as much as she expects. “Am I making money or not?” she asks. She honestly does not know.",
              },
            ],
          },
          {
            id: 'why-separate',
            title: 'What mixing costs her',
            blocks: [
              {
                id: 'why-separate-choice',
                type: 'choice',
                prompt: 'Which of these problems does mixing personal and business money cause Halima? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'profit', text: 'She cannot tell whether the shop is profitable', correct: true, feedback: 'Yes. Personal spending hides inside business costs, and business sales hide inside household money.' },
                  { id: 'stock', text: 'Money for fabric gets spent on household needs, so she runs short of stock', correct: true, feedback: 'Yes. Without a separate pot, the business’s working money is always at risk.' },
                  { id: 'loan', text: 'A lender cannot see a clear record of her sales', correct: true, feedback: 'Yes. Clean records are often what makes credit possible.' },
                  { id: 'customers', text: 'Customers will stop liking her designs', correct: false, feedback: 'Her craft is not the problem. Her money system is.' },
                ],
                explanation:
                  "Mixing money does not just make records messy. It makes good decisions impossible. Halima might be running a healthy business and starving it of stock, or running a loss and covering it from household money without realising.",
              },
            ],
          },
          {
            id: 'pay-yourself',
            title: 'Pay yourself a salary',
            blocks: [
              {
                id: 'pay-yourself-text',
                type: 'text',
                body: "The single most useful habit for a small business owner: **pay yourself a fixed amount, on a fixed day, from the business to you.**\n\nEverything else stays in the business. If the business needs stock, the money is there. If you need more for your household, you raise your salary deliberately, when the numbers allow, not by dipping into the drawer.\n\nYour salary is a real cost of the business. If the business cannot pay you a reasonable amount, that is important information, not something to hide.",
              },
              {
                id: 'pay-yourself-example',
                type: 'example',
                title: 'Halima’s new system',
                body: "1. She opens a second mobile money line for the shop. All customer payments go there. Cash sales are deposited every evening.\n2. She keeps a sales and expenses notebook in the shop.\n3. On the 1st and 15th of each month she transfers herself **₦30,000**, her salary of ₦60,000 a month, to her personal wallet.\n4. School fees and family support come only from her personal wallet.\n\nAfter two months she can finally see the shop’s numbers clearly.",
              },
            ],
          },
          {
            id: 'family-scenario',
            title: 'A request from home',
            blocks: [
              {
                id: 'family-request',
                type: 'scenario',
                situation:
                  "Three weeks into her new system, Halima’s younger brother visits the shop. His landlord is threatening to evict him and he needs **₦50,000** by Friday. He knows the shop had a busy week. “You have the money right there,” he says, looking at the drawer.",
                prompt: 'What should Halima do?',
                options: [
                  {
                    id: 'drawer',
                    text: 'Take the ₦50,000 from the shop drawer. Family comes first.',
                    outcome: "Her brother keeps his room. On Monday a customer orders twenty shirts for a wedding, and Halima has no money for fabric. She turns the order down and loses far more than ₦50,000 in profit.",
                    best: false,
                  },
                  {
                    id: 'personal',
                    text: 'Explain that the shop money is for fabric and wages, then see what she can give from her personal wallet, or help him another way.',
                    outcome: "It is an uncomfortable conversation. She gives ₦20,000 from her own money and helps him negotiate a week’s extension with the landlord. The shop keeps its stock money, and the wedding order on Monday goes ahead.",
                    best: true,
                  },
                  {
                    id: 'refuse',
                    text: 'Refuse outright. Business is business.',
                    outcome: "The shop money is safe, but her brother leaves hurt and the family hears about it. Separating money does not mean refusing to help; it means helping from the right pot.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'separate-steps',
            title: 'Set up the separation',
            blocks: [
              {
                id: 'separate-order',
                type: 'order',
                prompt: 'Put these steps for separating your venture’s money in a sensible order.',
                items: [
                  { id: 'account', text: 'Open a separate account, wallet or line used only for the venture' },
                  { id: 'route', text: 'Route every sale and every business cost through it' },
                  { id: 'record', text: 'Record each transaction in a notebook or spreadsheet' },
                  { id: 'salary', text: 'Pay yourself a fixed salary on fixed days' },
                  { id: 'review', text: 'Review the venture’s numbers every month' },
                ],
                explanation:
                  "The separate account comes first because everything else depends on it. The monthly review comes last because it is where the separation pays off: you can finally see what the venture really earns.",
              },
            ],
          },
          {
            id: 'your-separation',
            title: 'Your venture’s money',
            blocks: [
              {
                id: 'separation-reflection',
                type: 'reflection',
                prompt: 'For your venture or project (or one you are planning), describe how you will keep its money separate from yours: which account or wallet, how you will record transactions, and what salary or allowance you will pay yourself.',
                guidance: 'If you have no venture yet, plan for the one you hope to build in the Dream Residency. This goes into the venture half of your Financial Plan.',
                minWords: 30,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'costs-prices-margins',
      type: 'lesson',
      title: 'Costs, prices and margins',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'two-costs',
            title: 'Two kinds of cost',
            blocks: [
              {
                id: 'two-costs-text',
                type: 'text',
                body: "Before you can set a price, you need to know what it costs you to sell. Every cost falls into one of two families.\n\n**Fixed costs** stay roughly the same whether you sell one item or a hundred: rent, a permanent worker’s wage, a licence, your own salary.\n\n**Variable costs** rise with every unit you sell: fabric for each shirt, fruit for each cup of juice, packaging, transaction fees.\n\nThis explainer shows the difference clearly.",
              },
              {
                id: 'two-costs-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'm3a3tvJ7ryc',
                title: 'Fixed Costs vs Variable Costs',
                channel: '365 Financial Analyst',
                durationS: 299,
                caption: "Fixed costs versus variable costs. Watch for how total cost changes as output grows, then think about which of your own costs would change if you doubled your sales.",
              },
            ],
          },
          {
            id: 'halima-costs',
            title: 'Halima’s costs',
            blocks: [
              {
                id: 'tailor-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/The_Art_of_Tailoring.jpg/1280px-The_Art_of_Tailoring.jpg',
                alt: 'A person with a tape measure around their neck sews blue and orange patterned fabric on a black sewing machine in a workshop doorway.',
                caption: 'A tailor at work with Ankara fabric in Nigeria. Every shirt carries both kinds of cost: the fabric in it, and a share of the rent on the room.',
                credit: 'Photo: Mjb juba / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'halima-costs-choice',
                type: 'choice',
                prompt: 'Which of Halima’s costs are variable costs? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'fabric', text: 'Fabric for each shirt', correct: true, feedback: 'Yes. Each extra shirt needs more fabric.' },
                  { id: 'trims', text: 'Thread, buttons and interlining for each shirt', correct: true, feedback: 'Yes. These rise with every shirt she makes.' },
                  { id: 'packaging', text: 'The branded bag each shirt goes out in', correct: true, feedback: 'Yes. One bag per shirt sold.' },
                  { id: 'rent', text: 'Monthly shop rent', correct: false, feedback: 'Rent is the same whether she sells ten shirts or fifty. It is fixed.' },
                  { id: 'salary', text: 'Her own monthly salary', correct: false, feedback: 'Her salary is fixed, and it is a real cost. Many owners forget to count it.' },
                ],
                explanation:
                  "Some costs sit in between. Generator fuel, for example, rises when she works longer hours. For simple planning, decide which family each cost mostly belongs to and be consistent.",
              },
            ],
          },
          {
            id: 'unit-cost',
            title: 'What one shirt really costs',
            blocks: [
              {
                id: 'unit-cost-example',
                type: 'example',
                title: 'Halima’s numbers (fictional)',
                body: "**Variable cost per shirt:**\n\n- Fabric: ₦4,000\n- Thread, buttons, interlining: ₦600\n- Branded bag: ₦400\n- Total variable cost: **₦5,000** per shirt\n\n**Fixed costs per month:**\n\n- Shop rent: ₦40,000\n- Apprentice’s wage: ₦50,000\n- Generator fuel: ₦25,000\n- Phone and data: ₦5,000\n- Halima’s own salary: ₦60,000\n- Total fixed costs: **₦180,000** a month\n\nShe sells each shirt for **₦12,500**.",
              },
              {
                id: 'contribution-choice',
                type: 'choice',
                prompt: 'Each shirt sells for ₦12,500 and has a variable cost of ₦5,000. How much does each shirt contribute towards Halima’s fixed costs and profit?',
                multiple: false,
                options: [
                  { id: 'a', text: '₦5,000', correct: false, feedback: 'That is the variable cost, not what is left over.' },
                  { id: 'b', text: '₦7,500', correct: true, feedback: 'Yes. ₦12,500 − ₦5,000 = ₦7,500.' },
                  { id: 'c', text: '₦12,500', correct: false, feedback: 'That is the full price. Some of it pays for the fabric and trims.' },
                  { id: 'd', text: '₦17,500', correct: false, feedback: 'That adds the cost to the price. Subtract it instead.' },
                ],
                explanation:
                  "Price minus variable cost is called the **contribution** per unit. It is what each sale contributes towards paying the fixed costs, and, once they are covered, towards profit. You will use it in the next lesson to find break-even.",
              },
            ],
          },
          {
            id: 'margin-markup',
            title: 'Margin and markup',
            blocks: [
              {
                id: 'margin-text',
                type: 'text',
                body: "Two words get mixed up all the time.\n\n**Markup** compares your profit on an item with its **cost**. Halima’s ₦7,500 on a ₦5,000 cost is a 150% markup.\n\n**Gross margin** compares the same profit with the **price**. ₦7,500 out of ₦12,500 is a 60% margin.\n\nSame shirt, same profit, two different percentages. Confusing them is one of the commonest pricing mistakes.",
              },
              {
                id: 'margin-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'rD-l7kO4-F4',
                title: 'Margin versus Markup',
                channel: 'The Finance Storyteller',
                durationS: 201,
                caption: "A clear walk-through of margin versus markup. Watch for why a 50% markup is not a 50% margin, and what happens if a supplier or partner uses one word when they mean the other.",
              },
              {
                id: 'margin-choice',
                type: 'choice',
                prompt: 'Njeri sells a cup of juice for KSh 100. The fruit, cup and straw cost her KSh 40. What is her gross margin per cup?',
                multiple: false,
                options: [
                  { id: 'a', text: '40%', correct: false, feedback: 'That is the cost as a share of the price, not the margin.' },
                  { id: 'b', text: '60%', correct: true, feedback: 'Yes. KSh 60 profit ÷ KSh 100 price = 60%.' },
                  { id: 'c', text: '150%', correct: false, feedback: 'That is the markup: KSh 60 ÷ KSh 40 cost.' },
                  { id: 'd', text: '250%', correct: false, feedback: 'That is the price as a share of the cost. Not a margin or a markup.' },
                ],
                explanation:
                  "Margin divides by the **price**; markup divides by the **cost**. Njeri’s 60% margin and 150% markup describe the same cup. When you compare yourself with others, make sure you are comparing the same measure.",
              },
            ],
          },
          {
            id: 'pricing-approaches',
            title: 'Three ways to set a price',
            blocks: [
              {
                id: 'pricing-framework',
                type: 'framework',
                title: 'Pricing approaches',
                steps: [
                  { label: 'Cost-plus', detail: 'Start from your full cost per unit and add a margin. Simple and safe, but it ignores what customers would happily pay.' },
                  { label: 'Competitor-based', detail: 'Look at what similar sellers charge and position yourself above, level or below. Useful, but their costs and quality may not be yours.' },
                  { label: 'Value-based', detail: 'Start from what the result is worth to the customer. Often the most profitable, but it needs real understanding of customers.' },
                ],
              },
              {
                id: 'pricing-match',
                type: 'match',
                prompt: 'Match each pricing decision to the approach it uses.',
                pairs: [
                  { id: 'cost', left: 'Halima adds up fabric, trims and a share of rent, then adds 40% on top', right: 'Cost-plus' },
                  { id: 'competitor', left: 'Njeri checks three juice stalls on her street and prices KSh 10 below the busiest one', right: 'Competitor-based' },
                  { id: 'value', left: 'Halima charges more for rush wedding orders because guests must look perfect on the day', right: 'Value-based' },
                ],
                explanation:
                  "Most good prices use all three: costs set the **floor** you cannot go below, competitors show the **range** customers expect, and value tells you how high you could go. A price below your floor is not a bargain. It is a slow way to close.",
              },
            ],
          },
          {
            id: 'underpricing',
            title: 'The underpricing trap',
            blocks: [
              {
                id: 'underpricing-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Busy is not the same as profitable',
                body: "Many young founders price low to win customers, then discover that every sale loses money once all costs are counted, including their own time. The busier they get, the faster they lose.\n\nCheck: does your price cover your variable cost **and** a fair share of your fixed costs, including a salary for you?",
              },
              {
                id: 'underpricing-reveal',
                type: 'reveal',
                prompt: 'Halima’s friend prices her shirts at ₦7,000 “to beat the competition”. Her variable cost is also ₦5,000 a shirt. What is wrong?',
                body: "Each shirt contributes only ₦2,000 towards fixed costs. If her fixed costs are like Halima’s, ₦180,000 a month, she would need to sell **90 shirts** a month just to break even, before any profit. Halima needs 24.\n\nLow prices are not always wrong, but they must be a deliberate strategy with numbers behind it, not a guess.",
              },
            ],
          },
          {
            id: 'your-costs',
            title: 'Your costs and price',
            blocks: [
              {
                id: 'costs-reflection',
                type: 'reflection',
                prompt: 'For one product or service in your venture or project, list its variable costs per unit and your monthly fixed costs. Then write your current or planned price, its contribution per unit and its gross margin.',
                guidance: 'Estimate where you must and label estimates honestly. Include a salary for yourself in fixed costs, even if you are not paying it yet.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'break-even',
      type: 'lesson',
      title: 'Break-even: the number every builder needs',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'what-break-even',
            title: 'The point where you stop losing money',
            blocks: [
              {
                id: 'break-even-text',
                type: 'text',
                body: "Your **break-even point** is the number of sales at which total income exactly equals total costs. Below it, you lose money. Above it, you make a profit.\n\nIt is the single most useful number in a small venture. It tells you whether your plan is realistic before you spend your savings finding out.\n\nWatch this short explanation, then we will work it out for Halima and Njeri.",
              },
              {
                id: 'break-even-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'r8BIz5I-aDc',
                title: 'Break even analysis',
                channel: 'The Finance Storyteller',
                durationS: 214,
                caption: "A short guide to break-even analysis. Listen for the role of the contribution per unit, the price minus the variable cost, which you met in the last lesson.",
              },
            ],
          },
          {
            id: 'formula',
            title: 'The formula',
            blocks: [
              {
                id: 'formula-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Contribution per unit', definition: 'Price minus variable cost per unit. What each sale adds towards fixed costs and profit.' },
                  { term: 'Break-even units', definition: 'Fixed costs ÷ contribution per unit. Round up: you cannot sell part of a shirt.' },
                  { term: 'Margin of safety', definition: 'How far your expected sales are above break-even. The bigger it is, the more a bad month can absorb.' },
                ],
              },
              {
                id: 'formula-example',
                type: 'example',
                title: 'Halima’s break-even',
                body: "- Fixed costs: ₦180,000 a month\n- Contribution per shirt: ₦12,500 − ₦5,000 = ₦7,500\n- Break-even: ₦180,000 ÷ ₦7,500 = **24 shirts a month**\n\nHalima usually sells about 35 shirts a month. Her margin of safety is about 11 shirts. Every shirt beyond 24 adds ₦7,500 of profit, on top of the salary she now pays herself.\n\nFor the first time, she knows she runs a profitable business.",
              },
            ],
          },
          {
            id: 'njeri-calc',
            title: 'Njeri’s kiosk',
            blocks: [
              {
                id: 'market-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Market_Stalls.jpg/1280px-Market_Stalls.jpg',
                alt: 'A narrow covered market lane lined with large metal bowls of grains, beans and dried peppers, with traders sitting at their stalls and shoppers walking through.',
                caption: 'A market lane of grain and spice stalls. Every stall here has a break-even point, whether or not the owner has written it down.',
                credit: 'Photo: Marvellousdurowaiye / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'njeri-story',
                type: 'callout',
                tone: 'story',
                title: 'Njeri, juice kiosk, Nairobi',
                body: "Njeri now runs a small fresh-juice kiosk near offices in Nairobi’s city centre. She sells each cup for **KSh 100**. Fruit, cup and straw cost her **KSh 40** a cup.\n\nHer fixed costs are **KSh 18,000** a month: kiosk rent KSh 9,000, an assistant KSh 6,000, electricity for the blender KSh 2,000 and her permit, spread over the year, KSh 1,000. (She pays herself from profit for now, and plans to add a salary once sales settle.)",
              },
              {
                id: 'njeri-choice',
                type: 'choice',
                prompt: 'How many cups must Njeri sell each month to break even?',
                multiple: false,
                options: [
                  { id: 'a', text: '180 cups', correct: false, feedback: 'That divides fixed costs by the full price. Use the contribution: price minus variable cost.' },
                  { id: 'b', text: '300 cups', correct: true, feedback: 'Yes. KSh 18,000 ÷ KSh 60 = 300 cups.' },
                  { id: 'c', text: '450 cups', correct: false, feedback: 'That divides by the variable cost, KSh 40. Use the contribution, KSh 60.' },
                  { id: 'd', text: '600 cups', correct: false, feedback: 'Check the contribution per cup: KSh 100 − KSh 40.' },
                ],
                explanation:
                  "300 cups a month is about 12 cups a day over 25 trading days. Njeri can now ask a sharp question: on a normal weekday, do more than 12 people buy juice from me? If the answer is clearly yes, her plan is realistic.",
              },
            ],
          },
          {
            id: 'what-if',
            title: 'Moving the break-even point',
            blocks: [
              {
                id: 'what-if-choice',
                type: 'choice',
                prompt: 'Njeri’s landlord raises the kiosk rent. Which of these would lower her break-even point? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'price', text: 'Raising the price to KSh 110 a cup', correct: true, feedback: 'Yes. Contribution rises to KSh 70, so fewer cups cover fixed costs, as long as customers keep buying.' },
                  { id: 'supplier', text: 'Buying fruit directly from a wholesale market to cut variable cost to KSh 35', correct: true, feedback: 'Yes. Contribution rises to KSh 65 a cup.' },
                  { id: 'fixed', text: 'Sharing the kiosk and its rent with a snack seller', correct: true, feedback: 'Yes. Lower fixed costs mean fewer cups needed.' },
                  { id: 'sell-more', text: 'Selling more cups', correct: false, feedback: 'Selling more takes her further above break-even, which is good, but it does not move the break-even point itself.' },
                ],
                explanation:
                  "Only three levers move break-even: **price**, **variable cost** and **fixed costs**. Selling more is how you get above it. Knowing the difference stops you from trying to “sell your way” out of a pricing problem.",
              },
            ],
          },
          {
            id: 'confidence-check',
            title: 'Check yourself',
            blocks: [
              {
                id: 'break-even-scale',
                type: 'scale',
                prompt: 'How confident are you that you could calculate the break-even point for your own venture or project today?',
                minLabel: 'Not at all',
                maxLabel: 'Very confident',
                afterword:
                  "If you are not confident yet, go back to Halima’s example and redo it with a pen. The method is always the same: fixed costs divided by contribution per unit.",
              },
            ],
          },
          {
            id: 'your-break-even',
            title: 'Your break-even',
            blocks: [
              {
                id: 'break-even-reflection',
                type: 'reflection',
                prompt: 'Using the costs and price you wrote in the last lesson, calculate your break-even point in units per month. Then compare it with the sales you realistically expect. What is your margin of safety, and what would you change if it is too thin?',
                guidance: 'Show your working: fixed costs ÷ (price − variable cost). If your venture sells services, use hours, sessions or clients as your unit.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'family-and-money-discussion',
      type: 'discussion',
      title: 'Discussion: family, money and your venture',
      minutes: 12,
      required: true,
      payload: {
        prompt:
          "Halima’s brother asked for money from the shop drawer. Most of us know a version of this story.\n\nIn your post, answer three questions:\n\n1. In your family or community, what expectations exist around money once someone starts earning or running a business?\n2. Which of those expectations help a young builder, and which make it harder to grow a venture?\n3. What is one practical, respectful way to honour family responsibilities while keeping your venture’s money separate?\n\nThen reply to at least two classmates. Share an idea that has worked for you or someone you know, or ask a question that helps them think it through.",
        guidance: 'Speak about patterns and your own experience. Do not share private details about named relatives. There are no perfect answers here, only honest ones.',
        minWords: 80,
      },
    },
    {
      key: 'venture-numbers-quiz',
      type: 'quiz',
      title: 'Module quiz: venture numbers',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on separating money, costs, margins and break-even. Have a pen or calculator ready. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-salary',
            type: 'choice',
            prompt: 'What is the main benefit of paying yourself a fixed salary from your venture?',
            multiple: false,
            options: [
              { id: 'a', text: 'It reduces the tax you owe', correct: false, feedback: 'Tax rules vary by country. The main benefit here is clarity and discipline.' },
              { id: 'b', text: 'It keeps the venture’s working money in the venture and shows its real costs', correct: true },
              { id: 'c', text: 'It means you never need to save personally', correct: false, feedback: 'Your personal budget still needs savings.' },
              { id: 'd', text: 'It guarantees the venture will make a profit', correct: false, feedback: 'Nothing guarantees profit. A salary makes it visible whether there is one.' },
            ],
            explanation: 'A fixed salary separates the two pots, makes your own pay a visible cost, and stops personal needs from quietly draining stock money.',
          },
          {
            id: 'q-fixed-variable',
            type: 'match',
            prompt: 'A phone-repair kiosk in Kumasi has these costs. Match each to its type.',
            pairs: [
              { id: 'rent', left: 'Monthly kiosk rent', right: 'Fixed cost' },
              { id: 'screens', left: 'Replacement screens fitted for customers', right: 'Variable cost' },
              { id: 'licence', left: 'Annual business permit', right: 'Fixed cost, spread across the year' },
              { id: 'fees', left: 'Mobile money charges on each customer payment', right: 'Variable cost, rising with each sale' },
            ],
            explanation: 'Fixed costs stay the same regardless of sales; variable costs rise with every unit. Annual costs should be spread into a monthly figure so your break-even reflects them.',
          },
          {
            id: 'q-margin',
            type: 'choice',
            prompt: 'A bag costs GH₵ 60 to make and sells for GH₵ 100. What is its gross margin?',
            multiple: false,
            options: [
              { id: 'a', text: '40%', correct: true },
              { id: 'b', text: '60%', correct: false, feedback: 'That is the cost as a share of the price.' },
              { id: 'c', text: '67%', correct: false, feedback: 'That is the markup: GH₵ 40 ÷ GH₵ 60.' },
              { id: 'd', text: '160%', correct: false, feedback: 'That compares price with cost. Margin compares profit with price.' },
            ],
            explanation: 'Gross margin = (price − cost) ÷ price = GH₵ 40 ÷ GH₵ 100 = 40%. The markup on the same bag is about 67%.',
          },
          {
            id: 'q-break-even',
            type: 'choice',
            prompt: 'A tutoring service charges ₦8,000 per session. Each session costs ₦3,000 in transport and materials. Fixed costs are ₦100,000 a month. How many sessions are needed to break even?',
            multiple: false,
            options: [
              { id: 'a', text: '13 sessions', correct: false, feedback: 'That divides by the full price. Use the contribution per session.' },
              { id: 'b', text: '20 sessions', correct: true },
              { id: 'c', text: '34 sessions', correct: false, feedback: 'That divides by the variable cost. Use price minus variable cost.' },
              { id: 'd', text: '50 sessions', correct: false, feedback: 'Check the contribution: ₦8,000 − ₦3,000.' },
            ],
            explanation: 'Contribution = ₦8,000 − ₦3,000 = ₦5,000. Break-even = ₦100,000 ÷ ₦5,000 = 20 sessions a month.',
          },
          {
            id: 'q-levers',
            type: 'choice',
            prompt: 'Which of these lower a venture’s break-even point? Select all that apply.',
            multiple: true,
            options: [
              { id: 'price', text: 'A higher price per unit', correct: true },
              { id: 'variable', text: 'A lower variable cost per unit', correct: true },
              { id: 'fixed', text: 'Lower fixed costs', correct: true },
              { id: 'volume', text: 'Selling more units', correct: false, feedback: 'Selling more takes you further above break-even but does not move the point itself.' },
            ],
            explanation: 'Price, variable cost and fixed costs are the only three levers. Volume decides how far above or below break-even you land.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Plan and protect: statements, forecasts, saving and borrowing
// ---------------------------------------------------------------------------

const financialPlanTemplate = [
  'PERSONAL AND VENTURE FINANCIAL PLAN',
  '',
  'PART A: PERSONAL',
  '',
  '1. My monthly take-home income',
  'Source(s), amount, and whether it is regular or irregular. If irregular, the cautious figure you budget on.',
  '',
  '2. Twelve-month personal budget',
  'Monthly lines for fixed commitments (including family support), savings, and flexible spending. Note any months that differ (school fees, festive season, rent renewal).',
  '',
  '3. What my 30-day tracking showed',
  'Two or three things you learnt, and the changes you made.',
  '',
  '4. Savings goals and emergency fund',
  'Target amount, monthly saving, where you will keep it and why.',
  '',
  'PART B: VENTURE OR PROJECT',
  '',
  '5. The venture in one sentence',
  'What you sell, to whom.',
  '',
  '6. Keeping the money separate',
  'Account or wallet, record-keeping method, and the salary or allowance you pay yourself.',
  '',
  '7. Costs and pricing',
  'Variable cost per unit, monthly fixed costs (including your salary), price, contribution per unit, gross margin, and how you chose the price.',
  '',
  '8. Break-even',
  'Break-even units per month with working, expected sales, and margin of safety.',
  '',
  '9. Simple monthly income statement',
  'Revenue, cost of sales, gross profit, operating expenses, net profit, for a typical month.',
  '',
  '10. Twelve-month cash-flow forecast',
  'For each month: opening cash, cash in, cash out, closing cash. Mark the lowest month and how you will get through it.',
  '',
  '11. Funding, saving and borrowing',
  'How you will fund start-up or growth costs, options compared, and the questions you would ask before borrowing.',
  '',
  '12. Risks and scam check',
  'The two biggest money risks to your plan, and how you will protect yourself and your venture from scams.',
].join('\n');

const modulePlan: Module = {
  key: 'plan-protect',
  title: 'Plan and protect: statements, forecasts, saving and borrowing',
  summary:
    'Read a simple income statement, see why profit is not the same as cash, build a cash-flow forecast, compare saving and borrowing options common across the continent, and learn to spot scams before they cost you.',
  weekNo: 7,
  items: [
    {
      key: 'statements-forecasts',
      type: 'lesson',
      title: 'Income statements and cash-flow forecasts',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'profit-cash',
            title: 'Profit is not cash',
            blocks: [
              {
                id: 'profit-cash-text',
                type: 'text',
                body: "Two questions every venture must answer:\n\n1. **Are we making money?** That is profit, shown on an income statement.\n2. **Will we have enough money in the account when bills are due?** That is cash, shown in a cash-flow forecast.\n\nThey sound the same. They are not. Plenty of profitable businesses have closed because they ran out of cash. Watch this very short explainer.",
              },
              {
                id: 'profit-cash-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'lkEtgnhsV04',
                title: 'Cash Flow vs. Profit: What’s the Difference? | Business: Explained',
                channel: 'HBS Online',
                durationS: 110,
                caption: "Harvard Business School Online on cash flow versus profit in under two minutes. Watch for how a business can be profitable on paper and still be short of cash.",
              },
            ],
          },
          {
            id: 'income-statement',
            title: 'Reading an income statement',
            blocks: [
              {
                id: 'income-statement-text',
                type: 'text',
                body: "An income statement, also called a profit and loss account or P&L, shows income and costs over a period, usually a month or a year. Read it from the top down: each line subtracts something until you reach profit at the bottom.\n\nThis video walks through the basics.",
              },
              {
                id: 'income-statement-video',
                type: 'video',
                provider: 'youtube',
                videoId: '0--AvwZabIQ',
                title: 'The INCOME STATEMENT for BEGINNERS',
                channel: 'Accounting Stuff',
                durationS: 309,
                caption: "A beginner’s guide to the income statement. Watch for the order of the lines, from revenue at the top to net profit at the bottom.",
              },
              {
                id: 'njeri-pl',
                type: 'example',
                title: 'Njeri’s income statement for March (fictional)',
                body: "- Revenue: 600 cups × KSh 100 = **KSh 60,000**\n- Cost of sales: 600 cups × KSh 40 = KSh 24,000\n- **Gross profit: KSh 36,000**\n- Operating expenses: rent, assistant, electricity, permit = KSh 18,000\n- **Net profit: KSh 18,000**\n\nIn March Njeri sold double her break-even of 300 cups, and her net profit is exactly 300 cups × KSh 60.",
              },
            ],
          },
          {
            id: 'read-lines',
            title: 'Name the lines',
            blocks: [
              {
                id: 'lines-match',
                type: 'match',
                prompt: 'Match each income statement line to what it means.',
                pairs: [
                  { id: 'revenue', left: 'Revenue', right: 'Total value of sales in the period' },
                  { id: 'cos', left: 'Cost of sales', right: 'Variable costs of the goods or services sold' },
                  { id: 'gross', left: 'Gross profit', right: 'Revenue minus cost of sales' },
                  { id: 'opex', left: 'Operating expenses', right: 'Running costs such as rent, wages and utilities' },
                  { id: 'net', left: 'Net profit', right: 'What remains after all costs in the period' },
                ],
                explanation:
                  "If you can name these five lines, you can read the core of almost any income statement, from a kiosk to a listed company. Bigger businesses add lines for interest, tax and depreciation, but the logic is the same: income at the top, costs subtracted, profit at the bottom.",
              },
            ],
          },
          {
            id: 'where-cash',
            title: 'Where did the cash go?',
            blocks: [
              {
                id: 'where-cash-reveal',
                type: 'reveal',
                prompt: 'Njeri made KSh 18,000 net profit in March. Yet her cash went up by only KSh 2,000. Before you tap, list three reasons that could happen.',
                body: "In Njeri’s case, two things explain the gap:\n\n- **A customer paid late.** An office that orders juice for meetings owes her KSh 4,000. It counts as March revenue, but the cash has not arrived.\n- **She bought equipment.** A new blender cost KSh 12,000 cash. It will last years, so it is not all a March expense, but the cash left in March.\n\nKSh 18,000 − KSh 4,000 − KSh 12,000 = KSh 2,000. Another common reason in other months: money the owner takes out for personal use reduces business cash without appearing as an operating expense on a simple statement.\n\nProfit tells you whether the business model works. Cash tells you whether you can pay next week’s rent. You need to watch both.",
              },
            ],
          },
          {
            id: 'forecast',
            title: 'Build a cash-flow forecast',
            blocks: [
              {
                id: 'forecast-text',
                type: 'text',
                body: "A **cash-flow forecast** looks ahead, month by month, and asks: how much cash will we have at the end of each month?\n\nEach month has four lines:\n\n- **Opening cash**: what you start the month with (last month’s closing cash).\n- **Cash in**: money you expect to actually receive that month.\n- **Cash out**: money you expect to actually pay that month.\n- **Closing cash** = opening cash + cash in − cash out.\n\nThe point is to spot the dangerous months **before** they arrive.",
              },
              {
                id: 'forecast-example',
                type: 'example',
                title: 'Njeri’s next three months (fictional)',
                body: "**April:** opening KSh 20,000 · cash in KSh 45,000 · cash out KSh 52,000 (includes a one-off kiosk repair) · closing **KSh 13,000**\n\n**May:** opening KSh 13,000 · cash in KSh 55,000 · cash out KSh 42,000 · closing **KSh 26,000**\n\n**June:** opening KSh 26,000 · cash in KSh 40,000 (the cold season, fewer juice buyers) · cash out KSh 45,000 · closing **?**",
              },
              {
                id: 'forecast-choice',
                type: 'choice',
                prompt: 'What is Njeri’s forecast closing cash for June?',
                multiple: false,
                options: [
                  { id: 'a', text: 'KSh 5,000 short', correct: false, feedback: 'That is June’s cash in minus cash out on its own. Remember to start from the opening cash.' },
                  { id: 'b', text: 'KSh 21,000', correct: true, feedback: 'Yes. 26,000 + 40,000 − 45,000 = 21,000.' },
                  { id: 'c', text: 'KSh 31,000', correct: false, feedback: 'Check the signs: cash out is subtracted.' },
                  { id: 'd', text: 'KSh 111,000', correct: false, feedback: 'Cash out must be subtracted, not added.' },
                ],
                explanation:
                  "June is a loss-making month on its own, but Njeri still ends with KSh 21,000 because May built a cushion. Without a forecast she might have spent May’s surplus. With one, she knows to keep it.",
              },
            ],
          },
          {
            id: 'forecast-order',
            title: 'Forecasting step by step',
            blocks: [
              {
                id: 'forecast-steps',
                type: 'order',
                prompt: 'Put the steps for building a twelve-month cash-flow forecast in order.',
                items: [
                  { id: 'opening', text: 'Write down the cash you have today' },
                  { id: 'in', text: 'Estimate cash in for each month, including slow seasons' },
                  { id: 'out', text: 'Estimate cash out for each month, including one-off purchases' },
                  { id: 'closing', text: 'Calculate closing cash and carry it forward as next month’s opening' },
                  { id: 'danger', text: 'Mark the lowest months and plan how to get through them' },
                ],
                explanation:
                  "The last step is the reason forecasts exist. A low or negative month is not a failure of the forecast. It is the forecast doing its job: warning you in time to save, cut, delay a purchase or arrange funding calmly.",
              },
            ],
          },
          {
            id: 'your-forecast',
            title: 'Your first forecast',
            blocks: [
              {
                id: 'forecast-reflection',
                type: 'reflection',
                prompt: 'Draft the first three months of a cash-flow forecast for your venture or project: opening cash, cash in, cash out and closing cash for each month. Which month looks hardest, and why?',
                guidance: 'Think about seasons: school fees, festive months, rainy seasons, holidays. You will extend this to twelve months in your Financial Plan.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'save-borrow-protect',
      type: 'lesson',
      title: 'Saving, borrowing and spotting scams',
      minutes: 20,
      required: true,
      payload: {
        steps: [
          {
            id: 'save-together',
            title: 'Saving is easier together',
            blocks: [
              {
                id: 'save-together-text',
                type: 'text',
                body: "Across Africa, people have saved together for generations: the **susu** in Ghana, **ajo** and **esusu** in Nigeria, the **chama** in Kenya, **tontines** in francophone West and Central Africa, **stokvels** in South Africa. Members contribute regularly and take turns receiving the pot, or build a shared fund they can borrow from.\n\nThese groups work partly because of money and partly because of people: it is harder to skip a contribution when your friends are counting on you. This short talk explains why peers matter so much for saving.",
              },
              {
                id: 'save-together-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'uyvcUVNOqeQ',
                title: 'Why talking to your friends can help you save money | Your Money and Your Mind',
                channel: 'TED',
                durationS: 210,
                caption: "Behavioural scientist Wendy De La Rosa on the surprising power of peers over our money habits. Notice how closely her ideas match the way savings groups already work.",
              },
              {
                id: 'save-disclaimer',
                type: 'callout',
                tone: 'caution',
                title: 'Check current terms yourself',
                body: "This lesson compares types of saving and borrowing in general terms. Fees, interest rates and rules vary by provider and country and change often. Always read the current terms, ask what the total cost will be, and check that a lender or investment is licensed by the right regulator before you commit.",
              },
            ],
          },
          {
            id: 'options',
            title: 'The options around you',
            blocks: [
              {
                id: 'mpesa-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg/1280px-M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg',
                alt: 'A brightly painted green and yellow kiosk with M-PESA and Equity Agent signs, where a customer stands at a barred counter talking to the attendant inside.',
                caption: 'A mobile money and bank agent kiosk in Nairobi, Kenya. Agents like this let people deposit, withdraw and transfer money close to home.',
                credit: 'Photo: Fiona Graham / Wikimedia Commons, CC BY-SA 2.0',
              },
              {
                id: 'options-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Savings group', definition: 'Susu, ajo, chama, tontine or stokvel. Members save together and take turns or borrow from the pool. Built on trust; rules and record-keeping matter.' },
                  { term: 'SACCO or credit union', definition: 'A member-owned co-operative that takes savings and lends to members, usually regulated.' },
                  { term: 'Mobile money savings', definition: 'Savings features on a mobile money platform. Convenient and easy to reach, which can also make them easy to spend.' },
                  { term: 'Microfinance', definition: 'Small loans and savings for people and businesses that banks often do not serve. Costs vary widely.' },
                  { term: 'Bank loan', definition: 'Often lower cost for larger amounts, but usually needs records, a track record or collateral.' },
                  { term: 'Digital loan app', definition: 'Fast small loans through a phone. Quick, but some are very expensive or unlicensed. Check the total cost and the lender’s licence.' },
                ],
              },
            ],
          },
          {
            id: 'match-options',
            title: 'Right tool, right job',
            blocks: [
              {
                id: 'options-match',
                type: 'match',
                prompt: 'Match each need to the option that usually fits it best.',
                pairs: [
                  { id: 'discipline', left: 'Kofi wants to save steadily but finds money in his wallet always gets spent', right: 'A savings group with friends he trusts' },
                  { id: 'buffer', left: 'Njeri needs an emergency fund she can reach within an hour', right: 'A separate mobile money or bank savings account' },
                  { id: 'machine', left: 'Halima wants to buy a second industrial machine with two years of clean records', right: 'A loan from a bank, SACCO or microfinance institution' },
                  { id: 'urgent', left: 'A small, genuinely urgent need that will be repaid in days', right: 'A licensed digital lender, after checking the total cost' },
                ],
                explanation:
                  "No option is good or bad on its own. Each fits a purpose. The danger comes from mismatches: using an expensive short-term loan for a long-term purchase, or keeping an emergency fund somewhere you cannot reach.",
              },
            ],
          },
          {
            id: 'borrow-well',
            title: 'Before you borrow',
            blocks: [
              {
                id: 'borrow-framework',
                type: 'framework',
                title: 'Five questions before any loan',
                steps: [
                  { label: 'What is it for?', detail: 'Borrowing to buy something that earns money (stock, equipment) is very different from borrowing to consume.' },
                  { label: 'What is the total cost?', detail: 'Add every fee and all interest. Ask: how much will I pay back in total, and when?' },
                  { label: 'Can my cash flow repay it?', detail: 'Check your forecast. Can you make every repayment, even in your slowest month?' },
                  { label: 'Who is the lender?', detail: 'Is it licensed by the central bank or relevant regulator? How does it treat borrowers who struggle?' },
                  { label: 'What if things go wrong?', detail: 'What happens if you miss a payment? What do you risk losing?' },
                ],
              },
              {
                id: 'second-kiosk',
                type: 'scenario',
                situation:
                  "Njeri wants to open a second kiosk near a university. Setting it up will cost about **KSh 60,000**. She has KSh 21,000 in cash.\n\nOn her phone she sees an advert: “Instant business loan, KSh 50,000 in five minutes! No paperwork!”",
                prompt: 'What should Njeri do?',
                options: [
                  {
                    id: 'instant',
                    text: 'Take the instant loan today, before the university spot is gone.',
                    outcome: "The money arrives in minutes. The repayment terms are short and the fees are high. The new kiosk takes three months to build regular customers, and the repayments drain the first kiosk’s cash too. She ends up borrowing again to repay.",
                    best: false,
                  },
                  {
                    id: 'forecast',
                    text: 'Forecast the second kiosk’s cash flow first, compare a SACCO or microfinance loan with saving for a few more months, and ask each lender for the total cost.',
                    outcome: "Her forecast shows the new kiosk will be slow for its first few months. She saves for two more months, then takes a smaller SACCO loan with repayments her forecast says she can manage. She opens a little later, and sleeps much better.",
                    best: true,
                  },
                  {
                    id: 'chama',
                    text: 'Ask her chama to give her the whole pot early, without telling them what it is for.',
                    outcome: "The group is uneasy. Savings groups run on trust and clear rules, and a secretive request strains both. Even if they agree, she has not checked whether the second kiosk can work.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'scams',
            title: 'Spotting scams',
            blocks: [
              {
                id: 'scams-text',
                type: 'text',
                body: "Wherever people work hard for money, someone is trying to take it from them. Ponzi and pyramid schemes, fake forex and crypto “signal” groups, and “investment clubs” promising to double your money have cost families across the continent their savings. One scheme, MMM, spread through Nigeria, South Africa and other countries in the 2010s before it froze payouts and left many participants with losses.\n\nThe tricks change. The pattern does not. This animated lesson shows how pyramid schemes recruit, and how to spot one.",
              },
              {
                id: 'scams-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'SBGfHk91Vrk',
                title: 'How to spot a pyramid scheme - Stacie Bosley',
                channel: 'TED-Ed',
                durationS: 302,
                caption: "A TED-Ed lesson on how pyramid schemes work and how to avoid them. Watch for the warning signs, then check them against any “opportunity” you have been sent on WhatsApp.",
              },
              {
                id: 'red-flags-choice',
                type: 'choice',
                prompt: 'A friend invites Kofi to an “investment club” on WhatsApp. Which of these are red flags? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'guaranteed', text: '“Guaranteed 30% returns every month”', correct: true, feedback: 'Yes. Real investments carry risk. Guaranteed high returns are the classic sign of a scam.' },
                  { id: 'recruit', text: '“You earn bonuses for every person you bring in”', correct: true, feedback: 'Yes. When income depends on recruiting, the scheme needs an endless stream of new money.' },
                  { id: 'urgent', text: '“Slots close tonight, decide now”', correct: true, feedback: 'Yes. Pressure to decide fast is designed to stop you thinking and checking.' },
                  { id: 'vague', text: '“Our traders use a secret strategy we cannot explain”', correct: true, feedback: 'Yes. If nobody can explain how the money is made, assume it is made from you.' },
                  { id: 'licensed', text: '“Here is our licence number; you can check it on the regulator’s website”', correct: false, feedback: 'This is a good sign, though still verify it yourself on the regulator’s own site, not through a link they send.' },
                ],
                explanation:
                  "Remember the pattern: **guaranteed high returns, pressure, recruitment, secrecy.** Before you put money anywhere, check the company and the person with your country’s securities regulator or central bank, and ask: how exactly does this make money? Early “winners” are often paid with later members’ money, which is why the testimonials look so convincing.",
              },
            ],
          },
          {
            id: 'scam-poll',
            title: 'How common is it?',
            blocks: [
              {
                id: 'scam-exposure-poll',
                type: 'poll',
                prompt: 'In the last year, have you or someone close to you been invited into a scheme promising quick, guaranteed returns?',
                options: [
                  { id: 'me', text: 'Yes, I was invited myself' },
                  { id: 'close', text: 'Yes, someone close to me was' },
                  { id: 'lost', text: 'Yes, and someone I know lost money' },
                  { id: 'no', text: 'Not that I know of' },
                ],
                afterword:
                  "Look at how many of your classmates said yes. Scams spread through trusted networks: friends, family, church and mosque groups, alumni chats. That is why your scepticism protects not only you but the people who trust your judgement.",
              },
            ],
          },
          {
            id: 'save-plan',
            title: 'Little by little',
            blocks: [
              {
                id: 'swahili-proverb',
                type: 'quote',
                text: 'Haba na haba hujaza kibaba. (Little by little fills the measure.)',
                attribution: 'Swahili proverb',
              },
              {
                id: 'save-reflection',
                type: 'reflection',
                prompt: 'Write your saving and borrowing plan for the next year. What will you save for, how much each month, and where will you keep it? If your venture may need funding, which option would you consider first, and what questions would you ask before borrowing?',
                guidance: 'Use the five questions before any loan. Add one personal rule for scams, for example: “I will never invest in anything I cannot check with the regulator.”',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'plan-protect-quiz',
      type: 'quiz',
      title: 'Module quiz: plan and protect',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on income statements, cash-flow forecasts, saving, borrowing and scams. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-gross-profit',
            type: 'choice',
            prompt: 'A shop has revenue of GH₵ 20,000, cost of sales of GH₵ 12,000 and operating expenses of GH₵ 5,000 in a month. What is its gross profit?',
            multiple: false,
            options: [
              { id: 'a', text: 'GH₵ 3,000', correct: false, feedback: 'That is net profit, after operating expenses.' },
              { id: 'b', text: 'GH₵ 8,000', correct: true },
              { id: 'c', text: 'GH₵ 15,000', correct: false, feedback: 'That subtracts operating expenses from revenue. Gross profit subtracts cost of sales.' },
              { id: 'd', text: 'GH₵ 20,000', correct: false, feedback: 'That is revenue.' },
            ],
            explanation: 'Gross profit = revenue − cost of sales = GH₵ 8,000. Net profit = gross profit − operating expenses = GH₵ 3,000.',
          },
          {
            id: 'q-closing-cash',
            type: 'choice',
            prompt: 'A venture opens the month with ₦150,000, expects ₦400,000 cash in and ₦480,000 cash out. What is its closing cash?',
            multiple: false,
            options: [
              { id: 'a', text: '₦80,000 short', correct: false, feedback: 'That ignores the opening cash.' },
              { id: 'b', text: '₦70,000', correct: true },
              { id: 'c', text: '₦230,000', correct: false, feedback: 'Check the subtraction: 150,000 + 400,000 − 480,000.' },
              { id: 'd', text: '₦1,030,000', correct: false, feedback: 'Cash out is subtracted, not added.' },
            ],
            explanation: 'Closing cash = opening + cash in − cash out = ₦150,000 + ₦400,000 − ₦480,000 = ₦70,000.',
          },
          {
            id: 'q-profit-cash',
            type: 'choice',
            prompt: 'Which of these can make a profitable business run short of cash? Select all that apply.',
            multiple: true,
            options: [
              { id: 'late', text: 'Customers paying weeks after the sale', correct: true },
              { id: 'equipment', text: 'Buying equipment for cash', correct: true },
              { id: 'stock', text: 'Buying a large amount of stock ahead of a busy season', correct: true },
              { id: 'price', text: 'Raising prices while customers keep buying', correct: false, feedback: 'If customers keep buying, higher prices bring in more cash, not less.' },
            ],
            explanation: 'Timing is everything. Profit records sales and costs when they happen; cash records when money actually moves. Late payments, equipment and stock all take cash before they return it.',
          },
          {
            id: 'q-loan-order',
            type: 'order',
            prompt: 'Put the five questions before any loan in the order taught in this course.',
            items: [
              { id: 'purpose', text: 'What is it for?' },
              { id: 'cost', text: 'What is the total cost?' },
              { id: 'repay', text: 'Can my cash flow repay it?' },
              { id: 'lender', text: 'Who is the lender?' },
              { id: 'wrong', text: 'What if things go wrong?' },
            ],
            explanation: 'Start with purpose, because borrowing to earn differs from borrowing to consume. Then cost, repayment, lender and downside. If any answer worries you, pause.',
          },
          {
            id: 'q-scam',
            type: 'choice',
            prompt: 'An “investment platform” promises 25% a month, guaranteed, and pays you a bonus for each new member you recruit. What is the most likely explanation?',
            multiple: false,
            options: [
              { id: 'a', text: 'It has found a clever new trading strategy', correct: false, feedback: 'Genuine strategies cannot guarantee returns like this.' },
              { id: 'b', text: 'It pays earlier members with money from newer members', correct: true },
              { id: 'c', text: 'It is a normal savings group', correct: false, feedback: 'Savings groups pool members’ own contributions; they do not promise outside returns or recruitment bonuses.' },
              { id: 'd', text: 'It is a government bond', correct: false, feedback: 'Government securities do not pay recruitment bonuses.' },
            ],
            explanation: 'Guaranteed high returns plus recruitment rewards is the signature of a Ponzi or pyramid scheme. It works until new money slows, then collapses, and most people lose.',
          },
        ],
      },
    },
    {
      key: 'financial-plan',
      type: 'assignment',
      title: 'Practical Output: your Personal and Venture Financial Plan',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: a **Personal and Venture Financial Plan**.\n\nPart A is your personal plan: a twelve-month budget that reflects your real income and responsibilities, what your tracking taught you, and your savings goals.\n\nPart B is a simple financial model for your venture or project: how its money stays separate from yours, its costs and pricing, its break-even point, a typical monthly income statement and a twelve-month cash-flow forecast, plus how you will fund it and protect it.\n\nYou have drafted most of it in your journal. Now bring it together. A spreadsheet is welcome; attach it, and summarise the key numbers in the template below. If you do not yet have a venture, model the one you plan to build in the Dream Residency, and label every estimate.\n\nThis is general financial education. Your reviewer will assess your reasoning, not tell you what to do with your money. Your plan joins your Dream Lab portfolio and feeds directly into the Sustainability and Impact stage of your residency.",
        practicalOutput: 'Personal and Venture Financial Plan',
        steps: [
          'Gather your journal reflections from every lesson: budget, tracking plan, separation plan, costs and price, break-even, forecast and saving plan.',
          'Complete at least 30 days of tracking if you can, and use what you learnt to correct your budget.',
          'Build your twelve-month personal budget, including family support and any months that differ.',
          'Work out your venture’s variable cost per unit, monthly fixed costs (including a salary for yourself), price, contribution and break-even.',
          'Write a typical monthly income statement and a twelve-month cash-flow forecast. Mark the lowest month and your plan for it.',
          'Compare at least two funding or saving options and apply the five questions before any loan.',
          'Fill in every section of the template. Show your working for break-even and closing cash.',
          'Read it through once as a sceptical lender would. Fix anything that does not add up, then submit.',
        ],
        rubric: [
          {
            id: 'personal-budget',
            criterion: 'Realistic personal budget',
            description: 'A twelve-month budget built on honest take-home income, including family responsibilities, savings paid first, and evidence from tracking. Irregular income is handled cautiously.',
          },
          {
            id: 'separation',
            criterion: 'Separation of personal and venture money',
            description: 'A clear, practical system for keeping venture money separate, with a defined salary or allowance for the owner and a record-keeping method.',
          },
          {
            id: 'unit-economics',
            criterion: 'Costs, pricing and break-even',
            description: 'Fixed and variable costs correctly identified, price justified using cost, competitors and value, contribution and gross margin calculated correctly, and break-even worked out with a margin of safety.',
          },
          {
            id: 'statements',
            criterion: 'Income statement and cash-flow forecast',
            description: 'A correctly structured monthly income statement and a twelve-month cash-flow forecast whose closing cash carries forward correctly, with seasonal patterns and the lowest month identified and planned for.',
          },
          {
            id: 'funding-risk',
            criterion: 'Funding, borrowing and protection',
            description: 'Compares realistic saving and funding options, applies the five questions before borrowing, and names key money risks including scams, with sensible protections.',
          },
          {
            id: 'clarity',
            criterion: 'Honesty and clarity',
            description: 'Numbers add up, estimates are labelled with their source, and the plan is clear enough for a mentor or lender to follow.',
          },
        ],
        template: financialPlanTemplate,
        minWords: 250,
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
          "Ten questions across the whole course: budgets, separation, costs, pricing, break-even, statements, forecasts, borrowing and scams. Most follow a new fictional case, so have a pen or calculator ready.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-intro',
            type: 'choice',
            prompt: 'New case: Ama runs a small bakery in Tamale. She takes home a variable income from it and supports her younger brother. Which first step would help her most?',
            multiple: false,
            options: [
              { id: 'a', text: 'Apply for a large loan to expand', correct: false, feedback: 'She cannot judge a loan until she knows her numbers.' },
              { id: 'b', text: 'Separate the bakery’s money from her own and pay herself a fixed amount', correct: true },
              { id: 'c', text: 'Stop supporting her brother', correct: false, feedback: 'Responsibilities should be planned, not ignored. Separation lets her see what she can sustain.' },
              { id: 'd', text: 'Lower her prices to attract more customers', correct: false, feedback: 'Without knowing her costs, a price cut could make things worse.' },
            ],
            explanation: 'Separation comes first. Until the bakery’s money is in its own pot, Ama cannot tell whether it is profitable, what she can afford to take home, or what her brother’s support really costs.',
          },
          {
            id: 'f-case-costs',
            type: 'match',
            prompt: 'Ama’s costs. Match each to its type.',
            pairs: [
              { id: 'flour', left: 'Flour, sugar and margarine for each batch', right: 'Variable cost' },
              { id: 'rent', left: 'Rent for the bakery room', right: 'Fixed cost' },
              { id: 'salary', left: 'Ama’s own fixed monthly pay', right: 'Fixed cost that owners often forget' },
              { id: 'wrap', left: 'Plastic wrap for each loaf', right: 'Variable cost per unit' },
            ],
            explanation: 'Her own pay is a real fixed cost. Leaving it out makes the bakery look more profitable than it is and the break-even point look lower than it is.',
          },
          {
            id: 'f-case-contribution',
            type: 'choice',
            prompt: 'Ama sells a loaf for GH₵ 20. Ingredients and wrap cost GH₵ 12 a loaf. What is the contribution per loaf?',
            multiple: false,
            options: [
              { id: 'a', text: 'GH₵ 8', correct: true },
              { id: 'b', text: 'GH₵ 12', correct: false, feedback: 'That is the variable cost.' },
              { id: 'c', text: 'GH₵ 20', correct: false, feedback: 'That is the price.' },
              { id: 'd', text: 'GH₵ 32', correct: false, feedback: 'Subtract the variable cost from the price; do not add it.' },
            ],
            explanation: 'Contribution = price − variable cost = GH₵ 20 − GH₵ 12 = GH₵ 8. Her gross margin is 40% and her markup about 67%.',
          },
          {
            id: 'f-case-break-even',
            type: 'choice',
            prompt: 'Ama’s fixed costs, including her own pay, are GH₵ 4,000 a month. How many loaves must she sell each month to break even?',
            multiple: false,
            options: [
              { id: 'a', text: '200 loaves', correct: false, feedback: 'That divides by the full price.' },
              { id: 'b', text: '334 loaves', correct: false, feedback: 'That divides by the variable cost.' },
              { id: 'c', text: '500 loaves', correct: true },
              { id: 'd', text: '4,000 loaves', correct: false, feedback: 'Divide fixed costs by the contribution per loaf.' },
            ],
            explanation: 'Break-even = GH₵ 4,000 ÷ GH₵ 8 = 500 loaves a month, about 20 a day over 25 days.',
          },
          {
            id: 'f-case-levers',
            type: 'choice',
            prompt: 'Ama sells about 450 loaves a month. Which actions would help her reach or pass break-even? Select all that apply.',
            multiple: true,
            options: [
              { id: 'price', text: 'Raising her price slightly, if customers will accept it', correct: true },
              { id: 'bulk', text: 'Buying flour in bulk with other bakers to cut her variable cost', correct: true },
              { id: 'sell', text: 'Finding a school or office that orders 100 loaves a month', correct: true },
              { id: 'hide', text: 'Leaving her own pay out of the fixed costs', correct: false, feedback: 'That makes the numbers look better without changing reality.' },
            ],
            explanation: 'She can move break-even down with price or cost, or move sales up past it. Removing her pay from the figures only hides the problem.',
          },
          {
            id: 'f-income-statement',
            type: 'order',
            prompt: 'Put the lines of a simple income statement in order, from top to bottom.',
            items: [
              { id: 'revenue', text: 'Revenue' },
              { id: 'cos', text: 'Cost of sales' },
              { id: 'gross', text: 'Gross profit' },
              { id: 'opex', text: 'Operating expenses' },
              { id: 'net', text: 'Net profit' },
            ],
            explanation: 'Income at the top, then costs subtracted in stages, with profit at the bottom.',
          },
          {
            id: 'f-forecast',
            type: 'choice',
            prompt: 'Ama opens December with GH₵ 3,000. She expects GH₵ 14,000 cash in and GH₵ 12,500 cash out. What is her December closing cash?',
            multiple: false,
            options: [
              { id: 'a', text: 'GH₵ 1,500', correct: false, feedback: 'That is December’s net movement only. Add the opening cash.' },
              { id: 'b', text: 'GH₵ 4,500', correct: true },
              { id: 'c', text: 'GH₵ 15,500', correct: false, feedback: 'Cash out must be subtracted from opening cash plus cash in.' },
              { id: 'd', text: 'GH₵ 29,500', correct: false, feedback: 'Cash out is subtracted, not added.' },
            ],
            explanation: 'Closing = 3,000 + 14,000 − 12,500 = GH₵ 4,500, which becomes January’s opening cash.',
          },
          {
            id: 'f-profit-vs-cash',
            type: 'choice',
            prompt: 'Ama’s income statement shows a healthy profit, but her account is nearly empty. What is the most likely explanation?',
            multiple: false,
            options: [
              { id: 'a', text: 'The income statement must be wrong', correct: false, feedback: 'Not necessarily. Profit and cash measure different things.' },
              { id: 'b', text: 'Cash has gone into things like an oven, stock or customers who have not yet paid', correct: true },
              { id: 'c', text: 'She has been paying too little tax', correct: false, feedback: 'That would leave more cash, not less.' },
              { id: 'd', text: 'Profitable businesses always have plenty of cash', correct: false, feedback: 'Many profitable businesses have failed for lack of cash.' },
            ],
            explanation: 'Profit records when sales and costs happen; cash records when money moves. A forecast is how you see the gap coming.',
          },
          {
            id: 'f-borrow',
            type: 'choice',
            prompt: 'Ama wants a new oven. Which approach best reflects the course?',
            multiple: false,
            options: [
              { id: 'a', text: 'Take the fastest loan available so she can start sooner', correct: false, feedback: 'Speed is not a reason. Fast loans are often the most expensive.' },
              { id: 'b', text: 'Check her forecast, compare options on total cost, confirm the lender is licensed, and make sure repayments fit her slowest month', correct: true },
              { id: 'c', text: 'Borrow as much as possible in case she needs more later', correct: false, feedback: 'Unneeded debt costs money and adds risk.' },
              { id: 'd', text: 'Never borrow under any circumstances', correct: false, feedback: 'Borrowing to buy something that earns money can be sensible if the numbers work.' },
            ],
            explanation: 'Purpose, total cost, repayment capacity, lender and downside. An oven that earns money can justify a loan, if the cash flow can carry it.',
          },
          {
            id: 'f-scam',
            type: 'choice',
            prompt: 'A trusted church friend invites Ama to a scheme that “doubles your money in 30 days, guaranteed”. Which are the right responses? Select all that apply.',
            multiple: true,
            options: [
              { id: 'check', text: 'Check whether the scheme is registered with the securities regulator or central bank', correct: true },
              { id: 'how', text: 'Ask exactly how the money is made, and walk away if nobody can explain', correct: true },
              { id: 'trust', text: 'Join, because she trusts the friend who invited her', correct: false, feedback: 'Scams spread through trusted networks. Your friend may be a victim too.' },
              { id: 'small', text: 'Put in a small amount first to test it', correct: false, feedback: 'Early payouts are how schemes build trust before they collapse. A “successful test” proves nothing.' },
            ],
            explanation: 'Guaranteed high returns are the clearest red flag there is. Check the regulator, demand a clear explanation, and remember that early winners are often paid with later members’ money.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const financialIntelligence: CourseAuthoring = {
  slug: 'financial-intelligence',
  title: 'Financial Intelligence',
  subtitle: 'Understand money well enough to run your life and your venture with confidence.',
  description:
    "Many good ventures fail not because the idea was wrong, but because the money ran out, was mixed with family money, or was never really understood. Financial intelligence is the ability to read, plan and decide with numbers.\n\nThis course covers personal and venture finance in plain language. You will learn to budget and track cash flow, to separate personal and business money, to understand costs, pricing, margins and break-even, and to read a simple income statement and cash-flow forecast. You will explore saving and borrowing options common across the continent, from savings groups and mobile money to microfinance and bank loans, and learn to spot scams and “guaranteed returns” before they cost you.\n\nEvery exercise uses simple tools: a notebook or a basic spreadsheet on your phone.\n\nYour Practical Output is a **Personal and Venture Financial Plan**: a twelve-month personal budget and a simple financial model for your venture or project, including pricing, costs, break-even and cash-flow forecast.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 4,
  outcomes: [
    'Build and keep a personal budget and track cash flow honestly.',
    'Separate personal and venture money and understand why it matters.',
    'Calculate costs, prices, margins and break-even for a product or service.',
    'Read a simple income statement and build a cash-flow forecast.',
    'Compare saving and borrowing options, and recognise financial scams.',
  ],
  skills: ['Budgeting', 'Cash-flow management', 'Pricing', 'Break-even analysis', 'Financial statements', 'Financial planning'],
  audience: 'Young builders who want control over their money and need to understand the numbers behind a venture or project.',
  prerequisites: 'Basic arithmetic. No accounting background needed.',
  practicalOutput: 'Personal and Venture Financial Plan',
  cover: {
    from: '#1E3A12',
    to: '#8DB33A',
    symbol: '■',
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Naira_notes_%2876252%29.jpg/1280px-Naira_notes_%2876252%29.jpg",
    imageAlt: "The front and back of a Nigerian two-hundred-naira banknote laid on paper.",
    imageCredit: "Photo: FAdelabu / Wikimedia Commons, CC BY-SA 4.0",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'bVqammPD5Sw',
    title: 'Financial literacy for Gen Z | Sola Adesakin | TEDxBellsTech',
    channel: 'TEDx Talks',
    durationS: 1104,
  },
  instructors: [],
  modules: [modulePersonal, moduleVenture, modulePlan],
};

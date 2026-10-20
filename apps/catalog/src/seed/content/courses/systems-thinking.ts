import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Systems Thinking and Formulation: the closing Life Architecture course of The African Dream Lab
 * (week 4, 5 credits).
 *
 * Spine: See the whole → Map the loops → Spot the traps → Find the leverage → Formulate the plan.
 * Recurring cast, all fictional:
 *   Amina   a tomato trader in Kano, now looking at the whole tomato chain, not just her stall
 *   Wanjiru operations lead at a Nairobi matatu SACCO, fighting the evening queue
 *   Uwase   secretary of a village borehole committee in Rwanda’s Eastern Province
 *   Kwame   a university student in Kumasi, volunteering at a junior high school
 *   Okello  chair of a fishers’ group on the Ugandan shore of Lake Victoria
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · See the whole system
// ---------------------------------------------------------------------------

const moduleSee: Module = {
  key: 'see-the-system',
  title: 'See the whole system',
  summary:
    'Learn what a system is, why some problems refuse to stay solved, and how to look beneath events to the patterns, structures and beliefs that keep producing them. Then map the actors, stocks and flows around your own problem.',
  weekNo: 4,
  items: [
    {
      key: 'what-is-a-system',
      type: 'lesson',
      title: 'Why some problems refuse to stay solved',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Systems Thinking',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to the last course of Life Architecture.\n\nIn Problem Solving you learnt to define a problem and dig to its roots. This week you zoom out. Some problems have no single root. They are produced by a **system**: many parts, connected in ways that keep the problem alive even when everyone is trying to fix it.\n\nThink of traffic that returns a year after a new road opens. A project that works until the funder leaves. Prices that climb again after a subsidy. Nobody chose these results. The system did.\n\nBy Friday you will have a **System Map and Leverage Brief** for the problem you have been working on, and you will fold it into your Life Architecture Blueprint. Start with the short film below.",
              },
              {
                id: 'welcome-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'qGRCWF4OK0U',
                title: 'What is Systems Thinking?',
                channel: 'MIT xPRO',
                durationS: 162,
                caption: "Two systems engineers explain what systems thinking is, and what it is not. Listen for the difference between thinking *systematically* (being tidy and step by step) and thinking in *systems* (seeing how parts affect each other).",
              },
            ],
          },
          {
            id: 'starting-point',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'starting-scale',
                type: 'scale',
                prompt: 'When a problem keeps coming back, how easily can you see the bigger picture behind it?',
                minLabel: 'I see only the parts',
                maxLabel: 'I see the whole',
                afterword:
                  "Most of us are trained to look at parts: one cause, one department, one person to blame. Seeing the whole is a habit, and like any habit it grows with practice. You will rate yourself again at the end of the week.",
              },
            ],
          },
          {
            id: 'three-parts',
            title: 'What makes a system',
            blocks: [
              {
                id: 'three-parts-text',
                type: 'text',
                body: "A system is a set of parts that are connected and that together produce a result. Every system has three things:\n\n- **Elements**: the parts you can point at. Traders, trucks, baskets, customers.\n- **Interconnections**: the relationships between them. Money, information, goods, trust, rules.\n- **A purpose or function**: what the system actually does, which may not be what anyone says it is for.\n\nThe last one surprises people. A school system may say its purpose is learning, but if it rewards only exam passes, what it actually produces is exam passing. To find a system’s real purpose, watch what it does, not what it says.",
              },
              {
                id: 'three-parts-choice',
                type: 'choice',
                prompt: 'Which of these are systems in this sense? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'market', text: 'A city vegetable market', correct: true, feedback: 'Yes. Traders, buyers, transporters, prices and rules all affect each other.' },
                  { id: 'family', text: 'A family’s monthly budget', correct: true, feedback: 'Yes. Income, spending, obligations to relatives and savings all push on each other.' },
                  { id: 'pile', text: 'A pile of bricks on a building site', correct: false, feedback: 'A pile has parts but no interconnections. Remove a brick and the rest do not change. Build them into a wall and you begin to have a system.' },
                  { id: 'route', text: 'A matatu route with its owners, drivers, passengers and police checks', correct: true, feedback: 'Yes. Change the pay of drivers and you change how they drive, which changes waiting times for passengers.' },
                ],
                explanation:
                  "A useful test: **if you change one part, do other parts change too?** If yes, you are looking at a system. If you can remove a part and nothing else notices, you have a collection, not a system.",
              },
            ],
          },
          {
            id: 'market-system',
            title: 'A market is a system',
            blocks: [
              {
                id: 'market-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Balogun_Market%2C_Lagos_Island.jpg/1280px-Balogun_Market%2C_Lagos_Island.jpg',
                alt: 'A view from above of a busy market street lined with stalls under red and green metal roofs, with clothes hanging on display, umbrellas and many people walking.',
                caption: 'Balogun Market on Lagos Island, Nigeria. Every stall here is connected to suppliers, transporters, landlords, customers and each other.',
                credit: 'Photo: Yellowcrunchy / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'amina-story',
                type: 'callout',
                tone: 'story',
                title: 'Amina looks up from her stall',
                body: "In Problem Solving, Amina (a fictional tomato trader in Kano) tested shallow crates and cut her losses. Then something odd happened. A month later, the farmers who supply her raised their prices, the loaders asked for more to carry crates, and two other traders copied her and bid for the same crates.\n\nAmina’s fix worked at her stall. But her stall sits inside a bigger system, and the system pushed back.",
              },
              {
                id: 'market-match',
                type: 'match',
                prompt: 'Match each part of Amina’s tomato system to what kind of part it is.',
                pairs: [
                  { id: 'farmers', left: 'Farmers, transporters, loaders and other traders', right: 'Elements: the actors' },
                  { id: 'money', left: 'Cash paid per basket at the truck', right: 'Interconnection: a flow of money' },
                  { id: 'rule', left: 'Loaders are paid per basket, not per kilo or by condition', right: 'Interconnection: a rule' },
                  { id: 'purpose', left: 'Moving as many baskets as possible, as fast as possible', right: 'What the system actually does' },
                ],
                explanation:
                  "Notice that the rule (pay per basket) and the actual purpose (move baskets fast) explain a lot. Nobody in the chain is paid for keeping tomatoes in good condition. That is not anyone’s fault. It is the design of the system.",
              },
            ],
          },
          {
            id: 'yesterday',
            title: 'Yesterday’s solutions',
            blocks: [
              {
                id: 'senge-quote',
                type: 'quote',
                text: 'Today’s problems come from yesterday’s “solutions.”',
                attribution: 'Peter Senge, The Fifth Discipline (1990)',
              },
              {
                id: 'yesterday-reveal',
                type: 'reveal',
                prompt: 'Why might yesterday’s solution cause today’s problem? Think of one example from your own town before you tap.',
                body: "Because a fix changes the system, and the system responds.\n\nA wider road makes driving easier, so more people drive, and the road fills up again. A free borehole means nobody saves for repairs, so it breaks and stays broken. A loan pays this month’s rent, and next month there is rent and a repayment.\n\nNone of these fixes was foolish. Each one solved the problem in front of it. Systems thinking asks one more question: **and then what happens?**",
              },
            ],
          },
          {
            id: 'which-system',
            title: 'Your system',
            blocks: [
              {
                id: 'system-poll',
                type: 'poll',
                prompt: 'The problem you defined in Problem Solving sits inside a system. Which kind is closest?',
                options: [
                  { id: 'market', text: 'A market or value chain' },
                  { id: 'transport', text: 'A transport or city system' },
                  { id: 'school', text: 'A school or learning system' },
                  { id: 'service', text: 'A public service, such as water, health or power' },
                  { id: 'organisation', text: 'An organisation or team' },
                  { id: 'household', text: 'A family or household economy' },
                ],
                afterword:
                  "Every one of these can be mapped with the same tools. This week you will map yours, find its loops and traps, and look for a place where a small push could make a lasting difference.",
              },
              {
                id: 'system-reflection',
                type: 'reflection',
                prompt: 'Write your problem statement from Problem Solving. Then list at least six elements of the system around it: people, groups, things, places or rules that affect the problem or are affected by it.',
                guidance: 'Go wider than feels natural. Include people who never see the problem but shape it, such as suppliers, officials, funders or relatives. This list is the start of your System Map.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'iceberg',
      type: 'lesson',
      title: 'Below the surface: the iceberg',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'iceberg-intro',
            title: 'Events are only the tip',
            blocks: [
              {
                id: 'iceberg-text',
                type: 'text',
                body: "When something goes wrong, we usually react to the **event**: the bus that did not come, the pupil who missed class, the pump that broke. Reacting is natural, and sometimes necessary. But if you only ever react, the same events keep arriving.\n\nThe iceberg model helps you look underneath. Only a small part of an iceberg shows above the water. Most of it, and most of what decides where it goes, is out of sight.",
              },
              {
                id: 'iceberg-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'Te1VYXqUH_c',
                title: 'Iceberg model',
                channel: 'Systems Innovation Network',
                durationS: 445,
                caption: "An introduction to the iceberg model. As you watch, write down the four levels and think of one problem in your town at each level.",
              },
            ],
          },
          {
            id: 'iceberg-levels',
            title: 'Four levels',
            blocks: [
              {
                id: 'iceberg-framework',
                type: 'framework',
                title: 'The iceberg',
                steps: [
                  { label: 'Events', detail: 'What just happened. “Passengers waited an hour at the stage last night.” We react.' },
                  { label: 'Patterns', detail: 'What keeps happening over time. “The wait is long every weekday evening, and worse on Fridays.” We anticipate.' },
                  { label: 'Structures', detail: 'What causes the pattern: rules, incentives, flows, physical layout. “Owners earn more from morning trips, so many vehicles rest in the evening.” We redesign.' },
                  { label: 'Mental models', detail: 'The beliefs that keep the structure in place. “Evening passengers will wait anyway.” “Drivers are lazy.” We transform.' },
                ],
              },
              {
                id: 'iceberg-insight',
                type: 'callout',
                tone: 'insight',
                title: 'The deeper the level, the bigger the lever',
                body: "Reacting to events is fast but changes nothing for tomorrow. Changing a structure changes many tomorrows. Changing a mental model can change the whole system, because people redesign the structures themselves.",
              },
            ],
          },
          {
            id: 'wanjiru-levels',
            title: 'Wanjiru’s stage',
            blocks: [
              {
                id: 'wanjiru-match',
                type: 'match',
                prompt: 'Wanjiru (fictional) runs operations for a matatu SACCO in Nairobi. Match what she hears to the level of the iceberg.',
                pairs: [
                  { id: 'event', left: '“A passenger fought with the stage marshal last night.”', right: 'Event' },
                  { id: 'pattern', left: '“Evening waits have been over 40 minutes most weekdays since January.”', right: 'Pattern' },
                  { id: 'structure', left: '“Owners set a flat daily target, so drivers stop once they hit it.”', right: 'Structure' },
                  { id: 'mental', left: '“Evening passengers have no choice, so they will always come back.”', right: 'Mental model' },
                ],
                explanation:
                  "The fight is what everyone will talk about. But it is produced by the pattern, which is produced by the target system, which survives because owners believe passengers will wait. A boda boda company that thinks differently could take those passengers away.",
              },
            ],
          },
          {
            id: 'respond-level',
            title: 'Respond at the right level',
            blocks: [
              {
                id: 'kwame-example',
                type: 'example',
                title: 'Kwame’s Thursday problem, on the iceberg',
                body: "Kwame (fictional) found that a third of JHS 2 pupils at his partner school in Kumasi miss Thursday lessons, when older children mind younger siblings on market day.\n\n- **Event:** twelve pupils absent last Thursday.\n- **Pattern:** absences double every Thursday, all term.\n- **Structure:** Thursday is market day; there is no childcare near the market; the timetable puts maths on Thursday mornings.\n- **Mental model:** “Older children are the family’s backup carers.” Also, among some teachers: “Those pupils don’t care about school.”",
              },
              {
                id: 'respond-choice',
                type: 'choice',
                prompt: 'Which response works at the level of structure?',
                multiple: false,
                options: [
                  { id: 'phone', text: 'Calling the parents of every absent pupil on Thursday afternoon', correct: false, feedback: 'This reacts to each event. It may help a little, but next Thursday the same thing happens.' },
                  { id: 'timetable', text: 'Moving maths from Thursday morning to a day when attendance is high', correct: true, feedback: 'Yes. It changes the design of the system so the pattern does less harm, without needing anyone to try harder.' },
                  { id: 'speech', text: 'Giving a speech at assembly about the importance of attendance', correct: false, feedback: 'Pupils already know school matters. A speech targets beliefs the pupils do not hold, and leaves the structure untouched.' },
                  { id: 'punish', text: 'Punishing pupils who miss class', correct: false, feedback: 'This treats the event and may push families further from school. It also ignores why the pupils are absent.' },
                ],
                explanation:
                  "Moving maths does not solve the whole problem, but it is a cheap structural change that the school controls. Deeper changes, such as a market-day crèche run with the market women’s association, would work at the structure and mental-model levels together.",
              },
            ],
          },
          {
            id: 'fines-scenario',
            title: 'The board meeting',
            blocks: [
              {
                id: 'fines-scenario-block',
                type: 'scenario',
                situation:
                  "At the SACCO board meeting, an owner slams the table. “Last night a passenger attacked our marshal. We must fine any driver who is not at the stage by 6 p.m.!”\n\nOther owners nod. Wanjiru has the trip records in her bag.",
                prompt: 'What should Wanjiru do?',
                options: [
                  {
                    id: 'agree',
                    text: 'Support the fines. The board is angry and wants action.',
                    outcome: "Fines are introduced. For two weeks, more vehicles appear at 6 p.m. Then drivers start arriving, taking one load, and leaving early. Some owners quietly pay the fines rather than lose morning income. The evening wait creeps back.",
                    best: false,
                  },
                  {
                    id: 'pattern',
                    text: 'Acknowledge the attack, then show the board the evening pattern and ask: “What in our own targets makes evening trips not worth it?”',
                    outcome: "The room goes quiet. One owner admits his driver stops at the daily target by 4 p.m. The board agrees to test a bonus for evening trips on one route for a month. The conversation has moved from the event to the structure.",
                    best: true,
                  },
                  {
                    id: 'security',
                    text: 'Propose hiring a security guard for the stage.',
                    outcome: "The guard helps the marshal feel safer, which matters. But passengers still wait 40 minutes, and their frustration finds other outlets. The guard is a response to the event, not the pattern.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-iceberg',
            title: 'Your iceberg',
            blocks: [
              {
                id: 'iceberg-reflection',
                type: 'reflection',
                prompt: 'Draw your problem as an iceberg. Write one recent event, the pattern behind it, at least two structures that produce the pattern, and one mental model that keeps those structures in place.',
                guidance: 'Mental models are often unspoken. Listen for phrases like “that’s just how it is”, “they will never change” or “we have always done it this way”.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'stocks-and-flows',
      type: 'lesson',
      title: 'Stocks, flows and boundaries',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'bathtub',
            title: 'The bathtub',
            blocks: [
              {
                id: 'bathtub-text',
                type: 'text',
                body: "Every system has things that build up and things that move. Systems thinkers call them **stocks** and **flows**.\n\nPicture a water drum outside a house. The water in the drum is a stock. Water poured in from a jerrycan is an inflow. Water drawn out for cooking is an outflow. If more comes in than goes out, the drum fills. If more goes out, it empties. Simple, but it explains a great deal.",
              },
              {
                id: 'bathtub-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'UL8azVk479M',
                title: 'Introduction to Stock Flow Diagrams',
                channel: 'CLExchange',
                durationS: 160,
                caption: "A short introduction to stock and flow diagrams from the Creative Learning Exchange. Watch how the drawing shows what accumulates and what changes it.",
              },
              {
                id: 'bathtub-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Stock', definition: 'Anything that accumulates and can be counted at a moment in time: money in a repair fund, fish in a lake, trust in a committee, pupils enrolled.' },
                  { term: 'Inflow', definition: 'What adds to a stock over time: fees paid in, fish born, new pupils joining.' },
                  { term: 'Outflow', definition: 'What drains a stock over time: repairs paid out, fish caught, pupils dropping out.' },
                  { term: 'Delay', definition: 'The time between a change and its effect. Stocks change slowly, so effects often show up long after the cause.' },
                  { term: 'Boundary', definition: 'The line you draw around the system you study. Draw it too tight and you miss causes; too wide and you cannot act.' },
                ],
              },
            ],
          },
          {
            id: 'uwase-fund',
            title: 'Uwase’s repair fund',
            blocks: [
              {
                id: 'uwase-text',
                type: 'text',
                body: "Uwase (fictional) is secretary of the borehole committee in a village in Rwanda’s Eastern Province. In Problem Solving her committee discovered that the pump kept breaking because there was no money to repair small faults.\n\nNow she draws the repair fund as a stock. Households pay a small monthly fee into it. The mechanic and spare parts are paid out of it. Last year the fund ran dry.",
              },
              {
                id: 'uwase-choice',
                type: 'choice',
                prompt: 'Which of these are flows that change the size of Uwase’s repair fund? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'fees', text: 'Monthly fees paid by households', correct: true, feedback: 'Yes, an inflow.' },
                  { id: 'repairs', text: 'Payments to the mechanic for repairs', correct: true, feedback: 'Yes, an outflow.' },
                  { id: 'trust', text: 'How much households trust the committee', correct: false, feedback: 'Trust is itself a stock, not a flow into the fund. But it matters: when trust falls, fee payments fall. That is a link between two stocks.' },
                  { id: 'donation', text: 'A one-off gift from a church group', correct: true, feedback: 'Yes, an inflow, though a one-off pulse rather than a steady flow.' },
                ],
                explanation:
                  "Drawing the fund as a stock with flows makes the problem visible: fees fell while repair costs rose, so the stock drained. It also reveals a hidden stock, **trust**, that drives the inflow. Fix the trust and the fees may follow.",
              },
            ],
          },
          {
            id: 'delays',
            title: 'Why stocks fool us',
            blocks: [
              {
                id: 'delay-reveal',
                type: 'reveal',
                prompt: 'The committee raises fees in January. By March the fund is still nearly empty, and members say “raising fees doesn’t work”. What might they be missing?',
                body: "A **delay**. A stock changes only as fast as its flows allow. Three months of slightly higher fees may not yet cover the debts already owed to the mechanic.\n\nStocks act as buffers and as memory. They make systems slow to respond, which tempts people to give up on good changes too early, or to push harder on a change that is already working and overshoot.",
              },
              {
                id: 'delay-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Ask “how long before we would see it?”',
                body: "Before you judge whether a change has worked, estimate how long the stock needs to respond. Trees, trust, skills, soil and reputations are slow stocks. Cash in hand and stock on a shelf are fast ones.",
              },
            ],
          },
          {
            id: 'map-order',
            title: 'How to map a system',
            blocks: [
              {
                id: 'map-order-block',
                type: 'order',
                prompt: 'Put these steps for a first system map in a sensible order.',
                items: [
                  { id: 'problem', text: 'Write the problem in the centre of the page' },
                  { id: 'actors', text: 'Add the actors who affect it or are affected by it' },
                  { id: 'stocks', text: 'Mark what accumulates: money, people, goods, trust' },
                  { id: 'flows', text: 'Draw the flows and links between them with arrows' },
                  { id: 'boundary', text: 'Draw a boundary around what you will focus on' },
                  { id: 'check', text: 'Show the map to someone inside the system and ask what is missing' },
                ],
                explanation:
                  "Start from the problem, go wide, then draw a boundary. The last step matters most: your first map is a guess. People who live inside the system will see links you cannot.",
              },
            ],
          },
          {
            id: 'boundary-scale',
            title: 'Your boundary',
            blocks: [
              {
                id: 'boundary-scale-block',
                type: 'scale',
                prompt: 'How clear are you about where the boundary of your system should be?',
                minLabel: 'Not clear at all',
                maxLabel: 'Very clear',
                afterword:
                  "A good rule: include everything that strongly affects your problem in the next year or two, and anything you could influence. Note big outside forces, such as the national economy or the weather, at the edge of the page as context.",
              },
              {
                id: 'stocks-reflection',
                type: 'reflection',
                prompt: 'Name two stocks in your system (one may be invisible, such as trust or skill). For each, write its main inflow and outflow, and how fast you think it changes.',
                guidance: 'Ask: what builds up or runs down over time? What would you count if you visited every month?',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'see-quiz',
      type: 'quiz',
      title: 'Module quiz: See the whole system',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on systems, the iceberg, stocks and flows. You need 70% to pass and can retake it as many times as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-system-test',
            type: 'choice',
            prompt: 'What is the best quick test for whether something is a system?',
            multiple: false,
            options: [
              { id: 'a', text: 'It has many parts', correct: false, feedback: 'A pile of bricks has many parts but is not a system.' },
              { id: 'b', text: 'Changing one part changes other parts', correct: true },
              { id: 'c', text: 'Someone designed it on purpose', correct: false, feedback: 'Many systems, such as markets or traffic, were never designed by anyone.' },
              { id: 'd', text: 'It has a written purpose', correct: false, feedback: 'A system’s real purpose shows in what it does, not what is written.' },
            ],
            explanation: 'Interconnection is what makes a system. If you change one part and others respond, the parts are connected.',
          },
          {
            id: 'q-iceberg-order',
            type: 'order',
            prompt: 'Order the levels of the iceberg from the surface to the deepest.',
            items: [
              { id: 'events', text: 'Events' },
              { id: 'patterns', text: 'Patterns' },
              { id: 'structures', text: 'Structures' },
              { id: 'models', text: 'Mental models' },
            ],
            explanation: 'Events show; patterns repeat; structures cause the patterns; mental models keep the structures in place.',
          },
          {
            id: 'q-iceberg-match',
            type: 'match',
            prompt: 'Match each statement about a clinic’s long queues to its level.',
            pairs: [
              { id: 'event', left: 'A patient fainted in the queue on Monday', right: 'Event' },
              { id: 'pattern', left: 'Queues are longest every Monday morning', right: 'Pattern' },
              { id: 'structure', left: 'All appointments are booked for 8 a.m.', right: 'Structure' },
              { id: 'model', left: '“Patients should come early and wait their turn.”', right: 'Mental model' },
            ],
            explanation: 'The booking rule produces the Monday pattern, and the belief about patients keeps the rule unquestioned.',
          },
          {
            id: 'q-stock',
            type: 'choice',
            prompt: 'Which of these is a stock?',
            multiple: false,
            options: [
              { id: 'a', text: 'Fish caught per week', correct: false, feedback: 'That is a flow: it describes a rate over time.' },
              { id: 'b', text: 'Fish in the lake', correct: true },
              { id: 'c', text: 'New fishers joining each year', correct: false, feedback: 'A flow into the stock of fishers.' },
              { id: 'd', text: 'Fees paid per month', correct: false, feedback: 'A flow into a fund.' },
            ],
            explanation: 'A stock can be counted at a moment in time. Flows are measured per week, per month or per year.',
          },
          {
            id: 'q-delay',
            type: 'choice',
            prompt: 'A youth group starts mentoring school leavers. After two months, job numbers have not changed. Which of these are sensible conclusions? Select all that apply.',
            multiple: true,
            options: [
              { id: 'delay', text: 'Skills and networks are slow stocks, so results may take longer to show', correct: true },
              { id: 'measure', text: 'They should also track earlier signs, such as applications sent or interviews won', correct: true },
              { id: 'stop', text: 'Mentoring clearly does not work, so they should stop', correct: false, feedback: 'Two months is likely too short for a slow stock to respond.' },
              { id: 'double', text: 'They should double the hours immediately to force faster results', correct: false, feedback: 'Pushing hard on a delayed system often overshoots or burns people out.' },
            ],
            explanation: 'Delays tempt people to quit too early or push too hard. Estimate the delay, and track earlier signals that the stock is starting to move.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Loops and traps
// ---------------------------------------------------------------------------

const moduleLoops: Module = {
  key: 'loops-and-traps',
  title: 'Feedback loops and system traps',
  summary:
    'Learn the two kinds of feedback that drive every system, draw simple loop diagrams, and recognise the common traps, such as fixes that fail and the tragedy of the commons, that make well-meant solutions backfire.',
  weekNo: 4,
  items: [
    {
      key: 'feedback-loops',
      type: 'lesson',
      title: 'Feedback loops: vicious and virtuous circles',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'wolves',
            title: 'One change, many effects',
            blocks: [
              {
                id: 'wolves-text',
                type: 'text',
                body: "In 1995, wolves were brought back to Yellowstone National Park in the United States after an absence of about seventy years. Many scientists believe the effects rippled far beyond the deer the wolves hunted: to trees, birds, beavers and even the shape of rivers. How large those effects were is still debated, but the story is a vivid picture of a system in which everything is connected.\n\nWatch the short film, then we will look at the engine behind effects like these: **feedback loops**.",
              },
              {
                id: 'wolves-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'ysa5OBhXz-Q',
                title: 'How Wolves Change Rivers',
                channel: 'Sustainable Human',
                durationS: 274,
                caption: "George Monbiot narrates the idea of a “trophic cascade”. Count how many links there are in the chain from wolves to rivers. Then ask: which links might come back round and affect the start of the chain?",
              },
            ],
          },
          {
            id: 'two-loops',
            title: 'Two kinds of loop',
            blocks: [
              {
                id: 'two-loops-text',
                type: 'text',
                body: "A **feedback loop** is a chain of cause and effect that comes back to where it started. There are only two kinds.\n\n**Reinforcing loops** amplify. More leads to more, or less leads to less. A successful trader gets more customers, earns more, buys better stock and gets even more customers. The same shape, running the other way, is a vicious circle: a failing school loses good teachers, results fall, more good teachers leave.\n\n**Balancing loops** push back towards a goal or limit. When a stock drops, someone notices and acts to refill it. A thermostat, a shopkeeper restocking a shelf, a body sweating to cool down.",
              },
              {
                id: 'loops-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'tTo06jbSZ4M',
                title: 'Introduction to Causal Loops',
                channel: 'CLExchange',
                durationS: 229,
                caption: "A short introduction to causal loop diagrams. Notice how each arrow says “this affects that”, and how the loop closes.",
              },
              {
                id: 'loops-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Reinforcing loop (R)', definition: 'Change amplifies itself. Produces growth or collapse. Virtuous or vicious circles.' },
                  { term: 'Balancing loop (B)', definition: 'Change triggers a correction towards a goal or limit. Produces stability, or resistance to change.' },
                  { term: 'Causal loop diagram', definition: 'A drawing of factors linked by arrows, showing how each affects the next, with loops marked R or B.' },
                ],
              },
            ],
          },
          {
            id: 'stage-loop',
            title: 'Wanjiru’s vicious circle',
            blocks: [
              {
                id: 'westlands-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Early_morning_traffic_at_Westlands_stage%2C_Nairobi.jpg/1280px-Early_morning_traffic_at_Westlands_stage%2C_Nairobi.jpg',
                alt: 'A view from high above a busy junction, with cars, minibuses and yellow buses crowded around a stage and along the road, and people walking on the pavements.',
                caption: 'Early morning traffic at Westlands stage, Nairobi. Wanjiru and her SACCO are fictional; queues like this are real.',
                credit: 'Photo: MarkDenver Karubiu / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'stage-order',
                type: 'order',
                prompt: 'Wanjiru traces a loop on her route. Put the links in order, starting from long evening waits, so that the loop closes.',
                items: [
                  { id: 'wait', text: 'Evening waits at the stage get longer' },
                  { id: 'boda', text: 'More regular passengers switch to boda bodas' },
                  { id: 'fares', text: 'Evening fare income per trip falls' },
                  { id: 'rest', text: 'More owners decide evening trips are not worth it and rest their vehicles' },
                  { id: 'fewer', text: 'Fewer vehicles serve the evening, so waits get longer still' },
                ],
                explanation:
                  "Every link pushes the next one the same way, so this is a **reinforcing loop**: a vicious circle. It also explains why fines alone failed. They pushed on one link while the loop kept spinning. To break a vicious circle, look for the link you can most cheaply reverse.",
              },
            ],
          },
          {
            id: 'which-loop',
            title: 'R or B?',
            blocks: [
              {
                id: 'loop-match',
                type: 'match',
                prompt: 'Match each situation to the loop that describes it.',
                pairs: [
                  { id: 'savings', left: 'Interest in a savings group grows the fund, which earns more interest', right: 'Reinforcing, running upwards (a virtuous circle)' },
                  { id: 'restock', left: 'Amina sees her crates running low and orders more from the truck', right: 'Balancing, with a short delay' },
                  { id: 'reputation', left: 'A clinic with a bad reputation loses patients and funding, so service gets worse', right: 'Reinforcing, running downwards (a vicious circle)' },
                  { id: 'price', left: 'When tomatoes are scarce, prices rise, so more farmers plant tomatoes next season', right: 'Balancing, with a long delay' },
                ],
                explanation:
                  "Reinforcing loops explain runaway growth and collapse. Balancing loops explain why things stay stuck, or swing back. Notice the last one: the balancing loop acts with a **delay** of a whole season, which is why tomato prices often swing from shortage to glut and back.",
              },
            ],
          },
          {
            id: 'resistance',
            title: 'Why systems resist change',
            blocks: [
              {
                id: 'resistance-reveal',
                type: 'reveal',
                prompt: 'A new head teacher pushes hard to raise standards. Each year, results improve a little, then slide back. Which kind of loop might be at work?',
                body: "A **balancing loop** with a hidden goal. Perhaps teachers, pupils and parents share an unspoken sense of what is “normal” for this school. When results rise above it, effort relaxes; when they fall below it, people work harder.\n\nWhen a system keeps returning to the same place however hard you push, look for the goal the balancing loop is protecting. Often it is a belief, not a rule.",
              },
              {
                id: 'loop-choice',
                type: 'choice',
                prompt: 'Kwame wants a virtuous circle at his partner school. Which change is most likely to start one?',
                multiple: false,
                options: [
                  { id: 'prize', text: 'A one-off prize for the best-attending class', correct: false, feedback: 'A one-off push. When the prize is over, nothing keeps the change going.' },
                  { id: 'club', text: 'A Thursday maths club where pupils who attend teach the next group, so success spreads through friends', correct: true, feedback: 'Yes. Each pupil who succeeds recruits and helps others, which grows the next round. That is a reinforcing loop built on purpose.' },
                  { id: 'letter', text: 'A letter to parents reminding them about attendance', correct: false, feedback: 'Useful information, but it does not create a loop that keeps itself going.' },
                ],
                explanation:
                  "Good interventions often **design a loop** rather than push once. Ask: if this works, what will it cause that makes it work even better next time?",
              },
            ],
          },
          {
            id: 'your-loop',
            title: 'Find your loop',
            blocks: [
              {
                id: 'loop-reflection',
                type: 'reflection',
                prompt: 'Find one feedback loop in your system. Write its links as a chain (A affects B, B affects C, C affects A) and say whether it is reinforcing or balancing. Is it helping or hurting?',
                guidance: 'Start from your problem and ask “what does this cause?” again and again until you arrive back at the start. If you cannot close the loop, you may need to add an actor you left off your map.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'system-traps',
      type: 'lesson',
      title: 'System traps: when good fixes backfire',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'commons',
            title: 'The tragedy of the commons',
            blocks: [
              {
                id: 'commons-text',
                type: 'text',
                body: "Some system structures appear again and again, in fishing grounds and family budgets, in companies and city councils. Systems thinkers call them **archetypes** or **traps**. Once you can name a trap, you can see it coming.\n\nWe start with the most famous one.",
              },
              {
                id: 'commons-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'CxC161GvMPc',
                title: 'What is the tragedy of the commons? - Nicholas Amendolare',
                channel: 'TED-Ed',
                durationS: 298,
                caption: "A TED-Ed lesson on Garrett Hardin’s 1968 idea. Watch for why each person’s choice makes sense on its own, yet the total ruins the shared resource.",
              },
            ],
          },
          {
            id: 'okello',
            title: 'Okello’s lake',
            blocks: [
              {
                id: 'lake-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Getting_out_to_fish_at_dusk_2.jpg/1280px-Getting_out_to_fish_at_dusk_2.jpg',
                alt: 'A long wooden canoe with four people in silhouette crosses calm water at sunset, under a sky of orange and grey clouds, with a dark wooded shore on the left.',
                caption: 'Heading out to fish at dusk. Okello and his fishers’ group are fictional.',
                credit: 'Photo: Khanairobi / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'okello-scenario',
                type: 'scenario',
                situation:
                  "Okello chairs a fishers’ group of forty boats on the Ugandan shore of Lake Victoria. Catches near the landing site have been shrinking for years. Several members have started using nets with smaller mesh, which catch young fish too. “If I don’t take them,” one says, “the next boat will.”\n\nAt the group meeting, members ask Okello what to do.",
                prompt: 'Which response best fits the structure of this problem?',
                options: [
                  {
                    id: 'bigger-boats',
                    text: 'Help members get loans for bigger engines so they can fish further out.',
                    outcome: "Catches rise for a season. Then the further grounds are fished down too, and members now carry loan repayments. The trap has moved, not gone.",
                    best: false,
                  },
                  {
                    id: 'shared-rules',
                    text: 'Propose rules the group agrees together: a minimum mesh size, a breeding-area closure for part of the year, and members who check each other’s nets at the landing site.',
                    outcome: "Some members grumble, and a few cheat at first. But because the rules are the group’s own and everyone can see the nets, cheating becomes visible and costly. After two seasons members report more young fish near the breeding area.",
                    best: true,
                  },
                  {
                    id: 'blame',
                    text: 'Name and shame the members using small nets.',
                    outcome: "The members are humiliated and leave the group. They keep fishing with small nets, now outside any agreement. The group has less influence on the lake than before.",
                    best: false,
                  },
                ],
              },
              {
                id: 'ostrom-insight',
                type: 'callout',
                tone: 'insight',
                title: 'The commons is not always a tragedy',
                body: "Hardin argued that shared resources would be ruined unless they were privatised or controlled by government. The political economist **Elinor Ostrom** spent decades studying real communities that managed fisheries, forests and irrigation systems well on their own. Her work won the Nobel Memorial Prize in Economic Sciences in 2009.\n\nWhat the successful communities had in common included clear boundaries, rules made by the users themselves, monitoring by people accountable to the users, graduated penalties and cheap ways to settle disputes. The trap is real, but so is the way out.",
              },
            ],
          },
          {
            id: 'traps',
            title: 'Five common traps',
            blocks: [
              {
                id: 'traps-framework',
                type: 'framework',
                title: 'System traps to recognise',
                steps: [
                  { label: 'Fixes that fail', detail: 'A quick fix relieves the symptom but, after a delay, makes the underlying problem worse. A new pump with no repair fund.' },
                  { label: 'Shifting the burden', detail: 'A short-term fix is used so often that the system loses its ability to fix itself. Relying on donor money until no local funding habit exists.' },
                  { label: 'Tragedy of the commons', detail: 'Each user of a shared resource gains by taking more, so together they exhaust it. Over-fishing, over-grazing, a shared office printer.' },
                  { label: 'Limits to growth', detail: 'Something grows until it hits a limit nobody planned for. A popular chop bar that cannot cook faster, so queues drive customers away.' },
                  { label: 'Success to the successful', detail: 'Winners get more resources to win again, losers get less. The best-connected trader gets first pick of the truck every morning.' },
                ],
              },
            ],
          },
          {
            id: 'fixes',
            title: 'Fixes that fail',
            blocks: [
              {
                id: 'fixes-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'kRK_dl4ENqU',
                title: 'The Cobra Effect: How to avoid unintended consequences when setting goals',
                channel: 'Geckoboard',
                durationS: 144,
                caption: "A short telling of the “cobra effect”, a story about a reward that bred the very problem it was meant to end. Historians are not sure it happened exactly this way, but the pattern is real. Watch for the moment the reward starts to work against its goal.",
              },
              {
                id: 'fixes-match',
                type: 'match',
                prompt: 'Match each situation to the trap it shows.',
                pairs: [
                  { id: 'fixes', left: 'Uwase’s committee replaced the pump; with no repair fund, it broke again', right: 'Fixes that fail' },
                  { id: 'burden', left: 'A youth centre relies on one funder every year and never builds local income', right: 'Shifting the burden' },
                  { id: 'commons', left: 'Every trader dumps waste in the market drain, which floods the whole market', right: 'Tragedy of the commons' },
                  { id: 'limits', left: 'Fatou’s online orders boom, but her two tailors cannot keep up and complaints rise', right: 'Limits to growth' },
                  { id: 'success', left: 'Schools with good results attract the best teachers, which improves their results', right: 'Success to the successful' },
                ],
                explanation:
                  "Naming the trap tells you where to look for the way out. For fixes that fail, look for the delayed side effect. For shifting the burden, strengthen the system’s own ability. For the commons, build shared rules. For limits to growth, find the limit early. For success to the successful, look at how resources are shared.",
              },
            ],
          },
          {
            id: 'spot-traps',
            title: 'Spot the warning signs',
            blocks: [
              {
                id: 'warning-choice',
                type: 'choice',
                prompt: 'Which of these are warning signs that you might be in a “fixes that fail” trap? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'returns', text: 'The problem keeps returning, a little worse each time', correct: true, feedback: 'Yes. That is the classic shape.' },
                  { id: 'same-fix', text: 'You keep applying the same fix, more often', correct: true, feedback: 'Yes. Needing more and more of a fix is a strong signal.' },
                  { id: 'side', text: 'The fix has side effects that show up weeks or months later', correct: true, feedback: 'Yes. Delayed side effects are what make the trap hard to see.' },
                  { id: 'once', text: 'The problem disappeared after one fix and never returned', correct: false, feedback: 'That is a fix that worked. Celebrate it.' },
                ],
                explanation:
                  "When you see these signs, stop and draw the loop. Ask: what does my fix cause, after a delay, that feeds the original problem?",
              },
              {
                id: 'trap-poll',
                type: 'poll',
                prompt: 'Which trap do you recognise most in your own community or organisation?',
                options: [
                  { id: 'fixes', text: 'Fixes that fail' },
                  { id: 'burden', text: 'Shifting the burden' },
                  { id: 'commons', text: 'Tragedy of the commons' },
                  { id: 'limits', text: 'Limits to growth' },
                  { id: 'success', text: 'Success to the successful' },
                ],
                afterword:
                  "Look at how your classmates answered. Many of the stubborn problems around us are not unique. They are well-known shapes that others have learnt to escape.",
              },
            ],
          },
          {
            id: 'your-trap',
            title: 'Name your trap',
            blocks: [
              {
                id: 'trap-reflection',
                type: 'reflection',
                prompt: 'Is your system caught in one of the five traps? Name it, describe how it works in your case, and note any fix that has already been tried and failed.',
                guidance: 'If none fits exactly, describe the closest one and what is different. A trap you can name goes straight into your System Map.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'fix-that-failed-discussion',
      type: 'discussion',
      title: 'Discussion: a fix that came back to bite',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Share a real example, from your community, a public service, an organisation or the news, where a solution made things better at first and then worse.\n\nIn your post:\n\n1. Describe the original problem and the fix.\n2. Explain what happened next, and after how long.\n3. Draw the loop in words: what did the fix cause that fed the problem?\n4. Name the trap, if one fits.\n\nThen reply to at least two classmates. Suggest a different place in their system where a change might have lasted longer.",
        guidance: 'Describe systems, not villains. The people who chose the fix were usually solving the problem in front of them with the information they had.',
        minWords: 80,
      },
    },
    {
      key: 'loops-quiz',
      type: 'quiz',
      title: 'Module quiz: Feedback loops and system traps',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on feedback loops and system traps. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-loop-type',
            type: 'choice',
            prompt: 'A new restaurant gets good reviews, which bring more customers, which pay for better ingredients, which bring better reviews. What kind of loop is this?',
            multiple: false,
            options: [
              { id: 'a', text: 'Reinforcing', correct: true },
              { id: 'b', text: 'Balancing', correct: false, feedback: 'A balancing loop pushes back towards a goal. This one amplifies.' },
              { id: 'c', text: 'Not a loop', correct: false, feedback: 'It is a loop: the chain comes back to reviews.' },
            ],
            explanation: 'More leads to more. It is a virtuous circle, until it meets a limit, such as kitchen size.',
          },
          {
            id: 'q-balancing',
            type: 'choice',
            prompt: 'Why do balancing loops often make systems resist change?',
            multiple: false,
            options: [
              { id: 'a', text: 'They pull the system back towards a goal, which may be unspoken', correct: true },
              { id: 'b', text: 'They make everything grow out of control', correct: false, feedback: 'That is a reinforcing loop.' },
              { id: 'c', text: 'They only exist in machines', correct: false, feedback: 'They exist everywhere: in bodies, markets, families and schools.' },
              { id: 'd', text: 'They have no delays', correct: false, feedback: 'Balancing loops often have delays, which cause overshoot.' },
            ],
            explanation: 'When a system keeps returning to the same state, look for the goal its balancing loops are protecting.',
          },
          {
            id: 'q-trap-match',
            type: 'match',
            prompt: 'Match each case to its trap.',
            pairs: [
              { id: 'commons', left: 'Herders on shared land each add one more cow until the grass is gone', right: 'Tragedy of the commons' },
              { id: 'fixes', left: 'A town paves a market road; more trucks come and the road is jammed again', right: 'Fixes that fail' },
              { id: 'burden', left: 'A family pays school fees with loans every term and never builds savings', right: 'Shifting the burden' },
              { id: 'limits', left: 'A popular salon grows until there are not enough chairs and clients leave', right: 'Limits to growth' },
            ],
            explanation: 'Each trap has a typical escape: shared rules, looking for delayed side effects, rebuilding the system’s own capacity, and finding the limit before you hit it.',
          },
          {
            id: 'q-ostrom',
            type: 'choice',
            prompt: 'According to Elinor Ostrom’s research, which features helped communities manage shared resources well? Select all that apply.',
            multiple: true,
            options: [
              { id: 'rules', text: 'Rules made by the users themselves', correct: true },
              { id: 'monitor', text: 'Monitoring by people accountable to the users', correct: true },
              { id: 'boundaries', text: 'Clear boundaries about who may use the resource', correct: true },
              { id: 'none', text: 'No rules at all, so everyone is free', correct: false, feedback: 'Open access with no rules is exactly the setting where the tragedy happens.' },
            ],
            explanation: 'Ostrom showed that communities can escape the commons trap when they design and enforce their own rules, with clear boundaries and fair, graduated penalties.',
          },
          {
            id: 'q-loop-order',
            type: 'order',
            prompt: 'Put this vicious circle in order, starting from the first link.',
            items: [
              { id: 'leave', text: 'Good teachers leave a struggling school' },
              { id: 'results', text: 'Results fall' },
              { id: 'reputation', text: 'The school’s reputation drops' },
              { id: 'hire', text: 'It becomes harder to attract good teachers' },
            ],
            explanation: 'The last link feeds the first: fewer good teachers arrive, so more of the remaining good teachers feel isolated and leave. A reinforcing loop running downhill.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Leverage and formulation
// ---------------------------------------------------------------------------

const moduleLeverage: Module = {
  key: 'leverage-and-formulation',
  title: 'Leverage and formulation',
  summary:
    'Find the leverage points where a small, well-placed push changes the whole system, then formulate a staged plan with a clear goal, a chain of change, honest assumptions and indicators. Finish with your System Map and Leverage Brief.',
  weekNo: 4,
  items: [
    {
      key: 'leverage-points',
      type: 'lesson',
      title: 'Leverage points: where to push',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'leverage-intro',
            title: 'Small push, big change',
            blocks: [
              {
                id: 'leverage-text',
                type: 'text',
                body: "A **leverage point** is a place in a system where a small change can make a large, lasting difference.\n\nThe systems scientist **Donella Meadows** wrote a famous essay, *Leverage Points: Places to Intervene in a System*, listing places to push, from weakest to strongest. Her surprising finding: the places most people push, such as budgets and numbers, are usually the weakest. The strongest are rules, information flows, goals and the beliefs behind them.",
              },
              {
                id: 'leverage-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'zAoqRJ0V1VE',
                title: 'Leverage Points Explained',
                channel: 'Systems Innovation Network',
                durationS: 549,
                caption: "An overview of Meadows’ leverage points. Don’t try to memorise all twelve. Listen for why changing a number is usually weak and changing a goal or a mindset is usually strong.",
              },
            ],
          },
          {
            id: 'ladder',
            title: 'A simple ladder',
            blocks: [
              {
                id: 'ladder-framework',
                type: 'framework',
                title: 'Places to push, from weaker to stronger (simplified from Meadows)',
                steps: [
                  { label: 'Numbers', detail: 'Budgets, prices, fees, targets, the size of a fine. Easy to change, rarely changes behaviour for long.' },
                  { label: 'Stocks and buffers', detail: 'The size of a reserve, a store or a fund. Helpful, but slow and often expensive.' },
                  { label: 'Loops and delays', detail: 'Strengthening a balancing loop or slowing a vicious circle. Shortening the delay before people see a result.' },
                  { label: 'Information flows', detail: 'Who sees what, and when. Making hidden things visible to the people who can act.' },
                  { label: 'Rules and incentives', detail: 'Who gets rewarded or punished for what. Who decides.' },
                  { label: 'Goals', detail: 'What the system is really trying to achieve.' },
                  { label: 'Mindsets', detail: 'The shared beliefs out of which goals and rules arise.' },
                ],
              },
              {
                id: 'ladder-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Higher is stronger, and harder',
                body: "The deeper levers are powerful precisely because people hold on to them. Changing a goal or a mindset takes time, trust and allies. A good plan often combines a quick, visible change low on the ladder with patient work higher up.",
              },
            ],
          },
          {
            id: 'wanjiru-levers',
            title: 'Wanjiru’s options',
            blocks: [
              {
                id: 'levers-match',
                type: 'match',
                prompt: 'Wanjiru lists ways to shorten the evening wait. Match each one to its place on the ladder.',
                pairs: [
                  { id: 'fine', left: 'Raise the fine for missing the evening slot', right: 'Numbers' },
                  { id: 'board', left: 'Show live waiting times on a board and in the owners’ WhatsApp group', right: 'Information flows' },
                  { id: 'bonus', left: 'Change pay so evening trips earn a bonus instead of a flat daily target', right: 'Rules and incentives' },
                  { id: 'goal', left: 'Agree that the SACCO’s goal is reliable service all day, not maximum morning income', right: 'Goals' },
                ],
                explanation:
                  "Look at the information lever: owners had never seen the evening queue, because they are not there at 7 p.m. Making it visible to them costs almost nothing, and it changes the conversation in the board room.",
              },
            ],
          },
          {
            id: 'information',
            title: 'The power of making things visible',
            blocks: [
              {
                id: 'information-example',
                type: 'example',
                title: 'Uwase’s notice board',
                body: "Uwase’s committee tried raising the water fee twice. Both times, payments fell. Then they tried something different: each month they wrote on a board beside the pump how much was paid in, how much was spent, on what, and how much was left in the repair fund.\n\nWithin a few months, more households were paying again. Nothing about the fee changed. What changed was that households could see where their money went, and see their neighbours paying.",
              },
              {
                id: 'information-choice',
                type: 'choice',
                prompt: 'Why did the notice board work better than raising the fee?',
                multiple: false,
                options: [
                  { id: 'cheap', text: 'Because it was cheaper', correct: false, feedback: 'It was cheaper, but cheapness alone does not change behaviour.' },
                  { id: 'trust', text: 'Because it rebuilt trust, the hidden stock that drives payments, by making the fund visible', correct: true, feedback: 'Yes. Higher on the ladder, information changed the loop between trust and fees.' },
                  { id: 'force', text: 'Because households were forced to pay', correct: false, feedback: 'Nobody was forced. That is what makes it a strong lever.' },
                  { id: 'luck', text: 'It was probably luck', correct: false, feedback: 'Possible, but the mechanism is clear and you could test it in another village.' },
                ],
                explanation:
                  "The fee was a **number**. The board was an **information flow** that strengthened a loop: more visible payments, more trust, more payments. Before you reach for a number, ask who needs to see what.",
              },
            ],
          },
          {
            id: 'counterintuitive',
            title: 'Pushing the wrong way',
            blocks: [
              {
                id: 'counter-reveal',
                type: 'reveal',
                prompt: 'Meadows warned that people often find a leverage point and then push it in the wrong direction. What could that look like?',
                body: "A government sees that growth matters and pushes for growth at any cost, which drains the soil, water or public trust that growth depends on. A school sees that exams matter and pushes test drilling, which crowds out the learning the exams were meant to measure.\n\nThe lesson: once you find a strong lever, test it small and watch the whole system, not only the number you hoped to move.",
              },
              {
                id: 'meadows-quote',
                type: 'quote',
                text: 'We can’t control systems or figure them out. But we can dance with them!',
                attribution: 'Donella Meadows, “Dancing with Systems”',
              },
              {
                id: 'leverage-scale',
                type: 'scale',
                prompt: 'How confident are you that you can name a real leverage point in your own system?',
                minLabel: 'Not yet',
                maxLabel: 'Very confident',
                afterword:
                  "If you are not yet confident, go back to your map and look for hidden information, rules that reward the wrong thing, or a goal nobody has said out loud. Those are the usual hiding places.",
              },
            ],
          },
          {
            id: 'your-levers',
            title: 'Your leverage points',
            blocks: [
              {
                id: 'levers-reflection',
                type: 'reflection',
                prompt: 'List three possible leverage points in your system, at different levels of the ladder. For each, say what change you would make and what you expect it to cause. Then choose the one you would try first and say why.',
                guidance: 'Include at least one information or rules lever. For your first choice, weigh strength against what you can actually influence in the next three months.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'formulation',
      type: 'lesson',
      title: 'Formulation: from insight to a staged plan',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'formulation-intro',
            title: 'From map to plan',
            blocks: [
              {
                id: 'formulation-text',
                type: 'text',
                body: "Seeing a system clearly is half the work. The other half is **formulation**: turning what you see into a plan that others can follow, fund and check.\n\nA common tool is a **theory of change**: a chain that runs from what you will do, to what that will cause, to the change you want in the end, with the assumptions behind each link written down. It makes your thinking visible, so you and others can test it.",
              },
              {
                id: 'formulation-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'eJPK7oZaK70',
                title: 'Theory of change for advocacy and campaigns',
                channel: 'Bond',
                durationS: 204,
                caption: "In this video from Bond, the UK network for organisations working in international development, Jenny Ross introduces four simple questions behind a theory of change. It is aimed at campaigners, but the questions work for any plan. Note them down: you will use them in your brief.",
              },
            ],
          },
          {
            id: 'chain',
            title: 'The chain of change',
            blocks: [
              {
                id: 'chain-framework',
                type: 'framework',
                title: 'A simple theory of change',
                steps: [
                  { label: 'Goal', detail: 'The lasting change you want in the system. “Every household in the village has reliable safe water all year.”' },
                  { label: 'Outcomes', detail: 'The changes in behaviour or conditions that lead to the goal. “Households pay fees regularly; small faults are fixed within a week.”' },
                  { label: 'Outputs', detail: 'What your activities directly produce. “A monthly public fund board; a trained local repairer.”' },
                  { label: 'Activities', detail: 'What you will actually do. “Post the accounts each month; train one young person in pump repair.”' },
                  { label: 'Assumptions', detail: 'What must be true for each link to hold. “Households will trust figures they can see.” Write them down; they are what you will test.' },
                ],
              },
              {
                id: 'chain-order',
                type: 'order',
                prompt: 'Put Uwase’s plan in order, from what the committee does to the change it wants.',
                items: [
                  { id: 'activity', text: 'Post income and spending on a board by the pump each month' },
                  { id: 'output', text: 'Every household can see the state of the repair fund' },
                  { id: 'outcome1', text: 'Trust in the committee grows and more households pay' },
                  { id: 'outcome2', text: 'The fund can pay for small repairs as soon as they appear' },
                  { id: 'goal', text: 'The pump works reliably all year' },
                ],
                explanation:
                  "Read the chain with “if… then…” between each link. **If** the accounts are posted, **then** households can see the fund. **If** they can see it, **then** trust grows. Each “then” hides an assumption you can test.",
              },
            ],
          },
          {
            id: 'indicators',
            title: 'How will you know?',
            blocks: [
              {
                id: 'indicators-text',
                type: 'text',
                body: "An **indicator** is a sign you will watch to see whether a link in your chain is holding. Good indicators are specific, cheap to collect and honest. Include early indicators for the first links in the chain, because the final goal may take a long time to move.",
              },
              {
                id: 'indicator-choice',
                type: 'choice',
                prompt: 'Which is the best early indicator for Uwase’s plan?',
                multiple: false,
                options: [
                  { id: 'happy', text: 'Whether the village seems happier', correct: false, feedback: 'Too vague to measure, and many things affect it.' },
                  { id: 'payments', text: 'The share of households that paid the fee each month, from the fee book', correct: true, feedback: 'Yes. It tests the trust link directly, and the committee already has the data.' },
                  { id: 'national', text: 'National statistics on rural water access', correct: false, feedback: 'These will not show anything about one village’s pump.' },
                  { id: 'meetings', text: 'The number of committee meetings held', correct: false, feedback: 'Meetings are activity, not change. A committee can meet often and achieve nothing.' },
                ],
                explanation:
                  "Track one indicator per key link. Activities tell you that you are busy; outcomes tell you that the system is changing. Measure both, but don’t confuse them.",
              },
            ],
          },
          {
            id: 'stages',
            title: 'A staged plan',
            blocks: [
              {
                id: 'meeting-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/A_village_community_development_meeting_in_northern_Ghana.jpg/1280px-A_village_community_development_meeting_in_northern_Ghana.jpg',
                alt: 'A group of adults sits in a circle on benches and plastic chairs under a large shade tree while one person stands and speaks, with a motorbike in the foreground and buildings in the distance.',
                caption: 'A village community development meeting in northern Ghana. Plans that change systems are usually made with the people inside them.',
                credit: 'Photo: Qulat96 / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'stages-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Stage it: test, then grow',
                body: "Systems surprise you, so plan in stages:\n\n1. **Test** (weeks): a small, cheap change at your chosen leverage point, with an early indicator.\n2. **Strengthen** (months): if it holds, build it into rules or routines so it does not depend on you.\n3. **Spread** (a year or more): bring in more actors, more places or deeper levers such as goals.\n\nAt the end of each stage, look at your map again. The system will have moved.",
              },
              {
                id: 'stage-scenario',
                type: 'scenario',
                situation:
                  "Wanjiru’s one-month bonus test on one route worked: evening waits fell sharply. The chairman is delighted. “Let’s roll it out to all twelve routes next Monday,” he says, “and double the bonus to be sure.”",
                prompt: 'What should Wanjiru recommend?',
                options: [
                  {
                    id: 'all',
                    text: 'Agree. The test worked, so move fast.',
                    outcome: "The bonus goes everywhere at double the rate. Evening waits fall, but morning service suffers as drivers save energy for the evening, and the SACCO’s cash runs short by the third week. A good lever pushed too hard has created a new problem.",
                    best: false,
                  },
                  {
                    id: 'staged',
                    text: 'Suggest adding three more routes at the same bonus, watching morning and evening service and the SACCO’s cash for a month, then deciding.',
                    outcome: "The chairman is impatient but agrees. The expansion shows that one route needs a smaller bonus, because it is shorter. The SACCO writes the bonus into its rules route by route, and keeps the evening board as an ongoing indicator.",
                    best: true,
                  },
                  {
                    id: 'stop',
                    text: 'Recommend stopping the test, since one route proves nothing.',
                    outcome: "The owners who saw results lose faith in Wanjiru’s process. The evening wait on the test route creeps back. A promising lever is abandoned.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'blueprint',
            title: 'Your Life Architecture Blueprint',
            blocks: [
              {
                id: 'blueprint-context',
                type: 'callout',
                tone: 'context',
                title: 'Closing Life Architecture',
                body: "This brief is the last piece of your **Life Architecture Blueprint**. Together, your Problem Definition Canvas, your Critical Thinking, Emotional Intelligence and Values work, and this System Map and Leverage Brief describe how you think, what you stand for and the system you intend to change. You will carry the Blueprint into Builder’s Architecture next week, and into the Dream Residency in week 11.",
              },
              {
                id: 'final-scale',
                type: 'scale',
                prompt: 'Look back at the start of the week. How easily can you now see the bigger picture behind a stubborn problem?',
                minLabel: 'I see only the parts',
                maxLabel: 'I see the whole',
                afterword: "Compare this with your answer on the first day. Whatever moved, the habit is now yours to practise: zoom out, find the loop, look for the lever, then test it small.",
              },
              {
                id: 'plan-reflection',
                type: 'reflection',
                prompt: 'Draft a theory of change for your chosen leverage point: goal, outcomes, outputs, activities and at least two assumptions. Then add one early indicator and describe your first stage (test).',
                guidance: 'Write each link as “if… then…”. Underline the assumption you are least sure of. Your first stage should test it.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'leverage-quiz',
      type: 'quiz',
      title: 'Module quiz: Leverage and formulation',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on leverage points, theories of change and staged plans. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-weak-lever',
            type: 'choice',
            prompt: 'According to Meadows, which kind of intervention is usually the weakest lever?',
            multiple: false,
            options: [
              { id: 'a', text: 'Changing numbers such as fees, prices or fines', correct: true },
              { id: 'b', text: 'Changing who gets to see what information', correct: false, feedback: 'Information flows are often surprisingly strong.' },
              { id: 'c', text: 'Changing the system’s goal', correct: false, feedback: 'Goals are among the strongest levers.' },
              { id: 'd', text: 'Changing shared mindsets', correct: false, feedback: 'Mindsets are the strongest, and the hardest.' },
            ],
            explanation: 'Numbers are easy to change and get most of the attention, but the structure around them usually stays the same.',
          },
          {
            id: 'q-ladder-match',
            type: 'match',
            prompt: 'A city wants less plastic waste in its drains. Match each idea to its lever.',
            pairs: [
              { id: 'numbers', left: 'Raise the fine for littering', right: 'Numbers' },
              { id: 'info', left: 'Publish a weekly map of blocked drains by street', right: 'Information flows' },
              { id: 'rules', left: 'Require sachet water makers to pay for collection of their packaging', right: 'Rules and incentives' },
              { id: 'goal', left: 'Make “zero flooding” the council’s headline goal', right: 'Goals' },
            ],
            explanation: 'The rule that makes producers pay changes who has a reason to care. That is often stronger than a bigger fine on individuals.',
          },
          {
            id: 'q-toc-order',
            type: 'order',
            prompt: 'Put the parts of a theory of change in order, from what you do to what you want.',
            items: [
              { id: 'activities', text: 'Activities' },
              { id: 'outputs', text: 'Outputs' },
              { id: 'outcomes', text: 'Outcomes' },
              { id: 'goal', text: 'Goal' },
            ],
            explanation: 'Activities produce outputs, outputs lead to outcomes, outcomes add up to the goal. Assumptions sit on every arrow.',
          },
          {
            id: 'q-indicator',
            type: 'choice',
            prompt: 'Which of these is an outcome indicator rather than an activity indicator?',
            multiple: false,
            options: [
              { id: 'a', text: 'Number of training sessions held', correct: false, feedback: 'That counts activity.' },
              { id: 'b', text: 'Number of leaflets printed', correct: false, feedback: 'That counts output, not change.' },
              { id: 'c', text: 'Share of trained farmers still using the new storage method three months later', correct: true },
              { id: 'd', text: 'Hours spent planning', correct: false, feedback: 'That counts effort.' },
            ],
            explanation: 'Outcome indicators show that behaviour or conditions changed. Activity indicators show only that you were busy.',
          },
          {
            id: 'q-stages',
            type: 'choice',
            prompt: 'Why plan in stages (test, strengthen, spread)? Select all that apply.',
            multiple: true,
            options: [
              { id: 'surprise', text: 'Systems respond in ways you cannot fully predict', correct: true },
              { id: 'cheap', text: 'A small test is cheap to undo if it fails', correct: true },
              { id: 'learn', text: 'Each stage teaches you something that improves the next', correct: true },
              { id: 'slow', text: 'Because fast results are always bad', correct: false, feedback: 'Fast results are welcome. Staging is about learning safely, not going slowly for its own sake.' },
            ],
            explanation: 'Staging lets you learn from the system’s response before you commit. It is how you dance with a system rather than fight it.',
          },
        ],
      },
    },
    {
      key: 'system-map-leverage-brief',
      type: 'assignment',
      title: 'Practical Output: your System Map and Leverage Brief',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: a **System Map and Leverage Brief** for the problem you have been working on since Problem Solving.\n\nYour submission has two parts. First, a **system map**: a hand-drawn or digital diagram showing the actors, stocks, flows and at least two feedback loops around your problem, with a boundary. Second, a **written brief** of one to two pages explaining what the map shows, which trap (if any) the system is caught in, the leverage point you have chosen, and a staged plan to act on it.\n\nMost of it is already in your journal. Bring it together, check it with at least one person inside the system, and make it clear enough that a stranger could follow it. Your brief completes your Life Architecture Blueprint.\n\nA faculty reviewer will grade it against the rubric below and give you written feedback.",
        practicalOutput: 'System Map and Leverage Brief',
        steps: [
          'Start from your problem statement. If it has sharpened this week, use the new version.',
          'Gather your journal entries: system elements, iceberg, stocks and flows, loop, trap, leverage points and theory of change.',
          'Draw your system map on one page. Show actors, at least two stocks, the main flows, at least two feedback loops marked R or B, and your boundary.',
          'Show the map to at least one person who lives or works inside the system. Ask what is missing or wrong, and update it.',
          'Fill in each section of the template below. Keep the brief to one or two pages.',
          'Attach a photo or file of your map.',
          'Read your plan once more and check that the first stage can start within two weeks and has an early indicator.',
          'Submit, and add your brief to your Life Architecture Blueprint.',
        ],
        rubric: [
          {
            id: 'map',
            criterion: 'System map',
            description: 'The map shows the key actors, at least two stocks with their flows, at least two feedback loops correctly marked as reinforcing or balancing, and a sensible boundary. It is legible to a stranger.',
          },
          {
            id: 'iceberg-loops',
            criterion: 'Depth of diagnosis',
            description: 'The brief looks beneath events to patterns, structures and mental models, explains how the loops produce the problem, and names a system trap where one applies.',
          },
          {
            id: 'leverage',
            criterion: 'Leverage point',
            description: 'Identifies at least three possible leverage points at different levels, chooses one with clear reasons, and weighs its strength against what the author can influence.',
          },
          {
            id: 'formulation',
            criterion: 'Formulated plan',
            description: 'Presents a theory of change with goal, outcomes, outputs and activities, states at least two assumptions honestly, and stages the plan into test, strengthen and spread.',
          },
          {
            id: 'indicators',
            criterion: 'Indicators and learning',
            description: 'Includes specific, cheap indicators for early links in the chain, and says what result would make the author change course.',
          },
          {
            id: 'voices',
            criterion: 'Voices from inside the system',
            description: 'Shows that the map was checked with at least one person inside the system and explains what changed as a result.',
          },
        ],
        template:
          "SYSTEM MAP AND LEVERAGE BRIEF\n\n1. The problem\nYour sharpened problem statement (three sentences or fewer).\n\n2. The system and its boundary\nThe main actors, stocks and flows. What is inside your boundary and what sits outside as context.\n\n3. Below the surface\nEvent, pattern, structures and mental models.\n\n4. Feedback loops\nAt least two loops, each written as a chain and marked reinforcing (R) or balancing (B).\n\n5. System trap\nWhich trap the system is caught in, if any, and any fixes that have already failed.\n\n6. Leverage points\nThree possible leverage points at different levels of the ladder, and the one you chose, with reasons.\n\n7. Theory of change\nGoal, outcomes, outputs, activities. Assumptions behind the key links.\n\n8. Staged plan and indicators\nTest, strengthen, spread: what happens in each stage, and the indicators you will watch.\n\n9. Who I checked this with\nWho inside the system reviewed your map, and what changed.\n\nAttach: a photo or file of your system map.",
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
          "Nine questions across the whole course: seeing systems, loops and traps, leverage and formulation. Most follow a new case.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-intro',
            type: 'choice',
            prompt: 'New case: Esi (fictional) runs a cassava processing cooperative near Cape Coast. Every rainy season, members’ gari goes mouldy in storage and buyers pay less. Last year the cooperative bought plastic sheets; this year the mould is back. Which question shows systems thinking?',
            multiple: false,
            options: [
              { id: 'a', text: '“Where can we buy better plastic sheets?”', correct: false, feedback: 'That repeats last year’s fix at the level of the event.' },
              { id: 'b', text: '“What keeps producing mouldy gari every rainy season, and what did our last fix change in the system?”', correct: true },
              { id: 'c', text: '“Which member is storing gari badly?”', correct: false, feedback: 'Blaming one person ignores the pattern across many members.' },
              { id: 'd', text: '“How do we sell faster this week?”', correct: false, feedback: 'Useful in the short term, but it treats only this week’s event.' },
            ],
            explanation: 'Systems thinking asks what produces the pattern, and what earlier fixes did to the system, instead of reacting to each event.',
          },
          {
            id: 'f-iceberg',
            type: 'match',
            prompt: 'Match each statement from Esi’s cooperative to its level of the iceberg.',
            pairs: [
              { id: 'event', left: 'Ten bags of gari went mouldy last week', right: 'Event' },
              { id: 'pattern', left: 'Losses rise every rainy season', right: 'Pattern' },
              { id: 'structure', left: 'Members store gari in their own homes because the cooperative has no shared store', right: 'Structure' },
              { id: 'model', left: '“Each family must look after its own produce.”', right: 'Mental model' },
            ],
            explanation: 'The belief that each family stores its own produce keeps the structure (no shared, dry store) in place, which produces the seasonal pattern.',
          },
          {
            id: 'f-stock',
            type: 'choice',
            prompt: 'In Esi’s system, which of these is a stock?',
            multiple: false,
            options: [
              { id: 'a', text: 'Bags of gari in storage', correct: true },
              { id: 'b', text: 'Bags sold per week', correct: false, feedback: 'A flow out of storage.' },
              { id: 'c', text: 'Bags produced per week', correct: false, feedback: 'A flow into storage.' },
            ],
            explanation: 'Stored gari accumulates and can be counted at any moment. The longer it sits in damp conditions, the more is lost.',
          },
          {
            id: 'f-loop',
            type: 'order',
            prompt: 'Put Esi’s vicious circle in order, starting from mouldy gari.',
            items: [
              { id: 'mould', text: 'More gari goes mouldy' },
              { id: 'price', text: 'Buyers pay less and some stop coming' },
              { id: 'cash', text: 'Members have less cash' },
              { id: 'hold', text: 'Members hold stock longer, hoping for better prices' },
              { id: 'longer', text: 'Gari sits in damp storage for longer' },
            ],
            explanation: 'The last link feeds the first: longer storage means more mould. A reinforcing loop. Breaking any one link, for example a dry shared store or faster sales, weakens the whole circle.',
          },
          {
            id: 'f-trap',
            type: 'choice',
            prompt: 'The plastic sheets helped for a while, but members then stored more gari for longer, trusting the sheets, and losses grew. Which trap is this?',
            multiple: false,
            options: [
              { id: 'a', text: 'Fixes that fail', correct: true },
              { id: 'b', text: 'Tragedy of the commons', correct: false, feedback: 'No shared resource is being overused here.' },
              { id: 'c', text: 'Success to the successful', correct: false, feedback: 'That is about winners gaining more resources.' },
              { id: 'd', text: 'Limits to growth', correct: false, feedback: 'Nothing is growing into a limit here.' },
            ],
            explanation: 'The fix relieved the symptom, then changed behaviour in a way that made the problem worse after a delay.',
          },
          {
            id: 'f-lever',
            type: 'choice',
            prompt: 'Which of these is likely to be the strongest lever for Esi’s cooperative?',
            multiple: false,
            options: [
              { id: 'a', text: 'Asking members to check their sheets more often', correct: false, feedback: 'A small change at the level of events.' },
              { id: 'b', text: 'A rule that the cooperative buys members’ gari at a fair price as soon as it is made, and sells it together from one dry store', correct: true },
              { id: 'c', text: 'A small discount for buyers in the rainy season', correct: false, feedback: 'A number. It may help sales a little but leaves the structure untouched.' },
              { id: 'd', text: 'A poster about the dangers of mould', correct: false, feedback: 'Members already know mould is bad.' },
            ],
            explanation: 'Changing the rule about who holds stock, and where, reshapes the loop at its root and challenges the belief that each family must store alone.',
          },
          {
            id: 'f-info',
            type: 'choice',
            prompt: 'Which of these are information-flow levers Esi could use? Select all that apply.',
            multiple: true,
            options: [
              { id: 'prices', text: 'Sharing weekly buyer prices with all members by text message', correct: true },
              { id: 'losses', text: 'Posting each month’s mould losses by storage method at the cooperative', correct: true },
              { id: 'fine', text: 'Fining members whose gari is mouldy', correct: false, feedback: 'That is a number and a penalty, not an information flow.' },
              { id: 'sheets', text: 'Buying more plastic sheets', correct: false, feedback: 'That repeats the fix that failed.' },
            ],
            explanation: 'Making prices and losses visible changes members’ decisions about when to sell and how to store, at almost no cost.',
          },
          {
            id: 'f-toc',
            type: 'order',
            prompt: 'Put Esi’s theory of change in order.',
            items: [
              { id: 'activity', text: 'Rent one dry shared store and buy gari from members on production' },
              { id: 'output', text: 'Most gari is stored in one dry place, not in homes' },
              { id: 'outcome', text: 'Mould losses fall and buyers return' },
              { id: 'goal', text: 'Members earn a steadier income all year' },
            ],
            explanation: 'Activity → output → outcome → goal. Key assumptions: members will trust the cooperative with their gari, and the store will stay dry.',
          },
          {
            id: 'f-stage',
            type: 'choice',
            prompt: 'What is the best first stage for Esi’s plan?',
            multiple: false,
            options: [
              { id: 'a', text: 'Build a large warehouse with a bank loan', correct: false, feedback: 'A big, hard-to-undo commitment before the key assumptions are tested.' },
              { id: 'b', text: 'For one rainy season, rent a small dry room, store gari for ten volunteer members, and compare their losses and prices with other members', correct: true },
              { id: 'c', text: 'Wait for a funder to pay for everything', correct: false, feedback: 'Waiting teaches nothing and shifts the burden onto outsiders.' },
              { id: 'd', text: 'Ask members whether they like the idea', correct: false, feedback: 'Opinions about the future are weak evidence. Test real behaviour.' },
            ],
            explanation: 'A small, cheap test of the riskiest assumptions, with a clear comparison, before strengthening and spreading.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const systemsThinking: CourseAuthoring = {
  slug: 'systems-thinking',
  title: 'Systems Thinking and Formulation',
  subtitle: 'See the whole system behind a problem, find the leverage points and formulate a plan that lasts.',
  description:
    "Some problems refuse to stay solved. Traffic returns after the new road opens. Prices rise again after the subsidy. A project works until the funder leaves. These are signs of a system at work: many parts, connected by feedback, producing results nobody chose.\n\nThis course teaches you to see systems. You will learn to map the actors, flows and feedback loops behind a problem; to recognise common patterns such as vicious circles, delays and “fixes that fail”; and to find leverage points where small changes have big effects. You will then learn formulation: turning that understanding into a clear, staged plan with goals, assumptions and indicators.\n\nYou will practise on systems you know well: a city market, a transport network, a school, a farming value chain, a family economy. The course builds directly on Problem Solving and closes the Life Architecture phase.\n\nYour Practical Output is a **System Map and Leverage Brief**: a map of the system around your chosen problem, the key loops and leverage points you have identified, and a formulated plan of action. Together with your other Life Architecture outputs, it completes your Life Architecture Blueprint.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 5,
  outcomes: [
    'Map the actors, flows and feedback loops that sustain a real-world problem.',
    'Recognise common system patterns such as vicious circles, delays and fixes that fail.',
    'Identify leverage points where small, well-placed actions create lasting change.',
    'Formulate a staged plan with clear goals, assumptions and indicators.',
    'Combine your Life Architecture outputs into a coherent Life Architecture Blueprint.',
  ],
  skills: ['Systems mapping', 'Feedback loops', 'Leverage points', 'Strategic formulation', 'Planning', 'Theory of change'],
  audience: 'Learners who want to tackle complex, stubborn problems in communities, ventures or public services, and who have begun defining a problem in Problem Solving.',
  prerequisites: 'Problem Solving recommended, ideally completed first.',
  practicalOutput: 'System Map and Leverage Brief',
  cover: {
    from: '#0A2A3D',
    to: '#2E8C9E',
    symbol: '◈',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg/1280px-Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg',
    imageAlt: 'An aerial view of a large open-air market where hundreds of baskets and crates of red tomatoes are spread across the ground among crowds of traders.',
    imageCredit: 'Photo: Ayorinde Ogundele / Wikimedia Commons, CC BY-SA 4.0',
  },
  trailer: {
    provider: 'youtube',
    videoId: 'A_BtS008J0k',
    title: 'In A World of Systems',
    channel: 'Donella Meadows',
    durationS: 563,
  },
  instructors: [
    {
      name: 'The African Dream Lab Faculty',
      title: 'Life Architecture faculty',
      bio: 'The Life Architecture faculty of The African Dream Lab brings together educators, founders, community organisers and practitioners from across the continent. They teach the habits of mind every builder needs, from seeing a problem clearly to seeing the whole system around it. The Lab is run by the African Dream Network and grew out of the TADIS conference.',
    },
  ],
  modules: [moduleSee, moduleLoops, moduleLeverage],
};

import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Character Formation and Ethics: Life Architecture, week 3, 5 credits. Practical Output:
 * Personal Values Charter.
 *
 * Spine: Know your values → Reason through dilemmas → Resist the slide → Speak up → Build trust.
 * Recurring cast, all fictional:
 *   Chidi     founder of a small logistics start-up in Port Harcourt, waiting on goods at the port
 *   Ama       a procurement officer at a district assembly in Ghana
 *   Nyambura  treasurer of a women’s farming cooperative near Nyeri, Kenya
 *   Sipho     a software engineer at a Cape Town start-up
 *   Uwase     secretary of a village borehole committee in Rwanda’s Eastern Province
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Values: who you are before the test
// ---------------------------------------------------------------------------

const moduleValues: Module = {
  key: 'values',
  title: 'Values: who you are before the test',
  summary:
    'See why character is formed long before the hard choice arrives, examine your own values and where they come from, including family, faith, culture and ubuntu, and choose the few that matter most.',
  weekNo: 3,
  items: [
    {
      key: 'character-before-crisis',
      type: 'lesson',
      title: 'Character is decided before the crisis',
      minutes: 17,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to Character Formation and Ethics.\n\nEvery builder is tested. A bribe that would speed up a permit. A partner who cuts corners. A chance to take credit for someone else’s work. What you do in those moments depends mostly on decisions you made long before them.\n\nThis course is not a list of rules. It is about **character**: the steady, chosen pattern of how you treat people and handle power. By the end you will have written your own **Personal Values Charter**.\n\nStart with Patrick Awuah, who left a career at Microsoft in the United States to found Ashesi University in Ghana, with ethical leadership at its heart.",
              },
              {
                id: 'awuah-video',
                type: 'video',
                provider: 'youtube',
                videoId: '-BckS8D-opA',
                title: 'How can education foster ethical citizens? | Patrick Awuah',
                channel: 'TED Archive',
                durationS: 652,
                caption: 'Patrick Awuah on why he believes Africa’s progress depends on how it forms its leaders. As you watch, ask yourself: where was your own character formed, and who formed it?',
              },
            ],
          },
          {
            id: 'ashesi',
            title: 'A code students chose',
            blocks: [
              {
                id: 'ashesi-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ashesi%27s_Archer_Cornfield_Courtyard.jpg/1280px-Ashesi%27s_Archer_Cornfield_Courtyard.jpg',
                alt: 'A university courtyard at dusk: two-storey buildings with lit windows and balconies around a lawn, palm trees, and a paved path lined with red flowering shrubs.',
                caption: 'A courtyard at Ashesi University in Berekuso, Ghana.',
                credit: 'Photo: Gwumah / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'honour-context',
                type: 'callout',
                tone: 'context',
                title: 'The Ashesi honour code',
                body: "In 2008, after years of debate, Ashesi’s students voted to adopt an honour code. Before exams, students pledge not to cheat and to report dishonesty, and exams are generally taken without invigilators watching.\n\nNotice what happened. The rule did not come from above. Students chose it, argued over it and committed to it together. That is what character formation looks like: not obedience, but a decision about who you will be, made before anyone is watching.",
              },
            ],
          },
          {
            id: 'terms',
            title: 'Words we will use',
            blocks: [
              {
                id: 'ethics-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Values', definition: 'What you believe matters most and want your life to stand for: honesty, family, fairness, faith, excellence, courage.' },
                  { term: 'Ethics', definition: 'Reasoning about what is right and wrong, especially when values or people’s interests conflict.' },
                  { term: 'Character', definition: 'The steady pattern of how you actually behave, especially under pressure. Built by repeated choices.' },
                  { term: 'Integrity', definition: 'Being the same person in private as in public, and keeping your word when it costs you.' },
                  { term: 'Bright line', definition: 'A line you decide in advance you will not cross, so you do not have to argue with yourself under pressure.' },
                ],
              },
            ],
          },
          {
            id: 'meet-chidi',
            title: 'Meet Chidi',
            blocks: [
              {
                id: 'chidi-story',
                type: 'callout',
                tone: 'story',
                title: 'Chidi, logistics founder, Port Harcourt',
                body: "Chidi runs a small logistics start-up. Twelve containers of a client’s goods are waiting for clearance. Every day of delay costs him storage charges and his client’s patience.\n\nAn official tells him, quietly, that “things can move faster” for a fee paid in cash. Chidi’s competitors pay these fees, he is fairly sure. His client is threatening to leave. He has two staff salaries due on Friday.\n\nChidi has always said he would never pay a bribe. Now it does not feel so simple.",
              },
              {
                id: 'chidi-reveal',
                type: 'reveal',
                prompt: 'Before you tap: when will Chidi’s real decision be made? At the port, or earlier?',
                body: "Mostly earlier. Under pressure, with salaries due, people rarely reason their way to a new position. They fall back on what they have already decided, or on what feels easiest.\n\nIf Chidi has never thought through what he will do, how he will explain delays to clients, and who he can call for help, the pressure will decide for him. If he has, he has a plan he can follow even when he is frightened.\n\nThat is why this course asks you to decide **before the crisis**.",
              },
            ],
          },
          {
            id: 'clear-lines',
            title: 'How clear are your lines?',
            blocks: [
              {
                id: 'lines-scale',
                type: 'scale',
                prompt: 'How clearly could you say, today, which lines you would never cross in your work, even under heavy pressure?',
                minLabel: 'Not clear at all',
                maxLabel: 'Completely clear',
                afterword:
                  "Most people have a general sense of right and wrong, but few have thought through specific lines. That is normal. Your Values Charter will change it.",
              },
              {
                id: 'integrity-choice',
                type: 'choice',
                prompt: 'Which of these best shows integrity?',
                multiple: false,
                options: [
                  { id: 'public', text: 'Speaking strongly against corruption at public events', correct: false, feedback: 'Admirable, but words in public are the easy part. Integrity is about what you do when it costs you.' },
                  { id: 'private', text: 'Returning extra change a shopkeeper gave you by mistake, when nobody would ever know', correct: true, feedback: 'Yes. Integrity is being the same person when nobody is watching.' },
                  { id: 'rules', text: 'Following every rule exactly, even when it harms someone', correct: false, feedback: 'Rule-following is not the same as integrity. Sometimes integrity means questioning a rule.' },
                  { id: 'reputation', text: 'Having a good reputation in your community', correct: false, feedback: 'Reputation is what others think of you. Integrity is who you are. They usually go together, but not always.' },
                ],
                explanation:
                  "Integrity comes from the same root as *integer* and *integrated*: whole, one piece. The person in private and the person in public are the same person.",
              },
            ],
          },
          {
            id: 'tested',
            title: 'Your own test',
            blocks: [
              {
                id: 'tested-reflection',
                type: 'reflection',
                prompt: 'Describe a time your values were tested: at school, work, in your family or community. What was the pressure, what did you do, and how do you feel about it now?',
                guidance: 'Be honest. Times you fell short often teach more than times you did well. This stays in your journal.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'where-values-come-from',
      type: 'lesson',
      title: 'Where your values come from, and ubuntu',
      minutes: 12,
      required: true,
      payload: {
        steps: [
          {
            id: 'ubuntu-intro',
            title: 'A person through other people',
            blocks: [
              {
                id: 'ubuntu-text',
                type: 'text',
                body: "Nobody invents their values alone. We absorb them from family, faith, culture, teachers, friends and our own experiences, especially painful ones.\n\nMany African traditions express a powerful idea about this: that we become fully human through our relationships with others. In Southern Africa it is called **ubuntu**. Listen to Nelson Mandela describe it.",
              },
              {
                id: 'mandela-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'HED4h00xPPA',
                title: 'Ubuntu told by Nelson Mandela',
                channel: 'Sylvia-Educomm',
                durationS: 97,
                caption: 'A short interview clip. Listen for the story of the traveller, and for the question Mandela says ubuntu puts to anyone who wants to do well for themselves.',
              },
            ],
          },
          {
            id: 'ubuntu-builder',
            title: 'What ubuntu asks of a builder',
            blocks: [
              {
                id: 'umuganda-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Umuganda%22Rwandan_community_work%22.jpg/1280px-Umuganda%22Rwandan_community_work%22.jpg',
                alt: 'A group of people work side by side laying stones and mortar for a building foundation, one spreading mortar with a trowel while others watch and help.',
                caption: 'People lay a foundation together during Umuganda, Rwanda’s monthly community work day, in Kicukiro District.',
                credit: 'Photo: Smish60 / Wikimedia Commons, CC BY-SA 3.0',
              },
              {
                id: 'ubuntu-quote',
                type: 'quote',
                text: 'Umuntu ngumuntu ngabantu. (A person is a person through other people.)',
                attribution: 'Nguni proverb, isiZulu',
              },
              {
                id: 'ubuntu-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Success is not only yours',
                body: "Ubuntu does not say you should not succeed. It asks *how* you succeed, and who succeeds with you. A founder who grows rich by underpaying staff, cheating customers or poisoning a river has broken the web that made their success possible.\n\nFor a builder, ubuntu raises practical questions. Who carries the cost of my decisions? Who shares in the gains? Would the people affected recognise my conduct as fair?",
              },
            ],
          },
          {
            id: 'sources',
            title: 'Where values come from',
            blocks: [
              {
                id: 'sources-match',
                type: 'match',
                prompt: 'Match each memory to the source of values it shows.',
                pairs: [
                  { id: 'family', left: 'Nyambura’s mother made her walk back to return a shilling a trader overpaid.', right: 'Family' },
                  { id: 'faith', left: 'Ama learnt at her mosque that cheating in trade is a serious wrong.', right: 'Faith' },
                  { id: 'culture', left: 'Uwase grew up expecting every household to help when a neighbour’s house needed rebuilding.', right: 'Culture and community' },
                  { id: 'experience', left: 'Sipho’s father lost his savings to a dishonest employer, so Sipho cares fiercely about paying people fairly.', right: 'Painful experience' },
                ],
                explanation:
                  "Most of our deepest values have a story behind them. Knowing the story helps you hold the value with conviction, and also question it if it was learnt in a way that no longer serves you.",
              },
            ],
          },
          {
            id: 'source-poll',
            title: 'What shaped you most?',
            blocks: [
              {
                id: 'source-poll-block',
                type: 'poll',
                prompt: 'Which source has shaped your values most?',
                options: [
                  { id: 'family', text: 'Parents and family' },
                  { id: 'faith', text: 'Faith or religious community' },
                  { id: 'culture', text: 'Culture and community traditions' },
                  { id: 'teachers', text: 'Teachers, mentors or coaches' },
                  { id: 'friends', text: 'Friends and peers' },
                  { id: 'experience', text: 'Hard experiences' },
                ],
                afterword:
                  "There is no right answer. Most people find several sources, and some values they hold are a reaction against what they saw growing up.",
              },
            ],
          },
          {
            id: 'conflict',
            title: 'When values collide',
            blocks: [
              {
                id: 'ama-reveal',
                type: 'reveal',
                prompt: 'Ama works in procurement at a district assembly. Her cousin’s company bids for a contract she is evaluating. Her family says “we look after our own.” Her job says “treat every bidder fairly.” Both are real values. What should she do?',
                body: "This is what makes ethics hard. It is rarely good against evil. More often it is **one good value against another**: loyalty against fairness, family against public duty, kindness against honesty.\n\nHere, a widely accepted answer exists: Ama should declare the relationship and step out of evaluating that bid. That protects the public, protects her cousin from suspicion, and protects Ama. She can still be loyal to her family in other ways. Loyalty does not have to mean using public office for relatives.",
              },
              {
                id: 'values-choice',
                type: 'choice',
                prompt: 'Which of these are values, rather than goals or rules? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'honesty', text: 'Honesty', correct: true, feedback: 'Yes. A quality you want to live by.' },
                  { id: 'fairness', text: 'Fairness', correct: true, feedback: 'Yes.' },
                  { id: 'courage', text: 'Courage', correct: true, feedback: 'Yes.' },
                  { id: 'car', text: 'Owning a car by thirty', correct: false, feedback: 'That is a goal. A value is about how you live, not what you get.' },
                  { id: 'late', text: 'Never arrive late to meetings', correct: false, feedback: 'That is a rule. The value behind it might be respect or reliability.' },
                ],
                explanation:
                  "Values are qualities you want your actions to show. Goals are things you want to achieve. Rules are specific behaviours. Your charter needs all three in their place, but it starts with values.",
              },
            ],
          },
          {
            id: 'your-values',
            title: 'Name your values',
            blocks: [
              {
                id: 'values-reflection',
                type: 'reflection',
                prompt: 'List five values that matter most to you. For each, write one sentence on where it comes from. Then choose your top three and say why they made the cut.',
                guidance: 'Choose values you actually live by, or genuinely want to, not ones that sound impressive. This becomes the first section of your Values Charter.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'values-quiz',
      type: 'quiz',
      title: 'Module quiz: Values',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Four questions on values, character, integrity and ubuntu. You need 75% to pass and you can retake it as many times as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'q-terms',
            type: 'match',
            prompt: 'Match each term to its meaning.',
            pairs: [
              { id: 'values', left: 'Values', right: 'What you believe matters most and want your life to stand for' },
              { id: 'character', left: 'Character', right: 'The steady pattern of how you actually behave under pressure' },
              { id: 'integrity', left: 'Integrity', right: 'Being the same person in private as in public' },
              { id: 'bright', left: 'Bright line', right: 'A line you decide in advance never to cross' },
            ],
            explanation: 'Values are what you believe. Character is what you do. Integrity is when the two match, in private as well as in public.',
          },
          {
            id: 'q-before',
            type: 'choice',
            prompt: 'Why does this course stress deciding your lines before a crisis?',
            multiple: false,
            options: [
              { id: 'a', text: 'Because under pressure people mostly fall back on what they have already decided, or on what is easiest', correct: true },
              { id: 'b', text: 'Because ethical decisions never change', correct: false, feedback: 'Views can grow with experience. The point is not to be making them up under pressure.' },
              { id: 'c', text: 'Because crises are rare', correct: false, feedback: 'Ethical pressure is common in business and public life.' },
              { id: 'd', text: 'So that you never need to think about ethics again', correct: false, feedback: 'Deciding in advance frees you to think clearly about the hard parts, not to stop thinking.' },
            ],
            explanation: 'Pressure narrows thinking. Lines and plans made in calm moments are what you can rely on when you are frightened or rushed.',
          },
          {
            id: 'q-ubuntu',
            type: 'choice',
            prompt: 'Which statement best reflects ubuntu as discussed in this course?',
            multiple: false,
            options: [
              { id: 'a', text: 'Individual success is wrong', correct: false, feedback: 'Ubuntu does not oppose success. It asks how you succeed and who succeeds with you.' },
              { id: 'b', text: 'A person becomes fully human through relationships with others, so success should strengthen the community, not exploit it', correct: true },
              { id: 'c', text: 'You should always do what your community tells you', correct: false, feedback: 'Ubuntu is about mutual humanity, not blind obedience.' },
              { id: 'd', text: 'Ubuntu only applies inside families', correct: false, feedback: 'Mandela’s traveller was a stranger.' },
            ],
            explanation: '“A person is a person through other people.” For a builder: who carries the cost of my decisions, and who shares in the gains?',
          },
          {
            id: 'q-conflict',
            type: 'choice',
            prompt: 'A procurement officer’s relative bids for a contract she is evaluating. What should she do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Score the bid fairly and say nothing, since she knows she is honest', correct: false, feedback: 'Even if she is fair, nobody can check that. The conflict itself damages trust.' },
              { id: 'b', text: 'Declare the relationship and step out of evaluating that bid', correct: true },
              { id: 'c', text: 'Give the relative a slightly higher score, since family comes first', correct: false, feedback: 'That uses public office for private gain.' },
              { id: 'd', text: 'Reject the relative’s bid automatically', correct: false, feedback: 'That is unfair to the relative. Stepping aside lets others judge the bid on its merits.' },
            ],
            explanation: 'Declare and step aside. It protects the public, the relative and the officer.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Ethical decisions: frameworks and dilemmas
// ---------------------------------------------------------------------------

const moduleDecisions: Module = {
  key: 'decisions',
  title: 'Ethical decisions: frameworks and dilemmas',
  summary:
    'Learn four lenses for thinking through a hard choice and a short decision process you can use under pressure, then work through realistic dilemmas from African business, public service and community life.',
  weekNo: 3,
  items: [
    {
      key: 'ethical-frameworks',
      type: 'lesson',
      title: 'Four lenses for a hard choice',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'lenses-intro',
            title: 'Thinking through a dilemma',
            blocks: [
              {
                id: 'lenses-text',
                type: 'text',
                body: "When a choice is hard, gut feeling is a useful signal but a poor guide on its own. Philosophers have argued about right and wrong for thousands of years, on every continent, and they have left us some powerful lenses for looking at a problem.\n\nStart with a famous thought experiment. Notice how your answer changes as the details change.",
              },
              {
                id: 'trolley-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'yg16u_bzjPE',
                title: 'Would you sacrifice one person to save five? - Eleanor Nelsen',
                channel: 'TED-Ed',
                durationS: 296,
                caption: 'Watch for the difference between judging an action by its results and judging it by what the action itself involves. Which pull do you feel more strongly?',
              },
            ],
          },
          {
            id: 'four-lenses',
            title: 'Four lenses',
            blocks: [
              {
                id: 'trolley-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Trolley_Problem.svg/1280px-Trolley_Problem.svg.png',
                alt: 'A black-and-white diagram of a tram heading along a track towards five figures. A figure beside a lever could switch it onto a branch track where one figure stands.',
                caption: 'The trolley problem: pull the lever or not?',
                credit: 'Diagram: McGeddon, vector by Zapyon / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'lenses-framework',
                type: 'framework',
                title: 'Four lenses for an ethical decision',
                steps: [
                  { label: 'Consequences', detail: 'Which option does the most good and least harm, for everyone affected, now and later?' },
                  { label: 'Duties and rights', detail: 'What do I owe people, whatever the results? Which promises, laws or rights are at stake?' },
                  { label: 'Character', detail: 'What would a person of good character do? What will this choice make me into?' },
                  { label: 'Relationships and community', detail: 'How does this affect the web of relationships and trust I am part of? Would those affected see it as fair? This is where ubuntu speaks.' },
                ],
              },
            ],
          },
          {
            id: 'lens-match',
            title: 'Which lens?',
            blocks: [
              {
                id: 'lens-match-block',
                type: 'match',
                prompt: 'Chidi is thinking about the port “fee”. Match each of his thoughts to the lens it uses.',
                pairs: [
                  { id: 'consequences', left: '“If I pay, my staff get paid on Friday. If everyone pays, clearance gets slower for those who can’t.”', right: 'Consequences' },
                  { id: 'duties', left: '“It is against the law, and I signed an anti-bribery clause with my client.”', right: 'Duties and rights' },
                  { id: 'character', left: '“If I pay once, I become someone who pays.”', right: 'Character' },
                  { id: 'community', left: '“Every bribe paid makes it harder for small honest firms like mine across the city.”', right: 'Relationships and community' },
                ],
                explanation:
                  "Each lens shows something the others miss. When all four point the same way, as they mostly do here, you can act with confidence. When they disagree, you have found a genuine dilemma, and you need to weigh them honestly.",
              },
            ],
          },
          {
            id: 'quick-tests',
            title: 'Quick tests',
            blocks: [
              {
                id: 'tests-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Three quick tests when time is short',
                body: "- **The front-page test:** Would I be comfortable if this appeared on the front page of a newspaper, or trended online, with my name on it?\n- **The mirror test:** Could I explain this honestly to someone whose respect I value: a parent, a mentor, my children one day?\n- **The swap test:** Would I accept this if I were on the other side of it?",
              },
              {
                id: 'tests-choice',
                type: 'choice',
                prompt: 'Sipho’s start-up could win a contract by quietly copying a competitor’s design, which a former employee brought with him. Which test most directly exposes the problem?',
                multiple: false,
                options: [
                  { id: 'swap', text: 'The swap test: would Sipho accept a competitor doing this to his team’s work?', correct: true, feedback: 'Yes. Imagining himself as the one copied makes the wrong obvious.' },
                  { id: 'profit', text: 'The profit test: will it make money?', correct: false, feedback: 'That is not an ethical test. Many wrongs are profitable.' },
                  { id: 'legal', text: 'The detection test: will anyone find out?', correct: false, feedback: 'Whether you get caught is not the same as whether it is right.' },
                  { id: 'popular', text: 'The popularity test: do others in the industry do it?', correct: false, feedback: '“Everybody does it” is a rationalisation, not a test. You will meet it again later.' },
                ],
                explanation:
                  "All three quick tests can help here, but the swap test is often the sharpest. It strips away the excuses we make for ourselves and that we would never accept from others.",
              },
            ],
          },
          {
            id: 'process',
            title: 'A decision process',
            blocks: [
              {
                id: 'process-order',
                type: 'order',
                prompt: 'Put these steps for working through an ethical decision into a sensible order.',
                items: [
                  { id: 'pause', text: 'Pause, and notice that this is an ethical choice, not just a business one' },
                  { id: 'facts', text: 'Get the facts: what do I actually know, and what am I assuming?' },
                  { id: 'people', text: 'List who is affected, including people who are not in the room' },
                  { id: 'options', text: 'List options, including creative ones, and look at each through the four lenses' },
                  { id: 'test', text: 'Run the quick tests on your preferred option' },
                  { id: 'act', text: 'Act, and own the decision and its consequences' },
                ],
                explanation:
                  "The first step is the one most often skipped. Many ethical failures start with someone treating an ethical question as a purely technical one: “just a fee”, “just a number in a report”.",
              },
            ],
          },
          {
            id: 'apply-lenses',
            title: 'Apply the lenses',
            blocks: [
              {
                id: 'lenses-reflection',
                type: 'reflection',
                prompt: 'Think of an ethical choice you face now or expect to face soon. Look at it through each of the four lenses in turn. Where do they agree, and where do they pull in different directions?',
                guidance: 'One or two sentences per lens is enough. Notice which lens you naturally reach for first, and which you tend to ignore.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'real-dilemmas',
      type: 'lesson',
      title: 'Real dilemmas: bribes, family and ends and means',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'anas-intro',
            title: 'Ends and means',
            blocks: [
              {
                id: 'anas-text',
                type: 'text',
                body: "Real dilemmas are messier than thought experiments. People you love are involved. Money is short. The rules are unclear, or the rules themselves are unjust.\n\nAnas Aremeyaw Anas is a Ghanaian investigative journalist known for exposing corruption, often by working undercover and keeping his own face hidden. Many admire him. Some question his methods. Listen to him explain his mission.",
              },
              {
                id: 'anas-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'CoNkj-SuALc',
                title: 'Anas Aremeyaw Anas: My mission to name, shame and jail the corrupt',
                channel: 'TEDTalentSearch',
                durationS: 378,
                caption: 'Watch for how Anas describes his methods and his goal. Then ask yourself: is it right to deceive people in order to expose wrongdoing?',
              },
            ],
          },
          {
            id: 'ends-means',
            title: 'Does the end justify the means?',
            blocks: [
              {
                id: 'ends-reveal',
                type: 'reveal',
                prompt: 'Look at Anas’s work through the four lenses. Which lenses support undercover methods, and which raise questions?',
                body: "**Consequences** largely support him: corrupt officials removed, public money protected, others deterred.\n\n**Duties and rights** raise questions: deception, secret recording and the rights of the people filmed, including their right to a fair process.\n\n**Character** cuts both ways: great courage, but what does repeated deception do to the deceiver?\n\n**Community** asks whether trust in institutions grows when wrongdoing is exposed, or shrinks when people learn anyone could be secretly filming.\n\nThoughtful people disagree here. That is what a genuine dilemma looks like. The goal is not to find the one obvious answer, but to reason honestly about the trade-offs.",
              },
            ],
          },
          {
            id: 'chidi-port',
            title: 'Chidi at the port',
            blocks: [
              {
                id: 'naira-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Naira_notes_%2876252%29.jpg/1280px-Naira_notes_%2876252%29.jpg',
                alt: 'The front and back of a Nigerian two-hundred-naira banknote laid on lined paper.',
                caption: 'Small notes, big consequences. Chidi is a fictional character.',
                credit: 'Photo: FAdelabu / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'chidi-scenario',
                type: 'scenario',
                situation:
                  "Day four. The official repeats his offer: pay cash and the containers move tomorrow. Chidi’s client calls twice before noon. His operations manager says, “Oga, everybody pays. It’s just the cost of doing business.”",
                prompt: 'What should Chidi do?',
                options: [
                  {
                    id: 'pay-once',
                    text: 'Pay this once, to save the client, and promise himself never again.',
                    outcome: "The containers move. A month later, the same official expects the same fee, and now he knows Chidi pays. Saying no has become harder, not easier. “Just once” rarely stays once.",
                    best: false,
                  },
                  {
                    id: 'escalate',
                    text: 'Refuse politely, ask for the official procedure and timeline in writing, use the port’s formal complaint channel, and tell his client honestly what is happening.',
                    outcome: "It is slower and he loses three days. His client is frustrated but respects the honesty, and adds a clause to future contracts allowing for clearance delays. Chidi joins a group of logistics firms that report delays together. It costs him now, and builds something that protects him later.",
                    best: true,
                  },
                  {
                    id: 'agent',
                    text: 'Hire a clearing agent and not ask what the agent pays.',
                    outcome: "Chidi has not paid the bribe himself, but he has paid for one to be paid. Deliberately not asking is still a choice, and in many legal systems it does not protect you.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'ama-bid',
            title: 'Ama and the gift',
            blocks: [
              {
                id: 'ama-example',
                type: 'example',
                title: 'After the contract',
                body: "Ama stepped aside from evaluating her cousin’s bid. Another company won. A month later, the winning company’s director sends Ama a hamper at Christmas: rice, oil, drinks and an envelope with cash “for the children”. A card says: “Thank you for your support.”",
              },
              {
                id: 'ama-choice',
                type: 'choice',
                prompt: 'What should Ama do?',
                multiple: false,
                options: [
                  { id: 'keep', text: 'Keep it. It is Christmas, and the contract has already been awarded.', correct: false, feedback: 'Gifts after a contract can still be rewards, and they create expectations for the next one.' },
                  { id: 'keep-food', text: 'Keep the food but return the cash.', correct: false, feedback: 'Better, but the hamper still comes from a supplier she may evaluate again, with a card thanking her for “support”.' },
                  { id: 'return-report', text: 'Return the gift politely and record it with her manager or the assembly’s gift register.', correct: true, feedback: 'Yes. Returning protects her independence, and recording it protects her if questions are ever asked.' },
                  { id: 'share', text: 'Share it with her colleagues so nobody benefits personally.', correct: false, feedback: 'Spreading the gift around spreads the obligation too.' },
                ],
                explanation:
                  "Gift-giving is a warm part of many cultures, and not every gift is a bribe. The questions to ask: Who is giving? Do I have power over decisions that affect them? Would I be comfortable if everyone knew? When the answers are “a supplier”, “yes” and “no”, the gift goes back, with thanks.",
              },
            ],
          },
          {
            id: 'hard-poll',
            title: 'Your hardest dilemma',
            blocks: [
              {
                id: 'hard-poll-block',
                type: 'poll',
                prompt: 'Which kind of dilemma do you expect to find hardest in your career?',
                options: [
                  { id: 'bribes', text: 'Bribes and “facilitation fees”' },
                  { id: 'family', text: 'Pressure to favour family or friends' },
                  { id: 'truth', text: 'Telling the truth when it costs money or friendship' },
                  { id: 'credit', text: 'Credit, ownership and other people’s work' },
                  { id: 'boss', text: 'Being asked to do something wrong by someone senior' },
                  { id: 'harm', text: 'Profit that harms people or the environment' },
                ],
                afterword:
                  "Whatever you chose, you are not alone in it. The dilemma you picked is a strong candidate for your Values Charter: plan for it now, while you are calm.",
              },
            ],
          },
          {
            id: 'your-dilemma',
            title: 'Plan for your dilemma',
            blocks: [
              {
                id: 'dilemma-reflection',
                type: 'reflection',
                prompt: 'Describe the dilemma most likely in your path over the next few years. What exactly would the pressure be? Using the four lenses, what will you do, and what would you say in the moment?',
                guidance: 'Be concrete: who, where, how much. Write the actual words you would use. This becomes the “dilemmas I expect” section of your Values Charter.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'dilemma-discussion',
      type: 'discussion',
      title: 'Discussion: a dilemma from your world',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Share a real ethical dilemma from your sector, community or country: one you have faced, witnessed or read about. Change names and details to protect people.\n\nIn your post:\n\n1. Describe the situation and the pressure in a few sentences.\n2. Look at it through at least two of the four lenses: consequences, duties and rights, character, and relationships and community.\n3. Say what you think the right course of action was, and what it would have cost.\n\nThen reply to at least two classmates. Offer a lens they did not use, or a creative option they did not consider.",
        guidance: 'Disagree with ideas, never with people’s worth. Do not name real individuals in connection with wrongdoing that has not been publicly established.',
        minWords: 80,
      },
    },
    {
      key: 'decisions-quiz',
      type: 'quiz',
      title: 'Module quiz: Ethical decisions',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on the four lenses, the quick tests and real dilemmas. You need 70% to pass and you can retake it as many times as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-lenses',
            type: 'match',
            prompt: 'Match each question to its lens.',
            pairs: [
              { id: 'consequences', left: 'Which option does the most good and least harm?', right: 'Consequences' },
              { id: 'duties', left: 'What promises, laws or rights are at stake?', right: 'Duties and rights' },
              { id: 'character', left: 'What will this choice make me into?', right: 'Character' },
              { id: 'community', left: 'Would those affected see this as fair, and how does it affect trust?', right: 'Relationships and community' },
            ],
            explanation: 'Four lenses, four questions. Use all four, especially the ones you tend to skip.',
          },
          {
            id: 'q-swap',
            type: 'choice',
            prompt: 'What does the swap test ask?',
            multiple: false,
            options: [
              { id: 'a', text: 'Would I accept this if I were on the other side of it?', correct: true },
              { id: 'b', text: 'Could I swap this decision for a more profitable one?', correct: false, feedback: 'Profit is not an ethical test.' },
              { id: 'c', text: 'Would anyone notice if I swapped the numbers?', correct: false, feedback: 'Whether anyone notices is not the question.' },
              { id: 'd', text: 'Can I swap responsibility to someone else?', correct: false, feedback: 'That is avoiding the decision, not testing it.' },
            ],
            explanation: 'Imagining yourself on the receiving end strips away the excuses we make for ourselves.',
          },
          {
            id: 'q-process',
            type: 'order',
            prompt: 'Put the ethical decision process in order.',
            items: [
              { id: 'pause', text: 'Pause and recognise it as an ethical choice' },
              { id: 'facts', text: 'Get the facts' },
              { id: 'people', text: 'List who is affected' },
              { id: 'options', text: 'Weigh options through the four lenses' },
              { id: 'test', text: 'Run the quick tests' },
              { id: 'act', text: 'Act and own it' },
            ],
            explanation: 'The first step is the one most often skipped.',
          },
          {
            id: 'q-agent',
            type: 'choice',
            prompt: 'A founder hires an agent to “handle” a licence and deliberately avoids asking whether the agent pays bribes. Which statement is most accurate?',
            multiple: false,
            options: [
              { id: 'a', text: 'The founder is fully protected because she never paid anyone herself', correct: false, feedback: 'Deliberately not asking is still a choice. In many legal systems it does not protect you.' },
              { id: 'b', text: 'Choosing not to know is itself an ethical choice, and she shares responsibility for what she is paying for', correct: true },
              { id: 'c', text: 'Agents are always corrupt, so she should never use one', correct: false, feedback: 'Many agents are honest and useful. The problem is choosing not to know.' },
              { id: 'd', text: 'It only matters if the bribe is large', correct: false, feedback: 'Size changes the stakes, not the principle.' },
            ],
            explanation: 'Wilful blindness lets people feel innocent while benefiting from wrongdoing. Ask the question, and get the answer in writing.',
          },
          {
            id: 'q-gifts',
            type: 'choice',
            prompt: 'When should a gift make you cautious? Select all that apply.',
            multiple: true,
            options: [
              { id: 'power', text: 'When you have power over decisions that affect the giver', correct: true },
              { id: 'secret', text: 'When you would be uncomfortable if everyone knew about it', correct: true },
              { id: 'cash', text: 'When it includes cash', correct: true },
              { id: 'timing', text: 'When it arrives just before or after a decision about the giver', correct: true },
              { id: 'birthday', text: 'When a close friend with no business link gives you a birthday present', correct: false, feedback: 'Ordinary gifts between friends with no business connection are part of normal life.' },
            ],
            explanation: 'Power, secrecy, cash and timing. Not every gift is a bribe, but these four signals call for returning it or at least recording it.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Integrity, pressure and trust
// ---------------------------------------------------------------------------

const charterTemplate = [
  'PERSONAL VALUES CHARTER',
  '',
  '1. My core values',
  'My three to five core values, what each means in my own words, and where it comes from.',
  '',
  '2. What I stand for',
  'One or two sentences on the kind of builder and leader I intend to be, and how I want people to be treated by what I build.',
  '',
  '3. Lines I will not cross',
  'Three to five specific bright lines, written so that anyone could tell whether I had crossed them.',
  '',
  '4. Dilemmas I expect',
  'The two or three dilemmas most likely in my path, and what I will do and say when they arrive.',
  '',
  '5. My warning signs',
  'The rationalisations and pressures I am most vulnerable to, and how I will notice them.',
  '',
  '6. How I will speak up',
  'A pre-scripted response for one situation where I may need to voice my values to someone with more power.',
  '',
  '7. Who will hold me accountable',
  'One to three named accountability partners, what I have asked them to do, and how often we will review this charter.',
  '',
  'Signed and dated.',
].join('\n');

const moduleIntegrity: Module = {
  key: 'integrity',
  title: 'Integrity, pressure and trust',
  summary:
    'Understand the small steps and rationalisations that lead good people into bad choices, learn to voice your values when it is hard, and see how integrity, accountability and trust are built in teams and institutions. Then write your Personal Values Charter.',
  weekNo: 3,
  items: [
    {
      key: 'why-good-people',
      type: 'lesson',
      title: 'Why good people make bad choices',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'slide-intro',
            title: 'The slow slide',
            blocks: [
              {
                id: 'slide-text',
                type: 'text',
                body: "Most people who end up in serious wrongdoing did not set out to be villains. They took a small step, then another, each one only a little worse than the last. By the time they noticed, they were far from where they started.\n\nUnderstanding how that happens is one of the best protections you have.",
              },
              {
                id: 'incremental-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'ky2sAsLUKeo',
                title: 'Incrementalism | Concepts Unwrapped',
                channel: 'McCombs School of Business',
                durationS: 245,
                caption: 'From the Ethics Unwrapped series at the University of Texas. Watch for how small steps make the next step feel normal.',
              },
            ],
          },
          {
            id: 'nyambura',
            title: 'Nyambura’s slide',
            blocks: [
              {
                id: 'nyambura-story',
                type: 'callout',
                tone: 'story',
                title: 'Nyambura, cooperative treasurer, near Nyeri',
                body: "Nyambura is treasurer of a women’s farming cooperative. In March her son’s school fees are due and her own money is late. She takes 3,000 shillings from the cooperative’s cash box, fully intending to put it back next week. She does.\n\nIn June she borrows 8,000 and returns it a month later. In September, 20,000. By December she owes the cooperative 45,000 shillings, has stopped writing the loans in the book, and lies awake before every meeting.\n\nNyambura is not a thief by nature. She is a respected, generous woman. What happened?",
              },
              {
                id: 'nyambura-reveal',
                type: 'reveal',
                prompt: 'Where could Nyambura have stopped the slide most easily?',
                body: "At the very first step, in March. Every later step felt only slightly bigger than the one before, and each time she had “always paid it back”. The first step was small, but it broke a line: **cooperative money is never personal money, not even for a week**.\n\nThat is why bright lines matter. A clear line is easy to hold at the first step and almost impossible to rebuild at the tenth.\n\nThere was also a missing safeguard: nobody else checked the cash box. Good systems protect good people from their worst weeks.",
              },
            ],
          },
          {
            id: 'rationalisations',
            title: 'The stories we tell ourselves',
            blocks: [
              {
                id: 'rational-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'MoZOTHkXyoY',
                title: 'Rationalizations | Ethics Defined',
                channel: 'McCombs School of Business',
                durationS: 112,
                caption: 'A two-minute definition. Listen for the examples, and notice which ones you have used yourself.',
              },
              {
                id: 'rational-terms',
                type: 'key_terms',
                terms: [
                  { term: '“Everybody does it”', definition: 'Treating a common practice as an acceptable one.' },
                  { term: '“Nobody gets hurt”', definition: 'Ignoring harm that is spread out, delayed or falls on people you cannot see.' },
                  { term: '“I deserve it”', definition: 'Feeling entitled because you are underpaid, overworked or treated unfairly.' },
                  { term: '“It’s for a good cause”', definition: 'Letting a good goal excuse bad means.' },
                  { term: '“It’s only temporary”', definition: 'Telling yourself you will fix it later. Nyambura’s rationalisation.' },
                  { term: '“I was told to”', definition: 'Handing your conscience to someone with more power.' },
                ],
              },
            ],
          },
          {
            id: 'rational-match',
            title: 'Spot the rationalisation',
            blocks: [
              {
                id: 'rational-match-block',
                type: 'match',
                prompt: 'Match each statement to the rationalisation it uses.',
                pairs: [
                  { id: 'everybody', left: '“All the firms on this route pay the checkpoint. Why should I be different?”', right: '“Everybody does it”' },
                  { id: 'deserve', left: '“The company pays me so little, a few extra fuel receipts is fair.”', right: '“I deserve it”' },
                  { id: 'cause', left: '“We inflated the beneficiary numbers, but the extra funding will help the children.”', right: '“It’s for a good cause”' },
                  { id: 'told', left: '“My manager said to backdate the invoices. It’s not my decision.”', right: '“I was told to”' },
                ],
                explanation:
                  "Each rationalisation contains something that feels true: pay really is low, the cause really is good. That is why they work. When you hear one in your own head, treat it as a warning light, not a reason.",
              },
            ],
          },
          {
            id: 'pressures',
            title: 'The pressures',
            blocks: [
              {
                id: 'everybody-scale',
                type: 'scale',
                prompt: 'In your community or sector, how often do you hear “everybody does it” used to excuse something wrong?',
                minLabel: 'Rarely',
                maxLabel: 'Constantly',
                afterword:
                  "Where a wrong is common, standing apart costs more and matters more. Many of the institutions that work well across the continent today exist because some people refused to accept “everybody does it”.",
              },
              {
                id: 'pressures-choice',
                type: 'choice',
                prompt: 'Which of these situations make good people more likely to make bad choices? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'time', text: 'Extreme time pressure', correct: true, feedback: 'Yes. Rushing pushes ethical questions out of view.' },
                  { id: 'authority', text: 'An instruction from someone with power over you', correct: true, feedback: 'Yes. Obedience to authority is one of the strongest pressures there is.' },
                  { id: 'group', text: 'A group where everyone else is going along with it', correct: true, feedback: 'Yes. Conformity makes the wrong feel normal.' },
                  { id: 'small', text: 'Small first steps that seem harmless', correct: true, feedback: 'Yes. Incrementalism, as with Nyambura.' },
                  { id: 'checks', text: 'Clear rules and regular, friendly checks by others', correct: false, feedback: 'These are protections, not pressures. They make good choices easier.' },
                ],
                explanation:
                  "Time pressure, authority, conformity and small steps. Notice that none of these is about bad character. They are about situations. That is why wise people design their situations, not just their intentions.",
              },
            ],
          },
          {
            id: 'warning-signs',
            title: 'Your warning signs',
            blocks: [
              {
                id: 'warning-reflection',
                type: 'reflection',
                prompt: 'Which two rationalisations or pressures are you most vulnerable to? Describe a situation where you can imagine them working on you, and one safeguard you could put in place now.',
                guidance: 'A safeguard is something outside your willpower: a rule, a check by someone else, a habit, a separate account. This becomes the “warning signs” section of your Values Charter.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'speaking-up',
      type: 'lesson',
      title: 'Moral courage: voicing your values',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'gvv-intro',
            title: 'Knowing is not enough',
            blocks: [
              {
                id: 'gvv-text',
                type: 'text',
                body: "Often we know what is right. The hard part is saying it: to a boss, an elder, a big client or a room full of people who all seem to agree.\n\nProfessor Mary Gentile developed an approach called **Giving Voice to Values**. Instead of asking “what is right?”, it asks: “Once I know what I think is right, how can I act on it effectively?” Its key idea is that speaking up is a skill you can rehearse.",
              },
              {
                id: 'gvv-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'Chyw6-UQw_c',
                title: 'Intro to Giving Voice to Values (GVV)',
                channel: 'McCombs School of Business',
                durationS: 419,
                caption: 'An introduction to Giving Voice to Values. Watch for why rehearsing what you will say makes it far more likely that you will say it.',
              },
            ],
          },
          {
            id: 'voice-steps',
            title: 'Preparing to speak up',
            blocks: [
              {
                id: 'voice-framework',
                type: 'framework',
                title: 'Six moves for voicing your values',
                steps: [
                  { label: 'Name the value', detail: 'Be clear with yourself about what is at stake: honesty, fairness, safety.' },
                  { label: 'Know the stakes', detail: 'What do the people involved stand to gain or lose? What are their reasons for the wrong course?' },
                  { label: 'Find allies', detail: 'Who else is uneasy? Speaking with even one other person changes the dynamic.' },
                  { label: 'Script it', detail: 'Write the actual words. Rehearse them out loud, ideally with someone you trust.' },
                  { label: 'Choose the moment', detail: 'Private before public. Calm before urgent. Right person, right channel.' },
                  { label: 'Offer a way forward', detail: 'Do not just say no. Propose an alternative that meets the legitimate goal.' },
                ],
              },
              {
                id: 'respect-context',
                type: 'callout',
                tone: 'context',
                title: 'Respect and courage',
                body: "In many African settings, respect for elders and seniors runs deep, and openly challenging them can feel unthinkable. Giving voice to values does not require disrespect. It often works best when it honours the other person: “Sir, I know you want this project to succeed. I am worried this approach could put it at risk. Could we consider another way?”",
              },
            ],
          },
          {
            id: 'sipho-scenario',
            title: 'Sipho and the bug',
            blocks: [
              {
                id: 'sipho-block',
                type: 'scenario',
                situation:
                  "Sipho is a software engineer at a Cape Town start-up. The team’s biggest client, a microfinance lender, has reported a bug that sometimes shows borrowers the wrong repayment amount. Sipho has not fixed it yet.\n\nBefore a call with the client, his manager says: “Tell them it’s fixed. We’ll sort it out next week. If we lose this client, we can’t make payroll.”",
                prompt: 'What should Sipho do?',
                options: [
                  {
                    id: 'comply',
                    text: 'Say it is fixed. His manager knows the business situation better.',
                    outcome: "Over the next week, several borrowers are shown the wrong amounts and some pay too much. The client discovers the bug was known. The start-up loses the client and its reputation. Sipho’s name is on the call notes.",
                    best: false,
                  },
                  {
                    id: 'refuse-public',
                    text: 'On the call, contradict his manager in front of the client.',
                    outcome: "The truth comes out, but the manager is humiliated and the client sees a team in conflict. Sipho is right about the facts and has made it much harder to be heard next time.",
                    best: false,
                  },
                  {
                    id: 'voice',
                    text: 'Ask his manager for two minutes before the call, name the risk to borrowers and to the client relationship, and propose saying: “We have found the cause, here is a temporary safeguard, and the full fix will be live by Wednesday.”',
                    outcome: "The manager is tense but agrees. The client is unhappy about the delay and grateful for the honesty and the safeguard. They stay. Weeks later, the manager tells Sipho he was glad he spoke up.",
                    best: true,
                  },
                ],
              },
            ],
          },
          {
            id: 'prep-order',
            title: 'Get ready',
            blocks: [
              {
                id: 'prep-order-block',
                type: 'order',
                prompt: 'Put Sipho’s preparation into a sensible order.',
                items: [
                  { id: 'value', text: 'Name the value at stake: honesty with the client and fairness to borrowers' },
                  { id: 'stakes', text: 'Understand his manager’s fear: losing the client and missing payroll' },
                  { id: 'alternative', text: 'Work out an honest alternative that also protects the client relationship' },
                  { id: 'script', text: 'Write and rehearse the words he will use' },
                  { id: 'moment', text: 'Raise it privately with his manager before the call' },
                ],
                explanation:
                  "Understanding the other person’s legitimate fear is what lets Sipho offer an alternative they can say yes to. Moral courage works best when it is also practical.",
              },
            ],
          },
          {
            id: 'courage-proverb',
            title: 'Courage together',
            blocks: [
              {
                id: 'together-quote',
                type: 'quote',
                text: 'If you want to go fast, go alone. If you want to go far, go together.',
                attribution: 'African proverb',
              },
              {
                id: 'allies-choice',
                type: 'choice',
                prompt: 'Why does finding even one ally make speaking up more effective?',
                multiple: false,
                options: [
                  { id: 'win', text: 'Because two votes always beat one', correct: false, feedback: 'It is not a vote. The effect is subtler.' },
                  { id: 'normal', text: 'Because it shows the concern is not just one person’s quirk, and makes it easier for others to agree', correct: true, feedback: 'Yes. One dissenter can be dismissed; two start to change what feels normal in the room.' },
                  { id: 'blame', text: 'Because it spreads the blame if things go wrong', correct: false, feedback: 'Allies are about being heard, not about sharing blame.' },
                  { id: 'none', text: 'It does not; speaking alone is always better', correct: false, feedback: 'Sometimes you must speak alone, but allies usually help a great deal.' },
                ],
                explanation:
                  "Conformity is a powerful pressure. The first person to break it pays the highest price. A second voice makes it far easier for a third and a fourth.",
              },
            ],
          },
          {
            id: 'script-yours',
            title: 'Script your voice',
            blocks: [
              {
                id: 'script-reflection',
                type: 'reflection',
                prompt: 'Choose a situation where you may need to voice your values to someone with more power than you. Write the actual words you would use: name the concern respectfully, acknowledge their goal, and propose a better way forward.',
                guidance: 'Read it out loud afterwards. If it sounds like an accusation, soften the tone but keep the substance. This becomes the “how I will speak up” section of your Values Charter.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'trust-and-accountability',
      type: 'lesson',
      title: 'Trust, accountability and servant leadership',
      minutes: 17,
      required: true,
      payload: {
        steps: [
          {
            id: 'dishonesty-intro',
            title: 'How honest are we?',
            blocks: [
              {
                id: 'dishonesty-text',
                type: 'text',
                body: "Trust is the invisible infrastructure of every team, business and nation. Where people trust each other, deals are quicker, cooperation is easier and less is spent on checking. Where they do not, everything costs more.\n\nBehavioural economist Dan Ariely has run many experiments on everyday dishonesty. His findings are humbling, and useful for anyone designing a team or an institution.",
              },
              {
                id: 'ariely-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'XBmJay_qdNc',
                title: 'RSA ANIMATE: The Truth About Dishonesty',
                channel: 'Royal Society of Arts',
                durationS: 668,
                caption: 'Dan Ariely on why most people cheat a little rather than a lot. Watch for the conditions that made cheating more likely in his experiments, and the simple reminders that made it less likely.',
              },
            ],
          },
          {
            id: 'trust-terms',
            title: 'The building blocks of trust',
            blocks: [
              {
                id: 'trust-key-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Accountability', definition: 'Being answerable for your decisions to others who can see them and ask questions.' },
                  { term: 'Transparency', definition: 'Making information about money, decisions and performance visible to the people affected.' },
                  { term: 'Conflict of interest', definition: 'A situation where your personal interest could influence a decision you make for others.' },
                  { term: 'Separation of duties', definition: 'Making sure no single person controls a whole process, such as both spending and recording money.' },
                  { term: 'Servant leadership', definition: 'Leading in order to serve the people you lead and the people you exist for, rather than to be served.' },
                ],
              },
            ],
          },
          {
            id: 'uwase',
            title: 'Uwase rebuilds trust',
            blocks: [
              {
                id: 'uwase-example',
                type: 'example',
                title: 'The borehole committee’s books',
                body: "Uwase is secretary of a village borehole committee in Rwanda’s Eastern Province. Households pay a small monthly fee for water and repairs. Last year rumours spread that the treasurer was using the money for himself. Payments dropped. The repair fund ran low.\n\nThe new committee made three changes:\n\n- Every month, income and spending are read aloud at the community meeting and pinned on the noticeboard.\n- Two people must sign for any spending, and neither can be the person who keeps the book.\n- Any committee member with a family link to a supplier must say so and stay out of that decision.\n\nWithin a few months, more households were paying again.",
              },
              {
                id: 'uwase-choice',
                type: 'choice',
                prompt: 'Which change most directly addresses the original rumour about the treasurer?',
                multiple: false,
                options: [
                  { id: 'public', text: 'Reading the accounts aloud and pinning them on the noticeboard every month', correct: true, feedback: 'Yes. Transparency lets every household see where the money goes, so rumours can be checked instead of believed.' },
                  { id: 'conflict', text: 'Declaring family links to suppliers', correct: false, feedback: 'Important, but the rumour was about the treasurer and the money, not suppliers.' },
                  { id: 'new-treasurer', text: 'Simply choosing a more trustworthy treasurer', correct: false, feedback: 'Choosing honest people matters, but systems protect trust even when people change.' },
                  { id: 'fees', text: 'Raising the monthly fee', correct: false, feedback: 'That would make trust worse, not better.' },
                ],
                explanation:
                  "Trust grows when people can check, not only when they are told to believe. Notice too that two signatures and declared conflicts protect honest committee members from suspicion. Good systems serve good people.",
              },
            ],
          },
          {
            id: 'practice-match',
            title: 'How practices build trust',
            blocks: [
              {
                id: 'practice-match-block',
                type: 'match',
                prompt: 'Match each practice to how it builds trust.',
                pairs: [
                  { id: 'transparency', left: 'Publishing the accounts every month', right: 'Lets people check for themselves' },
                  { id: 'separation', left: 'Two signatures for spending', right: 'No single person can misuse funds unnoticed' },
                  { id: 'recusal', left: 'Stepping out of decisions involving relatives', right: 'Removes personal interest from shared decisions' },
                  { id: 'reminder', left: 'Members recite a short pledge before each meeting', right: 'Reminds people of their values at the moment they act' },
                ],
                explanation:
                  "The last one echoes Ariely’s research: in his experiments, reminders of moral standards just before a task reduced cheating. Values work best when they are present at the moment of decision, not just written in a drawer.",
              },
            ],
          },
          {
            id: 'servant',
            title: 'Power and servant leadership',
            blocks: [
              {
                id: 'servant-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Power is lent, not owned',
                body: "As you build, you will gain power: over staff, money, information and decisions. Servant leadership treats that power as something entrusted to you for the good of others.\n\nIn practice that means: being the first to be accountable, not the last. Paying people fairly and on time. Admitting mistakes publicly. Making it safe for people to tell you what you do not want to hear. Using your position to open doors for others, as ubuntu asks.",
              },
              {
                id: 'tutu-quote',
                type: 'quote',
                text: 'My humanity is bound up in yours, for we can only be human together.',
                attribution: 'Archbishop Desmond Tutu',
              },
            ],
          },
          {
            id: 'accountability-reflect',
            title: 'Who will hold you accountable?',
            blocks: [
              {
                id: 'accountability-reflection',
                type: 'reflection',
                prompt: 'Draft your three to five bright lines: specific lines you will not cross. Then name one to three people who could hold you accountable to them, and say what you will ask of them.',
                guidance: 'Write lines so clearly that anyone could tell whether you had crossed them. “I will be honest” is a value. “I will never sign a document I know to be false” is a line.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'integrity-quiz',
      type: 'quiz',
      title: 'Module quiz: Integrity, pressure and trust',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Four questions on incrementalism, rationalisations, speaking up and building trust. You need 75% to pass and you can retake it as many times as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'q-incremental',
            type: 'choice',
            prompt: 'What is incrementalism in ethics?',
            multiple: false,
            options: [
              { id: 'a', text: 'Small ethical lapses that make each next step feel normal, until a person has drifted far from their values', correct: true },
              { id: 'b', text: 'Improving your ethics a little every day', correct: false, feedback: 'A nice idea, but not what the term means here.' },
              { id: 'c', text: 'A large, sudden ethical failure', correct: false, feedback: 'Incrementalism is the opposite: small and gradual.' },
              { id: 'd', text: 'Raising prices slowly so customers do not notice', correct: false, feedback: 'That is a pricing tactic, not the ethical concept.' },
            ],
            explanation: 'Nyambura’s slide began with 3,000 shillings. The first step is the easiest place to hold the line.',
          },
          {
            id: 'q-rationalise',
            type: 'match',
            prompt: 'Match each rationalisation to an example.',
            pairs: [
              { id: 'everybody', left: '“Everybody does it”', right: '“All the firms pay the checkpoint.”' },
              { id: 'deserve', left: '“I deserve it”', right: '“They underpay me, so a few extra receipts is fair.”' },
              { id: 'temporary', left: '“It’s only temporary”', right: '“I’ll put the money back next week.”' },
              { id: 'told', left: '“I was told to”', right: '“My manager said to backdate it.”' },
            ],
            explanation: 'Hear one in your own head? Treat it as a warning light.',
          },
          {
            id: 'q-voice',
            type: 'order',
            prompt: 'Put the moves for voicing your values in order.',
            items: [
              { id: 'value', text: 'Name the value at stake' },
              { id: 'stakes', text: 'Understand the stakes and the other side’s reasons' },
              { id: 'allies', text: 'Find allies' },
              { id: 'script', text: 'Script and rehearse your words' },
              { id: 'speak', text: 'Choose the moment and offer a way forward' },
            ],
            explanation: 'Preparation turns courage into effective action.',
          },
          {
            id: 'q-trust',
            type: 'choice',
            prompt: 'Which practices build trust in a community organisation? Select all that apply.',
            multiple: true,
            options: [
              { id: 'publish', text: 'Publishing the accounts regularly', correct: true },
              { id: 'two', text: 'Requiring two signatures for spending', correct: true },
              { id: 'declare', text: 'Declaring conflicts of interest', correct: true },
              { id: 'secret', text: 'Keeping finances private to avoid arguments', correct: false, feedback: 'Secrecy feeds rumours, even when everyone is honest.' },
            ],
            explanation: 'Transparency, separation of duties and declared conflicts. Systems that let people check.',
          },
        ],
      },
    },
    {
      key: 'values-charter',
      type: 'assignment',
      title: 'Practical Output: your Personal Values Charter',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: your **Personal Values Charter**, a one-page statement of your core values, the lines you will not cross, how you will handle the dilemmas most likely in your path, and who will hold you accountable.\n\nA good charter is specific, honest and usable under pressure. It should sound like you, not like a corporate poster. Someone reading it should be able to tell what you would actually do when Chidi’s, Ama’s or Sipho’s moment arrives in your own life.\n\nYou have drafted most of it in your journal. Now bring it together on one page. Your charter joins your Dream Lab portfolio and forms part of your Life Architecture Blueprint.\n\nA faculty reviewer will grade it against the rubric below.",
        practicalOutput: 'Personal Values Charter',
        steps: [
          'Reread your journal reflections from this course: your tested moment, your values and their roots, the four lenses, your likely dilemma, your warning signs, your script and your bright lines.',
          'Choose three to five core values and define each in your own words.',
          'Write three to five bright lines so specific that anyone could tell whether you had crossed them.',
          'Plan for the two or three dilemmas most likely in your path, including what you would say.',
          'Name the rationalisations and pressures you are most vulnerable to, and the safeguards you will use.',
          'Ask one to three people to be your accountability partners. Tell them what is in your charter and how often you will review it together.',
          'Fill in every section of the template, keep it to one page, then sign and date it.',
          'Submit, and keep a copy somewhere you will see it: your phone, your notebook or your wall.',
        ],
        rubric: [
          { id: 'values', criterion: 'Clear, personal values', description: 'Three to five core values, defined in the author’s own words, with a thoughtful account of where they come from.' },
          { id: 'lines', criterion: 'Specific bright lines', description: 'Three to five lines that are concrete and checkable, clearly connected to the stated values.' },
          { id: 'dilemmas', criterion: 'Realistic dilemmas planned', description: 'Identifies the dilemmas most likely in the author’s path and shows reasoning through more than one ethical lens, with a clear course of action.' },
          { id: 'self-knowledge', criterion: 'Honest self-knowledge', description: 'Names the rationalisations and pressures the author is most vulnerable to, with practical safeguards beyond willpower.' },
          { id: 'voice', criterion: 'Prepared to speak up', description: 'Includes a respectful, practical script for voicing values to someone with more power, with an alternative course proposed.' },
          { id: 'accountability', criterion: 'Real accountability', description: 'Names accountability partners, what they have been asked to do and a realistic review rhythm.' },
        ],
        template: charterTemplate,
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
          "Nine questions across the whole course: values, ubuntu, the four lenses, real dilemmas, rationalisations, speaking up and trust. Most follow a new case.\n\nYou need 75% to pass and you can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-values',
            type: 'choice',
            prompt: 'New case: Kofi is a young pharmacist who has just opened a pharmacy in Tamale. Which of these belong in his Values Charter as bright lines, rather than general values? Select all that apply.',
            multiple: true,
            options: [
              { id: 'expired', text: '“I will never sell a medicine past its expiry date.”', correct: true },
              { id: 'prescription', text: '“I will never sell a prescription-only medicine without a valid prescription.”', correct: true },
              { id: 'care', text: '“I care about my customers’ health.”', correct: false, feedback: 'An important value, but not a line anyone could check.' },
              { id: 'honest', text: '“I believe in honesty.”', correct: false, feedback: 'A value. A line would say exactly what honesty requires in a specific situation.' },
            ],
            explanation: 'Values say what you care about. Bright lines are specific enough that anyone could tell whether you crossed them.',
          },
          {
            id: 'f-case-lens',
            type: 'match',
            prompt: 'A distributor offers Kofi cheap medicines without proper paperwork. Match each of his thoughts to its lens.',
            pairs: [
              { id: 'consequences', left: '“If these are fake, someone could die.”', right: 'Consequences' },
              { id: 'duties', left: '“My licence requires me to buy only from registered suppliers.”', right: 'Duties and rights' },
              { id: 'character', left: '“I didn’t become a pharmacist to gamble with patients.”', right: 'Character' },
              { id: 'community', left: '“My neighbours trust that what I sell is real.”', right: 'Relationships and community' },
            ],
            explanation: 'All four lenses point the same way. When that happens, the decision is clear, even if it costs money.',
          },
          {
            id: 'f-rationalise',
            type: 'choice',
            prompt: 'Kofi’s friend says: “Every pharmacy in town buys from that distributor. You’ll go bankrupt being the only saint.” Which rationalisation is this?',
            multiple: false,
            options: [
              { id: 'a', text: '“Everybody does it”', correct: true },
              { id: 'b', text: '“I was told to”', correct: false, feedback: 'Nobody with authority is instructing him.' },
              { id: 'c', text: '“It’s only temporary”', correct: false, feedback: 'Nothing here suggests a short-term exception.' },
              { id: 'd', text: '“I deserve it”', correct: false, feedback: 'The argument is about what others do, not what Kofi is owed.' },
            ],
            explanation: 'The pressure is real, because competitors may undercut him. But a common practice is not an acceptable one, especially when lives are at stake.',
          },
          {
            id: 'f-incremental',
            type: 'choice',
            prompt: 'Where is the easiest point for Kofi to hold the line?',
            multiple: false,
            options: [
              { id: 'a', text: 'The very first small purchase, before it becomes normal', correct: true },
              { id: 'b', text: 'After a few purchases, once he knows the distributor better', correct: false, feedback: 'Each step makes the next feel more normal. It gets harder, not easier.' },
              { id: 'c', text: 'Only if a customer gets sick', correct: false, feedback: 'By then the harm is done.' },
              { id: 'd', text: 'It makes no difference when', correct: false, feedback: 'Incrementalism shows it makes a great difference.' },
            ],
            explanation: 'A clear line is easy to hold at the first step and very hard to rebuild at the tenth.',
          },
          {
            id: 'f-gift',
            type: 'choice',
            prompt: 'A medical representative offers Kofi an all-expenses-paid weekend in Accra if he stocks more of one company’s brand. What should he do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Decline, and choose which brands to stock based on patients’ needs and price', correct: true },
              { id: 'b', text: 'Accept the trip but promise himself it will not influence him', correct: false, feedback: 'The offer is explicitly tied to his stocking decision. Promises to oneself are weak against that.' },
              { id: 'c', text: 'Accept, since doctors and pharmacists often get such trips', correct: false, feedback: '“Everybody does it” again.' },
              { id: 'd', text: 'Accept and keep it secret', correct: false, feedback: 'If it must be secret, that is your answer.' },
            ],
            explanation: 'Power over a decision, a direct link to that decision, and personal benefit. A clear conflict of interest.',
          },
          {
            id: 'f-voice',
            type: 'choice',
            prompt: 'Kofi’s senior partner wants to sell a popular painkiller without prescriptions “just for regular customers”. Which response best voices Kofi’s values?',
            multiple: false,
            options: [
              { id: 'a', text: 'Privately: “I know we want to keep regular customers happy. I’m worried this could harm someone and cost us our licence. Could we offer a quick consultation and refer them to a clinic for a prescription instead?”', correct: true },
              { id: 'b', text: 'Agree, since the partner is senior', correct: false, feedback: '“I was told to” does not remove Kofi’s responsibility.' },
              { id: 'c', text: 'Report the partner to the regulator without saying anything first', correct: false, feedback: 'Sometimes escalation is necessary, but a private, respectful conversation usually comes first.' },
              { id: 'd', text: 'Argue loudly with the partner in front of customers', correct: false, feedback: 'Right concern, wrong moment and channel.' },
            ],
            explanation: 'Name the concern, honour the other person’s goal, choose a private moment and propose a way forward.',
          },
          {
            id: 'f-trust',
            type: 'choice',
            prompt: 'Kofi hires two staff. Which practices will help build trust and protect everyone? Select all that apply.',
            multiple: true,
            options: [
              { id: 'two', text: 'One person takes cash and another checks the daily total', correct: true },
              { id: 'stock', text: 'Regular stock counts with results shared with staff', correct: true },
              { id: 'pledge', text: 'A short team commitment to the pharmacy’s values, reviewed each month', correct: true },
              { id: 'trust', text: 'No checks at all, to show he trusts them', correct: false, feedback: 'Good systems protect honest people from suspicion. Trust grows when people can check.' },
            ],
            explanation: 'Separation of duties, transparency and regular reminders of shared values.',
          },
          {
            id: 'f-ubuntu',
            type: 'choice',
            prompt: 'Kofi’s pharmacy becomes successful. Which choice best reflects ubuntu?',
            multiple: false,
            options: [
              { id: 'a', text: 'Paying his staff fairly and on time, and training a young assistant to become a pharmacist', correct: true },
              { id: 'b', text: 'Keeping all profits, since he took all the risk', correct: false, feedback: 'Ubuntu does not forbid profit, but it asks who shares in the success you built with others.' },
              { id: 'c', text: 'Giving large gifts to local officials to stay on good terms', correct: false, feedback: 'That buys influence, which is not what ubuntu asks.' },
              { id: 'd', text: 'Opening a branch next to a competitor to force them to close', correct: false, feedback: 'Competition is fine, but this is not about community.' },
            ],
            explanation: '“A person is a person through other people.” Success that lifts others is success that lasts.',
          },
          {
            id: 'f-charter',
            type: 'order',
            prompt: 'Put the steps for writing a Values Charter in order.',
            items: [
              { id: 'values', text: 'Name your core values and their roots' },
              { id: 'lines', text: 'Turn them into specific bright lines' },
              { id: 'dilemmas', text: 'Plan for the dilemmas most likely in your path' },
              { id: 'warnings', text: 'Name your warning signs and safeguards' },
              { id: 'accountability', text: 'Choose accountability partners and a review rhythm' },
            ],
            explanation: 'From what you believe, to what you will and will not do, to who will help you keep it.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const characterAndEthics: CourseAuthoring = {
  slug: 'character-and-ethics',
  title: 'Character Formation and Ethics',
  subtitle: 'Decide who you will be before the hard choices arrive, and build the integrity people can rely on.',
  description:
    "Every builder is tested. A bribe that would speed up a permit. A partner who cuts corners. A chance to take credit for someone else’s work. A shortcut nobody would ever notice. What you do in those moments depends on decisions you made long before.\n\nIn this course you will examine your own values and where they come from, including the wisdom of your family, faith and culture. You will learn practical frameworks for ethical decisions, work through realistic dilemmas from African business, public service and community life, and study how integrity, accountability and trust are built and lost. We take seriously ideas such as *ubuntu*, the conviction that a person is a person through other people, and ask what they demand of a builder today.\n\nThis is not a course about rules. It is about character: the steady, chosen pattern of how you treat people and handle power.\n\nYour Practical Output is a **Personal Values Charter**: a one-page statement of your core values, the lines you will not cross, how you will handle the dilemmas most likely in your path, and who will hold you accountable.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 5,
  outcomes: [
    'Articulate your core values and trace where they come from.',
    'Apply practical ethical frameworks to real dilemmas in business, community and public life.',
    'Recognise the pressures and rationalisations that lead good people into bad choices.',
    'Explain how integrity, accountability and trust are built in teams and institutions.',
    'Commit to a personal values charter with clear lines and accountability partners.',
  ],
  skills: ['Ethical reasoning', 'Integrity', 'Values clarity', 'Accountability', 'Moral courage', 'Servant leadership'],
  audience: 'Young leaders and founders who want their success to rest on character they are proud of, and who expect to face real ethical pressure in their careers.',
  prerequisites: 'None.',
  practicalOutput: 'Personal Values Charter',
  cover: {
    from: '#3A2A0E',
    to: '#D8A84E',
    symbol: '▲',
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Umuganda.jpg/1280px-Umuganda.jpg",
    imageAlt: "A group of people work a field together with hoes during a community work day, with buildings and trees behind them.",
    imageCredit: "Photo: Masako Kato / Wikimedia Commons, CC BY-SA 4.0",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'OI-G23HF6Sw',
    title: "Ethical dilemma: Would you lie? - Sarah Stroud",
    channel: "TED-Ed",
    durationS: 260,
  },
  instructors: [
    {
      name: 'The African Dream Lab Faculty',
      title: 'Life Architecture faculty',
      bio: 'The Life Architecture faculty of The African Dream Lab brings together educators, ethicists, founders, public servants and community leaders from across the continent. They teach the habits of mind every builder needs, including how to lead with integrity under pressure. The Lab is run by the African Dream Network and grew out of the TADIS conference.',
    },
  ],
  modules: [moduleValues, moduleDecisions, moduleIntegrity],
};

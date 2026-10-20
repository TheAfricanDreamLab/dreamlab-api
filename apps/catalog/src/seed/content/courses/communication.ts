import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Communication: the first Builder’s Architecture course of The African Dream Lab (week 5, 4 credits).
 *
 * Spine: Point → Audience → Story → Writing → Delivery → Listening → Feedback.
 * Recurring cast, all fictional:
 *   Fatou   founder of a small fashion label in Dakar, pitching to a boutique chain
 *   Tunde   product manager at a Lagos fintech, briefing his CEO and his team
 *   Kwame   a university student in Kumasi, presenting to a school’s parent–teacher association
 *   Wanjiru operations lead at a Nairobi matatu SACCO, writing to the county transport office
 *   Amina   a tomato trader in Kano, speaking at her market association
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · The message
// ---------------------------------------------------------------------------

const moduleMessage: Module = {
  key: 'the-message',
  title: 'The message: point first, audience always',
  summary:
    'Learn to find the one idea you want people to leave with, put it first, and shape the same message for elders, peers, funders and officials. Everything else in the course builds on these two habits.',
  weekNo: 5,
  items: [
    {
      key: 'point-first',
      type: 'lesson',
      title: 'Lead with the point',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Communication',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to Builder’s Architecture. For the next four weeks you will build the skills to work with and through other people, and it starts with communication.\n\nGreat ideas die every day because nobody could explain them. A founder rambles for five minutes before saying what she needs. A team leader sends a long message and nobody knows what to do. A community meeting ends with everyone nodding and nothing changing.\n\nThis week you will learn to speak, write and present so that people understand, remember and act. By the end you will record your **Signature Talk**: a five-minute talk about your dream or problem, improved through two rounds of feedback.\n\nStart with the talk below. Listen for one secret ingredient.",
              },
              {
                id: 'welcome-video',
                type: 'video',
                provider: 'youtube',
                videoId: '-FOCpMAww28',
                title: "TED's secret to great public speaking | Chris Anderson | TED",
                channel: 'TED',
                durationS: 477,
                caption: "TED’s curator Chris Anderson on the one thing great talks have in common, and four ways to make it work for you. As you watch, ask: what is the one idea I would want people to carry away from my talk?",
              },
            ],
          },
          {
            id: 'starting',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'starting-scale',
                type: 'scale',
                prompt: 'When you have to explain an important idea, how often do people get your point the first time?',
                minLabel: 'Rarely',
                maxLabel: 'Almost always',
                afterword:
                  "Wherever you are, this is learnable. Clear communicators are not born fluent. They follow a few simple habits, and they practise. You will rate yourself again at the end of the week.",
              },
            ],
          },
          {
            id: 'point-first-text',
            title: 'Say the point first',
            blocks: [
              {
                id: 'bluf-text',
                type: 'text',
                body: "Most of us were taught to build up to our point: background, then details, then, finally, the conclusion. That works in a novel. It fails almost everywhere else. Busy people stop listening before you arrive.\n\nThe fix is simple: **put the point first**. Armies call it *bottom line up front*. Journalists call it the lead. Whatever the name, the rule is the same: within the first thirty seconds, your listener should know what you want them to know, or do.",
              },
              {
                id: 'prep-framework',
                type: 'framework',
                title: 'PREP: a simple shape for almost any message',
                steps: [
                  { label: 'Point', detail: 'Your main idea or request, in one sentence.' },
                  { label: 'Reason', detail: 'Why it matters, or why it is true.' },
                  { label: 'Example', detail: 'A story, a fact or a picture that makes the reason real.' },
                  { label: 'Point', detail: 'Say it again, now with the weight of the example behind it, and say what happens next.' },
                ],
              },
            ],
          },
          {
            id: 'tunde-update',
            title: 'Tunde’s update',
            blocks: [
              {
                id: 'tunde-choice',
                type: 'choice',
                prompt: 'Tunde (fictional) is a product manager at a Lagos fintech. He has two minutes with his CEO in the corridor. Which opening is strongest?',
                multiple: false,
                options: [
                  { id: 'history', text: '“So, as you know, we launched the savings app in March, and then in April we did the first survey, and…”', correct: false, feedback: 'This is history. The CEO will be wondering where it is going, and may leave before Tunde gets there.' },
                  { id: 'point', text: '“I need your approval to pilot cash collection at stalls in two markets next month. Here is why.”', correct: true, feedback: 'Yes. The CEO knows within seconds what is being asked and can listen to the reasons with that in mind.' },
                  { id: 'data', text: '“We have some really interesting data from the markets.”', correct: false, feedback: 'Interesting to whom, and so what? This is a teaser, not a point.' },
                  { id: 'apology', text: '“Sorry to bother you, I know you’re busy, this will only take a minute…”', correct: false, feedback: 'Polite, but it spends the first seconds lowering the value of what follows.' },
                ],
                explanation:
                  "Point first does not mean rude or abrupt. You can still greet people warmly. It means that once the conversation starts, your listener never has to guess what you want from them.",
              },
            ],
          },
          {
            id: 'build-prep',
            title: 'Build a message',
            blocks: [
              {
                id: 'prep-order',
                type: 'order',
                prompt: 'Amina (fictional) is speaking for one minute at her market association. Put her message in PREP order.',
                items: [
                  { id: 'point', text: '“I propose that we share the cost of shallow crates across all tomato traders in our line.”' },
                  { id: 'reason', text: '“Deep baskets crush the bottom layer, and in the hot season we all lose stock.”' },
                  { id: 'example', text: '“When I switched to crates for three weeks, my losses fell by more than half.”' },
                  { id: 'close', text: '“So let’s agree a shared crate fund today, and I will bring prices on Friday.”' },
                ],
                explanation:
                  "Notice the last line: it repeats the point **and** says what happens next. A message that ends without a next step usually ends with nothing happening.",
              },
            ],
          },
          {
            id: 'so-what',
            title: 'The “so what?” test',
            blocks: [
              {
                id: 'so-what-reveal',
                type: 'reveal',
                prompt: 'Kwame’s first draft of his talk to the parent–teacher association begins: “Today I want to talk about attendance.” What is wrong with it?',
                body: "It names a **topic**, not a **point**. A topic tells people what you will talk about. A point tells them what you think, and why they should care.\n\nTry the “so what?” test. “I want to talk about attendance.” *So what?* “A third of JHS 2 miss Thursdays.” *So what?* “They are falling behind in maths a year before the BECE, and a market-day crèche could bring them back.”\n\nThat last sentence is a point. Keep asking “so what?” until you reach it.",
              },
              {
                id: 'throughline-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Your throughline',
                body: "Chris Anderson calls the single connecting idea of a talk its **throughline**. Test yours: can you say it in fifteen words or fewer, to a friend, and have them repeat it back? If not, you do not have one yet.",
              },
            ],
          },
          {
            id: 'your-point',
            title: 'Your Signature Talk point',
            blocks: [
              {
                id: 'point-reflection',
                type: 'reflection',
                prompt: 'Your Signature Talk is about your dream or the problem you have worked on in Life Architecture. Write its throughline in fifteen words or fewer. Then write one reason and one example in PREP shape.',
                guidance: 'Use the “so what?” test until you have a point, not a topic. You will refine this all week.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'know-your-audience',
      type: 'lesson',
      title: 'One message, many audiences',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'audience-intro',
            title: 'Communication happens in the listener',
            blocks: [
              {
                id: 'audience-text',
                type: 'text',
                body: "A message is not what you say. It is what the other person understands. The same words can land as respectful with one audience and arrogant with another, as exciting to peers and alarming to elders.\n\nGood communicators keep their point the same and change how they carry it: the words, the length, the examples, the order, even the language. Start with a quick checklist that works for any message.",
              },
              {
                id: 'audience-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'sYBw9-8eCuM',
                title: 'The 7 Cs of Communication',
                channel: 'Mindtools Kineo',
                durationS: 166,
                caption: "A short guide to the 7 Cs from Mindtools. Write the seven words down. You will use them as a checklist for your writing and your talk.",
              },
            ],
          },
          {
            id: 'seven-cs',
            title: 'The 7 Cs',
            blocks: [
              {
                id: 'cs-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Clear', definition: 'One purpose, easy to understand. The listener knows what you want.' },
                  { term: 'Concise', definition: 'No more words than needed. Cut the filler and the repetition.' },
                  { term: 'Concrete', definition: 'Specific facts, numbers and pictures, not vague claims.' },
                  { term: 'Correct', definition: 'Accurate facts and names, and language that fits the audience.' },
                  { term: 'Coherent', definition: 'Each point follows logically from the last.' },
                  { term: 'Complete', definition: 'Everything the listener needs to act, including the next step.' },
                  { term: 'Courteous', definition: 'Respectful, honest and considerate of the listener’s position.' },
                ],
              },
            ],
          },
          {
            id: 'four-audiences',
            title: 'Four audiences, one point',
            blocks: [
              {
                id: 'meeting-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/A_village_community_development_meeting_in_northern_Ghana.jpg/1280px-A_village_community_development_meeting_in_northern_Ghana.jpg',
                alt: 'A group of adults sits in a circle on benches and plastic chairs under a large shade tree while one person stands and speaks, with a motorbike in the foreground and buildings in the distance.',
                caption: 'A village community development meeting in northern Ghana. Who is in the circle shapes how a message should be carried.',
                credit: 'Photo: Qulat96 / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'audience-match',
                type: 'match',
                prompt: 'Kwame wants support for a market-day crèche so older pupils can attend school on Thursdays. Match each audience to the approach most likely to work.',
                pairs: [
                  { id: 'elders', left: 'The chief and elders', right: 'Greet properly, ask for their counsel first, and connect the idea to the community’s future' },
                  { id: 'mothers', left: 'Mothers who trade at the market', right: 'Speak in Twi at closing time, start from their Thursdays, and ask what would make them trust a crèche' },
                  { id: 'funder', left: 'A small education funder', right: 'One page: the problem in numbers, the pilot, the cost and how success will be measured' },
                  { id: 'classmates', left: 'Fellow student volunteers', right: 'A quick story from the school gate, then a clear ask for two hours each Thursday' },
                ],
                explanation:
                  "The point never changes: older pupils miss school to mind siblings, and a crèche could fix it. What changes is the entry point, the language, the length and the ask. Respect for the listener comes first every time.",
              },
            ],
          },
          {
            id: 'respect',
            title: 'Respect, language and status',
            blocks: [
              {
                id: 'respect-context',
                type: 'callout',
                tone: 'context',
                title: 'Speaking across age and status',
                body: "In many African settings, how you begin matters as much as what you say. Greetings, titles and the order in which people speak carry meaning. Starting a meeting with elders by announcing your plan can sound like you have already decided without them.\n\nLanguage matters too. A message in Hausa, Twi, Kiswahili, Wolof or Yoruba can reach people that English cannot, and choosing someone’s language is itself a sign of respect. If you do not speak it well, bring someone who does, and agree the key words together first.",
              },
              {
                id: 'elders-scenario',
                type: 'scenario',
                situation:
                  "Kwame has five minutes at a meeting with the chief and elders of the community near the school. He has a strong slide deck on his phone with charts of Thursday attendance.",
                prompt: 'How should he open?',
                options: [
                  {
                    id: 'charts',
                    text: 'Start straight with the charts: “The data shows a serious problem on Thursdays.”',
                    outcome: "The elders look at each other. One says quietly that the young man has come to tell them their children are failing. The rest of the five minutes is spent defending the community.",
                    best: false,
                  },
                  {
                    id: 'counsel',
                    text: 'Greet the chief and elders properly, thank them, say briefly what he has noticed, and ask for their counsel on how Thursdays could work better for families.',
                    outcome: "An elder explains that market day has always been this way, and another mentions a woman who used to mind children for traders years ago. By asking first, Kwame has turned them from an audience into partners. He shares his numbers when they ask how big the problem is.",
                    best: true,
                  },
                  {
                    id: 'english',
                    text: 'Speak quickly in formal English to show he is well educated.',
                    outcome: "Several elders follow only part of what he says. They are polite, but nobody commits to anything. Impressing an audience is not the same as reaching it.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'hardest',
            title: 'Your hardest audience',
            blocks: [
              {
                id: 'audience-poll',
                type: 'poll',
                prompt: 'Which audience do you find hardest to communicate with?',
                options: [
                  { id: 'elders', text: 'Elders and senior leaders' },
                  { id: 'officials', text: 'Government officials' },
                  { id: 'funders', text: 'Investors and funders' },
                  { id: 'peers', text: 'My own peers' },
                  { id: 'customers', text: 'Customers or the public' },
                  { id: 'family', text: 'My own family' },
                ],
                afterword:
                  "Whichever you chose, the approach is the same: find out what they care about, what they already believe, and what they need from you to say yes. Then carry your point to them in their terms.",
              },
              {
                id: 'adichie-quote',
                type: 'quote',
                text: 'The single story creates stereotypes, and the problem with stereotypes is not that they are untrue, but that they are incomplete.',
                attribution: 'Chimamanda Ngozi Adichie, “The danger of a single story”, TED (2009)',
              },
              {
                id: 'audience-reflection',
                type: 'reflection',
                prompt: 'Who are the two most important audiences for your dream or problem? For each, write what they care about most, what they might already believe about people like you or ideas like yours, and how you would open your message to them.',
                guidance: 'Avoid a single story about your audience. If you are not sure what they care about, write down how you will find out.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'message-quiz',
      type: 'quiz',
      title: 'Module quiz: The message',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on leading with the point and adapting to your audience. You need 70% to pass and can retake it as many times as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-point-first',
            type: 'choice',
            prompt: 'Wanjiru has thirty seconds to raise an issue with her SACCO chairman. Which opening follows “point first”?',
            multiple: false,
            options: [
              { id: 'a', text: '“There have been some developments on route 46 lately.”', correct: false, feedback: 'A topic, not a point. The chairman still does not know what she wants.' },
              { id: 'b', text: '“I’d like your approval to test an evening bonus on route 46 for one month.”', correct: true },
              { id: 'c', text: '“Let me start from January, when the complaints began.”', correct: false, feedback: 'History first. He may stop listening before the request.' },
              { id: 'd', text: '“I know you won’t like this, but…”', correct: false, feedback: 'This sets up resistance before the point arrives.' },
            ],
            explanation: 'Point first: the listener knows within seconds what you want them to know or do.',
          },
          {
            id: 'q-prep',
            type: 'order',
            prompt: 'Put the parts of PREP in order.',
            items: [
              { id: 'point', text: 'Point' },
              { id: 'reason', text: 'Reason' },
              { id: 'example', text: 'Example' },
              { id: 'point-again', text: 'Point again, with the next step' },
            ],
            explanation: 'Point, Reason, Example, Point. The final point lands harder because the example has made it real.',
          },
          {
            id: 'q-topic',
            type: 'choice',
            prompt: 'Which of these is a point rather than a topic?',
            multiple: false,
            options: [
              { id: 'a', text: '“Youth unemployment in Kano”', correct: false, feedback: 'A topic. What do you think about it?' },
              { id: 'b', text: '“Our savings app”', correct: false, feedback: 'A topic. What should the listener know or do?' },
              { id: 'c', text: '“Market traders will save more if we collect cash at their stalls, as their informal collectors already do.”', correct: true },
              { id: 'd', text: '“Some thoughts on communication”', correct: false, feedback: 'A topic, and a vague one.' },
            ],
            explanation: 'A point makes a claim the listener could agree or disagree with. A topic only names an area.',
          },
          {
            id: 'q-seven-cs',
            type: 'match',
            prompt: 'Match each fix to the C it improves.',
            pairs: [
              { id: 'concise', left: 'Cutting a 400-word email to 120 words', right: 'Concise' },
              { id: 'concrete', left: 'Replacing “many customers” with “23 of our 40 regular customers”', right: 'Concrete' },
              { id: 'complete', left: 'Adding “Please reply by Thursday so we can book the hall”', right: 'Complete' },
              { id: 'courteous', left: 'Thanking the official for her time before making the request', right: 'Courteous' },
            ],
            explanation: 'The 7 Cs work as a quick checklist before you send or speak.',
          },
          {
            id: 'q-audience',
            type: 'choice',
            prompt: 'When adapting a message for different audiences, what should stay the same? Select all that apply.',
            multiple: true,
            options: [
              { id: 'point', text: 'Your core point', correct: true },
              { id: 'facts', text: 'The facts', correct: true },
              { id: 'language', text: 'The language you speak in', correct: false, feedback: 'Choosing the audience’s language is often the most respectful adaptation of all.' },
              { id: 'length', text: 'The length', correct: false, feedback: 'A funder may want one page; a community meeting may want a story and a conversation.' },
            ],
            explanation: 'Keep the point and the facts. Change the entry point, examples, length, language and ask to fit the listener.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Story and writing
// ---------------------------------------------------------------------------

const moduleStory: Module = {
  key: 'story-and-writing',
  title: 'Story, evidence and clear writing',
  summary:
    'Learn to build a story that makes people care, pair it with evidence and a clear ask, and write emails, proposals and posts that busy readers can act on.',
  weekNo: 5,
  items: [
    {
      key: 'story',
      type: 'lesson',
      title: 'Stories that make people care',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'story-intro',
            title: 'Why stories work',
            blocks: [
              {
                id: 'story-text',
                type: 'text',
                body: "Facts tell people what is true. Stories make them care. A good story puts your listener inside someone’s experience, so the problem stops being abstract.\n\nYou do not need to be a born storyteller. Most strong stories follow a simple shape, and once you see it you can use it in a pitch, a meeting or a two-minute introduction. Pixar’s storytellers teach one version of it.",
              },
              {
                id: 'story-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'bKrCKg9ggVI',
                title: 'Pixar in a Box:  Story Structure',
                channel: 'Khan Academy Labs',
                durationS: 237,
                caption: "A lesson from Pixar in a Box, made by Pixar and Khan Academy. Watch for the simple structure that holds a story together, then think about how your own dream could fit it.",
              },
            ],
          },
          {
            id: 'spine',
            title: 'The story spine',
            blocks: [
              {
                id: 'spine-framework',
                type: 'framework',
                title: 'The story spine',
                steps: [
                  { label: 'Once upon a time…', detail: 'Who is this about, and where? One real person beats a crowd.' },
                  { label: 'Every day…', detail: 'What normal life looks like for them.' },
                  { label: 'Until one day…', detail: 'Something changes or goes wrong.' },
                  { label: 'Because of that…', detail: 'What happened next. Repeat as needed, building the stakes.' },
                  { label: 'Until finally…', detail: 'The turning point or resolution, or the choice still to be made.' },
                  { label: 'And ever since then…', detail: 'What is different now, or what could be different, which leads to your ask.' },
                ],
              },
              {
                id: 'spine-order',
                type: 'order',
                prompt: 'Fatou (fictional) runs a small fashion label in Dakar. Put her story in story-spine order.',
                items: [
                  { id: 'once', text: 'Fatou started making clothes for friends in Dakar from fabric she bought at the market.' },
                  { id: 'every', text: 'Every week, she sold a few pieces through Instagram and WhatsApp.' },
                  { id: 'one-day', text: 'One day, a customer abroad returned three dresses because the sizes did not fit.' },
                  { id: 'because', text: 'Because of that, she measured twenty regular customers and built her own size chart.' },
                  { id: 'finally', text: 'Finally, returns fell to almost none, and her customers started recommending her for the fit.' },
                  { id: 'since', text: 'Ever since then, she has wanted to bring her fit to a boutique chain, and she needs a partner to do it.' },
                ],
                explanation:
                  "Notice how the last line turns the story into an **ask**. A story without an ask is entertainment. In a pitch, the story earns attention, and the ask tells people what to do with it.",
              },
            ],
          },
          {
            id: 'story-evidence',
            title: 'Story plus evidence',
            blocks: [
              {
                id: 'evidence-example',
                type: 'example',
                title: 'Fatou’s pitch, two ways',
                body: "**Story only:** “A customer cried when the dress finally fitted. That is why I do this.” Moving, but the buyer wonders: is this one happy customer, or a business?\n\n**Evidence only:** “Return rate down from 30% to 4% over six months on 412 orders.” Impressive, but forgettable.\n\n**Story plus evidence:** “A customer in Paris returned three dresses because nothing fitted. So I measured my regular customers and built my own size chart. Since then, returns have fallen from about three in ten orders to fewer than one in twenty, across more than 400 orders. I would like to bring that fit to your shops.”\n\n(Fatou and her figures are fictional.)",
              },
              {
                id: 'persuade-choice',
                type: 'choice',
                prompt: 'What makes the third version persuasive? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'person', text: 'It starts with one specific customer', correct: true, feedback: 'Yes. One person is easier to picture and care about than a percentage.' },
                  { id: 'numbers', text: 'It backs the story with numbers', correct: true, feedback: 'Yes. Evidence shows the story is not a one-off.' },
                  { id: 'ask', text: 'It ends with a clear ask', correct: true, feedback: 'Yes. The listener knows exactly what Fatou wants.' },
                  { id: 'long', text: 'It is long and detailed', correct: false, feedback: 'It is actually short. Persuasion comes from the right details, not more of them.' },
                ],
                explanation:
                  "Story, evidence, ask: the heart gets interested, the head gets reassured, and the hands know what to do.",
              },
            ],
          },
          {
            id: 'honest-story',
            title: 'Honest stories',
            blocks: [
              {
                id: 'honest-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Don’t borrow pain',
                body: "Stories about real people carry responsibility. Ask permission before you tell someone’s story, especially if it involves hardship, health or children. Never exaggerate suffering to move an audience, and avoid stories that show the people you serve only as helpless. Show their agency too. Audiences, and the people in your stories, can tell the difference.",
              },
              {
                id: 'honest-reveal',
                type: 'reveal',
                prompt: 'Your story features a real trader who struggled. You have not asked her permission, but you have changed her name. Is that enough?',
                body: "Not always. In a small community, people may still recognise her from the details. The safest path is to ask: “May I tell your story in my talk? Is there anything you would rather I left out?”\n\nIf you cannot ask, use a composite and say so: “This is based on several traders I spoke to.” That keeps the story honest and protects the people in it.",
              },
            ],
          },
          {
            id: 'your-story',
            title: 'Draft your story',
            blocks: [
              {
                id: 'story-reflection',
                type: 'reflection',
                prompt: 'Write the story at the heart of your Signature Talk using the story spine. Then add one piece of evidence and end with the ask you will make of your audience.',
                guidance: 'Keep it under one minute when spoken: around 150 words. Start with one person, not a statistic.',
                minWords: 80,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'clear-writing',
      type: 'lesson',
      title: 'Writing that busy people read',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'writing-intro',
            title: 'Clear thinking, clear writing',
            blocks: [
              {
                id: 'writing-text',
                type: 'text',
                body: "Most of what builders communicate is written: emails, WhatsApp messages, proposals, posts, letters to officials. Your reader cannot interrupt to ask what you mean. They can only give up.\n\nUnclear writing is usually a symptom of unclear thinking. Changing a word here and there will not save a message whose point is fuzzy. Start with the three strategies below.",
              },
              {
                id: 'writing-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'prUqCd2R3Zw',
                title: '3 Ways To Make Your Writing Clearer',
                channel: 'Harvard Business Review',
                durationS: 186,
                caption: "Three strategies from Harvard Business Review: cut the throat-clearing opening, write topic sentences that make a claim, and make sure people are doing things in your sentences. Try spotting all three in the example later in this lesson.",
              },
            ],
          },
          {
            id: 'before-after',
            title: 'Wanjiru’s letter',
            blocks: [
              {
                id: 'letter-example',
                type: 'example',
                title: 'A letter to the county transport office, before and after',
                body: "**Before:** “Since time immemorial, public transport has been the backbone of our nation’s economy. It has come to the attention of our SACCO that certain challenges have been experienced at the Westlands stage in the evenings, which has been negatively impacting the commuting public. It would be appreciated if consideration could be given to the matter at the earliest convenience.”\n\n**After:** “We request a meeting with your office this month to discuss evening congestion at Westlands stage. Since January, our passengers have waited over 40 minutes most weekday evenings because matatus cannot enter the stage while it is blocked by parked private cars. We propose a trial of no parking from 5 to 8 p.m. and will share our trip records with you.”\n\n(Wanjiru’s SACCO and figures are fictional.)",
              },
              {
                id: 'fix-match',
                type: 'match',
                prompt: 'Match each change Wanjiru made to the problem it fixed.',
                pairs: [
                  { id: 'opening', left: 'Deleted “Since time immemorial…”', right: 'A throat-clearing opening that delays the point' },
                  { id: 'request', left: 'Started with “We request a meeting this month…”', right: 'The request was buried at the end' },
                  { id: 'actors', left: 'Wrote “matatus cannot enter because private cars park there”', right: 'Vague passive sentences where nobody does anything' },
                  { id: 'specific', left: 'Added “over 40 minutes most weekday evenings since January”', right: 'Vague claims with no evidence' },
                ],
                explanation:
                  "The “after” version is shorter, but more importantly, an official can act on it. It says who, what, since when, what is proposed and what the SACCO will bring.",
              },
            ],
          },
          {
            id: 'email',
            title: 'Emails with military precision',
            blocks: [
              {
                id: 'email-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'LBNF6l2n3YM',
                title: 'How to Write Email with Military Precision',
                channel: 'Harvard Business Review',
                durationS: 242,
                caption: "Three tips borrowed from military writing: subject lines with keywords, the bottom line up front, and economy. Notice how close the second tip is to “point first”.",
              },
              {
                id: 'subject-choice',
                type: 'choice',
                prompt: 'Tunde needs his team to review a pilot plan before Friday. Which subject line is best?',
                multiple: false,
                options: [
                  { id: 'update', text: '“Update”', correct: false, feedback: 'Says nothing. It will sink in a busy inbox.' },
                  { id: 'hi', text: '“Hi team, quick question when you get a moment”', correct: false, feedback: 'Friendly, but there is no subject and no deadline.' },
                  { id: 'action', text: '“ACTION by Fri: review stall-collection pilot plan (2 pages)”', correct: true, feedback: 'Yes. The reader knows what to do, by when and how long it will take before opening it.' },
                  { id: 'urgent', text: '“URGENT!!! PLEASE READ”', correct: false, feedback: 'Alarm without information. If everything is urgent, nothing is.' },
                ],
                explanation:
                  "A good subject line works like a mini message: what kind of email it is (action, information, decision), the topic and any deadline. Many readers decide from the subject line alone whether to open now or later.",
              },
            ],
          },
          {
            id: 'shorter',
            title: 'Shorter takes longer',
            blocks: [
              {
                id: 'pascal-quote',
                type: 'quote',
                text: 'I have made this letter longer than usual, only because I have not had the time to make it shorter.',
                attribution: 'Blaise Pascal, Provincial Letters (1657)',
              },
              {
                id: 'writing-tip',
                type: 'callout',
                tone: 'tip',
                title: 'A three-step edit for anything you write',
                body: "1. **Point:** can you underline the one sentence that says what you want? Move it to the top.\n2. **Cut:** delete every sentence the reader would not miss. Then delete every word.\n3. **Act:** make sure the last line says what happens next, who does it and by when.\n\nOn WhatsApp, the same rules apply. One message with the point beats six messages that build up to it.",
              },
              {
                id: 'writing-scale',
                type: 'scale',
                prompt: 'Look at the last important email or message you sent. How clear was the point?',
                minLabel: 'Buried or missing',
                maxLabel: 'First line, crystal clear',
                afterword:
                  "Most people discover their point arrived late, or never. That is normal, and easy to fix with the three-step edit.",
              },
            ],
          },
          {
            id: 'your-writing',
            title: 'Rewrite a real message',
            blocks: [
              {
                id: 'writing-reflection',
                type: 'reflection',
                prompt: 'Draft the one-page written summary that will go with your Signature Talk. Start with your point in one sentence. Add the problem, your evidence and your ask, and end with the next step you want the reader to take.',
                guidance: 'Use the three-step edit: point first, cut, then act. Aim for 120 to 200 words in this draft.',
                minWords: 80,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'story-feedback-discussion',
      type: 'discussion',
      title: 'Feedback round one: share your story',
      minutes: 12,
      required: true,
      payload: {
        prompt:
          "This is the first of two feedback rounds for your Signature Talk.\n\nPost the story at the heart of your talk (around 150 words), using the story spine, with your evidence and your ask. Add your throughline in fifteen words or fewer.\n\nThen give feedback to at least two classmates. For each, answer three questions:\n\n1. In one sentence, what do you think their point is? (If you cannot say, tell them.)\n2. Which moment in the story made you care most?\n3. What one change would make the ask clearer or stronger?",
        guidance: 'Be specific and kind. “Good story!” helps nobody. “I lost the thread at the second ‘because of that’” helps a lot. You will use what you receive in your second draft.',
        minWords: 100,
      },
    },
    {
      key: 'story-quiz',
      type: 'quiz',
      title: 'Module quiz: Story, evidence and clear writing',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on stories, evidence and clear writing. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-spine',
            type: 'order',
            prompt: 'Put the story spine in order.',
            items: [
              { id: 'once', text: 'Once upon a time…' },
              { id: 'every', text: 'Every day…' },
              { id: 'one-day', text: 'Until one day…' },
              { id: 'because', text: 'Because of that…' },
              { id: 'finally', text: 'Until finally…' },
            ],
            explanation: 'Who and where, normal life, the change, the consequences, the turning point. Then, in a pitch, the ask.',
          },
          {
            id: 'q-story-evidence',
            type: 'choice',
            prompt: 'Why combine a story with evidence?',
            multiple: false,
            options: [
              { id: 'a', text: 'The story makes people care; the evidence shows it is not a one-off', correct: true },
              { id: 'b', text: 'Stories are unreliable, so they must be hidden behind numbers', correct: false, feedback: 'Stories are not unreliable. They do a different job from numbers.' },
              { id: 'c', text: 'Evidence makes a talk longer, which shows effort', correct: false, feedback: 'Length is not persuasion.' },
              { id: 'd', text: 'Funders are not interested in people', correct: false, feedback: 'Funders are people too. Most respond to both.' },
            ],
            explanation: 'Heart, then head, then hands: a story, evidence that it is real and widespread, and a clear ask.',
          },
          {
            id: 'q-permission',
            type: 'choice',
            prompt: 'You want to tell a real customer’s story in a public talk. What should you do? Select all that apply.',
            multiple: true,
            options: [
              { id: 'ask', text: 'Ask their permission, and whether there is anything they would rather you left out', correct: true },
              { id: 'composite', text: 'If you cannot ask, use a composite story and say so', correct: true },
              { id: 'exaggerate', text: 'Exaggerate the hardship a little so it is more moving', correct: false, feedback: 'Exaggeration breaks trust and disrespects the person.' },
              { id: 'agency', text: 'Show what the person did, not only what happened to them', correct: true },
            ],
            explanation: 'Honest stories protect the people in them and keep your audience’s trust.',
          },
          {
            id: 'q-subject',
            type: 'choice',
            prompt: 'Which email subject line is clearest?',
            multiple: false,
            options: [
              { id: 'a', text: '“Following up”', correct: false, feedback: 'On what? And what should the reader do?' },
              { id: 'b', text: '“DECISION by Wed: choose venue for 12 June community meeting”', correct: true },
              { id: 'c', text: '“Important”', correct: false, feedback: 'Says nothing about what is important or why.' },
              { id: 'd', text: '“Quick question”', correct: false, feedback: 'Vague, and often not quick.' },
            ],
            explanation: 'Type of email, topic and deadline, all before the reader opens it.',
          },
          {
            id: 'q-writing-fix',
            type: 'match',
            prompt: 'Match each weak sentence to the fix it needs.',
            pairs: [
              { id: 'throat', left: '“Since the beginning of time, humans have needed water.”', right: 'Delete the throat-clearing opening' },
              { id: 'passive', left: '“Mistakes were made in the payment process.”', right: 'Say who did what' },
              { id: 'vague', left: '“Many customers are unhappy.”', right: 'Make it concrete with numbers or an example' },
              { id: 'no-ask', left: '“Anyway, that is the situation.”', right: 'End with the next step and a deadline' },
            ],
            explanation: 'Clear writing gets to the point, names actors, uses specifics and ends with action.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Present, listen, improve
// ---------------------------------------------------------------------------

const moduleDeliver: Module = {
  key: 'present-listen-improve',
  title: 'Present, listen and improve',
  summary:
    'Learn to manage nerves and present with confidence in person and online, handle questions, listen so conversations go both ways, and give and use structured feedback. Then record your Signature Talk.',
  weekNo: 5,
  items: [
    {
      key: 'presenting',
      type: 'lesson',
      title: 'Presenting with confidence',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'nerves',
            title: 'Your body is trying to help',
            blocks: [
              {
                id: 'nerves-text',
                type: 'text',
                body: "Racing heart, dry mouth, shaking hands. If speaking in front of people does this to you, you are in very large company. Even experienced speakers feel it.\n\nThe goal is not to feel nothing. It is to understand what your body is doing, so the nerves work for you rather than against you. Start with the science.",
              },
              {
                id: 'nerves-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'K93fMnFKwfI',
                title: 'The science of stage fright (and how to overcome it) - Mikael Cho',
                channel: 'TED-Ed',
                durationS: 248,
                caption: "A TED-Ed lesson on what happens in your body when you are nervous about speaking. Watch for the practical tips at the end, and pick the one you will try first.",
              },
            ],
          },
          {
            id: 'nerves-scale',
            title: 'How nervous are you?',
            blocks: [
              {
                id: 'nerves-scale-block',
                type: 'scale',
                prompt: 'Imagine recording a five-minute talk about your dream for your classmates to watch. How nervous does that make you?',
                minLabel: 'Not at all',
                maxLabel: 'Very nervous',
                afterword:
                  "Look at how your classmates answered. You are not alone. The most reliable cure for nerves is preparation and repetition: by your third recording, most people are surprised how much calmer they feel.",
              },
            ],
          },
          {
            id: 'delivery',
            title: 'Voice, pause and presence',
            blocks: [
              {
                id: 'stage-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Outreachy_organizers_present_at_FOSDEM_2024_02.jpg/1280px-Outreachy_organizers_present_at_FOSDEM_2024_02.jpg',
                alt: 'Four people stand together at the front of a hall behind a lectern and a table, one speaking into a handheld microphone, with conference banners beside them.',
                caption: 'Presenters at the FOSDEM 2024 conference in Brussels. Speaking as a team, each person knows their part and when to hand over.',
                credit: 'Photo: Jwf / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'delivery-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Pace', definition: 'Most nervous speakers rush. Slow down more than feels natural; it will sound normal to your audience.' },
                  { term: 'Pause', definition: 'Silence after an important sentence lets it land. It also replaces “umm”.' },
                  { term: 'Eye contact', definition: 'Speak to one person at a time, a sentence or so each. On camera, look at the lens, not the screen.' },
                  { term: 'Notes, not a script', definition: 'Key words on a card or phone keep you on track without reading aloud.' },
                ],
              },
            ],
          },
          {
            id: 'online',
            title: 'Presenting online',
            blocks: [
              {
                id: 'booth-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Radio_Studio_in_Ghana_01.jpg/1280px-Radio_Studio_in_Ghana_01.jpg',
                alt: 'A person wearing headphones and a white polo shirt speaks into a studio microphone in a recording booth with graffiti-painted walls, a music stand and a drum kit.',
                caption: 'Recording at a radio studio in Ghana. On a call, as on the radio, your voice carries most of your message.',
                credit: 'Photo: Joy Agyepong / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'online-choice',
                type: 'choice',
                prompt: 'Fatou is pitching to a boutique buyer on a video call with a slow connection. Which steps will help most? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'light', text: 'Sit facing a window or light, not with it behind her', correct: true, feedback: 'Yes. Light behind you turns your face into a silhouette.' },
                  { id: 'lens', text: 'Put the camera at eye level and look at the lens when making key points', correct: true, feedback: 'Yes. To the viewer, that is eye contact.' },
                  { id: 'backup', text: 'Send her one-page summary before the call, in case the video drops', correct: true, feedback: 'Yes. If the connection fails, the point still arrives.' },
                  { id: 'slides', text: 'Share a 30-slide deck full of photos', correct: false, feedback: 'Heavy slides may freeze on a slow connection, and 30 slides is too many for a short pitch.' },
                  { id: 'video-off', text: 'Turn her camera off to save data, without saying anything', correct: false, feedback: 'Sometimes needed, but say so first, and turn it on for the opening and the ask if you can.' },
                ],
                explanation:
                  "Online, the basics carry more weight: light, sound, eye level and a backup. Plan for the connection to fail, and make sure your point still gets through.",
              },
            ],
          },
          {
            id: 'questions',
            title: 'Handling questions',
            blocks: [
              {
                id: 'questions-framework',
                type: 'framework',
                title: 'Answering a question well',
                steps: [
                  { label: 'Listen to the end', detail: 'Do not start answering in your head halfway through.' },
                  { label: 'Thank or acknowledge', detail: '“Good question” is fine once. “That’s a fair concern” works for challenges.' },
                  { label: 'Answer briefly, point first', detail: 'Lead with yes, no or the answer, then one reason.' },
                  { label: 'Admit what you don’t know', detail: '“I don’t know yet. I’ll find out and come back to you by Friday.” Then do it.' },
                  { label: 'Bridge back', detail: 'Connect your answer to your main point when you can.' },
                ],
              },
              {
                id: 'hostile-scenario',
                type: 'scenario',
                situation:
                  "Kwame has just presented his market-day crèche idea to the parent–teacher association. A father stands up: “You are a student. You don’t have children. What do you know about raising them?” A few people laugh.",
                prompt: 'How should Kwame respond?',
                options: [
                  {
                    id: 'defend',
                    text: 'List his qualifications and the research he has read.',
                    outcome: "The father folds his arms. The more Kwame defends himself, the more it becomes a contest between them, and the room watches the contest instead of the idea.",
                    best: false,
                  },
                  {
                    id: 'acknowledge',
                    text: '“You’re right, I don’t have children, and parents know far more about this than I do. That’s why I’m asking for your help. What would make a crèche something you could trust?”',
                    outcome: "The laughter stops. The father pauses, then says the crèche would need a woman the market knows. Two mothers agree. The challenge has become the first piece of design advice.",
                    best: true,
                  },
                  {
                    id: 'ignore',
                    text: 'Smile, say “Next question,” and move on.',
                    outcome: "The room notices the dodge. The father’s point hangs in the air for the rest of the meeting, and support quietly drains away.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-delivery',
            title: 'Plan your delivery',
            blocks: [
              {
                id: 'delivery-reflection',
                type: 'reflection',
                prompt: 'Plan how you will deliver your Signature Talk. Where and how will you record it? What will you do about light, sound and nerves? Write the three hardest questions someone could ask about your dream, and a short, honest answer to each.',
                guidance: 'Be practical: a quiet room, phone at eye level, light in front of you. For the questions, think about the most sceptical person in your audience.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'listening',
      type: 'lesson',
      title: 'Listening: the other half of communication',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'listening-intro',
            title: 'We are losing our listening',
            blocks: [
              {
                id: 'listening-text',
                type: 'text',
                body: "Communication is not only speaking well. Leaders, founders and organisers who listen well learn faster, earn trust sooner and avoid the costly mistakes that come from assuming.\n\nMost of us listen just enough to prepare our reply. In this lesson you will practise listening to understand.",
              },
              {
                id: 'listening-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'cSohjlYQI2A',
                title: '5 ways to listen better | Julian Treasure | TED',
                channel: 'TED',
                durationS: 470,
                caption: "Sound expert Julian Treasure on five ways to listen more consciously. Pay most attention to his final tool, RASA, which you will practise below.",
              },
            ],
          },
          {
            id: 'rasa',
            title: 'RASA',
            blocks: [
              {
                id: 'rasa-framework',
                type: 'framework',
                title: 'RASA, from Julian Treasure',
                steps: [
                  { label: 'Receive', detail: 'Pay attention to the person. Put the phone down. Look at them.' },
                  { label: 'Appreciate', detail: 'Make small sounds and signals that show you are following: “mm”, “okay”, a nod.' },
                  { label: 'Summarise', detail: '“So what you’re saying is…” Check you have understood before you respond.' },
                  { label: 'Ask', detail: 'Ask questions afterwards that go deeper.' },
                ],
              },
              {
                id: 'rasa-match',
                type: 'match',
                prompt: 'Tunde is listening to a trader explain why she stopped using the savings app. Match what he does to the RASA step.',
                pairs: [
                  { id: 'receive', left: 'He puts his phone in his pocket and turns to face her', right: 'Receive' },
                  { id: 'appreciate', left: 'He nods and says “okay… I see” as she talks', right: 'Appreciate' },
                  { id: 'summarise', left: '“So the walk to the agent takes time you can’t spare in the morning?”', right: 'Summarise' },
                  { id: 'ask', left: '“What would saving look like if it fitted your day perfectly?”', right: 'Ask' },
                ],
                explanation:
                  "The summary step is the one most people skip, and the most powerful. It catches misunderstandings early, and it shows the speaker they have been heard, which makes them tell you more.",
              },
            ],
          },
          {
            id: 'listen-scenario',
            title: 'Listening under pressure',
            blocks: [
              {
                id: 'staff-scenario',
                type: 'scenario',
                situation:
                  "One of Tunde’s engineers, Ifeoma, comes to his desk looking stressed. “The release date is impossible,” she says. “Nobody listens to us.” Tunde has a meeting with the CEO in ten minutes.",
                prompt: 'What should Tunde do?',
                options: [
                  {
                    id: 'fix',
                    text: 'Immediately explain why the date was set and how the team can still hit it.',
                    outcome: "Ifeoma goes quiet and leaves. Tunde has proved her point: nobody listens. The real reason the date is impossible, a dependency on a partner bank, stays hidden until it is too late.",
                    best: false,
                  },
                  {
                    id: 'rasa',
                    text: 'Turn from his screen, let her finish, summarise what he heard, and ask: “What’s the biggest thing blocking us?” Then say he has ten minutes now and offer a proper conversation after his meeting.',
                    outcome: "Ifeoma explains that the partner bank has not delivered its test system. Tunde takes this straight into his CEO meeting. Because he listened for five minutes, he walks in with the most important fact of the day.",
                    best: true,
                  },
                  {
                    id: 'later',
                    text: 'Say “Not now, I’m busy,” and promise to talk later.',
                    outcome: "Honest about his time, but Ifeoma hears another version of “nobody listens”. Later never quite comes.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'listening-habits',
            title: 'Your listening habits',
            blocks: [
              {
                id: 'listening-poll',
                type: 'poll',
                prompt: 'Be honest. When someone is talking to you, what do you most often find yourself doing?',
                options: [
                  { id: 'reply', text: 'Planning my reply' },
                  { id: 'phone', text: 'Glancing at my phone' },
                  { id: 'fix', text: 'Jumping in with a solution' },
                  { id: 'finish', text: 'Finishing their sentences' },
                  { id: 'listen', text: 'Listening fully, most of the time' },
                ],
                afterword:
                  "Planning a reply is the most common answer in almost every group. Notice it next time, and try summarising instead. It is hard to plan a reply while you are trying to summarise accurately.",
              },
              {
                id: 'listening-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Listening is persuasive',
                body: "People are more open to your ideas once they feel you have understood theirs. In a community meeting, a negotiation or a pitch, the most persuasive move is often a good summary of the other side’s view, said before you make your own case.",
              },
            ],
          },
          {
            id: 'your-listening',
            title: 'Practise RASA',
            blocks: [
              {
                id: 'listening-reflection',
                type: 'reflection',
                prompt: 'Today, use RASA in one real conversation with someone affected by your dream or problem. Afterwards, write what you heard that you did not expect, and how it might change your Signature Talk.',
                guidance: 'Summarise at least once: “So what you’re saying is…”. Notice how the other person responds when they feel heard.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'feedback',
      type: 'lesson',
      title: 'Giving and using feedback',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'feedback-intro',
            title: 'Feedback is how you improve fast',
            blocks: [
              {
                id: 'feedback-text',
                type: 'text',
                body: "Good communicators are not people who never make mistakes. They are people who get honest feedback, often, and use it.\n\nBut most feedback is useless: “Nice talk!” or “It was a bit confusing.” The person learns nothing. In this lesson you will learn a simple structure for feedback that people can act on.",
              },
              {
                id: 'feedback-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'wtl5UrrgU8c',
                title: 'The secret to giving great feedback | The Way We Work, a TED series',
                channel: 'TED',
                durationS: 302,
                caption: "Cognitive psychologist LeeAnn Renninger shares a four-part method for giving feedback. Write down the four parts as she names them.",
              },
            ],
          },
          {
            id: 'four-parts',
            title: 'Four parts',
            blocks: [
              {
                id: 'parts-order',
                type: 'order',
                prompt: 'Put the four parts of Renninger’s feedback method in order.',
                items: [
                  { id: 'micro-yes', text: 'A micro-yes question: “Do you have five minutes for some thoughts on your talk?”' },
                  { id: 'data', text: 'A data point: “You said ‘basically’ eleven times in the first two minutes.”' },
                  { id: 'impact', text: 'An impact statement: “I started counting them instead of listening.”' },
                  { id: 'question', text: 'A question: “What do you think would help?”' },
                ],
                explanation:
                  "Asking first makes the other person ready to hear it. The data point is specific and checkable. The impact explains why it matters. The question turns feedback into a conversation, and people commit more to solutions they helped find.",
              },
            ],
          },
          {
            id: 'blur-words',
            title: 'Data, not blur',
            blocks: [
              {
                id: 'blur-choice',
                type: 'choice',
                prompt: 'Which piece of feedback on Fatou’s pitch is a clear data point?',
                multiple: false,
                options: [
                  { id: 'unprofessional', text: '“It felt a bit unprofessional.”', correct: false, feedback: 'A blur word. What exactly did she do? Fatou cannot act on “unprofessional”.' },
                  { id: 'specific', text: '“Your ask came at 4 minutes 30, and the call ended at 5 minutes.”', correct: true, feedback: 'Yes. Specific, checkable, and it points straight to the fix: ask earlier.' },
                  { id: 'great', text: '“Great energy!”', correct: false, feedback: 'Kind, but too vague to repeat or improve.' },
                  { id: 'confusing', text: '“The middle was confusing.”', correct: false, feedback: 'Closer, but which part? What did you expect to hear?' },
                ],
                explanation:
                  "Blur words, like “unprofessional”, “confusing” or “great”, mean different things to different people. Replace them with what you actually saw or heard. Positive feedback needs data too: “Your opening story about the returned dresses made me lean in” tells her what to keep.",
              },
            ],
          },
          {
            id: 'receiving',
            title: 'Receiving feedback',
            blocks: [
              {
                id: 'studio-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Radio_Studio_in_Ghana_03.jpg/1280px-Radio_Studio_in_Ghana_03.jpg',
                alt: 'A person seen from behind sits at a sound mixing desk with two computer screens showing audio software, looking through a window into a recording booth with a microphone.',
                caption: 'A radio studio in Ghana. Professionals listen back to every recording. Your phone lets you do the same.',
                credit: 'Photo: Joy Agyepong / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'receiving-tip',
                type: 'callout',
                tone: 'tip',
                title: 'How to receive feedback well',
                body: "- **Say thank you**, even when it stings. Someone spent time to help you.\n- **Ask for specifics**: “Can you show me where?”\n- **Don’t defend** in the moment. Write it down; decide later.\n- **Look for patterns.** One person’s view is a data point. Three people saying the same thing is a signal.\n- **Record yourself.** Watching your own talk is uncomfortable, and it is the fastest feedback there is.",
              },
              {
                id: 'receiving-scale',
                type: 'scale',
                prompt: 'How comfortable are you receiving critical feedback on something you care about?',
                minLabel: 'Very uncomfortable',
                maxLabel: 'Very comfortable',
                afterword:
                  "Discomfort is normal, especially when the work is personal, and a Signature Talk about your dream is very personal. Treat each piece of feedback as information, not a verdict.",
              },
            ],
          },
          {
            id: 'feedback-scenario-step',
            title: 'Feedback in practice',
            blocks: [
              {
                id: 'feedback-scenario',
                type: 'scenario',
                situation:
                  "Amina has recorded a practice version of her talk for the market association and asks her younger cousin, who is at university, for feedback. He watches it and says, “Honestly? It’s boring.”",
                prompt: 'What should Amina do next?',
                options: [
                  {
                    id: 'give-up',
                    text: 'Decide public speaking is not for her.',
                    outcome: "One blur word has cost her a skill she needs. Her cousin did not mean that, and would be upset to hear it.",
                    best: false,
                  },
                  {
                    id: 'specifics',
                    text: 'Thank him, then ask: “At what moment did you start to lose interest? What would have kept you listening?”',
                    outcome: "He watches again and stops it at 1:10. “Here. You read out all the prices. I wanted to hear about the week you lost half your stock.” Now Amina knows exactly what to change.",
                    best: true,
                  },
                  {
                    id: 'argue',
                    text: 'Explain that he is not her real audience, so his view does not count.',
                    outcome: "Partly true, but she has closed the conversation before learning anything. Even someone outside your audience can tell you where attention drops.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-feedback-plan',
            title: 'Plan your two rounds',
            blocks: [
              {
                id: 'feedback-reflection',
                type: 'reflection',
                prompt: 'Look at the feedback you received in round one on your story. What patterns do you see? List the three changes you will make before recording, and name two people, one inside your audience and one outside it, whom you will ask for round two.',
                guidance: 'For round two, ask your reviewers for data points: the moment they lost interest, the line they remember, and what they think your ask is.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'talk-feedback-discussion',
      type: 'discussion',
      title: 'Feedback round two: share your recorded draft',
      minutes: 12,
      required: true,
      payload: {
        prompt:
          "Record a draft of your Signature Talk (up to five minutes) on your phone and share the link, or post the script if you cannot share video.\n\nIn your post, say what you changed after round one and what you would most like feedback on.\n\nThen watch or read at least two classmates’ drafts and give feedback using the four-part method:\n\n1. A data point: something specific you saw or heard, with the time if you can.\n2. The impact it had on you as a listener.\n3. One thing to keep, described just as specifically.\n4. A question to help them improve.",
        guidance: 'No blur words. Instead of “good energy” or “a bit long”, say what happened and when. Be generous: everyone here is brave enough to put a recording up.',
        minWords: 100,
      },
    },
    {
      key: 'deliver-quiz',
      type: 'quiz',
      title: 'Module quiz: Present, listen and improve',
      minutes: 7,
      required: true,
      gradeWeight: 10,
      payload: {
        intro: "Five questions on presenting, listening and feedback. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-rasa',
            type: 'order',
            prompt: 'Put Julian Treasure’s RASA in order.',
            items: [
              { id: 'receive', text: 'Receive' },
              { id: 'appreciate', text: 'Appreciate' },
              { id: 'summarise', text: 'Summarise' },
              { id: 'ask', text: 'Ask' },
            ],
            explanation: 'Receive, Appreciate, Summarise, Ask. The summary is the step most people skip.',
          },
          {
            id: 'q-online',
            type: 'choice',
            prompt: 'On a video call, how do you make eye contact with your audience?',
            multiple: false,
            options: [
              { id: 'a', text: 'Look at the faces on your screen', correct: false, feedback: 'To them, you appear to be looking down.' },
              { id: 'b', text: 'Look at the camera lens', correct: true },
              { id: 'c', text: 'Look at your notes', correct: false, feedback: 'Useful sometimes, but it is not eye contact.' },
              { id: 'd', text: 'Close your eyes to concentrate', correct: false, feedback: 'Your audience will think the connection froze.' },
            ],
            explanation: 'Put the camera at eye level and look at the lens for key moments, especially your opening and your ask.',
          },
          {
            id: 'q-dont-know',
            type: 'choice',
            prompt: 'A funder asks a question you cannot answer. What is the best response?',
            multiple: false,
            options: [
              { id: 'a', text: 'Make up a confident answer', correct: false, feedback: 'If it is wrong, you lose all your credibility at once.' },
              { id: 'b', text: '“I don’t know yet. I’ll find out and send it to you by Friday.” Then do it.', correct: true },
              { id: 'c', text: 'Change the subject', correct: false, feedback: 'Funders notice dodges.' },
              { id: 'd', text: 'Say the question is not relevant', correct: false, feedback: 'It is relevant to them, which is what matters.' },
            ],
            explanation: 'Honesty plus a specific follow-up builds more trust than a guess.',
          },
          {
            id: 'q-feedback-parts',
            type: 'match',
            prompt: 'Match each part of a piece of feedback to its name.',
            pairs: [
              { id: 'micro', left: '“Can I share two thoughts on your pitch?”', right: 'Micro-yes question' },
              { id: 'data', left: '“Your ask came after four and a half minutes.”', right: 'Data point' },
              { id: 'impact', left: '“By then, I had started checking my phone.”', right: 'Impact statement' },
              { id: 'question', left: '“Where could the ask move to?”', right: 'Question' },
            ],
            explanation: 'Ask first, give specific data, explain the impact, then invite them to find the fix.',
          },
          {
            id: 'q-receiving',
            type: 'choice',
            prompt: 'Which are good habits when receiving feedback? Select all that apply.',
            multiple: true,
            options: [
              { id: 'thanks', text: 'Saying thank you', correct: true },
              { id: 'specifics', text: 'Asking for specifics', correct: true },
              { id: 'patterns', text: 'Looking for patterns across several people', correct: true },
              { id: 'defend', text: 'Explaining immediately why the feedback is wrong', correct: false, feedback: 'Defending in the moment stops people giving you honest feedback.' },
            ],
            explanation: 'Thank, ask for detail, decide later, and trust patterns more than single opinions.',
          },
        ],
      },
    },
    {
      key: 'signature-talk',
      type: 'assignment',
      title: 'Practical Output: your Signature Talk',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: your **Signature Talk**. It is a recorded talk of about five minutes about your dream or the problem you are working on, improved through two rounds of feedback, together with a one-page written summary.\n\nYour talk should lead with a clear point, carry a story with evidence, make a specific ask and be delivered with care for your audience. Your summary should say the same thing in writing, for someone who will never watch the video.\n\nRecord it on your phone. Good light and clear sound matter more than any equipment. You may speak in English or in another language with English subtitles or a translated summary.\n\nYour Signature Talk joins your Dream Lab portfolio, and you will use it again in Personal Branding and in the Dream Residency. A faculty reviewer will grade it against the rubric below.",
        practicalOutput: 'Signature Talk',
        steps: [
          'Choose your audience: the people whose support your dream most needs right now.',
          'Write your throughline in fifteen words or fewer, and check it with the “so what?” test.',
          'Build the talk: point first, a story using the story spine, evidence, and a clear ask with a next step.',
          'Use the feedback from round one (your story) and round two (your recorded draft). Note what you changed.',
          'Record the final talk in one take if you can, at eye level, in a quiet place with light in front of you. Aim for four to six minutes.',
          'Write the one-page summary using the template below.',
          'Upload the video or share a link (unlisted is fine), and paste your summary.',
          'Watch your final recording once and note in your journal one thing you will keep and one you will practise next.',
        ],
        rubric: [
          {
            id: 'point',
            criterion: 'Clear point',
            description: 'The main point is stated within the first thirty seconds and is a claim, not a topic. A listener could repeat it in one sentence.',
          },
          {
            id: 'story-evidence',
            criterion: 'Story and evidence',
            description: 'Uses a specific, honest story with a clear shape, supported by evidence that shows it is not a one-off. Real people’s stories are told with permission or as clearly labelled composites.',
          },
          {
            id: 'ask',
            criterion: 'Audience and ask',
            description: 'The talk is clearly shaped for a named audience and ends with a specific ask and next step that suits them.',
          },
          {
            id: 'delivery',
            criterion: 'Delivery',
            description: 'Steady pace, pauses that let key lines land, eye contact with the lens, and clear sound and light. Within four to six minutes.',
          },
          {
            id: 'summary',
            criterion: 'Written summary',
            description: 'A one-page summary that puts the point first, is concise and concrete, and ends with the next step. It makes sense to someone who has not watched the talk.',
          },
          {
            id: 'feedback-use',
            criterion: 'Use of feedback',
            description: 'Describes the feedback received in both rounds and shows specific changes made in response.',
          },
        ],
        template:
          "SIGNATURE TALK: WRITTEN SUMMARY\n\nLink to my recording:\n\nAudience\nWho this talk is for, and what they care about.\n\nThroughline\nMy point in fifteen words or fewer.\n\nThe problem or dream\nWhat is happening now, for whom, and why it matters.\n\nThe story\nThe story at the heart of my talk, in three or four sentences.\n\nEvidence\nThe facts or numbers that show this is real, and where they come from.\n\nMy ask\nExactly what I am asking this audience to do, and the next step.\n\nFeedback and changes\nRound one: what I heard and what I changed.\nRound two: what I heard and what I changed.",
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
          "Nine questions across the whole course: the message, audience, story, writing, presenting, listening and feedback. Most follow a new case.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-point',
            type: 'choice',
            prompt: 'New case: Baraka (fictional) runs a small solar-repair business in Mwanza and wants the town council to let him train young people at the vocational centre. Which opening line is strongest for his five minutes at the council?',
            multiple: false,
            options: [
              { id: 'a', text: '“Thank you for having me. Let me tell you about my background.”', correct: false, feedback: 'Polite, but the council still does not know what he wants.' },
              { id: 'b', text: '“I am asking for one classroom at the vocational centre on Saturdays, to train twenty young people to repair solar systems.”', correct: true },
              { id: 'c', text: '“Solar energy is the future of Africa.”', correct: false, feedback: 'A grand topic, not a point or an ask.' },
              { id: 'd', text: '“I have some ideas I would like to share.”', correct: false, feedback: 'Vague. Ideas about what?' },
            ],
            explanation: 'Point first, after a brief greeting: the council knows within seconds what is being asked.',
          },
          {
            id: 'f-audience',
            type: 'match',
            prompt: 'Match each of Baraka’s audiences to the best entry point.',
            pairs: [
              { id: 'council', left: 'Town councillors', right: 'Jobs for local youth and fewer dead solar systems in public buildings' },
              { id: 'parents', left: 'Parents of possible trainees', right: 'A practical skill that earns money, taught safely on Saturdays' },
              { id: 'funder', left: 'An energy charity', right: 'Numbers: systems repaired, trainees placed, and cost per trainee' },
              { id: 'youth', left: 'Young people', right: 'A story of a trainee who now earns from repairs in his own street' },
            ],
            explanation: 'Same point, different entry points, each chosen for what that audience cares about.',
          },
          {
            id: 'f-story',
            type: 'choice',
            prompt: 'Which opening is most likely to make the council care?',
            multiple: false,
            options: [
              { id: 'a', text: '“Many solar systems in Tanzania break down.”', correct: false, feedback: 'True perhaps, but abstract.' },
              { id: 'b', text: '“Last year the clinic at Igogo lost its fridge power for three weeks because nobody nearby could replace a twenty-dollar controller.”', correct: true },
              { id: 'c', text: '“Solar technology is very interesting.”', correct: false, feedback: 'Interesting to whom, and so what?' },
              { id: 'd', text: '“I have always loved electronics.”', correct: false, feedback: 'A fine detail later, but it is about Baraka, not the council’s problem.' },
            ],
            explanation: 'One specific, local story makes the problem real, and points straight at the solution. (The case is fictional.)',
          },
          {
            id: 'f-ask',
            type: 'choice',
            prompt: 'Which elements belong in Baraka’s ask? Select all that apply.',
            multiple: true,
            options: [
              { id: 'what', text: 'Exactly what he wants: one classroom on Saturdays', correct: true },
              { id: 'when', text: 'When he would start and for how long: a three-month pilot from next month', correct: true },
              { id: 'next', text: 'The next step: a meeting with the centre’s principal this month', correct: true },
              { id: 'everything', text: 'Every other idea he has for the town', correct: false, feedback: 'One clear ask beats a list. Save the rest for later.' },
            ],
            explanation: 'A complete ask says what, when and what happens next, and stops there.',
          },
          {
            id: 'f-writing',
            type: 'match',
            prompt: 'Match each weak sentence in Baraka’s letter to its fix.',
            pairs: [
              { id: 'throat', left: '“Since the dawn of electricity, mankind has sought power.”', right: 'Delete it and start with the request' },
              { id: 'passive', left: '“It is felt that training should be provided.”', right: 'Say who will do what' },
              { id: 'vague', left: '“Many systems are broken.”', right: 'Give a number or a named example' },
              { id: 'end', left: '“Thank you for reading.”', right: 'End with the next step and a date' },
            ],
            explanation: 'Point first, active sentences, concrete detail, and a clear next step.',
          },
          {
            id: 'f-question',
            type: 'choice',
            prompt: 'A councillor says sharply: “Why should we trust a private businessman with a public building?” What is the best response?',
            multiple: false,
            options: [
              { id: 'a', text: '“With respect, that is an unfair question.”', correct: false, feedback: 'It turns the meeting into a contest.' },
              { id: 'b', text: '“That’s a fair concern. The centre would keep the keys, and I’d report monthly on who attended. What else would give you confidence?”', correct: true },
              { id: 'c', text: 'List his business awards', correct: false, feedback: 'Defending himself does not address the concern about the building.' },
              { id: 'd', text: 'Move quickly to the next question', correct: false, feedback: 'The concern stays in the room.' },
            ],
            explanation: 'Acknowledge, answer briefly, and invite the challenger to help shape the solution.',
          },
          {
            id: 'f-rasa',
            type: 'choice',
            prompt: 'After the meeting, a councillor explains at length why the last training scheme failed. Which response shows the Summarise step of RASA?',
            multiple: false,
            options: [
              { id: 'a', text: '“Mine will be different.”', correct: false, feedback: 'That is a reply, not a summary, and it dismisses what she said.' },
              { id: 'b', text: '“So the trainees left because there was no equipment to practise on after the course?”', correct: true },
              { id: 'c', text: 'Nodding silently', correct: false, feedback: 'That is Appreciate. Useful, but it does not check understanding.' },
              { id: 'd', text: '“Can we talk about something else?”', correct: false, feedback: 'That ends the listening entirely.' },
            ],
            explanation: 'A summary checks understanding and shows the speaker they have been heard. Here it also gives Baraka a design lesson for free.',
          },
          {
            id: 'f-feedback',
            type: 'choice',
            prompt: 'Baraka’s friend watched his practice run. Which feedback is most useful?',
            multiple: false,
            options: [
              { id: 'a', text: '“It was good, man.”', correct: false, feedback: 'Kind, but nothing to act on.' },
              { id: 'b', text: '“It felt too technical.”', correct: false, feedback: 'A blur word. Which part?' },
              { id: 'c', text: '“When you explained charge controllers for a minute, I lost track. The clinic story got me back. Could you cut the technical part to one sentence?”', correct: true },
              { id: 'd', text: '“You should be more confident.”', correct: false, feedback: 'Vague, and hard to act on.' },
            ],
            explanation: 'A data point, its impact, and a question or suggestion. Baraka knows exactly what to change.',
          },
          {
            id: 'f-order',
            type: 'order',
            prompt: 'Put Baraka’s preparation in a sensible order.',
            items: [
              { id: 'audience', text: 'Find out what the council cares about' },
              { id: 'point', text: 'Write his throughline and ask' },
              { id: 'story', text: 'Build the story and evidence around them' },
              { id: 'practise', text: 'Record a practice run and get feedback' },
              { id: 'revise', text: 'Revise, then present' },
            ],
            explanation: 'Audience, point, story, practice, revision. The same loop you used for your Signature Talk.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const communication: CourseAuthoring = {
  slug: 'communication',
  title: 'Communication',
  subtitle: 'Speak, write and present so people understand, remember and act.',
  description:
    "Great ideas die every day because nobody could explain them. Whether you are pitching to an investor, briefing a team, persuading a community meeting or writing to a government office, how you communicate decides whether anything happens next.\n\nThis course covers the communication every builder needs: structuring a message so the point comes first, telling stories that make people care, writing clear emails, proposals and posts, presenting with confidence in person and on a call, and listening so that conversations go both ways. You will practise adapting the same message for elders, peers, funders and officials, and in more than one language where that helps.\n\nYou will record yourself, receive structured peer feedback and improve through repetition. Many learners say this is the course that changes them most visibly.\n\nYour Practical Output is a **Signature Talk**: a recorded five-minute talk about your dream or problem, refined through two rounds of feedback, together with a one-page written summary.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 4,
  outcomes: [
    'Structure any message so the main point is clear within the first thirty seconds.',
    'Use story, evidence and a clear ask to persuade different audiences.',
    'Write clear, concise emails, proposals and posts.',
    'Present with confidence in person and online, and handle questions well.',
    'Give and use structured feedback to improve your communication quickly.',
  ],
  skills: ['Public speaking', 'Storytelling', 'Business writing', 'Presentation', 'Active listening', 'Audience adaptation'],
  audience: 'Builders who need to pitch, lead, persuade and explain, and anyone who freezes, rambles or goes unheard when it matters.',
  prerequisites: 'Completion of the Life Architecture phase, or equivalent experience.',
  practicalOutput: 'Signature Talk',
  cover: {
    from: '#0A0F1E',
    to: '#D8A84E',
    symbol: '○',
    imageUrl: 'https://images.unsplash.com/photo-1581548708095-7158f2e63857?auto=format&fit=crop&w=1200&q=70',
    imageAlt: 'A close-up of a microphone on a stand against a soft, blurred background.',
    imageCredit: 'Photo: Robinson Recalde / Unsplash',
  },
  trailer: {
    provider: 'youtube',
    videoId: 'eIho2S0ZahI',
    title: 'How to Speak So That People Want to Listen | Julian Treasure | TED',
    channel: 'TED',
    durationS: 598,
  },
  instructors: [
    {
      name: 'The African Dream Lab Faculty',
      title: 'Builder’s Architecture faculty',
      bio: 'The Builder’s Architecture faculty of The African Dream Lab brings together founders, communicators, negotiators and practitioners from across the continent. They teach the skills to build with and through other people. The Lab is run by the African Dream Network and grew out of the TADIS conference.',
    },
  ],
  modules: [moduleMessage, moduleStory, moduleDeliver],
};

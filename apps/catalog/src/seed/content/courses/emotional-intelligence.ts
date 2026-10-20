import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Emotional Intelligence: Life Architecture, week 3, 5 credits. Practical Output: Emotional
 * Intelligence Growth Plan.
 *
 * Spine: Notice → Name → Pause → Choose → Connect. Recurring cast, all fictional:
 *   Adaeze   a new team lead at a youth NGO in Abuja, managing people older than her
 *   Thabo    founder of a small coding school in Durban, “the one who made it” in his family
 *   Wanjiru  operations lead at a Nairobi matatu SACCO, caught between owners and drivers
 *   Kwame    a university student in Kumasi, waiting on a scholarship decision
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Self-awareness: know what you feel
// ---------------------------------------------------------------------------

const moduleSelfAwareness: Module = {
  key: 'self-awareness',
  title: 'Self-awareness: know what you feel',
  summary:
    'Learn what emotional intelligence is and why it matters for builders, then practise naming your emotions with precision and spotting the triggers and patterns behind your reactions.',
  weekNo: 3,
  items: [
    {
      key: 'what-is-ei',
      type: 'lesson',
      title: 'What emotional intelligence is, and why it matters',
      minutes: 12,
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
                body: "Welcome to Emotional Intelligence.\n\nTalent gets you into the room. What happens once you are there depends a great deal on how you handle feelings: yours and other people’s. Rejection from an investor. A team member who misses a deadline again. A parent who does not understand why you left a safe job. Your own fear before a big pitch.\n\n**Emotional intelligence** is the ability to notice, understand and manage emotions, in yourself and in others, so that they inform your choices instead of running them.\n\nStart with the psychologist who made the idea famous.",
              },
              {
                id: 'goleman-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'Y7m9eNoB3NU',
                title: 'Daniel Goleman Introduces Emotional Intelligence | Big Think',
                channel: 'Big Think',
                durationS: 331,
                caption: 'Daniel Goleman explains what emotional intelligence is. Watch for the parts he describes, and ask which one feels strongest in you today, and which feels weakest.',
              },
            ],
          },
          {
            id: 'four-parts',
            title: 'Four parts',
            blocks: [
              {
                id: 'four-framework',
                type: 'framework',
                title: 'The four domains of emotional intelligence',
                steps: [
                  { label: 'Self-awareness', detail: 'Noticing what you feel, naming it accurately and knowing your triggers, strengths and limits.' },
                  { label: 'Self-management', detail: 'Handling your emotions so they do not hijack you: staying steady under stress, recovering from setbacks.' },
                  { label: 'Social awareness', detail: 'Reading what others feel and need, including across cultures and generations. Empathy lives here.' },
                  { label: 'Relationship skills', detail: 'Listening, giving and receiving feedback, handling conflict and building trust.' },
                ],
              },
              {
                id: 'four-context',
                type: 'callout',
                tone: 'context',
                title: 'A model, not a measurement',
                body: "This four-part model is widely used in leadership training and comes from the work of Daniel Goleman and his colleagues. Psychologists still debate how best to define and measure emotional intelligence. Treat it as a useful map, not a test score. Unlike IQ, these are skills you can practise.",
              },
            ],
          },
          {
            id: 'self-rating',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'self-scale',
                type: 'scale',
                prompt: 'When a strong emotion hits you, such as anger, fear or shame, how well do you usually manage what you say and do next?',
                minLabel: 'It usually runs me',
                maxLabel: 'I usually stay steady',
                afterword:
                  "Wherever you are is a fine starting point. Most people are steadier in some situations than others: calm at work and explosive at home, or the other way round. You will rate yourself again at the end of the course.",
              },
            ],
          },
          {
            id: 'meet-adaeze',
            title: 'Meet Adaeze',
            blocks: [
              {
                id: 'adaeze-story',
                type: 'callout',
                tone: 'story',
                title: 'Adaeze, new team lead, Abuja',
                body: "Adaeze is 25. Last month she was promoted to lead the programmes team at a youth NGO in Abuja. Two people on her team are older than her and were there before her.\n\nIn her first team meeting, one of them, Mr Okon, says loudly: “With respect, some of us were running these programmes when you were in secondary school.” The room goes quiet. Adaeze feels her face go hot.\n\nShe has about two seconds to decide what to say.",
              },
              {
                id: 'adaeze-choice',
                type: 'choice',
                prompt: 'Which response shows the most emotional intelligence?',
                multiple: false,
                options: [
                  { id: 'snap', text: '“Well, I am the lead now, so you will have to get used to it.”', correct: false, feedback: 'Understandable, but it lets the hurt speak. It turns a comment into a contest, in front of everyone.' },
                  { id: 'freeze', text: 'Say nothing and move quickly to the next agenda item.', correct: false, feedback: 'It avoids a scene, but the comment hangs in the air and Mr Okon learns that this works.' },
                  { id: 'steady', text: 'Take a breath and say: “You’re right, your experience matters a lot to this team. I’d like to talk with you this week about how we use it.”', correct: true, feedback: 'Yes. She notices her reaction, stays steady, acknowledges what is true in his comment and moves it to a private conversation.' },
                  { id: 'cry', text: 'Leave the room to collect herself.', correct: false, feedback: 'Taking a moment can be wise, but leaving mid-meeting signals the comment knocked her over.' },
                ],
                explanation:
                  "Adaeze’s feelings are completely valid. Emotional intelligence is not about not feeling hurt. It is about the gap between the feeling and what you do with it. You will learn how to widen that gap.",
              },
            ],
          },
          {
            id: 'why-builders',
            title: 'Why it matters for builders',
            blocks: [
              {
                id: 'why-poll',
                type: 'poll',
                prompt: 'Which situation tests your emotions most at the moment?',
                options: [
                  { id: 'rejection', text: 'Rejection: from jobs, investors, scholarships or people' },
                  { id: 'conflict', text: 'Conflict with colleagues, partners or teammates' },
                  { id: 'family', text: 'Family expectations and pressure' },
                  { id: 'money', text: 'Money worries' },
                  { id: 'uncertainty', text: 'Uncertainty about my future' },
                  { id: 'leading', text: 'Leading or managing other people' },
                ],
                afterword:
                  "Every one of these is common among young builders across the continent. You are not unusual for finding them hard. In this course you will work on the one that matters most to you.",
              },
              {
                id: 'why-proverb',
                type: 'quote',
                text: 'When there is no enemy within, the enemies outside cannot hurt you.',
                attribution: 'African proverb',
              },
            ],
          },
          {
            id: 'privacy',
            title: 'A note on privacy',
            blocks: [
              {
                id: 'privacy-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Your journal is yours',
                body: "Many reflections in this course are personal. They go into your private journal. Nothing is shared unless you choose to share it, and your Growth Plan only needs what you are comfortable with.\n\nThis course builds everyday skills. It is not therapy. If you are struggling with your mental health, please talk to someone you trust and seek help from a qualified professional or a health service near you. Asking for help is a sign of strength.",
              },
              {
                id: 'intent-reflection',
                type: 'reflection',
                prompt: 'Think of a recent moment when an emotion took over and you said or did something you later regretted, or held back something you wish you had said. What happened, and what would you like to do differently next time?',
                guidance: 'Write freely. This stays in your journal and becomes the starting point for your Growth Plan.',
                minWords: 30,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'name-it',
      type: 'lesson',
      title: 'Name it to tame it: emotions and triggers',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-name',
            title: 'Why naming helps',
            blocks: [
              {
                id: 'name-text',
                type: 'text',
                body: "Many of us have only a few words for how we feel: fine, stressed, angry, tired. But “stressed” can hide very different emotions: fear of failing, resentment at being overloaded, shame at falling behind, grief, loneliness.\n\nEach one needs a different response. If you cannot name it, you cannot work with it. Psychiatrist Dan Siegel calls this **name it to tame it**.",
              },
              {
                id: 'siegel-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'ZcDLzppD4Jc',
                title: 'Dan Siegel: Name it to Tame it',
                channel: 'Dalai Lama Center for Peace and Education',
                durationS: 261,
                caption: 'Watch for what Siegel says happens when we put a feeling into words. Then try it: what is the most accurate word for how you feel right now?',
              },
            ],
          },
          {
            id: 'precise-words',
            title: 'Beyond “fine” and “stressed”',
            blocks: [
              {
                id: 'faces-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Sixteen_faces_expressing_the_human_passions._Wellcome_L0068375_%28cropped%29.jpg/1280px-Sixteen_faces_expressing_the_human_passions._Wellcome_L0068375_%28cropped%29.jpg',
                alt: 'A hand-coloured engraving of sixteen numbered faces in four rows, each showing a different expression, from calm and admiring to fearful, angry, scornful and weeping.',
                caption: '“External Signs of the Passions”, an engraving from 1821 after the French painter Charles Le Brun. People have tried to map emotions for centuries.',
                credit: 'Engraving: J. Pass after Charles Le Brun / Wellcome Collection via Wikimedia Commons, CC BY 4.0',
              },
              {
                id: 'emotion-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Emotion', definition: 'A short-lived response of body and mind to something that matters to you: fear, anger, joy, sadness, shame and many more.' },
                  { term: 'Emotional granularity', definition: 'How precisely you can tell your emotions apart. “Disappointed” rather than just “bad”.' },
                  { term: 'Trigger', definition: 'A situation, word or memory that reliably sets off a strong emotion in you, often stronger than the moment deserves.' },
                  { term: 'Body signal', definition: 'What an emotion does in your body before you notice it in your mind: a hot face, a tight chest, clenched jaw, a sinking stomach.' },
                ],
              },
            ],
          },
          {
            id: 'thabo-match',
            title: 'What is Thabo feeling?',
            blocks: [
              {
                id: 'thabo-story',
                type: 'example',
                title: 'Thabo’s week',
                body: "Thabo runs a small coding school in Durban. He is the first in his family to go to university, and relatives often ask him for money. This week, four things happen. In each, he says he feels “stressed”.",
              },
              {
                id: 'thabo-match-block',
                type: 'match',
                prompt: 'Match each situation to the more precise emotion Thabo is probably feeling.',
                pairs: [
                  { id: 'investor', left: 'An investor he admired declines to meet him, without explanation.', right: 'Disappointment' },
                  { id: 'cousin', left: 'A cousin posts that Thabo “forgets where he comes from” after he says no to a loan.', right: 'Hurt and resentment' },
                  { id: 'payroll', left: 'He is not sure he can pay his two instructors at the end of the month.', right: 'Anxiety' },
                  { id: 'mistake', left: 'He forgot a student’s graduation, and she noticed.', right: 'Guilt' },
                ],
                explanation:
                  "Four different emotions, four different responses. Disappointment needs time and perspective. Hurt might need an honest conversation. Anxiety needs a plan. Guilt needs an apology. “Stressed” hides all of that.",
              },
            ],
          },
          {
            id: 'body-first',
            title: 'Your body knows first',
            blocks: [
              {
                id: 'body-text',
                type: 'text',
                body: "Emotions often show up in the body before the mind catches up. Learning your own body signals gives you an early warning, while there is still time to choose.\n\nCommon signals: heat in the face or neck, a tight chest, shallow breathing, clenched jaw or fists, a sinking or churning stomach, restlessness, or suddenly feeling very tired.",
              },
              {
                id: 'body-choice',
                type: 'choice',
                prompt: 'Wanjiru notices her jaw tightening and her voice getting louder in a meeting with matatu owners. What is the most useful thing she can do in that moment?',
                multiple: false,
                options: [
                  { id: 'ignore', text: 'Ignore it and push on with her point.', correct: false, feedback: 'The signal is a warning that her emotion is rising. Ignoring it is how people say things they regret.' },
                  { id: 'name', text: 'Silently name what she feels (“I’m angry, I feel disrespected”), slow her breathing and lower her voice.', correct: true, feedback: 'Yes. Naming the feeling and calming the body buys her the space to choose her next words.' },
                  { id: 'leave', text: 'Walk out of the meeting.', correct: false, feedback: 'Occasionally a break is wise, but she can usually manage this in the moment.' },
                  { id: 'hide', text: 'Smile broadly so nobody can tell.', correct: false, feedback: 'Masking may hide it from others, but it does nothing to manage the emotion itself.' },
                ],
                explanation:
                  "Notice, name, breathe. It takes a few seconds and nobody else needs to know. Over time, you will catch the signal earlier and earlier.",
              },
            ],
          },
          {
            id: 'triggers',
            title: 'Your triggers',
            blocks: [
              {
                id: 'trigger-reveal',
                type: 'reveal',
                prompt: 'Why does Thabo explode when his cousin says he “forgets where he comes from”, but stay calm when a stranger insults his business online?',
                body: "Because the cousin’s words hit a **trigger**: something that touches a deep fear or old wound. Thabo already worries that success is taking him away from his family. The comment presses exactly on that bruise.\n\nTriggers are personal. The same words can mean nothing to one person and everything to another. Knowing your triggers lets you prepare for them, and explains reactions that otherwise seem out of proportion.",
              },
              {
                id: 'trigger-scale',
                type: 'scale',
                prompt: 'How well do you know your own emotional triggers?',
                minLabel: 'Not at all',
                maxLabel: 'Very well',
                afterword:
                  "Most people know a few triggers and are surprised by others. A simple way to learn more: for one week, each time you react more strongly than you expected, note what happened just before.",
              },
            ],
          },
          {
            id: 'map-yours',
            title: 'Map your patterns',
            blocks: [
              {
                id: 'map-reflection',
                type: 'reflection',
                prompt: 'Name three emotions you feel often, as precisely as you can. For each, write one situation that tends to trigger it and the body signal that comes first.',
                guidance: 'Use precise words: disappointed, resentful, anxious, ashamed, lonely, proud, relieved. This becomes the “patterns and triggers” section of your Growth Plan.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'self-awareness-quiz',
      type: 'quiz',
      title: 'Module quiz: Self-awareness',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Four questions on the four domains, naming emotions and triggers. You need 75% to pass and you can retake it as many times as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'q-domains',
            type: 'match',
            prompt: 'Match each domain of emotional intelligence to an example.',
            pairs: [
              { id: 'aware', left: 'Self-awareness', right: 'Noticing you feel ashamed, not just “bad”, after a missed deadline' },
              { id: 'manage', left: 'Self-management', right: 'Waiting until you are calm before replying to an angry email' },
              { id: 'social', left: 'Social awareness', right: 'Sensing that a quiet colleague is worried, not uninterested' },
              { id: 'relate', left: 'Relationship skills', right: 'Giving clear, kind feedback that helps someone improve' },
            ],
            explanation: 'Awareness comes first, inside and out. Management and relationship skills are what you do with that awareness.',
          },
          {
            id: 'q-name',
            type: 'choice',
            prompt: 'Why does naming an emotion precisely help?',
            multiple: false,
            options: [
              { id: 'a', text: 'It makes the emotion disappear', correct: false, feedback: 'Naming does not erase feelings. It makes them easier to work with.' },
              { id: 'b', text: 'Different emotions need different responses, and naming helps calm the reaction', correct: true },
              { id: 'c', text: 'It proves to others that you are in control', correct: false, feedback: 'Naming is mostly an inner skill. Others may never know you did it.' },
              { id: 'd', text: 'It is only useful for therapists', correct: false, feedback: 'It is a practical everyday skill for anyone.' },
            ],
            explanation: 'Disappointment, guilt and anxiety each call for something different. Precise names lead to better choices.',
          },
          {
            id: 'q-trigger',
            type: 'choice',
            prompt: 'What is an emotional trigger?',
            multiple: false,
            options: [
              { id: 'a', text: 'Any situation that makes you feel something', correct: false, feedback: 'Too broad. Triggers set off reactions stronger than the moment deserves.' },
              { id: 'b', text: 'A situation, word or memory that reliably sets off a strong emotion, often linked to a deeper fear or old hurt', correct: true },
              { id: 'c', text: 'A sign that you are weak', correct: false, feedback: 'Everyone has triggers. Knowing them is a strength.' },
              { id: 'd', text: 'Something other people do on purpose to upset you', correct: false, feedback: 'Triggers are about your history, and most people hit them by accident.' },
            ],
            explanation: 'Knowing your triggers lets you prepare, and explains reactions that otherwise seem out of proportion.',
          },
          {
            id: 'q-signals',
            type: 'choice',
            prompt: 'Which of these are common body signals of a rising emotion? Select all that apply.',
            multiple: true,
            options: [
              { id: 'face', text: 'Heat in the face or neck', correct: true },
              { id: 'chest', text: 'A tight chest or shallow breathing', correct: true },
              { id: 'jaw', text: 'Clenched jaw or fists', correct: true },
              { id: 'stomach', text: 'A sinking or churning stomach', correct: true },
              { id: 'none', text: 'There are none: emotions happen only in the mind', correct: false, feedback: 'Emotions are felt in the body too, often before you notice them in your thoughts.' },
            ],
            explanation: 'Your body is an early-warning system. Learn your signals and you gain a few precious seconds to choose.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Self-management: stress, setbacks and pressure
// ---------------------------------------------------------------------------

const moduleSelfManagement: Module = {
  key: 'self-management',
  title: 'Self-management: stress, setbacks and pressure',
  summary:
    'Understand what stress does to your brain and body, learn practical techniques to pause before you react and reframe setbacks, and look honestly at the pressures many young Africans carry.',
  weekNo: 3,
  items: [
    {
      key: 'stress-and-pressure',
      type: 'lesson',
      title: 'Stress, pressure and your brain',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'stress-intro',
            title: 'What stress does',
            blocks: [
              {
                id: 'stress-text',
                type: 'text',
                body: "Some stress is useful. It sharpens you before an exam or a pitch. But stress that never switches off changes how you think, sleep and treat people.\n\nUnderstanding what stress does inside you is the first step to handling it. Watch this short lesson, then we will look at the particular pressures many young builders carry.",
              },
              {
                id: 'stress-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'WuyPuH9ojCE',
                title: 'How stress affects your brain - Madhumita Murgia',
                channel: 'TED-Ed',
                durationS: 256,
                caption: 'Watch for what long-lasting stress does to memory, learning and mood, and what the lesson suggests can help.',
              },
            ],
          },
          {
            id: 'pressures',
            title: 'The pressures you carry',
            blocks: [
              {
                id: 'danfo-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/The_Danfo_of_Lagos.jpg/1280px-The_Danfo_of_Lagos.jpg',
                alt: 'A yellow minibus speeds along a city street, blurred with motion. One passenger stands in the open doorway holding the roof, and others sit packed inside.',
                caption: 'A danfo minibus in Lagos, Nigeria. For many young people, every day starts with pressure before work has even begun.',
                credit: 'Photo: Oluwolehammond / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'pressures-context',
                type: 'callout',
                tone: 'context',
                title: '“The one who made it”',
                body: "Many young Africans carry pressures that self-help books written elsewhere rarely mention:\n\n- **Family expectations:** being the first graduate, the one expected to send money home, pay school fees for siblings or support parents.\n- **Financial strain:** irregular income, rising prices, debts to friends and family.\n- **Uncertainty:** jobs that are hard to find, and plans that depend on things you cannot control.\n- **Comparison:** watching peers’ highlight reels online.\n\nThese pressures often come wrapped in love and duty, which makes them harder to talk about. Naming them is not ungrateful. It is the start of handling them well.",
              },
            ],
          },
          {
            id: 'pressure-poll',
            title: 'Your biggest pressure',
            blocks: [
              {
                id: 'pressure-poll-block',
                type: 'poll',
                prompt: 'Which pressure weighs on you most right now?',
                options: [
                  { id: 'family', text: 'Family expectations' },
                  { id: 'money', text: 'Money' },
                  { id: 'future', text: 'Uncertainty about the future' },
                  { id: 'comparison', text: 'Comparing myself with others' },
                  { id: 'work', text: 'Workload at school, work or my venture' },
                  { id: 'relationships', text: 'Relationships' },
                ],
                afterword:
                  "You are in good company, whichever you chose. Pressures are easier to manage once you see that others carry them too.",
              },
            ],
          },
          {
            id: 'stress-signs',
            title: 'Spot the signs',
            blocks: [
              {
                id: 'signs-choice',
                type: 'choice',
                prompt: 'Thabo has been under heavy pressure for two months. Which of these could be signs that stress is building up? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'sleep', text: 'He sleeps badly and wakes up already worrying', correct: true, feedback: 'Yes. Sleep is often the first thing stress takes.' },
                  { id: 'snap', text: 'He snaps at his instructors over small things', correct: true, feedback: 'Yes. Irritability is a classic sign of overload.' },
                  { id: 'forget', text: 'He keeps forgetting things he would normally remember', correct: true, feedback: 'Yes. Long-lasting stress affects memory and concentration.' },
                  { id: 'withdraw', text: 'He stops answering friends’ messages', correct: true, feedback: 'Yes. Withdrawal is common, and it cuts people off from support just when they need it.' },
                  { id: 'busy', text: 'He has a busy calendar', correct: false, feedback: 'Being busy is not the same as being overwhelmed. What matters is how he is coping.' },
                ],
                explanation:
                  "Sleep, mood, memory and withdrawal are the four signs worth watching in yourself and in your team. Catching them early is far easier than recovering from burnout.",
              },
            ],
          },
          {
            id: 'reframe',
            title: 'Reading a setback differently',
            blocks: [
              {
                id: 'kwame-example',
                type: 'example',
                title: 'Kwame’s rejection',
                body: "Kwame applied for a scholarship to study for a master’s degree abroad. Today the email arrives: unsuccessful. His first thought: “I’m not good enough. I’ll never get out of here.”\n\nBy evening, he has written down three other thoughts:\n\n- “This was one panel’s decision about one application, not a verdict on my life.”\n- “I can ask for feedback on my essay and apply again next year.”\n- “Two people I admire were rejected before they were accepted.”",
              },
              {
                id: 'reframe-reveal',
                type: 'reveal',
                prompt: 'Kwame still feels disappointed. So what has changed?',
                body: "His **appraisal**: the story he tells himself about what the event means. The feeling of disappointment is real and he does not pretend otherwise. But “I’m not good enough” turns one setback into a permanent judgement. His new thoughts are just as true, and they point to action.\n\nReframing is not forced positivity. It is looking for the most accurate and useful reading of what happened.",
              },
            ],
          },
          {
            id: 'support',
            title: 'Your support',
            blocks: [
              {
                id: 'support-reflection',
                type: 'reflection',
                prompt: 'Name the pressure that weighs on you most. What signs show you when it is building up? Who could you talk to about it, and what one thing would make it lighter?',
                guidance: 'Be as honest as you are comfortable being. This is private, and it feeds the “stress and pressure” section of your Growth Plan.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'pause-and-respond',
      type: 'lesson',
      title: 'The pause: managing emotions in the moment',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'pause-intro',
            title: 'You can shape what you feel',
            blocks: [
              {
                id: 'pause-text',
                type: 'text',
                body: "You cannot stop emotions from arising. But you have more influence over them than it feels like in the moment: over the situations you walk into, what you pay attention to, how you interpret events, and what you do with the feeling.\n\nThis short lesson walks through those points of influence. Notice that the goal is not to feel happy all the time.",
              },
              {
                id: 'manage-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'Uew5BbvmLks',
                title: 'How to manage your emotions',
                channel: 'TED-Ed',
                durationS: 291,
                caption: 'Watch for the different points where you can step in: the situation, your attention, how you appraise what happened, and your response. Which one do you use most?',
              },
            ],
          },
          {
            id: 'five-points',
            title: 'Five points of influence',
            blocks: [
              {
                id: 'influence-framework',
                type: 'framework',
                title: 'Where you can step in',
                steps: [
                  { label: 'Choose the situation', detail: 'Avoid or plan for situations you know will trigger you. Do not open investor emails at midnight.' },
                  { label: 'Change the situation', detail: 'Ask for a break, move a hard conversation to private, bring a friend.' },
                  { label: 'Shift attention', detail: 'Look at what you can control, or step away briefly from what you cannot.' },
                  { label: 'Reappraise', detail: 'Ask: “What else could this mean?” Find a reading that is accurate and useful.' },
                  { label: 'Calm the response', detail: 'Slow your breathing, lower your voice, wait before you send.' },
                ],
              },
              {
                id: 'influence-tip',
                type: 'callout',
                tone: 'tip',
                title: 'The slow breath',
                body: "When you notice a body signal, breathe in slowly through your nose for a count of four, and out even more slowly for a count of six. Do it three times. It takes under a minute, nobody needs to notice, and a long out-breath helps many people feel calmer.",
              },
            ],
          },
          {
            id: 'pause-steps',
            title: 'The pause, step by step',
            blocks: [
              {
                id: 'pause-order',
                type: 'order',
                prompt: 'Put the steps of a good pause into order.',
                items: [
                  { id: 'notice', text: 'Notice the body signal' },
                  { id: 'name', text: 'Name the emotion to yourself' },
                  { id: 'breathe', text: 'Take three slow breaths' },
                  { id: 'ask', text: 'Ask: “What outcome do I actually want here?”' },
                  { id: 'choose', text: 'Choose your words or action' },
                ],
                explanation:
                  "Notice, name, breathe, ask, choose. The question in step four is the turning point. When emotions run high, we often act to win the moment instead of to get what we really want.",
              },
            ],
          },
          {
            id: 'wanjiru-scenario',
            title: 'Wanjiru and the angry owner',
            blocks: [
              {
                id: 'owner-scenario',
                type: 'scenario',
                situation:
                  "Wanjiru is operations lead at a matatu SACCO in Nairobi. A vehicle owner storms into the office and shouts that her new evening schedule is “destroying” his income. He jabs a finger at her in front of the drivers.\n\nWanjiru feels her chest tighten and her face burn. She is sure he is wrong: her figures show evening income has risen across the SACCO.",
                prompt: 'What should Wanjiru do?',
                options: [
                  {
                    id: 'fight',
                    text: 'Raise her voice to match his and tell him the figures prove him wrong.',
                    outcome: "The argument becomes a contest in front of the drivers. The owner leaves angrier, tells other owners Wanjiru is arrogant, and nobody looks at the figures.",
                    best: false,
                  },
                  {
                    id: 'pause',
                    text: 'Take a slow breath, acknowledge he is upset, and invite him to sit down and go through his own vehicle’s numbers with her.',
                    outcome: "He is still angry, but he sits. His vehicle’s numbers show that his income has fallen, because his driver is skipping the evening shift. Wanjiru’s figures were right for the SACCO overall and wrong for him. They agree a fix. The owner leaves calmer, and Wanjiru learns something too.",
                    best: true,
                  },
                  {
                    id: 'give-in',
                    text: 'Apologise and promise to change the schedule back.',
                    outcome: "The owner calms down, but the schedule that is working for everyone else is now in doubt. Other owners learn that shouting works.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'positivity',
            title: 'Not forced positivity',
            blocks: [
              {
                id: 'positivity-choice',
                type: 'choice',
                prompt: 'A friend’s business has just failed. Which response reflects healthy emotional management?',
                multiple: false,
                options: [
                  { id: 'cheer', text: '“Don’t be sad! Everything happens for a reason. Stay positive!”', correct: false, feedback: 'Well meant, but it tells your friend their sadness is wrong. Pushing feelings away tends to make them last longer.' },
                  { id: 'allow', text: '“That’s really painful. It makes sense you feel low. When you’re ready, I’d love to hear what you learnt.”', correct: true, feedback: 'Yes. It accepts the feeling and leaves room for hope and learning later.' },
                  { id: 'fix', text: '“Here are ten ideas for your next business.”', correct: false, feedback: 'Jumping to solutions skips over the feeling. There will be time for ideas.' },
                  { id: 'ignore', text: 'Change the subject so they don’t have to think about it.', correct: false, feedback: 'Avoidance can leave a friend feeling alone with it.' },
                ],
                explanation:
                  "Healthy emotional management makes room for hard feelings rather than forcing them away. Accept the emotion, then choose what to do with it.",
              },
            ],
          },
          {
            id: 'plan-pause',
            title: 'Plan your pause',
            blocks: [
              {
                id: 'pause-reflection',
                type: 'reflection',
                prompt: 'Pick one trigger situation you named earlier. Write a short plan for the next time it happens: the signal you will watch for, the technique you will use, and the question you will ask yourself before responding.',
                guidance: 'Make it specific enough to use: “When my uncle asks about my salary at Sunday lunch, I will…”',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'pressure-discussion',
      type: 'discussion',
      title: 'Discussion: carrying expectations',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Many young builders carry heavy expectations: from family, community, faith or themselves. Sometimes these expectations are a source of strength. Sometimes they become a weight.\n\nShare, at whatever depth you are comfortable with:\n\n1. One expectation you carry, and where it comes from.\n2. How it helps you, and how it costs you.\n3. One thing you have tried, or would like to try, to carry it more lightly.\n\nThen reply to at least two classmates with something supportive: a question, a similar experience, or an idea that has helped you.",
        guidance: 'Share only what you are comfortable sharing. Respond to others with care. Do not give medical advice, and do not share anything a classmate tells you outside this course.',
        minWords: 60,
      },
    },
    {
      key: 'self-management-quiz',
      type: 'quiz',
      title: 'Module quiz: Self-management',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on stress, the pause and reappraisal. You need 70% to pass and you can retake it as many times as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-pause-order',
            type: 'order',
            prompt: 'Put the steps of the pause in order.',
            items: [
              { id: 'notice', text: 'Notice the body signal' },
              { id: 'name', text: 'Name the emotion' },
              { id: 'breathe', text: 'Breathe slowly' },
              { id: 'ask', text: 'Ask what outcome you want' },
              { id: 'choose', text: 'Choose your response' },
            ],
            explanation: 'Notice, name, breathe, ask, choose.',
          },
          {
            id: 'q-reappraise',
            type: 'choice',
            prompt: 'What does it mean to reappraise a setback?',
            multiple: false,
            options: [
              { id: 'a', text: 'Pretend it did not hurt', correct: false, feedback: 'Reappraisal accepts the feeling. It changes the story about what the event means.' },
              { id: 'b', text: 'Look for a reading of what happened that is both accurate and useful', correct: true },
              { id: 'c', text: 'Blame someone else for it', correct: false, feedback: 'That is a reading, but rarely an accurate or useful one.' },
              { id: 'd', text: 'Decide never to try again', correct: false, feedback: 'That is a conclusion driven by the emotion, not a reappraisal.' },
            ],
            explanation: '“I’m not good enough” and “This panel said no to this application” describe the same event. The second is more accurate and points to action.',
          },
          {
            id: 'q-signs',
            type: 'choice',
            prompt: 'Which are warning signs of stress building up over time? Select all that apply.',
            multiple: true,
            options: [
              { id: 'sleep', text: 'Sleeping badly', correct: true },
              { id: 'irritable', text: 'Snapping at people over small things', correct: true },
              { id: 'withdraw', text: 'Withdrawing from friends', correct: true },
              { id: 'memory', text: 'Forgetting things you normally remember', correct: true },
              { id: 'goals', text: 'Having ambitious goals', correct: false, feedback: 'Ambition is not a sign of stress in itself.' },
            ],
            explanation: 'Sleep, mood, withdrawal and memory. Watch for them in yourself and in your team.',
          },
          {
            id: 'q-match-points',
            type: 'match',
            prompt: 'Match each action to the point of influence it uses.',
            pairs: [
              { id: 'situation', left: 'Not checking investor emails late at night', right: 'Choose the situation' },
              { id: 'change', left: 'Asking to continue a heated conversation in private', right: 'Change the situation' },
              { id: 'reappraise', left: 'Asking “what else could this mean?”', right: 'Reappraise' },
              { id: 'response', left: 'Waiting an hour before sending a reply', right: 'Calm the response' },
            ],
            explanation: 'The earlier you step in, the easier it usually is. But it is never too late to calm the response.',
          },
          {
            id: 'q-positivity',
            type: 'choice',
            prompt: 'Why can “just stay positive” be unhelpful advice?',
            multiple: false,
            options: [
              { id: 'a', text: 'Because positive emotions are bad', correct: false, feedback: 'Positive emotions are great. The problem is forcing them.' },
              { id: 'b', text: 'Because pushing hard feelings away tends to make them last longer, and can leave people feeling unheard', correct: true },
              { id: 'c', text: 'Because negative emotions are always right', correct: false, feedback: 'Emotions are signals, not verdicts. They can be mistaken.' },
              { id: 'd', text: 'It is always helpful advice', correct: false, feedback: 'It often tells people their real feelings are wrong.' },
            ],
            explanation: 'Accept the emotion, then choose what to do with it. That balance works better than forced cheerfulness.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Empathy, listening and feedback
// ---------------------------------------------------------------------------

const growthPlanTemplate = [
  'EMOTIONAL INTELLIGENCE GROWTH PLAN',
  '',
  '1. Where I am starting',
  'My strengths and weaker areas across self-awareness, self-management, social awareness and relationship skills, with one example of each.',
  '',
  '2. My patterns and triggers',
  'Three emotions I feel often, what triggers each, and the body signal that comes first.',
  '',
  '3. Stress and pressure',
  'The pressures I carry, the warning signs that they are building, and who supports me.',
  '',
  '4. How I come across',
  'What I learnt from asking one or two people how I listen and how I handle feedback.',
  '',
  '5. Three habits I will practise',
  'Habit 1: When [cue], I will [small action]. Why it matters: …',
  'Habit 2: When [cue], I will [small action]. Why it matters: …',
  'Habit 3: When [cue], I will [small action]. Why it matters: …',
  '',
  '6. How I will track them',
  'How often I will check in, what I will record, and how I will know I am improving by the end of the Lab.',
  '',
  '7. My accountability partner',
  'Who will check in with me, how often, and what I have asked them to do.',
].join('\n');

const moduleRelationships: Module = {
  key: 'relationships',
  title: 'Empathy, listening and feedback',
  summary:
    'Read what others feel and listen so they feel heard, give and receive hard feedback without damage, and turn what you have learnt into habits you will practise for the rest of the Lab.',
  weekNo: 3,
  items: [
    {
      key: 'empathy-and-listening',
      type: 'lesson',
      title: 'Empathy and listening so people feel heard',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'listen-intro',
            title: 'Listening is a skill',
            blocks: [
              {
                id: 'listen-text',
                type: 'text',
                body: "Most of us were taught to speak, read and write. Very few of us were taught to listen. Yet listening well is one of the fastest ways to build trust, settle conflict and understand what people really need, whether they are customers, colleagues or family.\n\n**Empathy** is understanding what another person feels, from their point of view. Listening is how you get there.",
              },
              {
                id: 'treasure-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'cSohjlYQI2A',
                title: '5 ways to listen better | Julian Treasure | TED',
                channel: 'TED',
                durationS: 470,
                caption: 'Julian Treasure offers five exercises for better listening. Pay close attention to the last one, RASA. You will practise it in this lesson.',
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
                title: 'RASA: four moves of good listening',
                steps: [
                  { label: 'Receive', detail: 'Give the person your full attention. Put the phone face down. Look at them.' },
                  { label: 'Appreciate', detail: 'Show you are with them: nods, “mm”, “okay”, “I see”.' },
                  { label: 'Summarise', detail: '“So what you’re saying is…” Check you understood before you respond.' },
                  { label: 'Ask', detail: 'Ask questions afterwards that help them say more: “What worried you most about that?”' },
                ],
              },
              {
                id: 'listen-group-image',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1700687530335-b71cd1d926ee?auto=format&fit=crop&w=1200&q=70',
                alt: 'A group of people sit on chairs in a loose circle in a room with a painted brick wall, talking and gesturing animatedly while one person stands and smiles.',
                caption: 'In a lively group, the person who listens well is often the one others end up trusting most.',
                credit: 'Photo: Ben Iwara / Unsplash',
              },
            ],
          },
          {
            id: 'listen-scale',
            title: 'How well do you listen?',
            blocks: [
              {
                id: 'listen-scale-block',
                type: 'scale',
                prompt: 'In a disagreement, how often are you planning your reply while the other person is still talking?',
                minLabel: 'Almost never',
                maxLabel: 'Almost always',
                afterword:
                  "Almost everyone does this. The moment you notice yourself preparing a reply, bring your attention back to what they are saying. Summarising before you answer forces you to listen first.",
              },
            ],
          },
          {
            id: 'empathy-not-sympathy',
            title: 'Empathy across generations',
            blocks: [
              {
                id: 'adaeze-okon',
                type: 'example',
                title: 'Adaeze talks to Mr Okon',
                body: "Adaeze meets Mr Okon privately. Instead of defending her promotion, she asks: “What has it been like for you, these changes at the organisation?”\n\nHe talks for ten minutes. He has worked there for twelve years. He trained most of the staff. He applied for the lead role and was not chosen. He feels that the organisation no longer values experience.\n\nAdaeze summarises: “So it feels as if twelve years of building this team counted for nothing when the decision was made.” He nods slowly. “Yes. That’s it exactly.”",
              },
              {
                id: 'empathy-reveal',
                type: 'reveal',
                prompt: 'Adaeze has not agreed with Mr Okon, apologised or changed any decision. Why might this conversation still change their relationship?',
                body: "Because he feels **heard**. Being understood is a powerful human need, often more powerful than getting your way. Empathy does not mean agreeing. It means understanding the other person’s experience well enough to say it back to them.\n\nNow Adaeze also knows what the real issue is: respect for experience. She can do something about that, such as asking him to lead training for new staff.",
              },
              {
                id: 'empathy-context',
                type: 'callout',
                tone: 'context',
                title: 'Respect, age and voice',
                body: "In many African workplaces and families, age carries deep respect. A young leader who ignores this will struggle. One who honours it, while still leading, often gains powerful allies. Listening carefully to elders is not weakness. It is often the most effective form of leadership.",
              },
            ],
          },
          {
            id: 'rasa-match',
            title: 'Spot the move',
            blocks: [
              {
                id: 'rasa-match-block',
                type: 'match',
                prompt: 'Match each thing Adaeze did to the RASA move.',
                pairs: [
                  { id: 'receive', left: 'She put her phone in her bag and turned her chair to face him.', right: 'Receive' },
                  { id: 'appreciate', left: 'She nodded and said “I see” as he spoke.', right: 'Appreciate' },
                  { id: 'summarise', left: '“So it feels as if twelve years counted for nothing.”', right: 'Summarise' },
                  { id: 'ask', left: '“What would make you feel your experience is being used well?”', right: 'Ask' },
                ],
                explanation:
                  "Simple moves, rarely all used together. Try RASA in your next three conversations and notice what changes.",
              },
            ],
          },
          {
            id: 'listen-reflect',
            title: 'Practise it',
            blocks: [
              {
                id: 'listen-reflection',
                type: 'reflection',
                prompt: 'Think of someone whose view you find hard to understand: a relative, colleague or teammate. Write what you think they feel and need, from their point of view, as if you were summarising it back to them.',
                guidance: 'Start with “So for you…”. If you can, have the real conversation this week and note how close you were.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'hard-feedback',
      type: 'lesson',
      title: 'Giving and receiving hard feedback',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'feedback-intro',
            title: 'Why feedback goes wrong',
            blocks: [
              {
                id: 'feedback-text',
                type: 'text',
                body: "Feedback is how people and teams improve. It is also where relationships often get damaged. Givers soften the message until it means nothing, or deliver it so bluntly that the receiver stops listening. Receivers get defensive and miss what might help them.\n\nThis short talk offers a simple structure for giving feedback that people can actually hear.",
              },
              {
                id: 'feedback-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'wtl5UrrgU8c',
                title: 'The secret to giving great feedback | The Way We Work, a TED series',
                channel: 'TED',
                durationS: 302,
                caption: 'Cognitive psychologist LeeAnn Renninger describes four parts of feedback that lands well. Note them down as you watch.',
              },
            ],
          },
          {
            id: 'four-parts',
            title: 'Four parts of good feedback',
            blocks: [
              {
                id: 'feedback-framework',
                type: 'framework',
                title: 'Feedback people can hear',
                steps: [
                  { label: 'Micro-yes', detail: 'Ask first: “Do you have five minutes for some thoughts on how the meeting went?” It gives the person a sense of control.' },
                  { label: 'Data point', detail: 'Describe exactly what you saw or heard, not a label. Not “you were rude” but “you spoke over Amaka three times”.' },
                  { label: 'Impact', detail: 'Say how it affected you, the work or the team: “She stopped contributing after that.”' },
                  { label: 'Question', detail: 'End with a question: “How did you see it?” Make it a conversation, not a verdict.' },
                ],
              },
              {
                id: 'colleagues-image',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1653566031535-bcf33e1c2893?auto=format&fit=crop&w=1200&q=70',
                alt: 'Three colleagues talk around a meeting table with laptops and a tablet, one listening thoughtfully with a hand to the chin.',
                caption: 'Good feedback is a conversation, not a speech.',
                credit: 'Photo: UK Black Tech / Unsplash',
              },
            ],
          },
          {
            id: 'data-or-label',
            title: 'Data, not labels',
            blocks: [
              {
                id: 'data-choice',
                type: 'choice',
                prompt: 'Thabo needs to give feedback to an instructor who often arrives late to class. Which opening is the best data point?',
                multiple: false,
                options: [
                  { id: 'lazy', text: '“You’ve become lazy lately.”', correct: false, feedback: 'A label about character. It invites defence, not change.' },
                  { id: 'always', text: '“You’re always late.”', correct: false, feedback: '“Always” is almost never accurate, and the instructor will focus on the exceptions.' },
                  { id: 'data', text: '“You arrived 15 to 20 minutes after the start on three of the last five Tuesdays.”', correct: true, feedback: 'Yes. Specific, checkable and about behaviour, not character.' },
                  { id: 'hint', text: '“Some people might feel the timekeeping could be better.”', correct: false, feedback: 'So vague the instructor may not realise it is about them.' },
                ],
                explanation:
                  "A data point is something a camera could have recorded. Labels like “lazy”, “rude” or “unprofessional” are conclusions. People argue with conclusions. They usually accept data.",
              },
            ],
          },
          {
            id: 'receiving',
            title: 'Receiving feedback',
            blocks: [
              {
                id: 'receiving-scenario',
                type: 'scenario',
                situation:
                  "After Adaeze’s first donor presentation, her director says: “The content was strong, but you read from your slides most of the time. The donors stopped looking at you after about five minutes.”\n\nAdaeze feels a rush of embarrassment. She worked on those slides until 2 a.m.",
                prompt: 'How should Adaeze respond?',
                options: [
                  {
                    id: 'defend',
                    text: 'Explain that she was up until 2 a.m. and the director did not give her enough time to prepare.',
                    outcome: "Both may be true, but the director hears an excuse. Next time she may soften her feedback, or not give it at all, and Adaeze loses useful information.",
                    best: false,
                  },
                  {
                    id: 'thank-ask',
                    text: 'Take a breath, thank her, and ask: “What would you suggest I do differently next time?”',
                    outcome: "The director suggests rehearsing out loud twice and using slides with fewer words. Adaeze still feels embarrassed later, and that is fine. She notes the advice. Her next presentation is noticeably stronger, and the director tells others about her quick growth.",
                    best: true,
                  },
                  {
                    id: 'collapse',
                    text: 'Apologise repeatedly and say she is probably not cut out for presenting.',
                    outcome: "The director ends up reassuring Adaeze instead of helping her improve. The specific, fixable point gets lost in a general feeling of failure.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'receiving-tips',
            title: 'When feedback stings',
            blocks: [
              {
                id: 'receiving-choice',
                type: 'choice',
                prompt: 'Which habits help when you receive feedback that stings? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'pause', text: 'Pause and breathe before responding', correct: true, feedback: 'Yes. The pause works here too.' },
                  { id: 'clarify', text: 'Ask for a specific example if the feedback is vague', correct: true, feedback: 'Yes. “Can you give me an example?” turns a label into something you can work on.' },
                  { id: 'separate', text: 'Separate what was said from how it was said, and look for the useful part', correct: true, feedback: 'Yes. Even clumsy feedback often contains something true.' },
                  { id: 'decide-later', text: 'Take time to decide whether you agree, rather than deciding on the spot', correct: true, feedback: 'Yes. You can thank someone for feedback without accepting all of it.' },
                  { id: 'counter', text: 'Immediately point out the giver’s own faults', correct: false, feedback: 'That turns feedback into a fight and teaches people not to tell you things.' },
                ],
                explanation:
                  "You do not have to agree with all feedback. But people who receive it well get more of it, and more feedback means faster growth.",
              },
            ],
          },
          {
            id: 'feedback-reflect',
            title: 'Your feedback habits',
            blocks: [
              {
                id: 'feedback-reflection',
                type: 'reflection',
                prompt: 'Think of feedback you need to give someone, or feedback you received that you reacted badly to. Using the four parts, write what you would say now: the micro-yes, the data point, the impact and the question.',
                guidance: 'Keep it real. If it is feedback you received, write how you would respond to it now.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'habits-and-resilience',
      type: 'lesson',
      title: 'Habits that build emotional resilience',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'habits-intro',
            title: 'From insight to habit',
            blocks: [
              {
                id: 'habits-text',
                type: 'text',
                body: "Understanding emotional intelligence is the easy part. Changing how you actually react, on a hard Tuesday when you are tired and someone pushes your buttons, takes practice. Practice means habits.\n\nThis lesson is about how habits form, why old ones are hard to break, and how to design small new ones you will actually keep.",
              },
              {
                id: 'habit-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'wr6fQ4KpbRM',
                title: 'Why is it so hard to break a bad habit?',
                channel: 'TED-Ed',
                durationS: 303,
                caption: 'Watch for the role that cues and rewards play in keeping habits going. Your new emotional habits will need both.',
              },
            ],
          },
          {
            id: 'habit-shape',
            title: 'The shape of a good habit',
            blocks: [
              {
                id: 'habit-framework',
                type: 'framework',
                title: 'Design a habit you will keep',
                steps: [
                  { label: 'Pick a cue', detail: 'Tie the habit to something that already happens: a trigger, a time of day, a regular meeting.' },
                  { label: 'Make it tiny', detail: 'So small you cannot fail: three breaths, one sentence in a notebook, one question.' },
                  { label: 'Write it as “When…, I will…”', detail: '“When I feel my face get hot in a meeting, I will take three slow breaths before speaking.”' },
                  { label: 'Track it', detail: 'A tick on a calendar or a note in your phone. Seeing progress keeps you going.' },
                  { label: 'Get a partner', detail: 'Someone who checks in weekly and whom you can be honest with.' },
                ],
              },
              {
                id: 'habit-proverb',
                type: 'quote',
                text: 'Little by little, the bird builds its nest.',
                attribution: 'French proverb, widely used across West Africa',
              },
            ],
          },
          {
            id: 'strong-habit',
            title: 'Which habit will stick?',
            blocks: [
              {
                id: 'habit-choice',
                type: 'choice',
                prompt: 'Thabo wants to stop snapping at his instructors when he is stressed. Which habit is best designed?',
                multiple: false,
                options: [
                  { id: 'vague', text: '“I will be calmer and more patient.”', correct: false, feedback: 'A wish, not a habit. There is no cue and no action.' },
                  { id: 'huge', text: '“I will meditate for an hour every morning.”', correct: false, feedback: 'Possibly helpful, but too big to start with. Most people drop habits this size within a week.' },
                  { id: 'good', text: '“When I notice my jaw clench while talking to an instructor, I will say ‘give me a minute’ and take three slow breaths before I reply.”', correct: true, feedback: 'Yes. A clear cue, a tiny action and a specific situation.' },
                  { id: 'avoid', text: '“I will avoid talking to my instructors when I am stressed.”', correct: false, feedback: 'Avoidance might reduce snapping, but it damages the team. Better to change how he responds.' },
                ],
                explanation:
                  "Cue, tiny action, specific situation. Habits written like this are far easier to keep, and to check whether you kept them.",
              },
            ],
          },
          {
            id: 'build-order',
            title: 'Building a habit',
            blocks: [
              {
                id: 'build-order-block',
                type: 'order',
                prompt: 'Put these steps for building a new emotional habit in order.',
                items: [
                  { id: 'pattern', text: 'Pick a pattern you want to change, from your journal' },
                  { id: 'cue', text: 'Identify the cue that sets it off' },
                  { id: 'action', text: 'Choose a tiny new action for that cue' },
                  { id: 'write', text: 'Write it as “When…, I will…”' },
                  { id: 'track', text: 'Track it daily and review it weekly with a partner' },
                ],
                explanation:
                  "Start from your real patterns, not from a list of virtues. The habit should fit your life, not someone else’s.",
              },
            ],
          },
          {
            id: 'setbacks',
            title: 'When you slip',
            blocks: [
              {
                id: 'slip-callout',
                type: 'callout',
                tone: 'insight',
                title: 'Missing once is normal',
                body: "You will slip. You will snap at someone, or forget to breathe, or skip your check-in. That is not failure. It is part of how habits form.\n\nThe most important rule: **never miss twice**. When you slip, notice it, be kind to yourself, and do the habit next time. Resilience is not never falling. It is getting up quickly.",
              },
              {
                id: 'end-scale',
                type: 'scale',
                prompt: 'Now, at the end of the course: when a strong emotion hits you, how well do you think you will manage what you say and do next?',
                minLabel: 'It will still run me',
                maxLabel: 'I will usually stay steady',
                afterword:
                  "Compare this with your answer at the start. Whatever the difference, the real test is in the weeks ahead. Your Growth Plan is how you will practise.",
              },
            ],
          },
          {
            id: 'draft-habits',
            title: 'Draft your three habits',
            blocks: [
              {
                id: 'habits-reflection',
                type: 'reflection',
                prompt: 'Draft three habits for your Growth Plan, one for each of three different areas, such as noticing emotions, managing stress, listening or feedback. Write each one as “When [cue], I will [tiny action]”, and say who will help you keep them.',
                guidance: 'Look back at your earlier reflections: your triggers, your pressure, your pause plan and your feedback habit. The best habits come from there.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'relationships-quiz',
      type: 'quiz',
      title: 'Module quiz: Empathy, listening and feedback',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Four questions on listening, feedback and habits. You need 75% to pass and you can retake it as many times as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'q-rasa',
            type: 'order',
            prompt: 'Put the four RASA moves in order.',
            items: [
              { id: 'receive', text: 'Receive' },
              { id: 'appreciate', text: 'Appreciate' },
              { id: 'summarise', text: 'Summarise' },
              { id: 'ask', text: 'Ask' },
            ],
            explanation: 'Receive, Appreciate, Summarise, Ask. Summarising is the move most people skip, and the one that most makes people feel heard.',
          },
          {
            id: 'q-empathy',
            type: 'choice',
            prompt: 'Which statement about empathy is accurate?',
            multiple: false,
            options: [
              { id: 'a', text: 'Empathy means agreeing with the other person', correct: false, feedback: 'You can understand someone deeply and still disagree.' },
              { id: 'b', text: 'Empathy means understanding someone’s experience well enough to say it back to them', correct: true },
              { id: 'c', text: 'Empathy means feeling sorry for someone', correct: false, feedback: 'That is closer to sympathy, which can feel distant.' },
              { id: 'd', text: 'Empathy is something you either have or do not', correct: false, feedback: 'Empathy can be practised, through listening and curiosity.' },
            ],
            explanation: 'Understanding, not agreement. That is what made Mr Okon feel heard.',
          },
          {
            id: 'q-feedback',
            type: 'match',
            prompt: 'Match each part of feedback to an example.',
            pairs: [
              { id: 'microyes', left: 'Micro-yes', right: '“Do you have a few minutes for some thoughts on the pitch?”' },
              { id: 'data', left: 'Data point', right: '“You read from the slides for most of the twenty minutes.”' },
              { id: 'impact', left: 'Impact', right: '“The donors stopped making eye contact.”' },
              { id: 'question', left: 'Question', right: '“How did it feel from where you were standing?”' },
            ],
            explanation: 'Ask, describe, explain the effect, invite their view.',
          },
          {
            id: 'q-habit',
            type: 'choice',
            prompt: 'Which is a well-designed habit?',
            multiple: false,
            options: [
              { id: 'a', text: '“I will be a better listener.”', correct: false, feedback: 'No cue and no action.' },
              { id: 'b', text: '“When someone in my team raises a problem, I will summarise it back before I respond.”', correct: true },
              { id: 'c', text: '“I will read ten books on emotional intelligence this month.”', correct: false, feedback: 'Reading helps understanding, but it is not a practice habit.' },
              { id: 'd', text: '“I will never get angry again.”', correct: false, feedback: 'Impossible, and it treats a normal emotion as a failure.' },
            ],
            explanation: 'When [cue], I will [tiny action]. Specific, small and checkable.',
          },
        ],
      },
    },
    {
      key: 'growth-plan',
      type: 'assignment',
      title: 'Practical Output: your Emotional Intelligence Growth Plan',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: your **Emotional Intelligence Growth Plan**, a personal map of your strengths, triggers and patterns, with three specific habits you will practise for the rest of the Lab and how you will track them.\n\nYou have drafted most of it in your journal. Now bring it together. Your plan should be honest, specific and practical. A plan full of good intentions is easy to write. A plan you will actually follow is harder, and far more valuable.\n\nYou decide how much personal detail to include. Reviewers are looking for self-awareness and practical design, not for private information.\n\nYour Growth Plan joins your Dream Lab portfolio and forms part of your Life Architecture Blueprint. A faculty reviewer will grade it against the rubric below.",
        practicalOutput: 'Emotional Intelligence Growth Plan',
        steps: [
          'Reread your journal reflections from this course: your regretted moment, emotions and triggers, pressure, pause plan, listening and feedback practice, and draft habits.',
          'Ask one or two people you trust: “When I’m under pressure, how do I come across?” and “How well do I listen?” Note what they say without arguing.',
          'Rate yourself honestly across the four domains, with one example of each.',
          'Choose three habits that address your most important patterns. Write each as “When [cue], I will [tiny action]”.',
          'Decide how you will track them, and ask someone to be your accountability partner for the rest of the Lab.',
          'Fill in every section of the template below.',
          'Submit, and do your first habit within 24 hours.',
        ],
        rubric: [
          { id: 'self-awareness', criterion: 'Honest self-assessment', description: 'Describes strengths and weaker areas across the four domains with concrete examples, including input from at least one other person.' },
          { id: 'patterns', criterion: 'Patterns and triggers', description: 'Names emotions precisely and identifies specific triggers and body signals, showing genuine insight into personal patterns.' },
          { id: 'pressure', criterion: 'Stress and support', description: 'Identifies the main pressures, the signs they are building and realistic sources of support.' },
          { id: 'habits', criterion: 'Well-designed habits', description: 'Three habits, each with a clear cue and a small, specific action, linked to the patterns identified and covering more than one domain.' },
          { id: 'tracking', criterion: 'Tracking and accountability', description: 'A simple, realistic tracking method, a named accountability partner and a clear sign of what progress will look like by the end of the Lab.' },
        ],
        template: growthPlanTemplate,
        minWords: 200,
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
          "Nine questions across the whole course: self-awareness, self-management, empathy, listening, feedback and habits. Several follow a new case.\n\nYou need 75% to pass and you can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-name',
            type: 'choice',
            prompt: 'New case: Sena runs a catering business in Lomé. A big client cancels a wedding order two days before the event, and refuses to pay the deposit she spent on ingredients. She tells a friend she feels “stressed”. Which is the most precise and useful name for what she is probably feeling?',
            multiple: false,
            options: [
              { id: 'a', text: 'Anger at being treated unfairly, and anxiety about the money', correct: true },
              { id: 'b', text: 'Tired', correct: false, feedback: 'She may be tired too, but that misses what the event means to her.' },
              { id: 'c', text: 'Fine', correct: false, feedback: 'That denies the feeling altogether.' },
              { id: 'd', text: 'Bored', correct: false, feedback: 'Nothing in the situation suggests boredom.' },
            ],
            explanation: 'Two emotions, two responses. Anger points to a firm conversation about the contract. Anxiety points to a plan for the money.',
          },
          {
            id: 'f-case-pause',
            type: 'order',
            prompt: 'Sena is about to call the client. Put her pause in order.',
            items: [
              { id: 'notice', text: 'Notice her hands shaking and her chest tight' },
              { id: 'name', text: 'Name it: “I’m angry and frightened about the money”' },
              { id: 'breathe', text: 'Take three slow breaths' },
              { id: 'ask', text: 'Ask: “What do I actually want from this call?”' },
              { id: 'choose', text: 'Choose to ask calmly for the deposit, citing the written agreement' },
            ],
            explanation: 'What she wants is the deposit back and her reputation intact, not to win a shouting match. The pause keeps her pointed at that.',
          },
          {
            id: 'f-case-reappraise',
            type: 'choice',
            prompt: 'That night Sena thinks: “My business is finished. I’m useless at this.” Which reappraisal is most helpful?',
            multiple: false,
            options: [
              { id: 'a', text: '“This is one bad client. I need a clearer cancellation policy, and I can start it this week.”', correct: true },
              { id: 'b', text: '“Everything is fine. I shouldn’t feel bad.”', correct: false, feedback: 'Forced positivity. Something genuinely bad happened.' },
              { id: 'c', text: '“All clients are dishonest.”', correct: false, feedback: 'A hasty generalisation, and not useful.' },
              { id: 'd', text: '“I should close the business before it gets worse.”', correct: false, feedback: 'A big decision driven by a fresh emotion.' },
            ],
            explanation: 'Accurate and useful: it accepts the setback and points to an action within her control.',
          },
          {
            id: 'f-domains',
            type: 'match',
            prompt: 'Match each of Sena’s actions to its domain of emotional intelligence.',
            pairs: [
              { id: 'aware', left: 'Recognising she is more frightened than angry', right: 'Self-awareness' },
              { id: 'manage', left: 'Waiting until morning to reply to the client’s rude message', right: 'Self-management' },
              { id: 'social', left: 'Noticing her assistant has gone quiet and seems worried about her job', right: 'Social awareness' },
              { id: 'relate', left: 'Talking honestly with her assistant about what the cancellation means for them both', right: 'Relationship skills' },
            ],
            explanation: 'The four domains work together. Notice in yourself, manage yourself, notice in others, act well together.',
          },
          {
            id: 'f-listen',
            type: 'choice',
            prompt: 'Sena’s assistant says: “I’m scared you’ll let me go.” Which response shows the best listening?',
            multiple: false,
            options: [
              { id: 'a', text: '“So you’re worried this cancellation means you’ll lose your job. Tell me more about what’s on your mind.”', correct: true },
              { id: 'b', text: '“Don’t be silly, stop worrying.”', correct: false, feedback: 'Dismisses the feeling instead of hearing it.' },
              { id: 'c', text: '“I’m the one who should be scared. I lost the money.”', correct: false, feedback: 'Turns the conversation back to Sena.' },
              { id: 'd', text: '“Let’s talk about the next order.”', correct: false, feedback: 'Changes the subject before the worry is heard.' },
            ],
            explanation: 'Summarise, then ask. The assistant feels heard, and Sena learns what is really worrying her.',
          },
          {
            id: 'f-feedback',
            type: 'choice',
            prompt: 'Sena needs to tell her assistant that he forgot to get the client’s signature on the order form. Which is the best data point?',
            multiple: false,
            options: [
              { id: 'a', text: '“The order form for the wedding wasn’t signed by the client.”', correct: true },
              { id: 'b', text: '“You’re careless with paperwork.”', correct: false, feedback: 'A label about character.' },
              { id: 'c', text: '“You never follow procedures.”', correct: false, feedback: '“Never” is almost always untrue.' },
              { id: 'd', text: '“Some things might have been missed.”', correct: false, feedback: 'Too vague to act on.' },
            ],
            explanation: 'A camera could have recorded it. Specific, checkable and about the work, not the person.',
          },
          {
            id: 'f-receive',
            type: 'choice',
            prompt: 'A friend tells Sena she sometimes sounds harsh with suppliers. Which responses show good habits for receiving feedback? Select all that apply.',
            multiple: true,
            options: [
              { id: 'example', text: 'Asking for a specific example', correct: true },
              { id: 'thank', text: 'Thanking her and taking time to think it over', correct: true },
              { id: 'useful', text: 'Looking for the useful part even if the delivery was clumsy', correct: true },
              { id: 'attack', text: 'Pointing out that the friend is also harsh sometimes', correct: false, feedback: 'True or not, it turns feedback into a fight.' },
            ],
            explanation: 'People who receive feedback well get more of it, and grow faster.',
          },
          {
            id: 'f-stress',
            type: 'choice',
            prompt: 'Which are signs that stress may be building up for Sena over the following weeks? Select all that apply.',
            multiple: true,
            options: [
              { id: 'sleep', text: 'Lying awake replaying the cancellation', correct: true },
              { id: 'snap', text: 'Snapping at her family over small things', correct: true },
              { id: 'withdraw', text: 'Avoiding friends’ calls', correct: true },
              { id: 'policy', text: 'Writing a new cancellation policy', correct: false, feedback: 'That is a healthy, practical response, not a warning sign.' },
            ],
            explanation: 'Sleep, mood and withdrawal. If they last, it is time to lean on support, and to seek professional help if needed.',
          },
          {
            id: 'f-habit',
            type: 'choice',
            prompt: 'Which habit is best designed for Sena?',
            multiple: false,
            options: [
              { id: 'a', text: '“When a client message makes my chest tighten, I will wait at least an hour before replying.”', correct: true },
              { id: 'b', text: '“I will stay calm with clients.”', correct: false, feedback: 'No cue and no action.' },
              { id: 'c', text: '“I will never take another wedding order.”', correct: false, feedback: 'A reaction to one event, not a habit.' },
              { id: 'd', text: '“I will do yoga for two hours every day.”', correct: false, feedback: 'Too big to keep while running a business.' },
            ],
            explanation: 'Cue, tiny action, specific situation. That is a habit she can keep, and track.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const emotionalIntelligence: CourseAuthoring = {
  slug: 'emotional-intelligence',
  title: 'Emotional Intelligence',
  subtitle: 'Understand your emotions, read other people well and stay steady when the pressure rises.',
  description:
    "Talent gets you in the room. Emotional intelligence decides what happens once you are there. How you handle rejection, conflict, stress and other people’s feelings shapes your relationships, your leadership and your ventures.\n\nThis course covers the core of emotional intelligence: self-awareness, self-management, empathy and relationship skills. You will learn to name what you feel with more precision, to notice your triggers, to pause before you react, to listen so people feel heard, and to give and receive hard feedback without damage. You will also look honestly at the pressures many young Africans carry: family expectations, financial strain, uncertainty about the future, and the weight of being “the one who made it”.\n\nThe course is practical and private where it needs to be. Your reflections stay in your journal, and you choose what to share.\n\nYour Practical Output is an **Emotional Intelligence Growth Plan**: a personal map of your strengths, triggers and patterns, with three specific habits you will practise for the rest of the Lab and how you will track them.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 5,
  outcomes: [
    'Name and understand your emotions with greater precision, and recognise your common triggers.',
    'Use practical techniques to manage stress, frustration and setbacks.',
    'Listen with empathy and read what others feel, including across cultures and generations.',
    'Give and receive difficult feedback in ways that strengthen relationships.',
    'Design and track personal habits that build emotional resilience.',
  ],
  skills: ['Self-awareness', 'Self-regulation', 'Empathy', 'Active listening', 'Feedback', 'Resilience'],
  audience: 'Anyone in the Lab who wants stronger relationships, steadier leadership and better ways to cope with pressure, at work, in ventures and at home.',
  prerequisites: 'None.',
  practicalOutput: 'Emotional Intelligence Growth Plan',
  cover: {
    from: '#123B2F',
    to: '#3CB795',
    symbol: '●',
    imageUrl: "https://images.unsplash.com/photo-1700687530335-b71cd1d926ee?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "A group of young adults sit in a circle of chairs, talking animatedly and laughing together.",
    imageCredit: "Photo: Ben Iwara / Unsplash",
  },
  trailer: {
    provider: 'youtube',
    videoId: '1Evwgu369Jw',
    title: "Brené Brown on Empathy",
    channel: "Royal Society of Arts",
    durationS: 173,
  },
  instructors: [
    {
      name: 'The African Dream Lab Faculty',
      title: 'Life Architecture faculty',
      bio: 'The Life Architecture faculty of The African Dream Lab brings together educators, coaches, founders and practitioners from across the continent. They teach the habits of mind every builder needs, including how to lead yourself and others under pressure. The Lab is run by the African Dream Network and grew out of the TADIS conference.',
    },
  ],
  modules: [moduleSelfAwareness, moduleSelfManagement, moduleRelationships],
};

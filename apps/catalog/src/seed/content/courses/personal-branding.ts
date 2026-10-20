import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Personal Branding: a Builder’s Architecture course of The African Dream Lab (week 7, 4 credits).
 *
 * Builds on the Personal Values Charter (Character Formation and Ethics) and the Signature Talk
 * (Communication). Recurring cast, all fictional:
 *   Adaeze  a self-taught UX designer in Enugu looking for remote clients
 *   Baraka  a youth climate organiser in Dar es Salaam applying for fellowships and funding
 *   Fatou   founder of a small fashion label in Dakar (also met in Problem Solving)
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Positioning: what you want to be known for
// ---------------------------------------------------------------------------

const modulePositioning: Module = {
  key: 'positioning',
  title: 'Positioning: what you want to be known for',
  summary:
    'See that you already have a brand, decide what you want to be known for and by whom, and write an honest positioning statement and spoken introduction grounded in your values.',
  weekNo: 7,
  items: [
    {
      key: 'brand-already-exists',
      type: 'lesson',
      title: 'Your brand already exists',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'already',
            title: 'People already have an impression of you',
            blocks: [
              {
                id: 'already-text',
                type: 'text',
                body: "Welcome to Personal Branding.\n\nWhether you like the phrase or not, people already have an impression of you. It comes from your profile picture, your posts, how you show up to meetings, whether you deliver on time, and what others say about you when you are not in the room.\n\nThat impression is your personal brand. You cannot avoid having one. You can only choose whether to shape it **honestly and deliberately**, or leave it to chance.\n\nThis short talk to young people explains what personal branding is, and what it is not.",
              },
              {
                id: 'already-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'I_1x5jxKPRo',
                title: 'What Personal Branding Is Not and What It Should Be | Caryn Foster Durham | TEDxYouth@RVA',
                channel: 'TEDx Talks',
                durationS: 247,
                caption: "Caryn Foster Durham, a marketing professional, talks to young people about how they see themselves and how others see them. Listen for what she says personal branding should be built on.",
              },
            ],
          },
          {
            id: 'comfort',
            title: 'How does this feel?',
            blocks: [
              {
                id: 'comfort-scale',
                type: 'scale',
                prompt: 'How comfortable do you feel about the idea of building a personal brand?',
                minLabel: 'It feels fake or boastful',
                maxLabel: 'It feels natural',
                afterword:
                  "Many people start near the bottom. In many of our cultures, modesty is a virtue and self-promotion feels rude. This course does not ask you to boast. It asks you to make your real work and values easy for the right people to see.",
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
                title: 'Adaeze, UX designer, Enugu',
                body: "Adaeze taught herself user-experience design over two years, using free courses and redesigning apps she used every day. She is good. Friends ask her to fix their websites.\n\nShe wants paid remote work with start-ups across Africa and beyond. She has sent dozens of applications and heard almost nothing back.\n\nHer online profile still says “Biochemistry graduate | Open to opportunities”. Her best work sits in a folder on her laptop. Her public posts are mostly football banter.",
              },
              {
                id: 'adaeze-reveal',
                type: 'reveal',
                prompt: 'Imagine a start-up founder in Accra looks Adaeze up after reading her application. What impression do they get? Think, then tap.',
                body: "They see a biochemistry graduate who is “open to opportunities”, with no visible design work and a lot of football opinions. Nothing tells them she is a skilled UX designer.\n\nAdaeze’s problem is not her talent. It is that **her talent is invisible to the people she wants to reach**. That gap, between who you are and what people can see, is what personal branding closes.",
              },
            ],
          },
          {
            id: 'sources',
            title: 'Where impressions come from',
            blocks: [
              {
                id: 'sources-text',
                type: 'text',
                body: "Your brand is built from four sources:\n\n1. **What you do**: your work, your reliability, how you treat people.\n2. **What you say**: how you introduce yourself, what you write and post.\n3. **What you show**: your profiles, portfolio, photos, the evidence of your work.\n4. **What others say**: recommendations, introductions, reputation passed from person to person.\n\nThe last one matters most and you control it least. You influence it through the first three.",
              },
              {
                id: 'sources-choice',
                type: 'choice',
                prompt: 'Which of these shape Adaeze’s personal brand? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'deadline', text: 'Whether she delivered her friend’s website on the date she promised', correct: true, feedback: 'Yes. What you do, especially reliability, is the foundation of reputation.' },
                  { id: 'posts', text: 'Her football banter on her public profile', correct: true, feedback: 'Yes. It is not wrong, but it is currently the main thing strangers see.' },
                  { id: 'recommend', text: 'What her friend says when someone asks, “Do you know a good designer?”', correct: true, feedback: 'Yes. Word of mouth is often the most powerful brand of all.' },
                  { id: 'private', text: 'The private notes she keeps on her laptop', correct: false, feedback: 'Nobody sees these, so they do not shape impressions, unless she chooses to share some of her thinking.' },
                ],
                explanation:
                  "A brand is not a logo or a slogan. It is the sum of experiences people have of you, directly and through others. That is why it cannot be faked for long, and why it is worth building on purpose.",
              },
            ],
          },
          {
            id: 'honest',
            title: 'Honest, not fake',
            blocks: [
              {
                id: 'honest-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Build on who you actually are',
                body: "The strongest personal brands are not invented. They are **discovered and then made visible**. Your Personal Values Charter from Character Formation and Ethics tells you what you stand for. Your Signature Talk from Communication shows how you sound when you speak about what matters to you. This course builds on both.\n\nIf your brand promises something your work and character cannot deliver, it will eventually break, usually at the worst moment.",
              },
              {
                id: 'hardest-poll',
                type: 'poll',
                prompt: 'What feels hardest about personal branding for you right now?',
                options: [
                  { id: 'boast', text: 'Talking about myself without feeling boastful' },
                  { id: 'what', text: 'Knowing what I want to be known for' },
                  { id: 'proof', text: 'Having enough work or proof to show' },
                  { id: 'time', text: 'Finding time to post or update profiles' },
                  { id: 'safety', text: 'Worrying about privacy, safety or criticism' },
                ],
                afterword:
                  "Each of these has a lesson in this course. Notice which answer most of your classmates chose. You are not alone in it.",
              },
            ],
          },
          {
            id: 'search-yourself',
            title: 'Search yourself',
            blocks: [
              {
                id: 'search-text',
                type: 'text',
                body: "Try this today. Search your full name in a search engine and on the two or three platforms where people in your field look. Look at your profiles as a stranger would.\n\nAsk: if this were all someone knew about me, what would they think I do, care about and am good at?",
              },
              {
                id: 'search-reflection',
                type: 'reflection',
                prompt: 'Describe what a stranger would conclude about you from your current online presence. Then describe, in two or three sentences, the impression you would like the right people to have instead.',
                guidance: 'Be honest and kind to yourself. The gap you describe here is the starting point for your Personal Brand Kit.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'positioning-statement',
      type: 'lesson',
      title: 'Writing your positioning statement',
      minutes: 17,
      required: true,
      payload: {
        steps: [
          {
            id: 'what-positioning',
            title: 'What is positioning?',
            blocks: [
              {
                id: 'positioning-text',
                type: 'text',
                body: "**Positioning** is the place you want to hold in the minds of the people who matter to your path. It answers three questions in one breath: **what you do, for whom, and why you are credible.**\n\nYou do not need to be the best in the world. You need to be clearly useful to a specific group of people, and easy to remember.\n\nIn this short lecture, Dorie Clark, a writer and teacher on personal branding, explains how to take control of your brand.",
              },
              {
                id: 'positioning-video',
                type: 'video',
                provider: 'youtube',
                videoId: '94vp1dl3iGY',
                title: 'Developing Your Personal Brand (Part 1)',
                channel: 'Dorie Clark | Personal Branding & Strategy',
                durationS: 283,
                caption: "Dorie Clark explains what a personal brand is and how it shapes your reputation. Listen for how she connects your brand to what other people say and remember about you.",
              },
            ],
          },
          {
            id: 'formula',
            title: 'A simple formula',
            blocks: [
              {
                id: 'formula-framework',
                type: 'framework',
                title: 'The positioning statement',
                steps: [
                  { label: 'Who', detail: 'The specific people you serve or want to reach. Not “everyone”.' },
                  { label: 'What', detail: 'The problem you solve or value you create for them.' },
                  { label: 'How', detail: 'Your approach, skills or angle: what makes your way distinctive.' },
                  { label: 'Proof', detail: 'Why they should believe you: work done, results, experience, values in action.' },
                ],
              },
              {
                id: 'formula-example',
                type: 'example',
                title: 'Adaeze, before and after',
                body: "**Before:** “Biochemistry graduate | Open to opportunities.”\n\n**After:** “I help early-stage African fintech and health start-ups make their apps simple enough for first-time smartphone users. I research with real users, design in Figma and test on low-end phones. I have redesigned three apps used by traders in Enugu, one of which cut sign-up drop-off in our test group by half.”\n\nThe new version says **who** (early-stage African fintech and health start-ups), **what** (simpler apps for first-time users), **how** (user research, design, testing on low-end phones) and **proof** (three redesigns and a tested result).",
              },
            ],
          },
          {
            id: 'strongest',
            title: 'Pick the strongest',
            blocks: [
              {
                id: 'strongest-choice',
                type: 'choice',
                prompt: 'Baraka organises young people around climate action in Dar es Salaam and is applying for a fellowship. Which positioning statement is strongest?',
                multiple: false,
                options: [
                  { id: 'passion', text: '“I am passionate about saving the planet.”', correct: false, feedback: 'Sincere, but it says nothing about what he does, for whom, or why anyone should believe him.' },
                  { id: 'titles', text: '“Activist. Leader. Visionary. Change-maker.”', correct: false, feedback: 'A list of big titles with no proof feels boastful and is easy to forget.' },
                  {
                    id: 'specific',
                    text: '“I organise secondary-school students in Dar es Salaam to run neighbourhood clean-ups and tree-planting days. In two years our network has grown to 14 school clubs, and we now partner with two ward offices.”',
                    correct: true,
                    feedback: 'Yes. Specific people, specific action, visible proof, and nothing he cannot back up.',
                  },
                  { id: 'everything', text: '“I work on climate, education, health, youth employment and governance.”', correct: false, feedback: 'Trying to be known for everything means being remembered for nothing.' },
                ],
                explanation:
                  "Specific beats grand. A reader can picture Baraka’s work, check it and repeat it to someone else. That last part matters: a good positioning statement is one other people can **pass on** about you.",
              },
            ],
          },
          {
            id: 'match-parts',
            title: 'Spot the parts',
            blocks: [
              {
                id: 'parts-match',
                type: 'match',
                prompt: 'Fatou’s statement reads: “I design modern, wearable clothes from Senegalese wax prints for young professional women in Dakar, made by a team of six local tailors. Our first collection sold out in three weeks.” Match each phrase to its part.',
                pairs: [
                  { id: 'who', left: '“for young professional women in Dakar”', right: 'Who' },
                  { id: 'what', left: '“modern, wearable clothes from Senegalese wax prints”', right: 'What' },
                  { id: 'how', left: '“made by a team of six local tailors”', right: 'How' },
                  { id: 'proof', left: '“Our first collection sold out in three weeks”', right: 'Proof' },
                ],
                explanation:
                  "Fatou’s statement also carries her values without announcing them: local makers, local fabric, clothes for real working lives. Values are most convincing when they show up in the details, not in adjectives.",
              },
            ],
          },
          {
            id: 'say-it',
            title: 'Say it out loud',
            blocks: [
              {
                id: 'say-it-text',
                type: 'text',
                body: "Your positioning statement is written. But most of the time you will **say** it: at an event, in an interview, when an aunt asks what you actually do. A spoken introduction should be shorter, warmer and easier to remember.\n\nThis video offers a simple formula for introducing yourself well, from body language to the words you choose.",
              },
              {
                id: 'say-it-video',
                type: 'video',
                provider: 'youtube',
                videoId: '5c5P8YQeymI',
                title: 'A Formula for Introducing Yourself Perfectly Every Time',
                channel: 'Vanessa Van Edwards',
                durationS: 310,
                caption: "Vanessa Van Edwards on introducing yourself with confidence. Some of her body-language advice reflects American norms; adapt greetings and eye contact to the culture and the person in front of you.",
              },
              {
                id: 'say-it-order',
                type: 'order',
                prompt: 'Put the parts of a short spoken introduction in a natural order.',
                items: [
                  { id: 'greet', text: 'Greet the person in a way that fits the setting and culture' },
                  { id: 'name', text: 'Say your name clearly, without rushing it' },
                  { id: 'what', text: 'Say what you do and for whom, in one sentence' },
                  { id: 'proof', text: 'Add one concrete example or result' },
                  { id: 'question', text: 'Turn it back with a genuine question about them' },
                ],
                explanation:
                  "Ending with a question turns an introduction into a conversation. People remember how you made them feel as much as what you said, and being interested in others is the fastest way to be interesting.",
              },
            ],
          },
          {
            id: 'niche',
            title: 'Isn’t narrowing down risky?',
            blocks: [
              {
                id: 'niche-reveal',
                type: 'reveal',
                prompt: 'Adaeze worries: “If I say I design for fintech and health start-ups, won’t I lose other clients?” What do you think?',
                body: "Usually the opposite happens. A clear focus makes you **easier to remember and easier to recommend**. “The designer who makes apps simple for first-time smartphone users” is something a founder can repeat. “A designer” is not.\n\nPositioning is not a prison. Adaeze can still accept other work. And as she grows, her positioning can change. You are choosing what to lead with now, not what you will do for ever.",
              },
              {
                id: 'niche-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Test it on three people',
                body: "Say your positioning statement to three people who do not know your work well. Then ask each: “What would you tell someone else I do?” If their answers match what you intended, it works. If not, simplify.",
              },
            ],
          },
          {
            id: 'draft-statement',
            title: 'Draft your statement',
            blocks: [
              {
                id: 'statement-reflection',
                type: 'reflection',
                prompt: 'Write your positioning statement using who, what, how and proof. Then write a two-sentence spoken version you could say when someone asks, “So, what do you do?”',
                guidance: 'Draw on your Values Charter and Signature Talk. Only claim what you can back up today. If your proof is thin, name the work you are doing to build it.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'positioning-quiz',
      type: 'quiz',
      title: 'Module quiz: positioning',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on personal brands and positioning. You need 70% to pass and can retake it as often as you like. Read each explanation, even when you get it right.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-what-brand',
            type: 'choice',
            prompt: 'Which description of a personal brand matches this course?',
            multiple: false,
            options: [
              { id: 'a', text: 'A logo and colour scheme for your social media', correct: false, feedback: 'Visual consistency helps, but it is the surface, not the brand.' },
              { id: 'b', text: 'The impression people hold of you, built from what you do, say, show and what others say', correct: true },
              { id: 'c', text: 'Something only influencers and celebrities need', correct: false, feedback: 'Everyone has a brand. The question is whether it reflects them accurately.' },
              { id: 'd', text: 'A way of making yourself look better than you are', correct: false, feedback: 'That is spin, and it breaks under scrutiny.' },
            ],
            explanation: 'Your brand is your reputation, made visible. You shape it honestly by making your real work and values easy to see.',
          },
          {
            id: 'q-parts',
            type: 'order',
            prompt: 'Put the four parts of a positioning statement in the order taught.',
            items: [
              { id: 'who', text: 'Who' },
              { id: 'what', text: 'What' },
              { id: 'how', text: 'How' },
              { id: 'proof', text: 'Proof' },
            ],
            explanation: 'Who you serve, what value you create, how you do it, and the proof that you can.',
          },
          {
            id: 'q-weak',
            type: 'choice',
            prompt: 'What is the main weakness of “Entrepreneur | Visionary | Passionate about Africa”?',
            multiple: false,
            options: [
              { id: 'a', text: 'It is too long', correct: false, feedback: 'It is short. The problem is what it leaves out.' },
              { id: 'b', text: 'It names no audience, no specific value and no proof', correct: true },
              { id: 'c', text: 'It mentions Africa', correct: false, feedback: 'Mentioning Africa is fine. Being vague about what you do is the problem.' },
              { id: 'd', text: 'It uses vertical bars', correct: false, feedback: 'Formatting is not the issue.' },
            ],
            explanation: 'Big labels without specifics are hard to believe and impossible to repeat. Swap adjectives for who, what, how and proof.',
          },
          {
            id: 'q-match',
            type: 'match',
            prompt: 'Match each phrase from a statement to its part.',
            pairs: [
              { id: 'who', left: '“smallholder maize farmers in Northern Ghana”', right: 'Who' },
              { id: 'what', left: '“get fair prices at harvest”', right: 'What' },
              { id: 'how', left: '“through SMS price alerts in Dagbani and English”', right: 'How' },
              { id: 'proof', left: '“used by 400 farmers in our first season”', right: 'Proof' },
            ],
            explanation: 'Each part does a job. Together they let a stranger picture the work and repeat it to someone else.',
          },
          {
            id: 'q-niche',
            type: 'choice',
            prompt: 'Why does a focused positioning usually help more than a broad one?',
            multiple: false,
            options: [
              { id: 'a', text: 'It stops you from ever doing other kinds of work', correct: false, feedback: 'Positioning is what you lead with, not a ban on everything else.' },
              { id: 'b', text: 'It makes you easier to remember and to recommend', correct: true },
              { id: 'c', text: 'Platforms only allow one topic per profile', correct: false, feedback: 'No such rule. The benefit is about human memory.' },
              { id: 'd', text: 'It guarantees more clients', correct: false, feedback: 'Nothing guarantees results, but clarity makes them more likely.' },
            ],
            explanation: 'People recommend what they can describe. A clear focus gives them the words.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Presence: profiles and content
// ---------------------------------------------------------------------------

const modulePresence: Module = {
  key: 'presence',
  title: 'Presence: bios, profiles and content',
  summary:
    'Write a professional bio in short and long versions, build a consistent profile on the platforms that matter for your path, and create content that shows how you think.',
  weekNo: 7,
  items: [
    {
      key: 'bios-profiles',
      type: 'lesson',
      title: 'Bios and profiles that work',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'bio-basics',
            title: 'Your bio does the talking when you are not there',
            blocks: [
              {
                id: 'bio-text',
                type: 'text',
                body: "A bio is the paragraph people read before they meet you: on a profile, a speaker list, a grant application, a programme brochure. It is your positioning statement, expanded into a short story.\n\nYou need two versions:\n\n- **Short** (about 40 to 60 words): for profiles, event programmes and introductions.\n- **Long** (about 120 to 200 words): for applications, websites and speaker pages.\n\nThis short video shows how to write a short professional bio, with examples.",
              },
              {
                id: 'bio-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'LzoGkirDr6Q',
                title: 'How to Write a Short Professional Bio (with Examples and Templates)',
                channel: 'Teal',
                durationS: 227,
                caption: "A practical guide to short professional bios, with templates. Watch for the order of information, and notice when first person or third person is used.",
              },
            ],
          },
          {
            id: 'adaeze-bios',
            title: 'Adaeze’s two bios',
            blocks: [
              {
                id: 'laptop-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Person_works_on_laptop_while_holding_smartphone_in_living_room.jpg/1280px-Person_works_on_laptop_while_holding_smartphone_in_living_room.jpg',
                alt: 'Seen from above, a person sitting on a sofa types on a laptop with one hand while holding a smartphone in the other.',
                caption: 'Most people will meet your bio on a screen, often a small one, before they ever meet you.',
                credit: 'Photo: Shixart1985 / Wikimedia Commons, CC BY 2.0',
              },
              {
                id: 'bios-example',
                type: 'example',
                title: 'Short and long',
                body: "**Short (third person, 51 words):**\n\n“Adaeze Okafor is a UX designer in Enugu who helps African fintech and health start-ups make their apps simple for first-time smartphone users. She researches with real users and tests on low-end phones. Her redesign of a trader savings app halved sign-up drop-off in testing. She is open to remote projects.”\n\n**Long (first person, opening lines):**\n\n“I became a designer by accident. Watching my mother give up on a banking app at her shop in Ogbete Market, I realised the problem was not her: it was the design. I taught myself UX over two years, redesigning apps that traders around me used every day…”",
              },
            ],
          },
          {
            id: 'bio-strengths',
            title: 'What makes it work?',
            blocks: [
              {
                id: 'bio-strengths-choice',
                type: 'choice',
                prompt: 'What makes Adaeze’s short bio strong? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'who-what', text: 'It says early on who she helps and with what', correct: true, feedback: 'Yes. Readers decide in seconds whether you are relevant to them.' },
                  { id: 'proof', text: 'It includes one concrete, checkable result', correct: true, feedback: 'Yes. One real result beats five adjectives.' },
                  { id: 'cta', text: 'It ends by saying what she is open to', correct: true, feedback: 'Yes. A clear invitation tells the right reader what to do next.' },
                  { id: 'degrees', text: 'It lists every course and certificate she has completed', correct: false, feedback: 'It does not, and that is a strength. Lists of credentials belong on a CV, not in a short bio.' },
                ],
                explanation:
                  "The long version does a different job: it tells the story of **why**. Stories are what people remember and retell. Keep the short version factual and the long version personal.",
              },
            ],
          },
          {
            id: 'profile-parts',
            title: 'Anatomy of a profile',
            blocks: [
              {
                id: 'profile-text',
                type: 'text',
                body: "Choose the two or three platforms that matter **for your path**, not every platform. A designer needs a portfolio. A researcher needs a professional network profile and perhaps a publication page. A fashion founder needs a visual platform and a way for customers to order.\n\nOn each one, the same few parts do most of the work.",
              },
              {
                id: 'profile-match',
                type: 'match',
                prompt: 'Match each part of a profile to its main job.',
                pairs: [
                  { id: 'photo', left: 'Profile photo', right: 'Lets people recognise you and signals how you want to be seen' },
                  { id: 'headline', left: 'Headline', right: 'Your positioning in a single line' },
                  { id: 'about', left: 'About section', right: 'Your short bio and what you are open to' },
                  { id: 'featured', left: 'Featured work or links', right: 'Proof: projects, writing, results' },
                  { id: 'handle', left: 'Username or handle', right: 'Makes you easy to find and consistent across platforms' },
                ],
                explanation:
                  "A clear photo where your face is visible, a headline that states your positioning, and one or two pieces of featured work will do more than a long list of skills. Think of your profile as a shop window, not a storeroom.",
              },
            ],
          },
          {
            id: 'consistency',
            title: 'One person, many platforms',
            blocks: [
              {
                id: 'consistency-scenario',
                type: 'scenario',
                situation:
                  "Baraka’s fellowship interview is next week. He realises his professional profile says “Environmental science student”, his X bio says “Climate warrior 🌍 | Views my own”, and his Instagram is a mix of club events and personal photos. His organisation’s website lists him as “Founder”, his professional profile does not mention the organisation at all.",
                prompt: 'With a week to go, what should Baraka do?',
                options: [
                  {
                    id: 'delete',
                    text: 'Delete every account except one, so there is nothing confusing.',
                    outcome: "The confusion goes, but so does years of evidence of his work: event photos, partner tags, posts by students. The panel finds very little about him at all.",
                    best: false,
                  },
                  {
                    id: 'align',
                    text: 'Use the same photo, name and one-line positioning on each platform, add his role and organisation everywhere, and pin his best piece of work.',
                    outcome: "In an afternoon his profiles tell the same story. When a panel member searches his name, every result points to the same clear picture: a student organiser leading a growing school climate network.",
                    best: true,
                  },
                  {
                    id: 'ignore',
                    text: 'Do nothing. The panel will judge his application, not his profiles.',
                    outcome: "One panel member does look him up and is confused about whether he founded the network or just volunteers. It does not sink his application, but it raises a question he has to spend interview time answering.",
                    best: false,
                  },
                ],
              },
              {
                id: 'consistency-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Keep a brand sheet',
                body: "Keep one note with your current photo, name format, one-line positioning, short bio, long bio and key links. When you update one platform, update the others from the same sheet. It takes minutes and saves you from contradicting yourself.",
              },
            ],
          },
          {
            id: 'draft-bio',
            title: 'Draft your bio',
            blocks: [
              {
                id: 'bio-reflection',
                type: 'reflection',
                prompt: 'Write your short bio (40 to 60 words) in the third person. Then list the two or three platforms that matter most for your path and the headline you will use on each.',
                guidance: 'Start from your positioning statement. Include one concrete result or piece of work, and end with what you are open to. You will share it for feedback in the discussion.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'content-thinking',
      type: 'lesson',
      title: 'Content that shows your thinking',
      minutes: 12,
      required: true,
      payload: {
        steps: [
          {
            id: 'show-work',
            title: 'Show your work',
            blocks: [
              {
                id: 'show-work-text',
                type: 'text',
                body: "Profiles say what you do. Content **shows** it. A post explaining how you solved a problem, a short video of your process, a thread on what you learnt from a failure: these let people see how you think long before they work with you.\n\nYou do not need to go viral. You need to be consistently useful to the small group of people who matter for your path.\n\nWriter and artist Austin Kleon puts the case in under two minutes.",
              },
              {
                id: 'show-work-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'G4D_mV0v_oQ',
                title: 'Austin Kleon on Why You Need to Share Your Work',
                channel: 'CreativeLive',
                durationS: 93,
                caption: "Austin Kleon on sharing your process, not just finished products. Listen for why he suggests making sharing a small daily habit.",
              },
            ],
          },
          {
            id: 'pillars',
            title: 'Choose your content pillars',
            blocks: [
              {
                id: 'speaker-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Arts_And_Feminism_HerVoiceCampaign_2023_03.jpg',
                alt: 'A person in a black T-shirt speaks and gestures with both hands while seated at a table with a laptop; another person sits behind them.',
                caption: 'A participant speaks at an Art+Feminism editing event organised by Women for Sustainability Africa in Accra, Ghana. Content often starts as ideas shared aloud in rooms like this.',
                credit: 'Photo: CoachAni / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'pillars-framework',
                type: 'framework',
                title: 'Three content pillars',
                steps: [
                  { label: 'Your craft', detail: 'How you do your work: process, tools, decisions, before-and-after.' },
                  { label: 'Your field', detail: 'What you notice about your industry or community: trends, problems, lessons from others.' },
                  { label: 'Your values', detail: 'What you stand for and why, shown through stories rather than slogans.' },
                ],
              },
            ],
          },
          {
            id: 'formats',
            title: 'Formats that fit',
            blocks: [
              {
                id: 'formats-match',
                type: 'match',
                prompt: 'Match each content format to a good example from our cast.',
                pairs: [
                  { id: 'case', left: 'Short case study', right: 'Adaeze explains how three changes to a sign-up screen helped first-time users' },
                  { id: 'video', left: 'Behind-the-scenes video', right: 'Fatou films a tailor cutting a new pattern, with her voice explaining the design choice' },
                  { id: 'lessons', left: 'Lessons-learnt post', right: 'Baraka shares what went wrong at a clean-up day and what the club will change' },
                  { id: 'curation', left: 'Curated resource', right: 'Adaeze shares five free tools for testing apps on low-end phones' },
                ],
                explanation:
                  "Notice that none of these require expensive equipment or a large following. Each one teaches something, so it is useful even to people who never hire or fund the author. That is what makes content generous rather than self-promotional.",
              },
            ],
          },
          {
            id: 'which-post',
            title: 'Which post shows thinking?',
            blocks: [
              {
                id: 'which-post-choice',
                type: 'choice',
                prompt: 'Fatou wants to post about her new collection. Which post best shows her thinking?',
                multiple: false,
                options: [
                  { id: 'buy', text: '“New collection out now! Link in bio. 🔥🔥🔥”', correct: false, feedback: 'Fine as an announcement, but it shows nothing about how she thinks or why the clothes are different.' },
                  { id: 'top-brand', text: '“Best collection ever. We are the top brand in Dakar.”', correct: false, feedback: 'A claim nobody can check. It sounds like boasting, not thinking.' },
                  {
                    id: 'story',
                    text: '“Our customers told us our dresses were beautiful but too hot for the office. Here’s how we changed the lining, the cut and the fabric weight, and the three samples that failed first.”',
                    correct: true,
                    feedback: 'Yes. It shows she listens to customers, solves real problems and is honest about failure. It also sells the collection.',
                  },
                  { id: 'quote', text: 'A motivational quote over a photo of the sea', correct: false, feedback: 'It may get likes, but it tells people nothing about Fatou or her work.' },
                ],
                explanation:
                  "The strongest content usually follows a simple shape: **a real problem, what you did, what you learnt**. It builds trust because it shows your judgement, not just your results.",
              },
            ],
          },
          {
            id: 'share-safely',
            title: 'Share with care',
            blocks: [
              {
                id: 'share-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Not everything is yours to share',
                body: "Before you post about your work:\n\n- **Ask permission** before sharing a client’s or employer’s work, data or name.\n- **Credit others**: teammates, collaborators, people whose ideas you built on.\n- **Protect people**: no photos of others, especially children, without consent, and nothing that exposes someone’s private situation.\n- **Be honest** about results. Round down, not up.",
              },
              {
                id: 'format-poll',
                type: 'poll',
                prompt: 'Which format will you try first in the next two weeks?',
                options: [
                  { id: 'case', text: 'A short written case study' },
                  { id: 'video', text: 'A short behind-the-scenes video' },
                  { id: 'lessons', text: 'A lessons-learnt post' },
                  { id: 'curation', text: 'A curated list of useful resources' },
                  { id: 'voice', text: 'A voice note or audio clip for a group I belong to' },
                ],
                afterword:
                  "Start with the format that feels most natural to you. Consistency matters more than polish: one honest, useful post every week for three months will do more than a burst of ten posts followed by silence.",
              },
            ],
          },
          {
            id: 'content-ideas',
            title: 'Your first three pieces',
            blocks: [
              {
                id: 'content-reflection',
                type: 'reflection',
                prompt: 'Name your three content pillars. Then outline three pieces of content you could create in the next month: the format, the platform, and the one thing a reader should learn from each.',
                guidance: 'Use the shape “a real problem, what I did, what I learnt”. These three pieces go into your Personal Brand Kit.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'bio-feedback-discussion',
      type: 'discussion',
      title: 'Discussion: bio feedback circle',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Post your short bio (40 to 60 words) and the one-line headline you plan to use.\n\nUnder it, tell classmates:\n\n1. Who you most want to read it (an employer, a funder, customers, collaborators).\n2. The one thing you want them to remember about you.\n\nThen give feedback on at least two classmates’ bios. For each, answer: **What would you tell someone else this person does?** Then suggest one change that would make it clearer, more specific or more believable.",
        guidance: 'Be generous and specific. “Great bio!” does not help. “I’m not sure who you help; is it farmers or the cooperatives that buy from them?” does. Never share anything about another learner outside this course.',
        minWords: 60,
      },
    },
    {
      key: 'presence-quiz',
      type: 'quiz',
      title: 'Module quiz: presence',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on bios, profiles and content. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-short-bio',
            type: 'choice',
            prompt: 'What belongs in a short professional bio? Select all that apply.',
            multiple: true,
            options: [
              { id: 'who-what', text: 'Who you help and with what', correct: true },
              { id: 'result', text: 'One concrete piece of proof', correct: true },
              { id: 'open', text: 'What you are open to', correct: true },
              { id: 'every-cert', text: 'Every certificate you have earned', correct: false, feedback: 'That belongs on a CV. A short bio needs focus.' },
            ],
            explanation: 'A short bio is your positioning in a few sentences, plus proof and an invitation.',
          },
          {
            id: 'q-profile-match',
            type: 'match',
            prompt: 'Match each profile part to its job.',
            pairs: [
              { id: 'headline', left: 'Headline', right: 'Positioning in one line' },
              { id: 'featured', left: 'Featured work', right: 'Proof of what you can do' },
              { id: 'handle', left: 'Handle', right: 'Consistency and findability' },
              { id: 'photo', left: 'Photo', right: 'Recognition and first impression' },
            ],
            explanation: 'Each part has one job. Together they should tell the same story as your bio.',
          },
          {
            id: 'q-consistency',
            type: 'choice',
            prompt: 'Why does consistency across platforms matter?',
            multiple: false,
            options: [
              { id: 'a', text: 'Platforms penalise people with different bios', correct: false, feedback: 'There is no such rule. The issue is human trust.' },
              { id: 'b', text: 'Contradictions make people unsure who you are and whether to trust your claims', correct: true },
              { id: 'c', text: 'It means you only need one platform', correct: false, feedback: 'You may use several. Consistency is about telling the same story on each.' },
              { id: 'd', text: 'It guarantees more followers', correct: false, feedback: 'It does not guarantee numbers. It builds clarity and trust.' },
            ],
            explanation: 'When every search result points to the same clear picture, people believe it.',
          },
          {
            id: 'q-content-shape',
            type: 'order',
            prompt: 'Put the parts of a “thinking” post in the order taught.',
            items: [
              { id: 'problem', text: 'A real problem' },
              { id: 'did', text: 'What you did' },
              { id: 'learnt', text: 'What you learnt' },
            ],
            explanation: 'Problem, action, lesson. It shows judgement, invites conversation and is useful to readers who never become clients.',
          },
          {
            id: 'q-permission',
            type: 'choice',
            prompt: 'Adaeze wants to post a case study about an app she redesigned for a client. What should she do first?',
            multiple: false,
            options: [
              { id: 'a', text: 'Post it quickly before the client launches', correct: false, feedback: 'That could breach trust and confidentiality.' },
              { id: 'b', text: 'Ask the client for permission and agree what she can show', correct: true },
              { id: 'c', text: 'Post it without the client’s name; that is always enough', correct: false, feedback: 'Screens and details can still identify a client. Ask first.' },
              { id: 'd', text: 'Never post client work under any circumstances', correct: false, feedback: 'Many clients agree, especially if you ask early. Some will even share it.' },
            ],
            explanation: 'Your reputation includes how you handle other people’s information. Asking permission is both ethical and good branding.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Network, reputation and safety
// ---------------------------------------------------------------------------

const brandKitTemplate = [
  'PERSONAL BRAND KIT',
  '',
  '1. Positioning statement',
  'Who you serve, what value you create, how you do it, and your proof. Two or three sentences.',
  '',
  '2. Spoken introduction',
  'The two-sentence version you say aloud when someone asks what you do.',
  '',
  '3. Short bio (40 to 60 words, third person)',
  '',
  '4. Long bio (120 to 200 words)',
  'Include the story of why you do this work.',
  '',
  '5. Updated profile',
  'Platform(s) chosen and why. Headline, about section and featured work. Add a link or screenshot.',
  '',
  '6. Three pieces of content',
  'For each: format, platform, the one thing a reader should learn, and a link or the full text.',
  '',
  '7. My network map',
  'Key people and communities for your path, and the first “give” you will offer.',
  '',
  '8. Reputation and safety check',
  'What you cleaned up, privacy and security settings you changed, and your personal posting rules.',
  '',
  '9. Ninety-day plan',
  'Weeks 1 to 4, 5 to 8 and 9 to 12: what you will post, who you will connect with, and how you will measure progress.',
  '',
  '10. Values link',
  'How this brand reflects your Personal Values Charter.',
].join('\n');

const moduleNetwork: Module = {
  key: 'network-reputation',
  title: 'Network, reputation and safety',
  summary:
    'Build a genuine network through generosity and follow-through, protect your reputation and privacy online, keep yourself safe, and bring everything together in your Personal Brand Kit and ninety-day plan.',
  weekNo: 7,
  items: [
    {
      key: 'network-generosity',
      type: 'lesson',
      title: 'Networking through generosity',
      minutes: 23,
      required: true,
      payload: {
        steps: [
          {
            id: 'givers',
            title: 'Givers, takers and matchers',
            blocks: [
              {
                id: 'givers-text',
                type: 'text',
                body: "Many young people hate the word “networking”. It sounds like collecting business cards and asking strangers for favours.\n\nThe kind of networking that works is different. It is about **being useful to people over time**, so that trust builds in both directions. Opportunities then come through relationships, often unexpectedly.\n\nIn this talk, organisational psychologist Adam Grant describes three styles people bring to their working relationships.",
              },
              {
                id: 'givers-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'YyXRYgjQXX0',
                title: 'Are you a giver or a taker? | Adam Grant',
                channel: 'TED',
                durationS: 808,
                caption: "Adam Grant on givers, takers and matchers at work. Listen for which givers succeed and which burn out, and what that means for how you build your network.",
              },
            ],
          },
          {
            id: 'network-words',
            title: 'How networks really work',
            blocks: [
              {
                id: 'network-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Arts_And_Feminism_HerVoiceCampaign_2023_02.jpg',
                alt: 'Three people seated at a table with laptops and phones smile towards the camera in a selfie; another person works on a laptop in the background.',
                caption: 'Participants at an Art+Feminism editing event organised by Women for Sustainability Africa in Accra, Ghana. Networks are built in rooms like this, one conversation at a time.',
                credit: 'Photo: CoachAni / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'network-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Strong ties', definition: 'Close friends, family and colleagues. High trust, but they often know the same people and hear the same news as you.' },
                  { term: 'Weak ties', definition: 'Acquaintances and people you know a little. Sociologist Mark Granovetter showed that they often bring new information and opportunities, because they move in different circles.' },
                  { term: 'Give first', definition: 'Offering something useful before asking for anything: an introduction, feedback, a resource, your time.' },
                  { term: 'Follow-through', definition: 'Doing what you said you would, when you said you would. The quiet foundation of every reputation.' },
                  { term: 'Mentor and sponsor', definition: 'A mentor advises you. A sponsor uses their own reputation to open doors for you, and only does so for people they trust.' },
                ],
              },
            ],
          },
          {
            id: 'event-scenario',
            title: 'Adaeze meets a senior designer',
            blocks: [
              {
                id: 'event-choice',
                type: 'scenario',
                situation:
                  "At a tech meetup in Enugu, Adaeze finds herself next to Chinedu, a well-known product designer at a Lagos fintech. He mentions his team is struggling to test their app with traders who have very little data on their phones.",
                prompt: 'What should Adaeze do?',
                options: [
                  {
                    id: 'ask-job',
                    text: 'Tell him she is looking for work and ask if his company is hiring.',
                    outcome: "Chinedu is polite and says to check the careers page. The conversation ends quickly. He will not remember her name.",
                    best: false,
                  },
                  {
                    id: 'give',
                    text: 'Share what she learnt testing apps with low-data users in Enugu, offer to send him her checklist, and actually send it the next morning.',
                    outcome: "Chinedu is interested. Her checklist arrives the next morning, as promised. Two weeks later he forwards it to his team and mentions her by name. A month later, he introduces her to a founder who needs exactly her skills.",
                    best: true,
                  },
                  {
                    id: 'pitch',
                    text: 'Give him her full portfolio pitch for ten minutes, so he understands everything she can do.',
                    outcome: "He listens, but his attention drifts. He leaves knowing she is keen, not what makes her useful to him.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'follow-up',
            title: 'The follow-up',
            blocks: [
              {
                id: 'follow-up-order',
                type: 'order',
                prompt: 'Put the steps of a good follow-up after meeting someone useful in order.',
                items: [
                  { id: 'note', text: 'Note their name, what you talked about and anything you promised' },
                  { id: 'thank', text: 'Send a short thank-you within a day, mentioning something specific you discussed' },
                  { id: 'deliver', text: 'Deliver whatever you offered, on time' },
                  { id: 'update', text: 'Weeks later, share a relevant update or resource, without asking for anything' },
                  { id: 'ask', text: 'Only once trust exists, make a clear, specific request if you need one' },
                ],
                explanation:
                  "Most people never follow up, so simply doing what you said makes you memorable. Notice that the request comes last, and only if needed. Relationships built this way survive for years.",
              },
            ],
          },
          {
            id: 'generous-acts',
            title: 'What counts as giving?',
            blocks: [
              {
                id: 'giving-choice',
                type: 'choice',
                prompt: 'You are early in your career and have no money or power. Which of these can you still give? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'intro', text: 'Introducing two people who could help each other', correct: true, feedback: 'Yes. Introductions cost you a message and can change two lives.' },
                  { id: 'give-feedback', text: 'Thoughtful feedback on someone’s project or post', correct: true, feedback: 'Yes. Specific, kind feedback is rare and valued.' },
                  { id: 'share', text: 'Sharing a useful resource, opportunity or article', correct: true, feedback: 'Yes. Passing on opportunities is one of the easiest gifts.' },
                  { id: 'skill', text: 'An hour of your skill: translating, testing, editing, design', correct: true, feedback: 'Yes, within limits. Generous, not exploited: protect your time.' },
                  { id: 'flattery', text: 'Lots of flattering comments on a senior person’s posts', correct: false, feedback: 'Flattery is easy to spot and adds nothing. Thoughtful engagement is different.' },
                ],
                explanation:
                  "Grant’s research suggests the most successful givers are generous **and** protect their own goals and time. Give in ways that use your strengths, and say no to requests that drain you without helping anyone grow.",
              },
            ],
          },
          {
            id: 'network-map',
            title: 'Map your network',
            blocks: [
              {
                id: 'network-reflection',
                type: 'reflection',
                prompt: 'List ten people or communities who matter for your path: mentors, peers, potential collaborators, customers, funders. Mark which are strong ties and which are weak. Then choose one person and describe a specific, useful thing you will give them this week.',
                guidance: 'Include at least three weak ties. Your “give” should cost you little and be genuinely useful to them. This becomes the network map in your Personal Brand Kit.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'reputation-safety',
      type: 'lesson',
      title: 'Protecting your reputation, privacy and safety',
      minutes: 19,
      required: true,
      payload: {
        steps: [
          {
            id: 'permanent',
            title: 'Your online life is close to permanent',
            blocks: [
              {
                id: 'permanent-text',
                type: 'text',
                body: "Reputation takes years to build and can be damaged in minutes. Online, the things you post, are tagged in or say in a group chat can be screenshotted, forwarded and found years later, long after you have changed your mind or grown up.\n\nThis short TED talk makes the point vividly.",
              },
              {
                id: 'permanent-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'Fu1C-oBdsMM',
                title: 'Juan Enriquez: Your online life, permanent as a tattoo',
                channel: 'TED',
                durationS: 358,
                caption: "Juan Enriquez compares our digital footprints to tattoos. Watch for his examples of how information about us spreads and lasts, then think about your own public posts and photos.",
              },
            ],
          },
          {
            id: 'think-twice',
            title: 'Think before you post',
            blocks: [
              {
                id: 'think-twice-choice',
                type: 'choice',
                prompt: 'Which of these should you think twice about before posting publicly? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'insult', text: 'An angry post insulting a former employer or lecturer', correct: true, feedback: 'Yes. Future employers and partners read it as how you might one day talk about them.' },
                  { id: 'location', text: 'Your live location, home address or daily routine', correct: true, feedback: 'Yes. This is a safety risk, not just a reputation one.' },
                  { id: 'others', text: 'Photos of friends at a party, without asking them', correct: true, feedback: 'Yes. Their reputation and safety are not yours to decide.' },
                  { id: 'documents', text: 'A photo of your new ID card, passport or bank card', correct: true, feedback: 'Yes. These are gifts to fraudsters and identity thieves.' },
                  { id: 'lesson', text: 'A thoughtful post about a lesson from a failed project', correct: false, feedback: 'This usually builds your reputation. Honest reflection is a strength.' },
                ],
                explanation:
                  "A useful test before posting: **would I be comfortable if this were read aloud at my dream job interview, and could it put me or anyone else at risk?** If either answer worries you, pause.",
              },
            ],
          },
          {
            id: 'stay-safe',
            title: 'Stay safe online',
            blocks: [
              {
                id: 'safety-text',
                type: 'text',
                body: "Being visible brings opportunities, and sometimes unwanted attention: scammers who copy your profile to defraud your contacts, phishing messages pretending to be employers, and harassment, which many women and outspoken young people face online.\n\nThis short guide from a cybersecurity company covers the basic protections everyone should have in place.",
              },
              {
                id: 'safety-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'aO858HyFbKI',
                title: '11 Internet Safety Tips for Your Online Security',
                channel: 'Kaspersky',
                durationS: 241,
                caption: "Eleven basic online safety habits, from privacy settings to strong passwords. The video ends by mentioning the company’s own products; you do not need any particular product to follow the habits.",
              },
              {
                id: 'safety-framework',
                type: 'framework',
                title: 'Your safety basics',
                steps: [
                  { label: 'Lock your accounts', detail: 'Strong, different passwords and two-step verification on email, social media and mobile money.' },
                  { label: 'Check your settings', detail: 'Decide which accounts are public and which are private. Hide your phone number and email where you can.' },
                  { label: 'Share less personal detail', detail: 'No home address, live location, ID documents or daily routine in public.' },
                  { label: 'Verify before you trust', detail: 'Treat unexpected job offers, prizes and urgent requests as suspicious until confirmed another way.' },
                  { label: 'Know how to respond', detail: 'Learn how to report, block and document harassment or impersonation, and who you would tell.' },
                ],
              },
            ],
          },
          {
            id: 'old-post',
            title: 'An old post resurfaces',
            blocks: [
              {
                id: 'old-post-scenario',
                type: 'scenario',
                situation:
                  "Two days before Baraka’s fellowship interview, someone in a WhatsApp group shares a screenshot of a post he wrote at 17: a crude, angry joke about a rival school. A friend forwards it to him. “Is this going to ruin everything?”",
                prompt: 'What should Baraka do?',
                options: [
                  {
                    id: 'deny',
                    text: 'Delete the original post and deny he ever wrote it.',
                    outcome: "The screenshot still exists. When someone confirms it was his account, the denial does far more damage than the joke ever could. Now the question is about his honesty, not his teenage humour.",
                    best: false,
                  },
                  {
                    id: 'own',
                    text: 'Delete the post, and if it comes up, own it briefly: what he wrote, why it was wrong, and how his values and work have changed since.',
                    outcome: "A panel member does ask. Baraka answers calmly in three sentences and points to his work with 14 school clubs. The panel sees someone who has grown and can take responsibility, which is exactly what they look for in a leader.",
                    best: true,
                  },
                  {
                    id: 'attack',
                    text: 'Post a long statement attacking whoever shared the screenshot.',
                    outcome: "His statement spreads further than the old post ever did. Many people only learn about the joke because of his reaction.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'secure-check',
            title: 'Check your security',
            blocks: [
              {
                id: 'security-scale',
                type: 'scale',
                prompt: 'How secure are your email, social media and mobile money accounts right now?',
                minLabel: 'Same weak password everywhere',
                maxLabel: 'Strong passwords and two-step verification',
                afterword:
                  "If you are at the low end, fix your email first: it is the key that resets everything else. Then mobile money and your main social accounts. It takes less than an hour.",
              },
              {
                id: 'name-quote',
                type: 'quote',
                text: 'A good name is rather to be chosen than great riches.',
                attribution: 'Proverbs 22:1 (King James Version)',
              },
            ],
          },
          {
            id: 'posting-rules',
            title: 'Your posting rules',
            blocks: [
              {
                id: 'rules-reflection',
                type: 'reflection',
                prompt: 'Write three to five personal rules for what you will and will not share online, and list the privacy and security changes you will make this week. Then note anything in your current online presence you want to clean up.',
                guidance: 'Make your rules concrete: “I will not post my location until I have left a place.” Your rules and changes form the reputation and safety section of your Brand Kit.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'network-reputation-quiz',
      type: 'quiz',
      title: 'Module quiz: network, reputation and safety',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on networking, reputation and online safety. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-weak-ties',
            type: 'choice',
            prompt: 'Why are weak ties often valuable for finding new opportunities?',
            multiple: false,
            options: [
              { id: 'a', text: 'They are more powerful than your close friends', correct: false, feedback: 'Not necessarily. Their value is in difference, not power.' },
              { id: 'b', text: 'They move in different circles, so they hear about things you do not', correct: true },
              { id: 'c', text: 'They are easier to ask for money', correct: false, feedback: 'Asking acquaintances for money is rarely wise.' },
              { id: 'd', text: 'They never expect anything in return', correct: false, feedback: 'Every relationship runs on some reciprocity.' },
            ],
            explanation: 'Close ties often know what you know. Acquaintances bridge to new information, which is why staying in light, generous contact with many people pays off.',
          },
          {
            id: 'q-follow-up',
            type: 'order',
            prompt: 'Put these follow-up steps in order.',
            items: [
              { id: 'note', text: 'Note what you discussed and promised' },
              { id: 'thank', text: 'Send a specific thank-you within a day' },
              { id: 'deliver', text: 'Deliver what you offered' },
              { id: 'ask', text: 'Make a specific request only once trust exists' },
            ],
            explanation: 'Give and deliver before you ask. Follow-through is what turns a meeting into a relationship.',
          },
          {
            id: 'q-givers',
            type: 'choice',
            prompt: 'Building on Adam Grant’s ideas about givers, which kind of giver tends to do best over time?',
            multiple: false,
            options: [
              { id: 'a', text: 'Those who say yes to every request', correct: false, feedback: 'Givers who never protect their time tend to burn out.' },
              { id: 'b', text: 'Those who are generous while protecting their own goals and time', correct: true },
              { id: 'c', text: 'Those who only give when they get something back', correct: false, feedback: 'That describes a matcher, not a giver.' },
              { id: 'd', text: 'Those who give only to powerful people', correct: false, feedback: 'That is strategic flattery, and people notice.' },
            ],
            explanation: 'Generosity works best with boundaries. Give where you add real value, and say no where you would only be drained.',
          },
          {
            id: 'q-safety',
            type: 'choice',
            prompt: 'Which are good online safety habits? Select all that apply.',
            multiple: true,
            options: [
              { id: '2fa', text: 'Turning on two-step verification for email and mobile money', correct: true },
              { id: 'passwords', text: 'Using different strong passwords for important accounts', correct: true },
              { id: 'verify', text: 'Confirming unexpected job offers through another channel', correct: true },
              { id: 'id', text: 'Posting a photo of your new passport to celebrate', correct: false, feedback: 'ID documents in public are a gift to fraudsters.' },
            ],
            explanation: 'Lock accounts, limit personal details and verify before trusting. These habits protect you and the people who trust you.',
          },
          {
            id: 'q-old-post',
            type: 'match',
            prompt: 'Match each response to an old embarrassing post with its likely result.',
            pairs: [
              { id: 'deny', left: 'Deny writing it', right: 'Turns a past mistake into a present question about honesty' },
              { id: 'own', left: 'Own it briefly and show how you have grown', right: 'Often builds trust in your maturity' },
              { id: 'attack', left: 'Publicly attack whoever shared it', right: 'Spreads the post further than before' },
            ],
            explanation: 'Calm, brief ownership almost always does least damage and can even strengthen your reputation.',
          },
        ],
      },
    },
    {
      key: 'personal-brand-kit',
      type: 'assignment',
      title: 'Practical Output: your Personal Brand Kit',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: your **Personal Brand Kit**.\n\nIt brings together everything you have drafted: a positioning statement, a spoken introduction, a professional bio in short and long versions, an updated profile on the platform that matters most for your path, three pieces of content that show your thinking, a network map, a reputation and safety check, and a **ninety-day plan** for building your presence.\n\nYour brand should rest on who you actually are. Show how it reflects your Personal Values Charter, and borrow freely from your Signature Talk.\n\nA faculty reviewer will grade it against the rubric below and give written feedback. Your Brand Kit joins your Dream Lab portfolio, and you will use it in the Dream Residency when you approach mentors, users, partners and funders.",
        practicalOutput: 'Personal Brand Kit',
        steps: [
          'Reread your journal reflections from each lesson and your Personal Values Charter.',
          'Finalise your positioning statement and test it on three people. Adjust it if their description of you does not match.',
          'Write your short bio (40 to 60 words) and long bio (120 to 200 words), using classmates’ feedback from the discussion.',
          'Update your profile on at least one platform that matters for your path. Add a link or screenshot.',
          'Create and publish, or fully draft, three pieces of content using the shape “a real problem, what I did, what I learnt”.',
          'Complete your network map and send your first “give”.',
          'Make the privacy and security changes from your safety check.',
          'Write a ninety-day plan with specific weekly actions, then fill in every section of the template and submit.',
        ],
        rubric: [
          {
            id: 'positioning',
            criterion: 'Clear, honest positioning',
            description: 'States who you serve, what value you create, how, and with what proof, in plain language. Claims are specific, believable and supported by real work.',
          },
          {
            id: 'bios-profile',
            criterion: 'Bios and profile',
            description: 'Short and long bios that fit their purposes, a profile whose headline, about section and featured work tell the same story, and consistency across chosen platforms.',
          },
          {
            id: 'content',
            criterion: 'Content that shows thinking',
            description: 'Three pieces of content that teach or show judgement, fit chosen pillars, credit others and respect permissions.',
          },
          {
            id: 'network',
            criterion: 'Generous networking',
            description: 'A realistic network map including weak ties, with specific, useful “gives” and evidence of follow-through.',
          },
          {
            id: 'safety',
            criterion: 'Reputation, privacy and safety',
            description: 'Concrete posting rules, security and privacy changes made, and a thoughtful approach to any past content.',
          },
          {
            id: 'plan',
            criterion: 'Ninety-day plan and values',
            description: 'A specific, achievable plan with weekly actions and a way to measure progress, clearly linked to your Personal Values Charter.',
          },
        ],
        template: brandKitTemplate,
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
          "Ten questions across the whole course: positioning, bios and profiles, content, networking, reputation and safety. Several follow a new fictional case.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-gap',
            type: 'choice',
            prompt: 'New case: Kwabena is a solar technician in Tamale who wants contracts installing systems for clinics. His only online profile says “Hustler | God first”. What is his main branding problem?',
            multiple: false,
            options: [
              { id: 'a', text: 'He mentions his faith', correct: false, feedback: 'Sharing your faith is a personal choice. The problem is that nothing shows his work.' },
              { id: 'b', text: 'Clinic managers cannot see what he does or why they should trust him', correct: true },
              { id: 'c', text: 'He is on the wrong platform', correct: false, feedback: 'Possibly, but even on the right platform, his profile says nothing about his work.' },
              { id: 'd', text: 'He has too few followers', correct: false, feedback: 'Followers matter less than whether the right few people understand his value.' },
            ],
            explanation: 'The gap between who he is and what clients can see is the problem. Positioning closes it.',
          },
          {
            id: 'f-case-statement',
            type: 'choice',
            prompt: 'Which positioning statement would serve Kwabena best?',
            multiple: false,
            options: [
              { id: 'a', text: '“Best solar technician in the North.”', correct: false, feedback: 'An uncheckable claim with no audience or proof.' },
              { id: 'b', text: '“I install and maintain solar power systems for rural clinics in the Northern Region, so vaccines stay cold and night deliveries have light. I have completed installations at five clinics and service them every quarter.”', correct: true },
              { id: 'c', text: '“Passionate about renewable energy and Africa’s future.”', correct: false, feedback: 'Sincere, but vague. What does he do, for whom?' },
              { id: 'd', text: '“Solar, wiring, plumbing, phone repair, generator servicing.”', correct: false, feedback: 'A list of everything is hard to remember or recommend.' },
            ],
            explanation: 'Who (rural clinics), what (reliable power for vaccines and night care), how (installation and quarterly servicing), proof (five clinics).',
          },
          {
            id: 'f-case-parts',
            type: 'match',
            prompt: 'Match each phrase from Kwabena’s statement to its part.',
            pairs: [
              { id: 'who', left: '“rural clinics in the Northern Region”', right: 'Who' },
              { id: 'what', left: '“so vaccines stay cold and night deliveries have light”', right: 'What' },
              { id: 'how', left: '“install and maintain… service them every quarter”', right: 'How' },
              { id: 'proof', left: '“completed installations at five clinics”', right: 'Proof' },
            ],
            explanation: 'Notice how the “what” describes the result for the clinic, not the technology. People buy outcomes.',
          },
          {
            id: 'f-bio',
            type: 'choice',
            prompt: 'Kwabena is writing a short bio for a clinic directory. Which choices are right? Select all that apply.',
            multiple: true,
            options: [
              { id: 'length', text: 'Keep it to about 40 to 60 words', correct: true },
              { id: 'proof', text: 'Include one concrete result, such as the five clinics', correct: true },
              { id: 'open', text: 'End with what he is open to, such as new clinic contracts', correct: true },
              { id: 'certs', text: 'List every training certificate with dates', correct: false, feedback: 'Certificates can go on a CV or be offered on request.' },
            ],
            explanation: 'Short bio: who and what first, one proof, one invitation.',
          },
          {
            id: 'f-content',
            type: 'choice',
            prompt: 'Which post would best show Kwabena’s thinking to clinic managers?',
            multiple: false,
            options: [
              { id: 'a', text: 'A photo of himself on a roof with the caption “Grinding!”', correct: false, feedback: 'It shows effort, not judgement or value.' },
              { id: 'b', text: '“A clinic’s fridge kept failing at night. We found the batteries were undersized for the vaccine fridge. Here’s how we resized the system, and what every clinic should check.”', correct: true },
              { id: 'c', text: 'A motivational quote about hard work', correct: false, feedback: 'Says nothing about his work.' },
              { id: 'd', text: '“DM me for installations. Cheap price.”', correct: false, feedback: 'An advert, and “cheap” may not be what clinics value most.' },
            ],
            explanation: 'Problem, action, lesson. It teaches managers something useful and shows exactly the judgement they need to trust.',
          },
          {
            id: 'f-permission',
            type: 'choice',
            prompt: 'Kwabena wants to post photos from inside a clinic where he installed panels. What should he do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Post them; the panels are his work', correct: false, feedback: 'The clinic, its staff and patients are not his to show without permission.' },
              { id: 'b', text: 'Ask the clinic’s permission, and keep patients and private information out of the frame', correct: true },
              { id: 'c', text: 'Post them but blur the clinic’s name', correct: false, feedback: 'Asking first is still the right step; details can identify people and places.' },
              { id: 'd', text: 'Never post any work photos', correct: false, feedback: 'Showing work is valuable when done with permission and care.' },
            ],
            explanation: 'Respecting clients’ and patients’ privacy is part of your reputation. Clinics will notice how you treat their information.',
          },
          {
            id: 'f-network',
            type: 'order',
            prompt: 'Kwabena meets a district health officer at a workshop. Put his next steps in a good order.',
            items: [
              { id: 'note', text: 'Note what they discussed and what he offered' },
              { id: 'thank', text: 'Send a specific thank-you the next day' },
              { id: 'deliver', text: 'Send the clinic power checklist he promised' },
              { id: 'update', text: 'Later, share a short update on a clinic installation, without asking for anything' },
              { id: 'ask', text: 'When trust exists, ask whether other clinics in the district need help' },
            ],
            explanation: 'Give, deliver and stay in touch before asking. That is how weak ties become doors.',
          },
          {
            id: 'f-giving',
            type: 'choice',
            prompt: 'Which of these are generous, sustainable ways for Kwabena to build his network? Select all that apply.',
            multiple: true,
            options: [
              { id: 'intro', text: 'Introducing a clinic manager to a supplier with fair prices', correct: true },
              { id: 'checklist', text: 'Sharing a free checklist for clinics to inspect their own systems', correct: true },
              { id: 'free-all', text: 'Doing every installation for free to build goodwill', correct: false, feedback: 'Generosity without boundaries leads to burnout and a business that cannot survive.' },
              { id: 'give-feedback', text: 'Giving thoughtful feedback on a younger technician’s first project', correct: true },
            ],
            explanation: 'Generous and boundaried. Give what is useful and sustainable; protect what keeps your work alive.',
          },
          {
            id: 'f-safety',
            type: 'choice',
            prompt: 'Kwabena receives a message from a profile using his photo and name, asking his contacts to send money for “urgent equipment”. What should he do first?',
            multiple: false,
            options: [
              { id: 'a', text: 'Ignore it; it will go away', correct: false, feedback: 'His contacts may lose money while he waits.' },
              { id: 'b', text: 'Report the fake profile to the platform and warn his contacts through his real accounts', correct: true },
              { id: 'c', text: 'Message the scammer and argue', correct: false, feedback: 'This wastes time and can expose more information.' },
              { id: 'd', text: 'Delete all his own accounts', correct: false, feedback: 'That removes his real presence and makes the fake look more credible.' },
            ],
            explanation: 'Report, warn and document. Then check his own account security, in case the impersonation came with an attempt to break in.',
          },
          {
            id: 'f-plan',
            type: 'choice',
            prompt: 'Which ninety-day plan is most likely to work for Kwabena?',
            multiple: false,
            options: [
              { id: 'a', text: 'Post ten times a day for the first week, then see how it goes', correct: false, feedback: 'Bursts followed by silence rarely build trust.' },
              { id: 'b', text: 'Update his profile in week 1, post one useful case study each week, and contact two clinic or district contacts every fortnight', correct: true },
              { id: 'c', text: 'Wait until he has a perfect logo before doing anything', correct: false, feedback: 'A logo is the least important part of a personal brand.' },
              { id: 'd', text: 'Join every platform at once to maximise reach', correct: false, feedback: 'Two or three platforms that matter beat ten neglected ones.' },
            ],
            explanation: 'Small, specific and steady. Consistency over ninety days builds a presence people trust.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const personalBranding: CourseAuthoring = {
  slug: 'personal-branding',
  title: 'Personal Branding',
  subtitle: 'Be known for what you stand for and what you can do, online and in the room.',
  description:
    "Whether you like it or not, people already have an impression of you: from your profile, your posts, the way you show up and what others say when you are not there. Personal branding is the work of shaping that impression honestly so that the right opportunities find you.\n\nIn this course you will define your positioning: what you want to be known for, for whom, and why you are credible. You will build a consistent presence across the platforms that matter for your path, write a bio and profile that work, create content that shows your thinking, and build a network through generosity rather than self-promotion. You will also learn to protect your reputation and think carefully about privacy, safety and what you share.\n\nThe course builds on your Values Charter and Signature Talk, so your brand rests on who you actually are.\n\nYour Practical Output is a **Personal Brand Kit**: a positioning statement, a professional bio in short and long versions, an updated profile, three pieces of content, and a ninety-day plan for building your presence.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 4,
  outcomes: [
    'Define a clear, honest positioning statement for your career or venture.',
    'Write a strong bio and build a consistent profile across key platforms.',
    'Create content that demonstrates your thinking and expertise.',
    'Build a genuine network through generosity and follow-through.',
    'Protect your reputation, privacy and safety online.',
  ],
  skills: ['Positioning', 'Profile writing', 'Content strategy', 'Networking', 'Online reputation', 'Self-presentation'],
  audience: 'Learners who want to be visible to employers, investors, collaborators and communities, without feeling fake.',
  prerequisites: 'Character Formation and Ethics and Communication recommended.',
  practicalOutput: 'Personal Brand Kit',
  cover: {
    from: '#3D0A1E',
    to: '#C2456B',
    symbol: '★',
    imageUrl: "https://images.unsplash.com/photo-1739271933163-8dcc7c8e8a3e?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "A smiling young woman with long braids looks down at her phone, one hand on her chest.",
    imageCredit: "Photo: Ninthgrid / Unsplash",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'ozMCb0wOnMU',
    title: "5 Steps to Building a Personal Brand You Feel Good About | The Way We Work, a TED series",
    channel: "TED",
    durationS: 374,
  },
  instructors: [],
  modules: [modulePositioning, modulePresence, moduleNetwork],
};

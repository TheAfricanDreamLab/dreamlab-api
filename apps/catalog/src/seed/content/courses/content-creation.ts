import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Content Creation: one of the three Dream Lab electives (weeks 9–10, 10 credits).
 *
 * Spine: Niche → Story → Shoot → Edit → Publish → Learn → Protect. Recurring cast, all fictional:
 *   Adaeze  a food creator in Lagos who cooks filling meals on a student budget
 *   Baraka  a climate-cause creator in Nairobi who documents a youth clean-up group
 *   Ines    a tech explainer in Kigali who makes phone and money tips in Kinyarwanda and English
 *   Kofi    founder of a small tailoring label in Accra who films how his clothes are made
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Niche, audience and voice (week 9)
// ---------------------------------------------------------------------------

const moduleNiche: Module = {
  key: 'niche-and-voice',
  title: 'Niche, audience and voice',
  summary:
    'Decide what you will make, for whom, and how you will sound. A clear niche and a real audience make every later decision easier, from what to film to which numbers to watch.',
  weekNo: 9,
  items: [
    {
      key: 'find-your-niche',
      type: 'lesson',
      title: 'Find your niche',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Content Creation',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to the Content Creation elective. For the next two weeks you will make things and put them into the world.\n\nYou do not need a studio, a camera or a big following. You need a phone, a point of view, a clear audience and a process you can repeat. By the end you will have a **Content Portfolio and 30-Day Calendar**: at least six published pieces in two formats, an honest review of what worked, and a plan for the next month.\n\nIt starts with a choice most new creators skip: *what, exactly, are you making, and for whom?* Watch the short video below, then we will build your answer.",
              },
              {
                id: 'niche-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'wKxWYglTAMM',
                title: 'How to Find Your Content Niche',
                channel: 'Nathan',
                durationS: 314,
                caption: 'A creator’s practical take on choosing a niche. Watch for the idea that a niche is where your interests, your skills and what people want overlap, and ignore any talk of specific platforms or income claims.',
              },
              {
                id: 'welcome-context',
                type: 'callout',
                tone: 'context',
                title: 'Your stories, told by you',
                body: "Across the continent, creators are showing food, fashion, music, faith, comedy, farming, coding and politics from the inside. Many started with a phone and a habit of posting. The tools are cheap. What is scarce is a clear point of view and the discipline to keep showing up.",
              },
            ],
          },
          {
            id: 'meet-cast',
            title: 'Meet four creators',
            blocks: [
              {
                id: 'cast-example',
                type: 'example',
                title: 'Four fictional creators you will follow',
                body: "- **Adaeze**, Lagos, makes short videos of filling meals students can cook for little money.\n- **Baraka**, Nairobi, documents a youth group that cleans up a river and turns plastic into paving blocks.\n- **Ines**, Kigali, explains phone settings, mobile money safety and simple apps, in Kinyarwanda and English.\n- **Kofi**, Accra, runs a small tailoring label and films how each piece is made, from cloth market to fitting.\n\nAll four are fictional. Their choices, and their mistakes, are very real.",
              },
              {
                id: 'cast-reveal',
                type: 'reveal',
                prompt: 'Before Adaeze settled on cheap student meals, her first idea was “a food page”. What was wrong with that? Think, then tap.',
                body: "“A food page” has no audience and no angle. Food for whom? Which food? Why would anyone choose her page over thousands of others?\n\n“Filling meals a Lagos student can cook for little money, in one pot” tells a viewer in one second whether this is for them. It also tells Adaeze what *not* to post: no restaurant reviews, no expensive baking. A narrow niche feels limiting, but it is what makes you findable and memorable.",
              },
            ],
          },
          {
            id: 'niche-formula',
            title: 'The niche formula',
            blocks: [
              {
                id: 'niche-framework',
                type: 'framework',
                title: 'A niche in four parts',
                steps: [
                  { label: 'Topic', detail: 'What you make content about. Food, climate action, phone tips, tailoring.' },
                  { label: 'Audience', detail: 'Who it is for, as specifically as you can say it. First-year students in Lagos. Young Kigali traders using mobile money.' },
                  { label: 'Angle', detail: 'What makes your take different. Cheap and filling. In Kinyarwanda. Behind the scenes of a real workshop.' },
                  { label: 'Result', detail: 'What your audience gets. A meal tonight. A safer phone. Confidence to join a clean-up.' },
                ],
              },
              {
                id: 'niche-choice',
                type: 'choice',
                prompt: 'Which of these is the strongest niche statement?',
                multiple: false,
                options: [
                  { id: 'a', text: '“I post about tech.”', correct: false, feedback: 'A topic, but no audience, no angle and no result. Nobody can tell if it is for them.' },
                  { id: 'b', text: '“I want to go viral and become an influencer.”', correct: false, feedback: 'This is a wish about you, not a promise to an audience. Viewers follow what helps or moves *them*.' },
                  {
                    id: 'c',
                    text: '“Short videos in Kinyarwanda and English that help young Kigali traders use mobile money and their phones safely.”',
                    correct: true,
                    feedback: 'Yes. Topic, audience, angle and result are all there. Ines knows exactly what to make next.',
                  },
                  { id: 'd', text: '“Content for everyone, about everything I find interesting.”', correct: false, feedback: 'When content is for everyone, it usually reaches no one. Start narrow and widen later.' },
                ],
                explanation:
                  "A strong niche answers four questions at once: what, for whom, how you are different, and what the viewer gains. You can always widen it once people know you. It is much harder to start wide and become known for anything.",
              },
            ],
          },
          {
            id: 'format-poll',
            title: 'Your natural format',
            blocks: [
              {
                id: 'format-poll-block',
                type: 'poll',
                prompt: 'Which format do you feel most drawn to right now?',
                options: [
                  { id: 'short-video', text: 'Short vertical video' },
                  { id: 'long-video', text: 'Longer video, such as tutorials or vlogs' },
                  { id: 'audio', text: 'Audio: voice notes, podcasts, spaces' },
                  { id: 'writing', text: 'Writing: threads, posts, newsletters' },
                  { id: 'photo', text: 'Photos and carousels' },
                ],
                afterword:
                  "There is no wrong answer. Your portfolio needs **two** formats, so pick one you enjoy and one that stretches you. Many creators find that one shoot can feed several formats: a video, a photo carousel and a written post.",
              },
            ],
          },
          {
            id: 'too-broad',
            title: 'Too broad, too narrow',
            blocks: [
              {
                id: 'too-broad-text',
                type: 'text',
                body: "A niche can fail in two directions.\n\n**Too broad**, and you are competing with everyone and remembered by no one. **Too narrow**, and you run out of ideas in a week, or there are simply not enough people who care.\n\nA useful test: can you list **twenty** post ideas in ten minutes? If you cannot, it may be too narrow. Can a stranger tell in one sentence who it is for? If not, it may be too broad.",
              },
              {
                id: 'too-broad-choice',
                type: 'choice',
                prompt: 'Which are warning signs that a niche is too broad? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'everyone', text: 'You describe your audience as “everyone” or “young people”.', correct: true, feedback: 'Yes. Name a group you could actually meet.' },
                  { id: 'random', text: 'Your last five posts could belong to five different pages.', correct: true, feedback: 'Yes. Viewers cannot tell what to expect, so they do not follow.' },
                  { id: 'ideas', text: 'You can list twenty ideas easily.', correct: false, feedback: 'That is a healthy sign. It means the niche has enough depth.' },
                  { id: 'pitch', text: 'You cannot explain in one sentence why someone should follow you.', correct: true, feedback: 'Yes. If you cannot say it, your audience will not be able to either.' },
                ],
                explanation:
                  "Broad pages are not wrong, but they are slow to grow, because nobody is sure the next post will be for them. A focused niche earns trust faster, and trust is what makes people follow, share and eventually buy.",
              },
            ],
          },
          {
            id: 'your-niche',
            title: 'Draft your niche',
            blocks: [
              {
                id: 'your-niche-reflection',
                type: 'reflection',
                prompt: 'Write your niche statement: “I make [format] about [topic] for [audience] so they can [result].” Then list five post ideas that fit it.',
                guidance: 'Link it to your Dream Lab problem, venture or cause if you can. This becomes the first section of your Content Portfolio.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'audience-and-voice',
      type: 'lesson',
      title: 'Know your audience, find your voice',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'who',
            title: 'One real person',
            blocks: [
              {
                id: 'who-image',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1739271933163-8dcc7c8e8a3e?auto=format&fit=crop&w=1200&q=70',
                alt: 'A smiling person with long braids looks down at a phone held in one hand, the other hand on their chest, against a plain cream wall.',
                caption: 'Every view is one person, on one phone, deciding in a moment whether to keep watching.',
                credit: 'Photo: Ninthgrid / Unsplash',
              },
              {
                id: 'who-text',
                type: 'text',
                body: "Your audience is not a crowd. It is one person at a time, scrolling on a phone, on a bus, between lectures, before sleep.\n\nThe better you know that person, the easier every choice becomes: what to say first, how long to make it, which words to use, what time to post. The video below gives a simple process for finding them.",
              },
              {
                id: 'audience-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'HGbq-8z1fs8',
                title: 'How to find your target audience in 4 easy steps',
                channel: 'Podia',
                durationS: 336,
                caption: 'Four steps to finding your target audience. Watch for the advice to look at the people you already help, and to listen to the words they use about their own problems.',
              },
            ],
          },
          {
            id: 'terms',
            title: 'Five words creators use',
            blocks: [
              {
                id: 'voice-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Audience profile', definition: 'A short description of one typical viewer: who they are, where they are, what they want, what worries them and where they spend time online.' },
                  { term: 'Voice', definition: 'Your consistent personality across everything you make. Warm and funny. Calm and precise. Bold and outspoken.' },
                  { term: 'Tone', definition: 'How your voice adjusts to the moment. The same creator can be playful in a recipe and serious about a food-safety warning.' },
                  { term: 'Point of view', definition: 'What you believe about your topic that others might not. It is the reason your content is yours and not anyone’s.' },
                  { term: 'Content pillar', definition: 'One of three to five recurring themes your posts fall under. Pillars keep you focused and make planning easier.' },
                ],
              },
            ],
          },
          {
            id: 'pillars',
            title: 'Adaeze’s pillars',
            blocks: [
              {
                id: 'pillars-match',
                type: 'match',
                prompt: 'Adaeze has four content pillars. Match each post idea to the pillar it belongs to.',
                pairs: [
                  { id: 'recipe', left: '“Jollof for four people with one pot and one gas refill”', right: 'One-pot recipes' },
                  { id: 'market', left: '“What ₦5,000 buys at the market this week”', right: 'Budget shopping' },
                  { id: 'hack', left: '“Keep tomatoes fresh longer without a fridge”', right: 'Kitchen hacks' },
                  { id: 'story', left: '“My first year away from home, and the meal that saved me”', right: 'Student life stories' },
                ],
                explanation:
                  "Pillars give an audience something to expect and give you something to plan around. Notice that the story pillar is not a recipe at all. It is there to build connection. Most strong creators mix useful posts with posts that show who they are.",
              },
            ],
          },
          {
            id: 'baraka-voice',
            title: 'Borrowed voice',
            blocks: [
              {
                id: 'voice-scenario',
                type: 'scenario',
                situation:
                  "Baraka admires a famous creator known for loud, fast, dramatic videos with big reactions. His own clean-up videos feel slow by comparison, and views are low.\n\nHe is thinking of copying that creator’s style: shouting hooks, fast cuts, dramatic music. But Baraka is calm by nature, and the youth group he films are shy on camera.",
                prompt: 'What should Baraka do?',
                options: [
                  {
                    id: 'copy',
                    text: 'Copy the famous creator’s style exactly. It obviously works.',
                    outcome: "His next two videos get slightly more views, but the comments say it feels fake. The youth group are uncomfortable with the drama. Baraka dreads filming. By week three he stops posting.",
                    best: false,
                  },
                  {
                    id: 'learn',
                    text: 'Study *why* the famous videos hold attention, borrow the principles (a strong first line, quick pace, clear payoff) and keep his own calm voice.',
                    outcome: "Baraka opens each video with a striking before-and-after of the riverbank, cuts the slow parts and lets group members speak in short, honest clips. The videos feel like him. Viewers say they trust him. Growth is slower than viral, but steady and real.",
                    best: true,
                  },
                  {
                    id: 'ignore',
                    text: 'Ignore other creators entirely and keep doing exactly what he does now.',
                    outcome: "Baraka stays authentic, but he misses easy lessons about pacing and hooks. His videos keep losing viewers in the first few seconds.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'camera-confidence',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'camera-scale',
                type: 'scale',
                prompt: 'How comfortable do you feel showing your face or voice in content?',
                minLabel: 'Very uncomfortable',
                maxLabel: 'Completely at ease',
                afterword:
                  "Many successful creators never show their face. Hands, voice-overs, screen recordings and text can carry a whole channel. Others grew comfortable with practice. Start where you are. Your voice comes through in your words and choices, not only your face.",
              },
            ],
          },
          {
            id: 'your-audience',
            title: 'Profile your audience',
            blocks: [
              {
                id: 'audience-reflection',
                type: 'reflection',
                prompt: 'Describe one typical member of your audience in four or five sentences: who they are, where they live, what they want, what worries them, and where they spend time online. Then write three words for your voice and name three or four content pillars.',
                guidance: 'If you can, message two real people who fit the profile and ask what they would want to see. Their exact words are gold.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'niche-quiz',
      type: 'quiz',
      title: 'Module quiz: Niche, audience and voice',
      minutes: 6,
      required: true,
      gradeWeight: 8,
      payload: {
        intro: 'Five questions on niche, audience, voice and pillars. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-niche-parts',
            type: 'choice',
            prompt: 'Which four parts make up a niche in this course?',
            multiple: false,
            options: [
              { id: 'a', text: 'Topic, audience, angle, result', correct: true },
              { id: 'b', text: 'Platform, camera, music, hashtags', correct: false, feedback: 'These are tools and tactics. They change often. A niche is about what you offer and to whom.' },
              { id: 'c', text: 'Followers, likes, shares, comments', correct: false, feedback: 'These are measures of performance, not a definition of what you make.' },
              { id: 'd', text: 'Idea, script, shoot, edit', correct: false, feedback: 'That is a production process. A niche comes before it.' },
            ],
            explanation: 'Topic, audience, angle and result. If a stranger can see all four in one sentence, your niche is clear.',
          },
          {
            id: 'q-voice-tone',
            type: 'match',
            prompt: 'Match each term to its meaning.',
            pairs: [
              { id: 'voice', left: 'Voice', right: 'Your consistent personality across everything you make' },
              { id: 'tone', left: 'Tone', right: 'How that personality adjusts to a particular moment' },
              { id: 'pov', left: 'Point of view', right: 'What you believe about your topic that others might not' },
              { id: 'pillar', left: 'Content pillar', right: 'A recurring theme your posts fall under' },
            ],
            explanation: 'Voice stays steady while tone shifts. Point of view is why your content is yours. Pillars keep you focused.',
          },
          {
            id: 'q-broad',
            type: 'choice',
            prompt: 'Kofi says his audience is “anyone who likes fashion”. What is the best next step?',
            multiple: false,
            options: [
              { id: 'a', text: 'Keep it broad so he does not lose anyone', correct: false, feedback: 'Broad audiences are hard to reach and slow to trust you.' },
              { id: 'b', text: 'Name a specific group, such as young Accra professionals who want well-made local clothes for work', correct: true },
              { id: 'c', text: 'Buy followers to test interest', correct: false, feedback: 'Bought followers do not watch, buy or share. They also make your numbers meaningless.' },
              { id: 'd', text: 'Post in every style until something works', correct: false, feedback: 'Random posting makes it hard to learn anything from the results.' },
            ],
            explanation: 'A specific audience tells Kofi what to film, how to speak and where to post. He can widen later.',
          },
          {
            id: 'q-borrow',
            type: 'choice',
            prompt: 'What is the healthiest way to learn from a creator you admire?',
            multiple: false,
            options: [
              { id: 'a', text: 'Copy their style and catchphrases exactly', correct: false, feedback: 'Audiences notice. Copied voices feel fake and are tiring to keep up.' },
              { id: 'b', text: 'Avoid watching other creators so you stay original', correct: false, feedback: 'You would miss useful lessons about craft.' },
              { id: 'c', text: 'Study why their content works and apply the principles in your own voice', correct: true },
              { id: 'd', text: 'Re-upload their best videos with your caption', correct: false, feedback: 'That is copying someone else’s work, and it may break copyright rules and the platform’s terms.' },
            ],
            explanation: 'Borrow principles, not personality. Hooks, pacing and payoffs are craft. Your voice is yours.',
          },
          {
            id: 'q-audience-signals',
            type: 'choice',
            prompt: 'Which are good ways to understand your audience? Select all that apply.',
            multiple: true,
            options: [
              { id: 'ask', text: 'Message a few people who fit your profile and ask what they want', correct: true },
              { id: 'comments', text: 'Read the comments and questions on similar content', correct: true },
              { id: 'words', text: 'Note the exact words people use to describe their problems', correct: true },
              { id: 'guess', text: 'Assume they want what you want', correct: false, feedback: 'You may be part of your audience, but you are only one person. Check.' },
            ],
            explanation: 'Real conversations and real comments beat guesses. Using your audience’s own words in hooks and titles makes them feel seen.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Story and phone production (week 9)
// ---------------------------------------------------------------------------

const moduleStory: Module = {
  key: 'story-and-production',
  title: 'Story and phone production',
  summary:
    'Learn the story shapes that hold attention, then shoot, record and edit with the phone in your pocket. By the end of this module you will publish your first pieces.',
  weekNo: 9,
  items: [
    {
      key: 'stories-that-hold',
      type: 'lesson',
      title: 'Stories that hold attention',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-story',
            title: 'Why story works',
            blocks: [
              {
                id: 'why-story-text',
                type: 'text',
                body: "People scroll past information. They stop for stories.\n\nA story is not only a fairy tale or a film. A thirty-second recipe can be a story: a problem (one pot, little money, four hungry people), a struggle, a turn and a satisfying result. A post about mobile money fraud can be a story: what happened to one trader, and what she does differently now.\n\nThe short video below comes from Pixar’s storytellers, who make films for a living. Their principles work just as well on a phone screen.",
              },
              {
                id: 'pixar-intro-video',
                type: 'video',
                provider: 'youtube',
                videoId: '1rMnzNZkIX0',
                title: 'Pixar in a Box: Introduction to Storytelling',
                channel: 'Khan Academy Labs',
                durationS: 178,
                caption: 'Pixar storytellers introduce what makes a story. Listen for how they describe stories as something everyone already tells, every day.',
              },
            ],
          },
          {
            id: 'shape',
            title: 'A shape for short content',
            blocks: [
              {
                id: 'shape-framework',
                type: 'framework',
                title: 'The short-content story shape',
                steps: [
                  { label: 'Hook', detail: 'The first line or image. Give the viewer a reason to stay: a question, a surprise, a promise or a problem they recognise.' },
                  { label: 'Context', detail: 'Just enough to understand. Who, where, what is at stake. Seconds, not minutes.' },
                  { label: 'Tension', detail: 'The struggle or the question that is not yet answered. This is what keeps people watching.' },
                  { label: 'Turn', detail: 'The moment things change: the trick, the discovery, the reveal.' },
                  { label: 'Payoff', detail: 'Deliver what the hook promised. The finished meal. The safer phone. The clean riverbank.' },
                  { label: 'Next step', detail: 'One clear invitation: try it, save it, share it, come to Saturday’s clean-up.' },
                ],
              },
            ],
          },
          {
            id: 'structure',
            title: 'Put a story in order',
            blocks: [
              {
                id: 'structure-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'bKrCKg9ggVI',
                title: 'Pixar in a Box:  Story Structure',
                channel: 'Khan Academy Labs',
                durationS: 237,
                caption: 'How Pixar thinks about the structure beneath a story. Notice the “story spine”, and compare it with the six-part shape above.',
              },
              {
                id: 'structure-order',
                type: 'order',
                prompt: 'Kofi is planning a 45-second video about one shirt. Put his beats in order.',
                items: [
                  { id: 'hook', text: '“This shirt started as six yards of cloth and a client who said it couldn’t be done.”' },
                  { id: 'context', text: 'Kofi at the cloth market, choosing the fabric' },
                  { id: 'tension', text: 'The pattern will not line up across the buttons; two attempts fail' },
                  { id: 'turn', text: 'An old tailor shows him how to cut on a different line' },
                  { id: 'payoff', text: 'The client tries it on and smiles in the mirror' },
                  { id: 'next', text: '“Want one made for you? Details in my bio.”' },
                ],
                explanation:
                  "Notice how the hook promises a struggle, and the payoff resolves it. The middle beats earn the ending. Without the failed attempts, the final shirt is just a shirt. With them, it is a small victory the viewer shares.",
              },
            ],
          },
          {
            id: 'hooks',
            title: 'The first seconds',
            blocks: [
              {
                id: 'hooks-text',
                type: 'text',
                body: "Most viewers decide whether to stay almost immediately. The hook is not a trick. It is a promise: *here is why the next minute is worth your time.*\n\nStrong hooks tend to do one of four things: ask a question the viewer wants answered, show a striking result first, name a problem the viewer has, or say something surprising that is also true.",
              },
              {
                id: 'hooks-choice',
                type: 'choice',
                prompt: 'Ines is making a video about turning on two-step verification for a mobile money app. Which opening is strongest?',
                multiple: false,
                options: [
                  { id: 'hello', text: '“Hello everyone, welcome back to my channel, today I want to talk about something…”', correct: false, feedback: 'A slow greeting spends the most valuable seconds on nothing. Greet later, or not at all.' },
                  { id: 'problem', text: '“If someone got your SIM card tonight, could they empty your mobile money? Here’s how to stop that in one minute.”', correct: true, feedback: 'Yes. It names a real fear, makes it personal and promises a quick fix.' },
                  { id: 'clickbait', text: '“You won’t BELIEVE what happened to my money!!!”', correct: false, feedback: 'Exaggerated hooks may get a click, but if the video does not deliver, viewers feel tricked and stop trusting you.' },
                  { id: 'settings', text: '“Today: security settings, part three.”', correct: false, feedback: 'Accurate but flat. Why should a viewer care right now?' },
                ],
                explanation:
                  "The best hook makes a promise the rest of the content keeps. Clickbait borrows attention it cannot repay, and audiences remember. Ines’s hook works because it is specific, personal and honest.",
              },
            ],
          },
          {
            id: 'formats',
            title: 'Story in every format',
            blocks: [
              {
                id: 'formats-tip',
                type: 'callout',
                tone: 'tip',
                title: 'The same shape, different formats',
                body: "- **Short video**: hook in the first line and first image; payoff before the end.\n- **Carousel**: the first slide is the hook; each slide earns the swipe to the next.\n- **Written post or thread**: the first sentence is the hook; short paragraphs; one idea each.\n- **Audio**: open with the most interesting moment, then go back and explain.\n\nThe shape travels. Only the packaging changes.",
              },
              {
                id: 'formats-reveal',
                type: 'reveal',
                prompt: 'Baraka’s clean-up video opens with ten seconds of the group arriving and greeting each other. What would you move to the front?',
                body: "The **before-and-after**. A riverbank buried in plastic, then the same bank clear, with forty young people standing on it. That image is the hook and the payoff in one. Then go back: how did they do it, and what happens to the plastic?\n\nStarting with the result is not cheating. It is a promise, and the rest of the video shows how it was kept.",
              },
            ],
          },
          {
            id: 'your-story',
            title: 'Outline your first piece',
            blocks: [
              {
                id: 'story-reflection',
                type: 'reflection',
                prompt: 'Plan your first piece of content using the six-part shape. Write your hook word for word, then one line each for context, tension, turn, payoff and next step.',
                guidance: 'Choose an idea from your niche list. Keep it short: under a minute for video, under eight slides for a carousel, under 250 words for a post.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'shoot-and-sound',
      type: 'lesson',
      title: 'Shoot and record with your phone',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'light-first',
            title: 'Light comes first',
            blocks: [
              {
                id: 'light-text',
                type: 'text',
                body: "The camera in your pocket is good enough. What makes phone content look cheap is rarely the phone. It is **poor light, shaky framing and bad sound**.\n\nAll three can be fixed for free. Start with light. A window, a doorway or open shade outside will do more for your picture than any app. Watch how in this short video.",
              },
              {
                id: 'light-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'NA2qDnjdCXA',
                title: 'How To Shoot Videos of Yourself with iPhone Using Natural Light',
                channel: 'The Modern Videographer',
                durationS: 193,
                caption: 'How to light yourself with a window. The phone in the video does not matter: the same placement works with any phone. Watch where the subject stands in relation to the light.',
              },
            ],
          },
          {
            id: 'checklist',
            title: 'The four-point check',
            blocks: [
              {
                id: 'checklist-framework',
                type: 'framework',
                title: 'Before you press record',
                steps: [
                  { label: 'Light', detail: 'Face the light source, do not stand with it behind you. Soft daylight from a window or doorway is ideal. Avoid harsh midday sun on faces.' },
                  { label: 'Steady', detail: 'Lean the phone on books, a wall or a cheap stand. Hold it with both hands and elbows tucked in if you must hand-hold.' },
                  { label: 'Frame', detail: 'Choose vertical or horizontal for where it will be posted. Keep eyes about a third from the top. Clean up what is behind you.' },
                  { label: 'Sound', detail: 'Get the microphone close to the voice. Find a quiet, soft-furnished room. Do a ten-second test and listen back with earphones.' },
                ],
              },
              {
                id: 'mic-image',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1581548708095-7158f2e63857?auto=format&fit=crop&w=1200&q=70',
                alt: 'A close-up of the mesh head of a handheld microphone on a stand, against a soft, blurred background.',
                caption: 'Viewers forgive a slightly soft picture. They rarely forgive sound they cannot hear.',
                credit: 'Photo: Robinson Recalde / Unsplash',
              },
            ],
          },
          {
            id: 'sound',
            title: 'Sound people can hear',
            blocks: [
              {
                id: 'sound-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'CcZJEuTF0ec',
                title: 'Record Better Sound With Your Smartphone',
                channel: 'Dee Nimmin',
                durationS: 381,
                caption: 'Audio basics for any phone. Focus on the principles (distance to the mic, quiet rooms, testing) rather than the specific apps and products mentioned, which change over time.',
              },
              {
                id: 'sound-choice',
                type: 'choice',
                prompt: 'Adaeze’s cooking videos have an echo and a loud generator hum. Which changes would help? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'closer', text: 'Move the phone, or a cheap clip-on mic, closer to her mouth', correct: true, feedback: 'Yes. Distance is the biggest factor in clear sound.' },
                  { id: 'soft', text: 'Hang a cloth or record near curtains and soft furniture', correct: true, feedback: 'Yes. Soft surfaces absorb echo. Bare tiled kitchens bounce sound.' },
                  { id: 'voiceover', text: 'Film the cooking, then record the explanation as a voice-over in a quiet room', correct: true, feedback: 'Yes. Many creators do this. It also lets you script and redo lines.' },
                  { id: 'louder', text: 'Turn the music up louder to cover the hum', correct: false, feedback: 'Music on top of noise makes speech harder to hear, not easier.' },
                ],
                explanation:
                  "Get close, soften the room and separate your voice from noisy action when you can. Then always listen back with earphones before you post. Your ears will catch what the phone speaker hides.",
              },
            ],
          },
          {
            id: 'fixes',
            title: 'Problem and fix',
            blocks: [
              {
                id: 'rig-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Mobile_journalism_msu-2018-1924.jpg/1280px-Mobile_journalism_msu-2018-1924.jpg',
                alt: 'Two hands hold a smartphone in a handheld frame fitted with a small LED light on one side and a furry-covered microphone on the other.',
                caption: 'A mobile filmmaking rig: a grip, a light and a microphone around an ordinary phone. Useful one day, but every problem below can be fixed without it.',
                credit: 'Photo: Matthias Süßen / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'fixes-match',
                type: 'match',
                prompt: 'Match each problem to the simplest fix.',
                pairs: [
                  { id: 'dark', left: 'Your face is dark and the background is bright', right: 'Turn round so you face the window' },
                  { id: 'shaky', left: 'The picture wobbles as you talk', right: 'Rest the phone on a stack of books or a stand' },
                  { id: 'echo', left: 'Your voice sounds hollow and echoey', right: 'Record in a room with curtains, cushions or clothes' },
                  { id: 'cropped', left: 'Your head is cut off when the video is posted', right: 'Frame for the platform’s shape before you start' },
                ],
                explanation:
                  "None of these fixes costs money. Light, steadiness, framing and sound are habits, not equipment. Buy gear only when you know exactly which problem it solves.",
              },
            ],
          },
          {
            id: 'ines-scenario',
            title: 'Ines’s noisy shoot',
            blocks: [
              {
                id: 'ines-scenario-block',
                type: 'scenario',
                situation:
                  "Ines needs to film a two-minute explainer today. Her shared room is noisy in the evening: a television next door, traffic outside and a neighbour’s music. She has a phone, earphones with a built-in mic and a free afternoon.",
                prompt: 'What is her best plan?',
                options: [
                  {
                    id: 'evening',
                    text: 'Film in her room in the evening anyway and fix the sound in editing.',
                    outcome: "Editing apps can reduce a little noise, but they cannot remove a television conversation. Viewers struggle to hear her and leave early.",
                    best: false,
                  },
                  {
                    id: 'afternoon',
                    text: 'Film the screen recording now, then record her voice in the quietest hour of the afternoon, with the earphone mic close to her mouth, in a wardrobe corner surrounded by clothes.',
                    outcome: "Her voice is clear and close. The clothes soak up echo. She records each line twice and keeps the best. The finished explainer sounds calm and professional.",
                    best: true,
                  },
                  {
                    id: 'outside',
                    text: 'Go to a busy street café with good light and film there.',
                    outcome: "The light is lovely, but traffic, voices and a coffee grinder fill the audio. For an explainer, clear speech matters more than a pretty background.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'plan-shoot',
            title: 'Plan your shoot',
            blocks: [
              {
                id: 'shoot-reflection',
                type: 'reflection',
                prompt: 'Plan the shoot for your first piece. Where will you record? Where is the light? How will you keep the phone steady? How will you get clean sound? What will you do if it is noisy?',
                guidance: 'Do a ten-second test shot in your chosen spot before the real thing, and note what you changed.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'edit-on-your-phone',
      type: 'lesson',
      title: 'Edit on your phone',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'edit-intro',
            title: 'Editing is where the story appears',
            blocks: [
              {
                id: 'edit-intro-text',
                type: 'text',
                body: "Editing is not decoration. It is where you decide what the viewer sees, in what order, for how long. Most of editing is **cutting**: removing every second that does not serve the story.\n\nFree phone editors can do everything you need for this course. The video below walks through one popular app. Apps change and come and go, so focus on the steps, which are the same in any editor.",
              },
              {
                id: 'edit-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'xwia09aJLcU',
                title: 'How To Edit Videos with Capcut for Beginners 2024 | Basic Tips & Tricks',
                channel: 'Adekemi Isamotu',
                durationS: 525,
                caption: 'A beginner’s walkthrough of a phone editing app. Watch for the basic moves (trimming, splitting, adding text and captions, adjusting audio, exporting) that every editor shares.',
              },
            ],
          },
          {
            id: 'edit-terms',
            title: 'Editing words',
            blocks: [
              {
                id: 'edit-key-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Trim and split', definition: 'Shortening a clip from either end, or cutting it in two so you can remove the middle.' },
                  { term: 'Jump cut', definition: 'A cut within the same shot that skips time, often used to remove pauses in talking videos.' },
                  { term: 'B-roll', definition: 'Extra footage shown over your voice: hands chopping onions, the riverbank, the cloth market. It keeps the picture moving.' },
                  { term: 'Captions', definition: 'On-screen words that match what is said. Many people watch with the sound off, and captions make content accessible.' },
                  { term: 'Aspect ratio', definition: 'The shape of the frame: tall (9:16) for most short-video feeds, square or 4:5 for many photo feeds, wide (16:9) for longer video.' },
                  { term: 'Export', definition: 'Saving the finished video as a file at a chosen quality, ready to post.' },
                ],
              },
            ],
          },
          {
            id: 'edit-order',
            title: 'A simple editing workflow',
            blocks: [
              {
                id: 'edit-order-block',
                type: 'order',
                prompt: 'Put this editing workflow in a sensible order.',
                items: [
                  { id: 'select', text: 'Watch everything and pick the best takes' },
                  { id: 'rough', text: 'Lay them out in story order and cut the dead air' },
                  { id: 'broll', text: 'Add B-roll over the talking parts' },
                  { id: 'captions', text: 'Add captions and any on-screen text' },
                  { id: 'audio', text: 'Balance voice and music so speech is always clear' },
                  { id: 'check', text: 'Watch it once on mute and once with earphones, then export' },
                ],
                explanation:
                  "Structure first, polish last. If you add music and effects before the story works, you will waste time polishing scenes you later cut. The final double check, on mute and with earphones, catches most mistakes.",
              },
            ],
          },
          {
            id: 'captions-why',
            title: 'Why captions matter',
            blocks: [
              {
                id: 'captions-choice',
                type: 'choice',
                prompt: 'Kofi wonders whether captions are worth the extra ten minutes per video. What is the strongest reason to add them?',
                multiple: false,
                options: [
                  { id: 'trend', text: 'Everyone else uses them', correct: false, feedback: 'That is a weak reason on its own. There is a better one.' },
                  { id: 'access', text: 'Many people watch with the sound off, and captions let people who are deaf or hard of hearing follow too', correct: true, feedback: 'Yes. Captions widen your audience and respect it.' },
                  { id: 'hide', text: 'They hide mistakes in the video', correct: false, feedback: 'Captions show what is said. They do not hide poor sound or framing.' },
                  { id: 'length', text: 'They make videos longer', correct: false, feedback: 'Captions do not change length. And longer is not automatically better.' },
                ],
                explanation:
                  "Captions are good craft and good manners. They help people watching on a bus, people in noisy places, people still learning the language and people who are deaf or hard of hearing. Check automatic captions carefully: they often get names and local words wrong.",
              },
            ],
          },
          {
            id: 'data-light',
            title: 'Editing on a budget',
            blocks: [
              {
                id: 'data-light-tip',
                type: 'callout',
                tone: 'tip',
                title: 'When data and storage are tight',
                body: "- Edit offline where you can, and upload once on Wi-Fi.\n- Delete bad takes as you go so your phone does not fill up.\n- Export at the quality the platform needs, not the highest possible.\n- Back up finished pieces somewhere other than your phone. A lost phone should not mean a lost portfolio.",
              },
              {
                id: 'edit-where-poll',
                type: 'poll',
                prompt: 'Where will you do most of your editing?',
                options: [
                  { id: 'phone', text: 'On my phone' },
                  { id: 'laptop', text: 'On a laptop or computer' },
                  { id: 'shared', text: 'On a shared computer, at a hub, café or school' },
                  { id: 'none', text: 'I will post with little or no editing' },
                ],
                afterword:
                  "Any of these can work. Even “little or no editing” content benefits from trimming the start and end and adding a caption. Choose the workflow you will actually repeat three times a week.",
              },
            ],
          },
          {
            id: 'first-edit',
            title: 'Edit and publish',
            blocks: [
              {
                id: 'first-edit-reflection',
                type: 'reflection',
                prompt: 'Edit and publish your first piece. Then write: what did you cut, and why? What took longest? What would you do differently next time?',
                guidance: 'Save the link. This is the first piece in your portfolio. Perfect is not the goal; published is.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'first-pieces-discussion',
      type: 'discussion',
      title: 'Discussion: share your first piece',
      minutes: 12,
      required: true,
      payload: {
        prompt:
          "Share the link to your first published piece (or a screenshot if you prefer not to share the link).\n\nIn your post, tell us:\n\n1. Your niche statement in one sentence.\n2. Your hook, word for word.\n3. One thing you are proud of and one thing you would change.\n\nThen give feedback to at least two classmates. For each, say whether the hook made you want to keep watching or reading, and suggest one specific improvement to light, sound, framing or editing.",
        guidance: 'Be generous and specific. “Nice!” helps nobody. “Your hook is strong, but I lost the sound when the generator came on at 0:20” helps a lot.',
        minWords: 60,
      },
    },
    {
      key: 'story-quiz',
      type: 'quiz',
      title: 'Module quiz: Story and phone production',
      minutes: 6,
      required: true,
      gradeWeight: 8,
      payload: {
        intro: 'Six questions on story shape, hooks, shooting, sound and editing. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-shape',
            type: 'order',
            prompt: 'Put the short-content story shape in order.',
            items: [
              { id: 'hook', text: 'Hook' },
              { id: 'context', text: 'Context' },
              { id: 'tension', text: 'Tension' },
              { id: 'turn', text: 'Turn' },
              { id: 'payoff', text: 'Payoff' },
              { id: 'next', text: 'Next step' },
            ],
            explanation: 'Hook, context, tension, turn, payoff, next step. The hook makes a promise and the payoff keeps it.',
          },
          {
            id: 'q-hook',
            type: 'choice',
            prompt: 'What is a hook, at its best?',
            multiple: false,
            options: [
              { id: 'a', text: 'A promise to the viewer that the rest of the content keeps', correct: true },
              { id: 'b', text: 'A dramatic claim that gets the click, whether or not it is true', correct: false, feedback: 'That is clickbait. It costs you trust when the content does not deliver.' },
              { id: 'c', text: 'A friendly greeting to your followers', correct: false, feedback: 'Greetings are fine later. They are a weak way to start.' },
              { id: 'd', text: 'The music at the start of a video', correct: false, feedback: 'Music can support a hook but is rarely the reason someone stays.' },
            ],
            explanation: 'A good hook earns attention honestly: a question, a striking result, a recognisable problem or a true surprise.',
          },
          {
            id: 'q-light',
            type: 'choice',
            prompt: 'You are filming yourself indoors in the day. Where should the main light be?',
            multiple: false,
            options: [
              { id: 'behind', text: 'A bright window behind you', correct: false, feedback: 'A bright window behind you turns your face into a dark shape.' },
              { id: 'front', text: 'In front of you or slightly to one side, such as a window you face', correct: true },
              { id: 'above', text: 'A single bulb directly overhead', correct: false, feedback: 'Overhead light casts shadows under the eyes and nose.' },
              { id: 'none', text: 'It does not matter with a modern phone', correct: false, feedback: 'Phones handle low light better than before, but light still makes the biggest difference to picture quality.' },
            ],
            explanation: 'Face the light. Soft daylight from a window you are facing is the best free light there is.',
          },
          {
            id: 'q-sound',
            type: 'choice',
            prompt: 'Which are effective ways to improve sound on a phone? Select all that apply.',
            multiple: true,
            options: [
              { id: 'close', text: 'Get the microphone closer to the speaker', correct: true },
              { id: 'soft', text: 'Record in a room with soft furnishings', correct: true },
              { id: 'test', text: 'Do a short test and listen back with earphones', correct: true },
              { id: 'music', text: 'Add louder music to cover background noise', correct: false, feedback: 'This makes speech harder to follow.' },
            ],
            explanation: 'Distance, room and testing. Most bad sound can be fixed before you press record.',
          },
          {
            id: 'q-edit-terms',
            type: 'match',
            prompt: 'Match each editing term to its meaning.',
            pairs: [
              { id: 'broll', left: 'B-roll', right: 'Extra footage shown over your voice' },
              { id: 'jump', left: 'Jump cut', right: 'A cut that skips time within the same shot' },
              { id: 'captions', left: 'Captions', right: 'On-screen words matching what is said' },
              { id: 'ratio', left: 'Aspect ratio', right: 'The shape of the frame' },
            ],
            explanation: 'These four ideas cover most of what beginner editing needs.',
          },
          {
            id: 'q-polish',
            type: 'choice',
            prompt: 'Why should you get the story structure right before adding music and effects?',
            multiple: false,
            options: [
              { id: 'a', text: 'Because music is not allowed on most platforms', correct: false, feedback: 'Music is widely used, though you must have the right to use it.' },
              { id: 'b', text: 'So you do not waste time polishing scenes you later cut', correct: true },
              { id: 'c', text: 'Because effects slow down your phone', correct: false, feedback: 'They might, but that is not the main reason.' },
              { id: 'd', text: 'Because viewers prefer videos without effects', correct: false, feedback: 'Some do, some do not. The reason is about your workflow.' },
            ],
            explanation: 'Structure first, polish last. It is faster, and it keeps your attention on the story.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Publish consistently and learn from data (week 10)
// ---------------------------------------------------------------------------

const modulePublish: Module = {
  key: 'publish-and-improve',
  title: 'Publish consistently and learn from data',
  summary:
    'Build a simple system that lets you publish every few days without burning out, choose the platforms your audience actually uses, and read your numbers to decide what to make next.',
  weekNo: 10,
  items: [
    {
      key: 'plan-and-publish',
      type: 'lesson',
      title: 'Plan and publish consistently',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'consistency',
            title: 'Consistency beats bursts',
            blocks: [
              {
                id: 'consistency-text',
                type: 'text',
                body: "Many new creators post five times in one excited week, then nothing for a month. Audiences, and the platforms that show your work to them, reward the opposite: a steady rhythm you can keep.\n\nConsistency is not about willpower. It is about a **system**: a bank of ideas, time set aside to make several pieces at once, and a calendar that tells you what is next. The video below is full of practical ways to stay consistent without spending every evening on content.",
              },
              {
                id: 'consistency-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'ACAzCVFIw9o',
                title: "Watch this if you're NOT consistent on social media",
                channel: 'Jade Beason',
                durationS: 701,
                caption: 'A creator’s practical tips for posting consistently without burning out. Note the ideas you could use this week, especially batching and reusing one idea in several ways.',
              },
            ],
          },
          {
            id: 'system',
            title: 'A weekly content system',
            blocks: [
              {
                id: 'system-framework',
                type: 'framework',
                title: 'From idea to published',
                steps: [
                  { label: 'Capture', detail: 'Keep an idea bank in your notes app. Add every question your audience asks and every idea that fits your pillars.' },
                  { label: 'Plan', detail: 'Once a week, choose the next pieces and put them on a calendar with a date, a pillar and a format.' },
                  { label: 'Batch', detail: 'Shoot or write several pieces in one session. Changing your shirt between videos counts as a new day.' },
                  { label: 'Edit', detail: 'Edit in a second session. Separating making and editing makes both faster.' },
                  { label: 'Publish', detail: 'Post on your planned days, at times your audience is around. Schedule ahead if your tools allow.' },
                  { label: 'Engage', detail: 'Reply to comments in the first hours. Conversation builds community and gives you new ideas.' },
                  { label: 'Review', detail: 'Once a week, look at what worked and feed it back into the plan.' },
                ],
              },
            ],
          },
          {
            id: 'kofi-calendar',
            title: 'Kofi’s calendar',
            blocks: [
              {
                id: 'calendar-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Brainstorming_Customer_Feedback_%281%29.jpg/1280px-Brainstorming_Customer_Feedback_%281%29.jpg',
                alt: 'Two hands arrange handwritten sticky notes into rows on a wooden table, next to a pile of yellow notes, an open notebook and a pen.',
                caption: 'A calendar does not need software. Sticky notes on a table or a wall work well for planning a month.',
                credit: 'Photo: Steveonmz / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'calendar-example',
                type: 'example',
                title: 'One fortnight, three pillars, two formats',
                body: "Kofi’s pillars are **How it’s made**, **Style tips** and **Client stories**. He posts short video on Mondays and Thursdays, and a photo carousel on Saturdays.\n\n- **Mon**: video, How it’s made: cutting a kaftan pattern.\n- **Thu**: video, Style tips: three ways to wear one shirt.\n- **Sat**: carousel, Client stories: a teacher’s graduation outfit, from fabric to photo.\n- **Mon**: video, How it’s made: why hand-finishing matters.\n- **Thu**: video, Style tips: matching prints without clashing.\n- **Sat**: carousel, How it’s made: a day at the cloth market.\n\nHe films all four videos on one Sunday afternoon and edits them on Sunday evening. Three posts a week takes him about five hours in total. That rhythm, in his fictional case, is one he can keep.",
              },
            ],
          },
          {
            id: 'platforms',
            title: 'Where your audience is',
            blocks: [
              {
                id: 'platforms-text',
                type: 'text',
                body: "You do not need to be everywhere. Choose one main platform where your audience already spends time, and at most one or two others where you reuse your work.\n\nPlatforms change their features and rules often, so do not build everything on one feature. Ask: *where do the people in my audience profile actually scroll, listen and read?* Then check by asking a few of them.",
              },
              {
                id: 'repurpose-choice',
                type: 'choice',
                prompt: 'Adaeze films one recipe video. Which are sensible ways to reuse that single shoot? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'carousel', text: 'A photo carousel of the steps with the ingredient costs', correct: true, feedback: 'Yes. Same content, new format, little extra work.' },
                  { id: 'status', text: 'A short clip shared to her messaging status and community groups', correct: true, feedback: 'Yes. Many audiences live in messaging apps, not only public feeds.' },
                  { id: 'written', text: 'A written recipe post with tips from her comments', correct: true, feedback: 'Yes. Writing reaches people who prefer to read, and it is easy to search and save.' },
                  { id: 'repost', text: 'The identical video posted five times on the same account', correct: false, feedback: 'Repeating the same post annoys followers. Reuse means adapting, not duplicating.' },
                ],
                explanation:
                  "Repurposing is how small creators keep up. One good shoot can feed a week of posts across formats and places, as long as each version is adapted to where it lives.",
              },
            ],
          },
          {
            id: 'baraka-burnout',
            title: 'Baraka’s burnout',
            blocks: [
              {
                id: 'burnout-scenario',
                type: 'scenario',
                situation:
                  "Baraka promised himself he would post every single day. After nine days he is exhausted. He is behind on his studies, and the clean-up group are tired of being filmed. He has not posted for three days and feels guilty.",
                prompt: 'What should Baraka do?',
                options: [
                  {
                    id: 'push',
                    text: 'Force himself back to daily posting and stay up late to catch up.',
                    outcome: "He manages a week, but quality drops and his grades suffer. He quits again, this time for longer.",
                    best: false,
                  },
                  {
                    id: 'reset',
                    text: 'Reset to two posts a week he can keep, batch-film once at each Saturday clean-up, and tell his audience the new rhythm.',
                    outcome: "Two posts a week is sustainable. The group knows filming happens once, so they relax. Baraka’s followers appreciate the honesty, and each post is better made.",
                    best: true,
                  },
                  {
                    id: 'quit',
                    text: 'Delete the account. Content creation is not for him.',
                    outcome: "Baraka loses the audience he built and the cause loses a voice. The problem was the plan, not Baraka.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-rhythm',
            title: 'Set your rhythm',
            blocks: [
              {
                id: 'rhythm-reflection',
                type: 'reflection',
                prompt: 'Decide your publishing rhythm for the next two weeks and beyond. Which platform is your main one, and why? How many posts a week can you truly sustain? When will you batch-create? Sketch your next six posts with date, pillar and format.',
                guidance: 'Pick a rhythm you could keep during a busy exam week. This becomes the backbone of your 30-day calendar.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'read-your-analytics',
      type: 'lesson',
      title: 'Read your analytics',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'numbers-tell',
            title: 'What the numbers are for',
            blocks: [
              {
                id: 'numbers-text',
                type: 'text',
                body: "Every platform gives you numbers. Most creators either ignore them or stare at them anxiously. Both are mistakes.\n\nAnalytics exist to answer **questions that change what you make next**: Did people stop scrolling? Did they stay? Did they do anything afterwards? The video below looks at one platform’s analytics, but the habit it teaches works on any platform: look for where your viewers come from and what they do.",
              },
              {
                id: 'analytics-video',
                type: 'video',
                provider: 'youtube',
                videoId: '7n9hBmA-oCY',
                title: '3 Ridiculously Useful YouTube Analytics (Small Channels, Pay Attention!)',
                channel: 'Nate Black',
                durationS: 517,
                caption: 'Three analytics views that small channels often overlook. Even if you do not use this platform, watch for the habit of asking how people found your content and what that tells you to make next.',
              },
            ],
          },
          {
            id: 'metric-terms',
            title: 'The numbers that matter',
            blocks: [
              {
                id: 'metric-key-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Reach', definition: 'How many different people saw your content at least once.' },
                  { term: 'Views', definition: 'How many times it was seen or played. One person can view more than once.' },
                  { term: 'Retention', definition: 'How long people kept watching or listening, often shown as a curve or an average percentage.' },
                  { term: 'Engagement', definition: 'Actions people took: likes, comments, shares, saves. Often divided by reach or views to give a rate.' },
                  { term: 'Shares and saves', definition: 'Strong signals that content was useful or moving enough to keep or pass on.' },
                  { term: 'Conversion', definition: 'People doing the thing you asked: joining a clean-up, ordering a shirt, signing up.' },
                ],
              },
            ],
          },
          {
            id: 'adaeze-data',
            title: 'Adaeze’s first six posts',
            blocks: [
              {
                id: 'adaeze-example',
                type: 'example',
                title: 'A fictional fortnight of results',
                body: "1. One-pot jollof for four: 2,400 views, 38% average watched, 61 saves.\n2. My first year away from home: 900 views, 72% average watched, 44 comments.\n3. What ₦5,000 buys this week: 5,100 views, 31% average watched, 210 shares.\n4. Beans three ways: 1,100 views, 29% average watched, 12 saves.\n5. Keep tomatoes fresh without a fridge: 3,800 views, 55% average watched, 190 saves.\n6. Noodles upgrade: 700 views, 22% average watched, 5 saves.\n\nAll numbers are fictional.",
              },
              {
                id: 'adaeze-choice',
                type: 'choice',
                prompt: 'What is the most useful conclusion Adaeze can draw?',
                multiple: false,
                options: [
                  { id: 'views', text: 'Only post market-price videos, because post 3 got the most views', correct: false, feedback: 'Views are one signal. Post 3 had low retention: many people left early. Shares are promising, but one post is not a pattern.' },
                  { id: 'mix', text: 'Practical money-saving and food-saving tips get shared and saved; personal stories hold attention and spark conversation. Make more of both and drop the weakest recipe ideas.', correct: true, feedback: 'Yes. She reads several signals together and turns them into decisions.' },
                  { id: 'quit', text: 'Her content is failing because no post passed 10,000 views', correct: false, feedback: 'For a new creator these fictional numbers show real interest. Compare with yourself, not with famous accounts.' },
                  { id: 'random', text: 'Results are random, so the numbers are useless', correct: false, feedback: 'Single posts vary a lot, but patterns across several posts are meaningful.' },
                ],
                explanation:
                  "Look for patterns across several posts, and read metrics together: reach tells you whether people saw it, retention whether they stayed, saves and shares whether it was worth keeping. Then make a decision: more of this, less of that, try a new hook here.",
              },
            ],
          },
          {
            id: 'metric-questions',
            title: 'Which number answers which question?',
            blocks: [
              {
                id: 'metric-match',
                type: 'match',
                prompt: 'Match each question to the metric that best answers it.',
                pairs: [
                  { id: 'hook', left: 'Did my hook make people stay?', right: 'Retention in the first few seconds' },
                  { id: 'useful', left: 'Was it useful enough to keep?', right: 'Saves' },
                  { id: 'spread', left: 'Did people want others to see it?', right: 'Shares' },
                  { id: 'action', left: 'Did anyone do what I asked?', right: 'Conversions, such as sign-ups or orders' },
                ],
                explanation:
                  "Start from the question, then find the number. That keeps analytics practical instead of overwhelming.",
              },
            ],
          },
          {
            id: 'vanity',
            title: 'Vanity and wellbeing',
            blocks: [
              {
                id: 'vanity-reveal',
                type: 'reveal',
                prompt: 'Why do experienced creators call follower counts and likes “vanity metrics”? Think, then tap.',
                body: "Because they feel good but rarely tell you what to do next. A thousand followers who never watch are worth less than a hundred who share every post and come to your events.\n\nThey can also be bought or inflated, which makes them easy to fake and easy to misread. Focus on numbers linked to your goal: retention, saves, shares, replies and real actions.",
              },
              {
                id: 'wellbeing-caution',
                type: 'callout',
                tone: 'caution',
                title: 'You are not your numbers',
                body: "Checking stats every hour is a fast route to anxiety. Set a weekly review time, look at patterns, make one or two decisions, and close the app. A post that underperforms is information, not a verdict on you.",
              },
            ],
          },
          {
            id: 'your-metrics',
            title: 'Choose your measures',
            blocks: [
              {
                id: 'metrics-reflection',
                type: 'reflection',
                prompt: 'Look at the numbers for the pieces you have published so far. Choose three metrics that match your goal, and for each write what it tells you and what you will change because of it.',
                guidance: 'If you have only one or two posts, say what you expect to learn and check again after six. This becomes the performance review in your portfolio.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'publish-quiz',
      type: 'quiz',
      title: 'Module quiz: Publish and improve',
      minutes: 6,
      required: true,
      gradeWeight: 7,
      payload: {
        intro: 'Five questions on consistency, planning, platforms and analytics. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-system',
            type: 'order',
            prompt: 'Put the weekly content system in order.',
            items: [
              { id: 'capture', text: 'Capture ideas' },
              { id: 'plan', text: 'Plan the calendar' },
              { id: 'batch', text: 'Batch-create' },
              { id: 'edit', text: 'Edit' },
              { id: 'publish', text: 'Publish and engage' },
              { id: 'review', text: 'Review results' },
            ],
            explanation: 'The review feeds the next plan. That loop is what makes you better each week.',
          },
          {
            id: 'q-rhythm',
            type: 'choice',
            prompt: 'Which publishing rhythm is best for a student creator with exams coming?',
            multiple: false,
            options: [
              { id: 'a', text: 'Daily posts, whatever it takes', correct: false, feedback: 'An unsustainable rhythm usually ends in a long silence.' },
              { id: 'b', text: 'A smaller number of posts each week that they can keep up even in a busy week', correct: true },
              { id: 'c', text: 'Post only when inspired', correct: false, feedback: 'Inspiration is unreliable. A system gets you through the uninspired days.' },
              { id: 'd', text: 'Post everything in one day and then rest for a month', correct: false, feedback: 'Bursts and silences make it hard for an audience to rely on you.' },
            ],
            explanation: 'A rhythm you can keep beats an ambitious one you abandon.',
          },
          {
            id: 'q-metrics',
            type: 'match',
            prompt: 'Match each metric to what it tells you.',
            pairs: [
              { id: 'reach', left: 'Reach', right: 'How many different people saw it' },
              { id: 'retention', left: 'Retention', right: 'How long people stayed' },
              { id: 'saves', left: 'Saves', right: 'Whether people wanted to keep it' },
              { id: 'conversion', left: 'Conversion', right: 'Whether people did what you asked' },
            ],
            explanation: 'Read them together. High reach with low retention often means the hook works but the content does not deliver.',
          },
          {
            id: 'q-vanity',
            type: 'choice',
            prompt: 'Which of these are usually vanity metrics when used on their own? Select all that apply.',
            multiple: true,
            options: [
              { id: 'followers', text: 'Total followers', correct: true },
              { id: 'likes', text: 'Likes', correct: true },
              { id: 'signups', text: 'Number of people who signed up for your clean-up through your link', correct: false, feedback: 'This is a conversion tied to a real goal. It is not vanity.' },
              { id: 'retention', text: 'Average percentage watched', correct: false, feedback: 'Retention tells you about quality and pacing. It is a useful metric.' },
            ],
            explanation: 'Followers and likes are pleasant but shallow. Tie your measures to the result you want.',
          },
          {
            id: 'q-repurpose',
            type: 'choice',
            prompt: 'What does repurposing content mean?',
            multiple: false,
            options: [
              { id: 'a', text: 'Posting the same file many times on one account', correct: false, feedback: 'That is repetition, and followers notice.' },
              { id: 'b', text: 'Adapting one piece of work into new formats for different places', correct: true },
              { id: 'c', text: 'Re-uploading other creators’ content', correct: false, feedback: 'That is using someone else’s work, and may break copyright.' },
              { id: 'd', text: 'Deleting old posts that did badly', correct: false, feedback: 'That is not repurposing, and low-performing posts can still teach you something.' },
            ],
            explanation: 'One shoot, many formats, each adapted to its place.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 4 · Rights, earning and your portfolio (week 10)
// ---------------------------------------------------------------------------

const portfolioTemplate = [
  'CONTENT PORTFOLIO AND 30-DAY CALENDAR',
  '',
  '1. Niche and audience',
  'Your niche statement (format, topic, audience, result), a short audience profile, your three voice words and your content pillars.',
  '',
  '2. Published pieces',
  'At least six pieces across two formats. For each: date, platform, format, pillar, hook, and a link or screenshot.',
  '',
  '3. Performance review',
  'The three metrics you chose and why. A short table of results for each piece. What worked, what did not, and the patterns you see.',
  '',
  '4. What I will change',
  'Three specific decisions based on your review: more of, less of, try next.',
  '',
  '5. Rights and consent check',
  'Where your music, images and footage came from and your right to use them. Who appears in your content and how you got their consent.',
  '',
  '6. 30-day calendar',
  'Your publishing rhythm and main platform. A day-by-day or week-by-week plan with date, pillar, format and working title for each piece, and when you will batch-create and review.',
  '',
  '7. Earning and next steps (optional)',
  'If relevant, one honest way this content could support your venture, cause or income, and what you would need first.',
].join('\n');

const moduleRights: Module = {
  key: 'rights-and-portfolio',
  title: 'Rights, earning and your portfolio',
  summary:
    'Protect yourself and the people in your content: copyright, consent and honest earning. Then bring everything together in your Content Portfolio and 30-Day Calendar.',
  weekNo: 10,
  items: [
    {
      key: 'rights-consent-earning',
      type: 'lesson',
      title: 'Copyright, consent and earning responsibly',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'copyright-basics',
            title: 'Whose work is it?',
            blocks: [
              {
                id: 'copyright-text',
                type: 'text',
                body: "Every song, photo, video clip and piece of writing was made by someone, and in most countries the maker owns the copyright automatically. Using it without permission can get your content removed, your account restricted or, in serious cases, lead to legal action.\n\nThe short video below explains copyright, the public domain and “fair use”. Watch it, then read the note underneath about how this applies where you live.",
              },
              {
                id: 'copyright-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'XzzkSZ0Jrko',
                title: 'Understanding Copyright, Public Domain, and Fair Use',
                channel: 'LearnFree',
                durationS: 162,
                caption: 'A plain introduction to copyright, public domain and fair use. Watch for the difference between work you may use freely and work that needs permission.',
              },
              {
                id: 'copyright-context',
                type: 'callout',
                tone: 'context',
                title: 'Rules differ by country',
                body: "“Fair use” is a United States idea. Many other countries have their own copyright laws with narrower exceptions, sometimes called “fair dealing”. Platforms also have their own rules, which can be stricter than the law.\n\nThe safe habit everywhere: **make it yourself, use material licensed for reuse, or get permission in writing.** When in doubt, leave it out.",
              },
            ],
          },
          {
            id: 'safe-to-use',
            title: 'Safe to use?',
            blocks: [
              {
                id: 'safe-choice',
                type: 'choice',
                prompt: 'Kofi is editing a video. Which of these can he use without asking anyone? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'own', text: 'Footage he filmed himself in his own workshop', correct: true, feedback: 'Yes. He made it, so he owns it, as long as people in it agreed to appear.' },
                  { id: 'library', text: 'A track from his editing app’s music library licensed for use in that app’s videos', correct: true, feedback: 'Yes, within the terms of that licence. Read them once.' },
                  { id: 'hit', text: 'The chorus of a popular hit song, because it is only fifteen seconds', correct: false, feedback: 'There is no general “fifteen-second rule”. Short clips of a song are still copyrighted.' },
                  { id: 'photo', text: 'A fashion photo from another brand’s page, with credit in the caption', correct: false, feedback: 'Credit is polite but it is not permission. Ask first, or use your own photos.' },
                ],
                explanation:
                  "Credit is not the same as permission. The safest sources are your own work, material clearly licensed for your use, and work whose owner has said yes in writing.",
              },
            ],
          },
          {
            id: 'consent',
            title: 'People in your content',
            blocks: [
              {
                id: 'consent-scenario',
                type: 'scenario',
                situation:
                  "At Saturday’s clean-up Baraka films a wide shot of forty volunteers. Later he wants to post a close-up of one volunteer crying as she talks about the river near her home. Some of the volunteers are under eighteen.",
                prompt: 'What should Baraka do?',
                options: [
                  {
                    id: 'post',
                    text: 'Post the close-up. It is powerful, and she spoke on camera, so she must be fine with it.',
                    outcome: "The video spreads. The volunteer is upset: she was emotional and did not expect to be shown to thousands of strangers. Trust in the group drops.",
                    best: false,
                  },
                  {
                    id: 'ask',
                    text: 'Ask the volunteer privately whether she is happy for that clip to be posted, show it to her first, and get a parent or guardian’s permission for any volunteers under eighteen.',
                    outcome: "She asks him to use a different moment where she is calmer, and agrees. Parents of younger volunteers sign a simple form. Baraka adds a short consent step to every clean-up. The group trusts him more.",
                    best: true,
                  },
                  {
                    id: 'blur',
                    text: 'Post it with her face blurred and do not ask.',
                    outcome: "Her friends recognise her voice and clothes anyway. Blurring helps sometimes, but it does not replace asking.",
                    best: false,
                  },
                ],
              },
              {
                id: 'consent-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Consent habits',
                body: "- Ask before you film people up close, and again before you post anything sensitive.\n- Get a parent or guardian’s permission for anyone under eighteen, and avoid making children the focus of your content.\n- Never post someone at their most vulnerable without clear agreement.\n- Remove content if someone asks you to. Their safety matters more than your views.",
              },
            ],
          },
          {
            id: 'earning',
            title: 'Earning from content',
            blocks: [
              {
                id: 'earning-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Your own products or services', definition: 'Using content to sell what you make: Kofi’s shirts, Ines’s training sessions. Often the most reliable route for small creators.' },
                  { term: 'Brand partnerships', definition: 'Being paid by a business to feature its product. Must be clearly disclosed to your audience.' },
                  { term: 'Affiliate links', definition: 'Earning a small commission when people buy through your link. Also needs disclosure.' },
                  { term: 'Platform payouts', definition: 'Money some platforms share with creators who meet their requirements. Rules and eligibility vary by country and change often.' },
                  { term: 'Audience support', definition: 'Tips, memberships or donations from people who value your work.' },
                  { term: 'Client work', definition: 'Being paid to create content for others, using the skills your portfolio shows.' },
                ],
              },
              {
                id: 'disclosure-choice',
                type: 'choice',
                prompt: 'A phone shop offers Ines payment to review its new handset. What should she do?',
                multiple: false,
                options: [
                  { id: 'hide', text: 'Accept and present the review as her own independent opinion', correct: false, feedback: 'Hiding payment misleads viewers and may break advertising rules and platform terms.' },
                  { id: 'disclose', text: 'Accept only if she can give an honest review, and say clearly at the start that it is a paid partnership', correct: true, feedback: 'Yes. Disclosure protects her audience and her reputation.' },
                  { id: 'praise', text: 'Accept and only mention the good points, so the shop is happy', correct: false, feedback: 'A one-sided review is still misleading, even with disclosure.' },
                  { id: 'never', text: 'Refuse all paid work forever', correct: false, feedback: 'Paid partnerships can be fine. The question is honesty and fit with her audience.' },
                ],
                explanation:
                  "Your audience’s trust is the most valuable thing you have. Disclose every paid relationship clearly and early, and only promote what you would recommend anyway.",
              },
            ],
          },
          {
            id: 'your-rights-check',
            title: 'Your rights and earning plan',
            blocks: [
              {
                id: 'rights-reflection',
                type: 'reflection',
                prompt: 'Check your published pieces. Where did every song, image and clip come from, and do you have the right to use it? Who appears in your content, and did they agree? Then name one honest way your content could support your venture, cause or income in future.',
                guidance: 'Fix or remove anything you are not sure about. This becomes the rights and consent section of your portfolio.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'rights-quiz',
      type: 'quiz',
      title: 'Module quiz: Rights and earning',
      minutes: 6,
      required: true,
      gradeWeight: 7,
      payload: {
        intro: 'Five questions on copyright, consent and earning. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-credit',
            type: 'choice',
            prompt: 'You use another creator’s photo and write “credit to the owner” in the caption. Is that enough?',
            multiple: false,
            options: [
              { id: 'a', text: 'Yes, credit counts as permission', correct: false, feedback: 'Credit is courtesy, not permission.' },
              { id: 'b', text: 'No. You need permission or a licence that allows the use', correct: true },
              { id: 'c', text: 'Yes, if the photo is small', correct: false, feedback: 'Size does not change ownership.' },
              { id: 'd', text: 'Yes, if you are not making money', correct: false, feedback: 'Non-commercial use can still break copyright.' },
            ],
            explanation: 'Make it, license it, or ask. Credit is good manners on top of permission, not instead of it.',
          },
          {
            id: 'q-sources',
            type: 'match',
            prompt: 'Match each source to how you can use it.',
            pairs: [
              { id: 'own', left: 'Footage you filmed yourself', right: 'Yours to use, with consent from people in it' },
              { id: 'licensed', left: 'Music from a library licensed for your use', right: 'Usable within the licence terms' },
              { id: 'hit', left: 'A popular commercial song', right: 'Needs permission from the rights holders' },
              { id: 'public', left: 'A work in the public domain', right: 'Free for anyone to use' },
            ],
            explanation: 'Knowing which bucket a piece falls into tells you what you must do before you use it.',
          },
          {
            id: 'q-consent',
            type: 'choice',
            prompt: 'Which are good consent habits? Select all that apply.',
            multiple: true,
            options: [
              { id: 'ask', text: 'Asking before you post close-ups of people', correct: true },
              { id: 'guardian', text: 'Getting a parent or guardian’s permission for anyone under eighteen', correct: true },
              { id: 'remove', text: 'Removing content when someone asks', correct: true },
              { id: 'assume', text: 'Assuming that anyone who spoke on camera agreed to be posted', correct: false, feedback: 'Speaking to a camera is not the same as agreeing to be shown to thousands of strangers, especially at an emotional moment.' },
            ],
            explanation: 'Consent is ongoing. Ask, explain where it will appear, and respect a no, even after posting.',
          },
          {
            id: 'q-disclosure',
            type: 'choice',
            prompt: 'When should you disclose a paid partnership?',
            multiple: false,
            options: [
              { id: 'a', text: 'Clearly and early in the content itself', correct: true },
              { id: 'b', text: 'Only if someone asks in the comments', correct: false, feedback: 'Most viewers never ask. They assume your opinion is independent.' },
              { id: 'c', text: 'Only for payments above a certain amount', correct: false, feedback: 'Free products and small payments are still material relationships.' },
              { id: 'd', text: 'Never; it reduces sales', correct: false, feedback: 'Hidden promotion misleads your audience and risks your reputation.' },
            ],
            explanation: 'Disclose clearly, early and every time. Trust is the asset that makes all other earning possible.',
          },
          {
            id: 'q-earning',
            type: 'choice',
            prompt: 'For a small creator with a venture, which earning route is often the most reliable to start with?',
            multiple: false,
            options: [
              { id: 'a', text: 'Waiting to qualify for platform payouts', correct: false, feedback: 'Payout rules vary by country and platform, and usually require a large audience.' },
              { id: 'b', text: 'Using content to sell their own product or service', correct: true },
              { id: 'c', text: 'Buying followers to attract brands', correct: false, feedback: 'Fake followers are easy to spot and destroy trust.' },
              { id: 'd', text: 'Posting giveaways every day', correct: false, feedback: 'Giveaways can attract people who only want free things.' },
            ],
            explanation: 'A small, engaged audience can support a real product or service long before it is big enough for brand deals or payouts.',
          },
        ],
      },
    },
    {
      key: 'content-portfolio',
      type: 'assignment',
      title: 'Practical Output: your Content Portfolio and 30-Day Calendar',
      minutes: 40,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the elective: a **Content Portfolio and 30-Day Calendar** for your dream, venture or cause.\n\nIt should show that you can define a niche and audience, tell stories that hold attention, produce content with a phone, publish consistently, learn from your numbers and handle rights and consent responsibly. And it should leave you with a realistic plan for the next month.\n\nYou have drafted most of it in your journal. Now bring it together. Your portfolio joins your Dream Lab portfolio and can support your Dream Residency from week 11, when you will need to tell the story of what you are building.\n\nA faculty reviewer will grade it against the rubric below and give you written feedback.",
        practicalOutput: 'Content Portfolio and 30-Day Calendar',
        steps: [
          'Make sure you have published at least six pieces across at least two formats during the elective.',
          'Gather your journal reflections: niche statement, audience profile, voice and pillars, story outlines, shoot plans, editing notes, metrics and rights check.',
          'Collect the numbers for each piece from the platform where you posted it.',
          'Fill in every section of the template below. Keep it clear and short.',
          'Write your performance review honestly. Weak results, clearly analysed, score better than strong results with no analysis.',
          'Build your 30-day calendar at a rhythm you can truly keep, and put your batch-creation and review sessions in it.',
          'Check every piece for rights and consent, and fix or remove anything doubtful.',
          'Submit, then publish the first piece from your new calendar.',
        ],
        rubric: [
          {
            id: 'niche-audience',
            criterion: 'Clear niche and audience',
            description: 'States a niche with topic, audience, angle and result; describes a specific audience; names a consistent voice and content pillars that fit the creator’s goals.',
          },
          {
            id: 'published-work',
            criterion: 'Published work and craft',
            description: 'At least six published pieces in two formats, each with a clear hook and story shape, and evidence of care with light, sound, framing, captions and editing.',
          },
          {
            id: 'performance-review',
            criterion: 'Performance review',
            description: 'Chooses metrics linked to the goal, reports results honestly, identifies patterns across pieces rather than single posts, and draws specific conclusions.',
          },
          {
            id: 'calendar',
            criterion: '30-day calendar',
            description: 'A realistic, sustainable rhythm on chosen platforms, with dated pieces across pillars and formats, batch-creation time and a weekly review built in, informed by the review.',
          },
          {
            id: 'rights-ethics',
            criterion: 'Rights, consent and honesty',
            description: 'Shows the source and right to use all music, images and footage; explains how consent was obtained, including for anyone under eighteen; discloses any paid relationships.',
          },
        ],
        template: portfolioTemplate,
        minWords: 250,
      },
    },
    {
      key: 'final-quiz',
      type: 'quiz',
      title: 'Final course quiz',
      minutes: 12,
      required: true,
      gradeWeight: 30,
      payload: {
        intro:
          "Nine questions across the whole elective: niche and audience, story, production, publishing, analytics and rights. Several follow a new case.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-niche',
            type: 'choice',
            prompt: 'New case: Zuri in Mombasa wants to start creating. She says: “I will post about my life.” What should she do first?',
            multiple: false,
            options: [
              { id: 'a', text: 'Buy a better camera', correct: false, feedback: 'Equipment comes last. Her phone is enough to start.' },
              { id: 'b', text: 'Define a niche: what she makes, for whom, with what angle and result', correct: true },
              { id: 'c', text: 'Post on every platform at once', correct: false, feedback: 'Spreading thin before knowing her audience makes everything harder.' },
              { id: 'd', text: 'Copy the most popular creator she knows', correct: false, feedback: 'Borrow principles, not personality.' },
            ],
            explanation: '“My life” is a topic with no audience or angle. A niche such as “cheap weekend adventures around Mombasa for young professionals” tells her what to make next.',
          },
          {
            id: 'f-hook',
            type: 'choice',
            prompt: 'Zuri’s first video about a free beach spot opens with: “Hi guys, so today I thought I would show you…” What would improve it most?',
            multiple: false,
            options: [
              { id: 'a', text: 'Open with the most striking shot of the beach and a line like: “This beach costs nothing, and almost nobody goes.”', correct: true },
              { id: 'b', text: 'Add louder music under the greeting', correct: false, feedback: 'Music does not fix a slow opening.' },
              { id: 'c', text: 'Make the greeting longer and friendlier', correct: false, feedback: 'The first seconds should give viewers a reason to stay.' },
              { id: 'd', text: 'Add more hashtags', correct: false, feedback: 'Hashtags do not keep people watching.' },
            ],
            explanation: 'Lead with the payoff or the question. The greeting can come later, or not at all.',
          },
          {
            id: 'f-story-order',
            type: 'order',
            prompt: 'Put Zuri’s video beats in story order.',
            items: [
              { id: 'hook', text: '“This beach costs nothing, and almost nobody goes.”' },
              { id: 'context', text: 'Where it is and how she heard about it' },
              { id: 'tension', text: 'The path is hard to find; she gets lost once' },
              { id: 'turn', text: 'A fisherman points out the hidden path' },
              { id: 'payoff', text: 'The empty beach at sunset' },
              { id: 'next', text: '“Save this for your next free weekend.”' },
            ],
            explanation: 'Hook, context, tension, turn, payoff, next step. The getting-lost moment is what makes the ending satisfying.',
          },
          {
            id: 'f-production',
            type: 'match',
            prompt: 'Match each production problem to its fix.',
            pairs: [
              { id: 'wind', left: 'Wind noise drowns her voice on the beach', right: 'Record the voice-over later in a quiet room' },
              { id: 'backlit', left: 'Her face is dark against the bright sea', right: 'Turn so the light falls on her face' },
              { id: 'shaky', left: 'The walking shots are very shaky', right: 'Walk slowly, hold with both hands and keep shots short' },
              { id: 'silent', left: 'Many viewers watch on mute', right: 'Add accurate captions' },
            ],
            explanation: 'Every one of these fixes is free. Light, steadiness, sound and captions do most of the work.',
          },
          {
            id: 'f-consistency',
            type: 'choice',
            prompt: 'Zuri works full time. Which plan is most likely to last?',
            multiple: false,
            options: [
              { id: 'a', text: 'Post daily, filming each evening after work', correct: false, feedback: 'Likely to burn out within weeks.' },
              { id: 'b', text: 'Film several pieces on one weekend outing, edit on Sunday, and post twice a week', correct: true },
              { id: 'c', text: 'Post whenever she feels like it', correct: false, feedback: 'Irregular posting makes it hard for an audience to rely on her.' },
              { id: 'd', text: 'Wait until she has time to do it perfectly', correct: false, feedback: 'That time rarely comes. Published beats perfect.' },
            ],
            explanation: 'Batching and a modest, steady rhythm are how busy creators stay consistent.',
          },
          {
            id: 'f-analytics',
            type: 'choice',
            prompt: 'One of Zuri’s videos had high reach but most people left in the first few seconds. What does that suggest?',
            multiple: false,
            options: [
              { id: 'a', text: 'The opening did not deliver on what made people tap', correct: true },
              { id: 'b', text: 'The video was perfect', correct: false, feedback: 'High reach with very low retention points to a problem.' },
              { id: 'c', text: 'She should stop posting', correct: false, feedback: 'One weak result is information, not a verdict.' },
              { id: 'd', text: 'She needs more followers', correct: false, feedback: 'Followers do not fix an opening that loses people.' },
            ],
            explanation: 'Reach says people saw it. Retention says whether they stayed. Read them together and fix the opening.',
          },
          {
            id: 'f-vanity',
            type: 'choice',
            prompt: 'Zuri wants her content to bring people to a beach clean-up she organises. Which measures matter most? Select all that apply.',
            multiple: true,
            options: [
              { id: 'signups', text: 'How many people sign up through her link', correct: true },
              { id: 'shares', text: 'How many people share the event post', correct: true },
              { id: 'attend', text: 'How many people actually come', correct: true },
              { id: 'likes', text: 'Total likes on her profile', correct: false, feedback: 'Pleasant, but it does not tell her whether people will come.' },
            ],
            explanation: 'Choose measures linked to the goal. For an event: sign-ups, shares and turnout.',
          },
          {
            id: 'f-rights',
            type: 'choice',
            prompt: 'Zuri wants to use a famous song in her beach video, “just for ten seconds”. What should she do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Use it; short clips are always allowed', correct: false, feedback: 'There is no general short-clip exception.' },
              { id: 'b', text: 'Use music licensed for her use, or get permission for the song', correct: true },
              { id: 'c', text: 'Use it and credit the artist', correct: false, feedback: 'Credit is not permission.' },
              { id: 'd', text: 'Speed the song up so it is not recognised', correct: false, feedback: 'Altering a song does not make it yours, and it is still likely to be detected.' },
            ],
            explanation: 'Make it, license it, or ask. When in doubt, leave it out.',
          },
          {
            id: 'f-partnership',
            type: 'choice',
            prompt: 'A hotel offers Zuri a free weekend in return for a video. How should she handle it?',
            multiple: false,
            options: [
              { id: 'a', text: 'Accept, review honestly, and disclose clearly at the start that the stay was free', correct: true },
              { id: 'b', text: 'Accept and say nothing, since no money changed hands', correct: false, feedback: 'A free stay is still a benefit that viewers would want to know about.' },
              { id: 'c', text: 'Accept and only show the best parts without disclosure', correct: false, feedback: 'That misleads her audience.' },
              { id: 'd', text: 'Accept and disclose only in a comment later', correct: false, feedback: 'Disclosure should be clear and early, not hidden.' },
            ],
            explanation: 'Gifts and free experiences count. Honest content with clear disclosure protects her audience and her reputation.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const contentCreation: CourseAuthoring = {
  slug: 'content-creation',
  title: 'Content Creation',
  subtitle: 'Create content people want to watch, read and share, with the phone in your pocket.',
  description:
    "African creators are telling the continent’s stories to the world, and building audiences, businesses and movements while they do it. You do not need expensive equipment to begin. You need a point of view, a clear audience and a repeatable process.\n\nIn this elective you will find your niche and voice, learn the basics of storytelling for short video, audio and written formats, and practise shooting, recording and editing on a phone. You will plan content around the platforms your audience actually uses, publish consistently, read your analytics to see what works, and learn the fundamentals of copyright, consent and earning from your work. Throughout, you will build content for your own dream, venture or cause.\n\nThis is a two-week, project-based elective. Expect to create and publish every few days.\n\nYour Practical Output is a **Content Portfolio and 30-Day Calendar**: at least six published pieces across two formats, a performance review of what worked, and a planned calendar for the next thirty days.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 10,
  outcomes: [
    'Define a content niche, audience and voice that fit your goals.',
    'Plan, shoot, record and edit short-form content using only a phone.',
    'Use storytelling structures that hold attention across formats.',
    'Publish consistently and use analytics to improve.',
    'Handle copyright, consent and the basics of earning from content responsibly.',
  ],
  skills: ['Storytelling', 'Mobile video', 'Editing', 'Copywriting', 'Content planning', 'Audience analytics'],
  audience: 'Learners who want to build an audience for a venture, cause or creative career, or work in media and communications.',
  prerequisites: "Builder’s Architecture phase, especially Communication and Personal Branding. A smartphone with a camera.",
  practicalOutput: 'Content Portfolio and 30-Day Calendar',
  cover: {
    from: '#3D1A0A',
    to: '#E07B39',
    symbol: '▶',
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Ekanty_visual_at_work.jpg/1280px-Ekanty_visual_at_work.jpg",
    imageAlt: "A young man films an event with a camera on a tripod while a speaker talks at a lectern in the background.",
    imageCredit: "Photo: Pacesetter Media / Wikimedia Commons, CC BY-SA 4.0",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'ZmNpeXTj2c4',
    title: "The Secret to Telling a Great Story — in Less Than 60 Seconds | Jenny Hoyos | TED",
    channel: "TED",
    durationS: 240,
  },
  instructors: [],
  modules: [moduleNiche, moduleStory, modulePublish, moduleRights],
};

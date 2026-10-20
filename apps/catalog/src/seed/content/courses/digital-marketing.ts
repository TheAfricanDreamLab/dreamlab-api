import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Digital Marketing: a two-week, project-based elective of The African Dream Lab (weeks 9–10, 10 credits).
 *
 * Spine: Customer → Value → Journey → Channel → Message → Campaign → Measure → Improve.
 * Recurring cast, all fictional:
 *   Fatou    founder of a small ready-to-wear fashion label in Dakar, selling through Instagram and WhatsApp
 *   Akosua   makes and sells whipped shea-butter skincare from her kitchen in Accra
 *   Achieng  runs a small maths tutoring service for secondary-school students in Nairobi
 *   Bisi     runs an events décor business in Lagos: weddings, birthdays and naming ceremonies
 *   Neema    (final quiz only) sells handmade leather sandals in Arusha
 * Every number in a case is part of that fictional case, never a real statistic. Platform features,
 * ad prices and algorithms change often, so the course teaches principles, not buttons.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Know your customer: who, why and how they buy
// ---------------------------------------------------------------------------

const moduleCustomer: Module = {
  key: 'know-your-customer',
  title: 'Know your customer',
  summary:
    'Marketing starts with people, not posts. Choose the specific customer you serve, put into words why they should choose you, and map the journey they take from first hearing about you to buying again. Every later decision in this course hangs from these three pieces.',
  weekNo: 9,
  items: [
    {
      key: 'who-is-it-for',
      type: 'lesson',
      title: 'Who is it for?',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to Digital Marketing',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to Digital Marketing.\n\nYour customers are already online. They are scrolling, searching, chatting with friends and asking for recommendations in WhatsApp groups. Digital marketing is how a small venture or cause shows up in those places, in a way that helps people, and turns some of that attention into customers, members or supporters.\n\nOver the next two weeks you will plan a real campaign, run it on a small budget, measure what happens and decide what to change. That is your Practical Output: a **Digital Marketing Campaign Plan and Results Report**. Every reflection you write in this course is a piece of it.\n\nWe start with the most important question in marketing, and the one most people skip: **who is it for?** Watch the short talk below.",
              },
              {
                id: 'welcome-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'UC4A2aimQaE',
                title: 'Finding Your "Who" with Seth Godin',
                channel: 'HubSpot Marketing',
                durationS: 328,
                caption: "The marketer and author Seth Godin on choosing who your work is for. Watch for why “everyone” is the wrong answer, and why serving a smaller group well is how small ventures grow.",
              },
            ],
          },
          {
            id: 'starting-point',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'confidence-scale',
                type: 'scale',
                prompt: 'Be honest. How confident are you today that you could get a stranger online to pay for what you offer?',
                minLabel: 'Not at all',
                maxLabel: 'Very confident',
                afterword:
                  "Wherever you are is a fine place to start. Marketing is not a gift for loud people. It is a set of habits: understand someone, make them a clear offer, ask them clearly, and learn from what they do. You will rate yourself again at the end of the course.",
              },
            ],
          },
          {
            id: 'meet-fatou',
            title: 'Meet Fatou',
            blocks: [
              {
                id: 'fatou-story',
                type: 'callout',
                tone: 'story',
                title: 'Fatou, fashion founder, Dakar',
                body: "Fatou designs bright, modern ready-to-wear pieces in wax print and sells them through Instagram and WhatsApp. Her first year was hard. She posted every day for “everyone who loves African fashion” and got plenty of likes, but orders came mostly from friends.\n\nThen she noticed something in her messages. The people who actually paid were mostly young professional women in Dakar who wanted outfits they could wear to the office on Monday and to a baptism on Saturday. They hated waiting three weeks for a tailor. They wanted to order on Tuesday and wear it on Friday.\n\nFatou rewrote her bio, her captions and her photos for exactly that person. She lost some likes. Her orders went up.",
              },
              {
                id: 'fatou-reveal',
                type: 'reveal',
                prompt: 'Fatou deliberately chose a smaller audience and sold more. Why might that work? Think of two reasons, then tap.',
                body: "**Specific messages feel personal.** “Office to baptism, ready this week” speaks to one person’s real week. “Beautiful African fashion” speaks to nobody in particular.\n\n**You can afford to reach a small group well.** With a small budget you cannot shout at a whole country. You can show up again and again where one group gathers.\n\n**Happy customers who are alike bring more people like them.** They work together, worship together and attend the same events. Word of mouth travels inside groups.\n\nChoosing a target customer is not excluding everyone else. Others can still buy. You are simply deciding whom you design and speak for.",
              },
            ],
          },
          {
            id: 'sharpest',
            title: 'The sharpest target',
            blocks: [
              {
                id: 'target-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Target customer', definition: 'The specific person your offer and messages are designed for. Described by their situation and needs, not only their age and location.' },
                  { term: 'Segment', definition: 'A group of people who share a need, a situation or a behaviour, so the same message can work for them.' },
                  { term: 'Pain or struggle', definition: 'What is hard, slow, risky or annoying for them today. The thing they would happily pay to have fixed.' },
                  { term: 'Where they gather', definition: 'The places, online and offline, where you can reliably reach them: groups, platforms, churches and mosques, markets, campuses, workplaces.' },
                ],
              },
              {
                id: 'target-choice',
                type: 'choice',
                prompt: 'Achieng runs a maths tutoring service in Nairobi. Which description of her target customer is most useful for marketing?',
                multiple: false,
                options: [
                  { id: 'everyone', text: '“Anyone who wants to learn maths.”', correct: false, feedback: 'Too wide to act on. Where would she find “anyone”, and what would she say to them?' },
                  { id: 'demographic', text: '“Kenyans aged 14 to 18.”', correct: false, feedback: 'Age is a start, but it says nothing about need. Most 14 to 18 year olds are not looking for a tutor this week.' },
                  {
                    id: 'specific',
                    text: '“Parents in Nairobi whose child is a year or two from national exams, is falling behind in maths, and who want help that fits around school hours.”',
                    correct: true,
                    feedback: 'Yes. A specific person, a real worry, a deadline and a constraint. Achieng can now picture where they gather and what to say.',
                  },
                  { id: 'students', text: '“Students who hate maths.”', correct: false, feedback: 'Closer, because it names a feeling. But in Achieng’s case parents usually decide and pay. Marketing to the wrong decision-maker is a common trap.' },
                ],
                explanation:
                  "A useful target describes a **situation and a need**, not only a demographic. Notice too that the person who uses the service (the student) and the person who pays (the parent) can be different. Your marketing must persuade the one who decides.",
              },
            ],
          },
          {
            id: 'what-are-you-marketing',
            title: 'What will you market?',
            blocks: [
              {
                id: 'marketing-poll',
                type: 'poll',
                prompt: 'For your campaign in this course, what will you be marketing?',
                options: [
                  { id: 'product', text: 'A physical product I make or sell' },
                  { id: 'service', text: 'A service, such as tutoring, design, repairs or events' },
                  { id: 'freelance', text: 'Myself, as a freelancer or job seeker' },
                  { id: 'cause', text: 'A cause, community project or non-profit' },
                  { id: 'event', text: 'An event, class or programme' },
                  { id: 'idea', text: 'An idea I want to test before I build it' },
                ],
                afterword:
                  "All of these work. The ideas in this course apply to a shea-butter brand, a tutoring service, a clean-up campaign or a freelance designer. If you are testing an idea, your campaign can ask people to join a waiting list or pre-order. That is real evidence of demand.",
              },
            ],
          },
          {
            id: 'your-customer',
            title: 'Describe your customer',
            blocks: [
              {
                id: 'customer-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Start from people you already know',
                body: "If you already have customers, look at the ones who paid quickly, came back, or told friends. What do they have in common? If you have none yet, picture one real person you know who has the problem you solve, and describe them.",
              },
              {
                id: 'customer-reflection',
                type: 'reflection',
                prompt: 'Describe your target customer in a short paragraph: their situation, the struggle or wish your offer answers, who decides and pays, and where they gather online and offline.',
                guidance: 'Write about one kind of person, not a crowd. This is the first section of your Campaign Plan. You will sharpen it as you go.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'value-proposition',
      type: 'lesson',
      title: 'Why you? Writing a value proposition',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'the-job',
            title: 'People hire products to do a job',
            blocks: [
              {
                id: 'job-text',
                type: 'text',
                body: "Once you know who it is for, the next question is: **why would they choose you?** Not why your product is good, but why it is the best answer to something in their life right now.\n\nThe late Harvard professor Clayton Christensen had a simple way to think about this. People do not buy products. They “hire” them to get a job done. Watch the short video and notice how the question changes from “what do we sell?” to “what are they trying to get done?”",
              },
              {
                id: 'job-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'Stc0beAxavY',
                title: 'Clay Christensen: The Jobs to be Done Theory',
                channel: 'HubSpot Marketing',
                durationS: 430,
                caption: "Clayton Christensen explains the “jobs to be done” idea with his well-known milkshake story. Watch for who the real competition turned out to be. It was not other milkshakes.",
              },
            ],
          },
          {
            id: 'three-jobs',
            title: 'Three kinds of job',
            blocks: [
              {
                id: 'shea-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Whipped_Shea_butter.jpg/1280px-Whipped_Shea_butter.jpg',
                alt: 'Three clear jars with metal clip lids, filled with pale whipped butter, stacked in a small pyramid on a bright pink cloth in front of a blue cushion.',
                caption: 'Whipped shea butter in clip-top jars. Akosua is a fictional maker; small brands selling products like this are real.',
                credit: 'Photo: Henny07 / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'akosua-story',
                type: 'callout',
                tone: 'story',
                title: 'Akosua, shea-butter skincare, Accra',
                body: "Akosua buys raw shea butter from a women’s cooperative in the north, whips it with a little oil and scent in her kitchen in Accra, and sells it in small jars. At first her posts said “100% natural shea butter”. So did everyone else’s.\n\nShe started asking customers why they bought. One mother said her children’s skin was dry and ashy every harmattan and she wanted something simple she trusted. A young man said he wanted to stop his beard itching before work. A woman said she bought jars as gifts because the packaging looked lovely and it was made in Ghana.",
              },
              {
                id: 'jobs-match',
                type: 'match',
                prompt: 'Match each of Akosua’s customers to the kind of job they hired her shea butter to do.',
                pairs: [
                  { id: 'functional', left: '“Stop my children’s skin going dry and ashy in harmattan.”', right: 'Functional job: get a practical task done' },
                  { id: 'emotional', left: '“Something simple I trust, so I stop worrying about what is in it.”', right: 'Emotional job: feel a certain way' },
                  { id: 'social', left: '“A lovely, made-in-Ghana gift that makes me look thoughtful.”', right: 'Social job: be seen a certain way by others' },
                ],
                explanation:
                  "Most purchases do all three jobs at once, in different amounts. “100% natural” describes the product. The jobs describe the customer’s life. Marketing that speaks to the job feels like it was written for the reader.",
              },
            ],
          },
          {
            id: 'formula',
            title: 'A value proposition in one breath',
            blocks: [
              {
                id: 'vp-framework',
                type: 'framework',
                title: 'The value proposition sentence',
                steps: [
                  { label: 'For', detail: 'Your target customer, described by their situation. “For parents of children with dry skin in harmattan…”' },
                  { label: 'Who want', detail: 'The job they are trying to get done, in their words. “…who want something simple and safe that works…”' },
                  { label: 'We offer', detail: 'What you provide, plainly. “…Akosua’s whipped shea butter, made in small batches in Accra…”' },
                  { label: 'That', detail: 'The main benefit, the change in their life. “…that keeps skin soft all day from one morning application…”' },
                  { label: 'Unlike', detail: 'The alternative they use today. “…unlike imported creams with long ingredient lists…”' },
                  { label: 'Because', detail: 'Your proof or reason to believe. “…because it has three ingredients, all listed on the jar.”' },
                ],
              },
              {
                id: 'vp-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Features are not benefits',
                body: "A **feature** is what the product is or has: “three ingredients”, “one-hour sessions”, “wax-print cotton”. A **benefit** is what changes for the customer: “skin that stays soft all day”, “your child walks into the exam calm”, “an outfit ready by Friday”.\n\nCustomers buy benefits and use features as proof. Lead with the benefit.",
              },
            ],
          },
          {
            id: 'pick-best',
            title: 'Pick the strongest',
            blocks: [
              {
                id: 'vp-choice',
                type: 'choice',
                prompt: 'Bisi runs an events décor business in Lagos. Which line is the strongest value proposition?',
                multiple: false,
                options: [
                  { id: 'quality', text: '“Quality décor at affordable prices.”', correct: false, feedback: 'Every décor business says this. It names no customer, no job and no proof.' },
                  { id: 'features', text: '“We have 400 chairs, 60 tables, LED lighting and fresh flowers.”', correct: false, feedback: 'These are features. They may be useful proof later, but they do not say what changes for the customer.' },
                  {
                    id: 'specific',
                    text: '“For families planning a naming ceremony or birthday at home: we set up, style and clear away, so you can enjoy your own party. Fixed packages, with photos of every past event on our page.”',
                    correct: true,
                    feedback: 'Yes. A clear customer, the job (enjoy your own party instead of working at it), what Bisi offers, and proof people can check.',
                  },
                  { id: 'best', text: '“The best event decorators in Lagos!”', correct: false, feedback: 'A claim nobody can check, and everyone can make. It also invites distrust.' },
                ],
                explanation:
                  "Strong value propositions are **specific, about the customer, and believable**. Notice that the best option even names the alternative indirectly: doing it yourself and spending the party stressed.",
              },
            ],
          },
          {
            id: 'feature-benefit',
            title: 'Spot the benefits',
            blocks: [
              {
                id: 'benefit-choice',
                type: 'choice',
                prompt: 'Which of these lines from Achieng’s tutoring flyer describe benefits rather than features? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'calm', text: '“Your child walks into the exam knowing how to approach every type of question.”', correct: true, feedback: 'Yes. It describes what changes for the student and parent.' },
                  { id: 'hours', text: '“Sessions of 90 minutes, twice a week.”', correct: false, feedback: 'A feature. Useful detail, but it does not say what the parent gains.' },
                  { id: 'progress', text: '“A short progress note to you every Friday, so you always know where things stand.”', correct: true, feedback: 'Yes. The benefit is a parent who is never left guessing. The note is the feature that delivers it.' },
                  { id: 'degree', text: '“Tutor holds a degree in mathematics.”', correct: false, feedback: 'A feature, and good proof. It supports a benefit rather than being one.' },
                  { id: 'time', text: '“Evening and Saturday slots that fit around school and family life.”', correct: true, feedback: 'Yes. It answers a real constraint parents have.' },
                ],
                explanation:
                  "A quick test: read the line and ask **“so what?”** If the answer is obvious and matters to the customer, it is a benefit. If you need to explain why it matters, it is a feature. Keep both, but lead with benefits and use features as proof.",
              },
            ],
          },
          {
            id: 'your-vp',
            title: 'Write your value proposition',
            blocks: [
              {
                id: 'vp-reflection',
                type: 'reflection',
                prompt: 'Using the For / Who want / We offer / That / Unlike / Because pattern, write a value proposition for your offer. Then rewrite it as one plain sentence you could say out loud to a customer.',
                guidance: 'Use your customer’s words, not industry words. If you do not know their words yet, message two customers and ask why they chose you, or what they use today. This is section two of your Campaign Plan.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'customer-journey',
      type: 'lesson',
      title: 'The customer journey',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'journey-intro',
            title: 'From stranger to fan',
            blocks: [
              {
                id: 'journey-text',
                type: 'text',
                body: "Nobody goes from never having heard of you to paying you in one step. They notice you, get curious, check whether they can trust you, decide, buy, and then, if things go well, buy again and tell friends.\n\nThat path is the **customer journey**. Mapping it shows you where people drop out, and where a small change could make a big difference. The short video explains how professional designers map journeys. You will use a much simpler version.",
              },
              {
                id: 'journey-video',
                type: 'video',
                provider: 'youtube',
                videoId: '2W13ext26kQ',
                title: 'Customer Journey Mapping 101',
                channel: 'NNgroup',
                durationS: 138,
                caption: "A two-minute introduction to journey mapping from the Nielsen Norman Group, a respected user-experience research firm. Watch for the idea of recording what the customer is doing, thinking and feeling at each stage.",
              },
            ],
          },
          {
            id: 'five-stages',
            title: 'Five stages',
            blocks: [
              {
                id: 'journey-framework',
                type: 'framework',
                title: 'A simple customer journey',
                steps: [
                  { label: 'Notice', detail: 'They first come across you: a friend’s status, a post, a search result, a flyer, a stall.' },
                  { label: 'Consider', detail: 'They look closer. They check your page, prices, photos and what others say.' },
                  { label: 'Trust', detail: 'They decide you are real and reliable. Reviews, clear answers, a quick reply and a safe way to pay all matter here.' },
                  { label: 'Buy', detail: 'They order and pay. Every extra step, delay or doubt here loses people.' },
                  { label: 'Return and recommend', detail: 'They come back and tell others. In small businesses this is often where most new customers come from.' },
                ],
              },
              {
                id: 'journey-context',
                type: 'callout',
                tone: 'context',
                title: 'Trust is often the hardest stage',
                body: "In many African markets, people have learnt to be careful online. Many have heard of someone who paid for an item that never came. So the Trust stage can matter more than anything else. Small signals carry weight: a real name and face, a physical location people can visit, photos of real customers (with their permission), quick and polite replies, and payment options such as mobile money or pay on delivery that feel safe.",
              },
            ],
          },
          {
            id: 'order-bisi',
            title: 'Bisi’s customer',
            blocks: [
              {
                id: 'decor-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Wedding_Decoration_in_Anambra_state%2C_Nigeria.jpg/1280px-Wedding_Decoration_in_Anambra_state%2C_Nigeria.jpg',
                alt: 'A walkway inside a draped white marquee passes under arches of green leaves, white flowers and gold foliage on orange pillars, with set tables and coloured lights on either side.',
                caption: 'Wedding décor in Anambra State, Nigeria. Bisi is fictional. Photos like this, shared by happy clients, are how many décor businesses are discovered.',
                credit: 'Photo: Solomoral / Wikimedia Commons, CC0',
              },
              {
                id: 'bisi-order',
                type: 'order',
                prompt: 'Put the steps of one of Bisi’s customers in the order they happened.',
                items: [
                  { id: 'see', text: 'Sees beautiful photos of a naming ceremony on a cousin’s WhatsApp status' },
                  { id: 'ask', text: 'Asks the cousin who did the décor and gets Bisi’s number' },
                  { id: 'browse', text: 'Looks through Bisi’s page and the photos of past events' },
                  { id: 'chat', text: 'Messages Bisi, gets a clear package price and a quick, friendly answer about dates' },
                  { id: 'pay', text: 'Pays a deposit by bank transfer and books the date' },
                  { id: 'share', text: 'After the party, posts photos and tags Bisi' },
                ],
                explanation:
                  "Notice where this journey started: not with an advert, but with a past customer’s photos. The last step feeds the first step for someone else. Good marketing makes that loop easy: Bisi could ask every happy client if she may share photos, and give them something worth posting.",
              },
            ],
          },
          {
            id: 'find-leak',
            title: 'Find the leak',
            blocks: [
              {
                id: 'leak-scenario',
                type: 'scenario',
                situation:
                  "Fatou’s new collection posts are doing well. Many people like them and send messages asking “How much?” But only a few of those who ask go on to buy.\n\nShe looks at her chats. She often replies hours later. When she does, she types the price and says “Let me know.” Many people never answer.",
                prompt: 'Where is Fatou’s journey leaking, and what should she try first?',
                options: [
                  {
                    id: 'more-posts',
                    text: 'Post more often, so more people notice the collection.',
                    outcome: "More people ask “How much?” and the same small share buy. Fatou is pouring more water into a leaking bucket. The Notice stage was not the problem.",
                    best: false,
                  },
                  {
                    id: 'discount',
                    text: 'Cut her prices by a third.',
                    outcome: "A few more people buy, but her margin shrinks and she still loses most of the people who message. She has not learnt whether price was the reason at all.",
                    best: false,
                  },
                  {
                    id: 'reply',
                    text: 'Reply within the hour with the price, sizes, delivery time and a simple next step: “Shall I reserve your size for Friday delivery?”',
                    outcome: "More conversations turn into orders. Interested people were dropping out between Consider and Buy because of slow replies and no clear next step. Fixing the leak cost her nothing but attention.",
                    best: true,
                  },
                  {
                    id: 'ads',
                    text: 'Start paid ads to reach new people.',
                    outcome: "The ads bring new people into the same leaky conversation. She pays for attention she then loses. Fix the leak first, then pay to fill the bucket.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-journey',
            title: 'Map your journey',
            blocks: [
              {
                id: 'journey-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Ask, do not guess',
                body: "The quickest way to map a journey is to ask two or three recent customers: “How did you first hear about us? What made you decide to buy? Was anything confusing or worrying?” Their answers are often surprising.",
              },
              {
                id: 'journey-reflection',
                type: 'reflection',
                prompt: 'Map your customer’s journey in five short lines: Notice, Consider, Trust, Buy, Return and recommend. For each, write where it happens and what the customer needs from you. Then name the stage where you think most people drop out.',
                guidance: 'If you have no customers yet, map the journey you hope for, and mark which parts are guesses. This is section three of your Campaign Plan.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'customer-quiz',
      type: 'quiz',
      title: 'Module quiz: Know your customer',
      minutes: 8,
      required: true,
      gradeWeight: 8,
      payload: {
        intro:
          "Five questions on target customers, value propositions and the customer journey. You need 70% to pass and you can retake it as many times as you like. Read the explanations, even when you are right.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-target',
            type: 'choice',
            prompt: 'Why is “everyone” a weak answer to “who is your customer?” for a small venture?',
            multiple: false,
            options: [
              { id: 'a', text: 'Because some people are not worth selling to', correct: false, feedback: 'It is not about worth. It is about whom you can reach and speak to clearly with limited time and money.' },
              { id: 'b', text: 'Because a message written for everyone speaks to nobody in particular, and a small budget cannot reach everyone', correct: true },
              { id: 'c', text: 'Because platforms do not allow you to target everyone', correct: false, feedback: 'The point is not a platform rule. It is about clarity and focus.' },
              { id: 'd', text: 'Because it is rude to market to strangers', correct: false, feedback: 'Marketing to strangers can be perfectly respectful. The problem is vagueness.' },
            ],
            explanation: 'Choosing a target customer lets you write specific messages and show up repeatedly where one group gathers. Others can still buy.',
          },
          {
            id: 'q-jobs',
            type: 'match',
            prompt: 'Match each reason for buying Achieng’s tutoring to the kind of job it is.',
            pairs: [
              { id: 'functional', left: 'Raise my child’s maths grade before the exam', right: 'Functional job' },
              { id: 'emotional', left: 'Stop lying awake worrying about the exam', right: 'Emotional job' },
              { id: 'social', left: 'Show the family I am doing everything I can for my child', right: 'Social job' },
            ],
            explanation: 'One purchase often does all three jobs. Messages that touch the emotional and social jobs, honestly, often move people more than a list of features.',
          },
          {
            id: 'q-benefit',
            type: 'choice',
            prompt: 'Which line is a benefit rather than a feature?',
            multiple: false,
            options: [
              { id: 'a', text: '“Made with 100% cotton wax print.”', correct: false, feedback: 'A feature: what the product is made of.' },
              { id: 'b', text: '“Ready to wear by Friday, so you are not stuck waiting for a tailor.”', correct: true },
              { id: 'c', text: '“Available in sizes 8 to 20.”', correct: false, feedback: 'A feature: useful information, but not the change in the customer’s life.' },
              { id: 'd', text: '“Designed in Dakar.”', correct: false, feedback: 'A feature, though it can support a social job. Ask “so what?” to turn it into a benefit.' },
            ],
            explanation: 'Ask “so what?” of every line. Benefits answer it; features need it answered.',
          },
          {
            id: 'q-journey',
            type: 'order',
            prompt: 'Put the stages of the simple customer journey in order.',
            items: [
              { id: 'notice', text: 'Notice' },
              { id: 'consider', text: 'Consider' },
              { id: 'trust', text: 'Trust' },
              { id: 'buy', text: 'Buy' },
              { id: 'return', text: 'Return and recommend' },
            ],
            explanation: 'Notice → Consider → Trust → Buy → Return and recommend. The last stage feeds the first for the next customer.',
          },
          {
            id: 'q-leak',
            type: 'choice',
            prompt: 'Many people message Akosua asking about prices, but few buy. What should she do before spending money on ads?',
            multiple: false,
            options: [
              { id: 'a', text: 'Post twice as often', correct: false, feedback: 'More attention will flow into the same leak. People are already noticing and asking.' },
              { id: 'b', text: 'Look at her chats to see where people drop out, and fix that step, for example with faster, clearer replies and an easy way to pay', correct: true },
              { id: 'c', text: 'Change her logo', correct: false, feedback: 'The logo is not stopping people who are already asking about prices.' },
              { id: 'd', text: 'Stop replying to price questions', correct: false, feedback: 'That would make the leak worse. Price questions are buying signals.' },
            ],
            explanation: 'Find the leak before you pour in more attention. The cheapest growth usually comes from fixing the stage where interested people drop out.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Channels and copy that converts
// ---------------------------------------------------------------------------

const moduleChannels: Module = {
  key: 'channels-and-copy',
  title: 'Channels and copy that converts',
  summary:
    'Choose the one or two channels where your customer already pays attention: social media, WhatsApp and other messaging, search or email. Then learn to write posts and messages that turn attention into a clear next step, and to message people only with their permission.',
  weekNo: 9,
  items: [
    {
      key: 'choosing-channels',
      type: 'lesson',
      title: 'Choosing your channels',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'channels-intro',
            title: 'Different channels, different jobs',
            blocks: [
              {
                id: 'channels-text',
                type: 'text',
                body: "A **channel** is a route between you and your customer: a social media feed, a WhatsApp chat, a search engine, an email inbox, a radio slot, a market stall.\n\nEach channel catches people in a different state of mind. On social media they are scrolling to be entertained or to keep up with friends. In a chat they are in a conversation. On a search engine they are **asking a question**, often because they need something now.\n\nThat last one is powerful for small ventures. Watch how search works, and notice where the person’s intention shows up.",
              },
              {
                id: 'search-video',
                type: 'video',
                provider: 'youtube',
                videoId: '0eKVizvYSUQ',
                title: 'How Google Search Works (in 5 minutes)',
                channel: 'Google',
                durationS: 315,
                caption: "Google’s own short explanation of how search finds and ranks pages. Watch for what search is trying to do: match a person’s question with the most helpful answer. Being genuinely helpful is also the most durable way to be found.",
              },
            ],
          },
          {
            id: 'owned-earned-paid',
            title: 'Owned, rented, earned and paid',
            blocks: [
              {
                id: 'oep-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Owned', definition: 'Channels you control: your list of customers who agreed to hear from you, your website, your shop sign, your product packaging.' },
                  { term: 'Rented', definition: 'Your page or profile on a platform you do not own. You can build an audience there, but the platform sets the rules and can change who sees your posts.' },
                  { term: 'Earned', definition: 'Attention you did not pay for: word of mouth, reviews, shares, tags and mentions by others.' },
                  { term: 'Paid', definition: 'Attention you buy: ads, boosted posts, sponsored content, paying a creator or a radio station.' },
                ],
              },
              {
                id: 'oep-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Do not build only on rented land',
                body: "Many small ventures build everything on one social platform. Then the rules change, the account is hacked, or posts suddenly reach fewer people, and the business disappears overnight.\n\nUse rented platforms to be discovered, and steadily move your best customers onto something you own: a contact list of people who agreed to hear from you, by WhatsApp, SMS or email.",
              },
            ],
          },
          {
            id: 'match-channels',
            title: 'What each channel is good at',
            blocks: [
              {
                id: 'channels-match',
                type: 'match',
                prompt: 'Match each channel to what it usually does best for a small venture.',
                pairs: [
                  { id: 'social', left: 'Social media feeds and short video', right: 'Being discovered and showing your product in action' },
                  { id: 'messaging', left: 'WhatsApp and other messaging', right: 'One-to-one conversations that answer questions and close sales' },
                  { id: 'search', left: 'Search engines and maps', right: 'Being found by people actively looking for what you offer, right now' },
                  { id: 'email', left: 'Email or an opt-in broadcast list', right: 'Staying in touch with people who already know you, on your own terms' },
                ],
                explanation:
                  "Channels work together along the journey. Social media often drives **Notice**. Search catches people already at **Consider**. Messaging is where **Trust** and **Buy** happen for many small businesses. Email or an opt-in list keeps **Return and recommend** going.",
              },
            ],
          },
          {
            id: 'messaging-shop',
            title: 'Messaging as your shopfront',
            blocks: [
              {
                id: 'momo-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Mobile_Money_Kiosk.jpg/1280px-Mobile_Money_Kiosk.jpg',
                alt: 'A bright yellow mobile money kiosk on a pavement beside a metal fence. One person stands at its window and others wait beside a green tent.',
                caption: 'A mobile money kiosk. For many customers, a payment method they already trust is part of what makes buying through a chat feel safe.',
                credit: 'Photo: Bukulu Steven / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'whatsapp-context',
                type: 'callout',
                tone: 'context',
                title: 'Where many sales really happen',
                body: "For many small businesses across the continent, the sale does not happen on a website. It happens in a chat. A customer sees a post, sends a message, asks two questions, and pays by mobile money or on delivery.\n\nBusiness versions of messaging apps usually let you add a profile with your hours and location, show products with prices, save replies to common questions and label chats. The exact features change, so check what yours offers today. The principles do not change: **reply fast, be clear about price and delivery, always give a next step, and keep a tidy record of who asked for what.**",
              },
              {
                id: 'channel-poll',
                type: 'poll',
                prompt: 'Where does your target customer spend the most attention that you could realistically reach?',
                options: [
                  { id: 'short-video', text: 'Short-video apps' },
                  { id: 'photo-social', text: 'Photo-led social media' },
                  { id: 'groups', text: 'Community groups and pages' },
                  { id: 'whatsapp', text: 'WhatsApp groups and status' },
                  { id: 'search', text: 'Search and maps' },
                  { id: 'offline', text: 'Mostly offline: church, mosque, market, campus, workplace' },
                ],
                afterword:
                  "There is no single right channel. The right channel is where your customer already is and where you can show up consistently. And offline counts: a flyer with your WhatsApp number at a school gate can start a digital journey.",
              },
            ],
          },
          {
            id: 'achieng-channels',
            title: 'Choosing for Achieng',
            blocks: [
              {
                id: 'achieng-choice',
                type: 'choice',
                prompt: 'Achieng has about five hours a week for marketing and a tiny budget. Her customers are parents of secondary-school students in Nairobi. Which choices make sense? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'parents-groups', text: 'Share genuinely useful exam tips in parent WhatsApp groups she already belongs to, where the group allows it', correct: true, feedback: 'Yes. Parents are already there, and helpful tips build trust before any sales message.' },
                  { id: 'search-profile', text: 'Set up a free business profile on maps and search, so parents looking for a tutor nearby can find her and read reviews', correct: true, feedback: 'Yes. It catches people with clear intent, and it costs time rather than money.' },
                  { id: 'every-platform', text: 'Open accounts on every social platform and post daily on all of them', correct: false, feedback: 'With five hours a week she would do all of them badly. One or two channels done consistently beat six done occasionally.' },
                  { id: 'list', text: 'Keep a list of parents who ask to hear about new term places, and message them when places open', correct: true, feedback: 'Yes. This is an owned channel, built with permission, and it will matter every term.' },
                  { id: 'dance', text: 'Post dance trends because they are popular', correct: false, feedback: 'Popular is not the same as relevant. Parents choosing a tutor want to see competence and care.' },
                ],
                explanation:
                  "Pick channels by asking three questions: **Where is my customer already paying attention? What can I keep up every week? Which stage of the journey do I most need to fix?** For most small ventures the answer is one discovery channel plus one conversation channel.",
              },
            ],
          },
          {
            id: 'your-channels',
            title: 'Choose your channels',
            blocks: [
              {
                id: 'channels-reflection',
                type: 'reflection',
                prompt: 'Choose one or two channels for your campaign. For each, say why it fits your customer, which stage of the journey it serves, and how much time per week you can honestly give it.',
                guidance: 'Choose fewer channels than you think. Note whether each is owned, rented, earned or paid. This is section four of your Campaign Plan.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'copy-that-converts',
      type: 'lesson',
      title: 'Copy and messages that convert',
      minutes: 17,
      required: true,
      payload: {
        steps: [
          {
            id: 'copy-intro',
            title: 'Words that get people to act',
            blocks: [
              {
                id: 'copy-text',
                type: 'text',
                body: "**Copy** is the words in your marketing: a caption, a flyer, a WhatsApp status, the first message you send to a customer. Good copy does one job. It moves the right person one step along the journey.\n\n**Converts** simply means the reader does the thing you asked: sends a message, books a place, places an order. Watch the short video, then we will build a simple pattern you can use on any channel.",
              },
              {
                id: 'copy-video',
                type: 'video',
                provider: 'youtube',
                videoId: 's2L6eRObBqw',
                title: 'How to Write Copy That Converts | 5 Things You Need to Know About Writing GREAT Marketing Copy',
                channel: 'Neil Patel',
                durationS: 194,
                caption: "Neil Patel, a well-known online marketer, on what makes copy work. Watch for how often the advice comes back to knowing the reader and making the next step obvious.",
              },
            ],
          },
          {
            id: 'copy-pattern',
            title: 'A pattern for any post',
            blocks: [
              {
                id: 'copy-framework',
                type: 'framework',
                title: 'Hook, benefit, proof, action',
                steps: [
                  { label: 'Hook', detail: 'The first line stops the right person. Name them or their situation: “Baptism on Saturday and nothing to wear?”' },
                  { label: 'Benefit', detail: 'Say what changes for them, in their words: “Ready-to-wear pieces you can order today and wear on Friday.”' },
                  { label: 'Proof', detail: 'Give one reason to believe: a real photo, a customer’s words (with permission), a guarantee, a number from your own records.' },
                  { label: 'Action', detail: 'Ask for one clear, easy next step: “Send your size on WhatsApp and we will reserve your piece.”' },
                ],
              },
              {
                id: 'fatou-example',
                type: 'example',
                title: 'Fatou’s caption, before and after',
                body: "**Before:** “New collection out now!!! Beautiful African fashion for every occasion. DM for price.”\n\n**After:** “Office on Monday, baptism on Saturday? The new Teranga set works for both. Order by Tuesday, wear it on Friday, delivered anywhere in Dakar. Every piece is cut and checked in our own studio. Send your size on WhatsApp and we will hold one for you.”\n\nThe second version names the reader’s week, gives a benefit, offers proof and asks for one clear action. It also answers the question everyone was asking in the comments: when can I have it?",
              },
            ],
          },
          {
            id: 'best-cta',
            title: 'One clear ask',
            blocks: [
              {
                id: 'cta-choice',
                type: 'choice',
                prompt: 'Akosua is ending a post about her harmattan skin set. Which call to action is strongest?',
                multiple: false,
                options: [
                  { id: 'many', text: '“Follow us, like, share, tag a friend, visit our website and DM us!”', correct: false, feedback: 'Six asks means no clear ask. People end up doing none of them.' },
                  { id: 'vague', text: '“Contact us for more information.”', correct: false, feedback: 'Vague and effortful. What will happen when they contact you? Why now?' },
                  { id: 'clear', text: '“Reply HARMATTAN on WhatsApp and we will send prices and deliver in Accra within two days.”', correct: true, feedback: 'Yes. One action, easy to do, and it says exactly what happens next.' },
                  { id: 'pushy', text: '“Buy now or regret it forever!”', correct: false, feedback: 'Pressure without a reason feels pushy, and it does not tell people how to buy.' },
                ],
                explanation:
                  "A strong call to action is **one step, easy, specific and honest about what happens next**. A code word like HARMATTAN has a bonus: when people use it, Akosua knows which post brought them. You will use that idea in Module 4.",
              },
            ],
          },
          {
            id: 'permission',
            title: 'Messages people want to receive',
            blocks: [
              {
                id: 'permission-text',
                type: 'text',
                body: "Messaging and email are powerful because they land in a personal space: someone’s phone, next to messages from family. That is exactly why they must be used with care.\n\nSeth Godin calls the right approach **permission marketing**: sending messages that people have agreed to receive and are glad to get. Watch his one-minute definition.",
              },
              {
                id: 'permission-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'eeHbc6iDPBA',
                title: "Seth Godin's Definition of Permission Marketing",
                channel: 'CreativeLive',
                durationS: 57,
                caption: "Seth Godin in under a minute. Listen for how he describes the kind of message people are actually glad to receive, and compare it with the messages you get from businesses.",
              },
              {
                id: 'permission-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Good habits for messaging and email',
                body: "- Ask first. “Would you like a message when the new collection is ready?” A yes is the start of your list.\n- Say what they will get and how often, then stick to it.\n- Make it personal: use their name and remember what they bought.\n- Make leaving easy. “Reply STOP and I will not message again,” and honour it straight away.\n- Send fewer, better messages. One useful message a fortnight beats a daily flood that gets you muted or reported.",
              },
            ],
          },
          {
            id: 'broadcast-scenario',
            title: 'Akosua’s contact list',
            blocks: [
              {
                id: 'broadcast-block',
                type: 'scenario',
                situation:
                  "Akosua has about 600 numbers in her phone: customers, family, old classmates, people from church and people she met once at a market. She wants to announce her new harmattan skin set.\n\nA friend says: “Just add everybody to a group and post it there. Or I can get you a list of 5,000 numbers for a small fee.”",
                prompt: 'What should Akosua do?',
                options: [
                  {
                    id: 'group-all',
                    text: 'Add all 600 contacts to a new group and post the announcement.',
                    outcome: "Dozens of people leave the group within an hour. Some are annoyed that strangers can now see their numbers. Two old classmates block her. A few buy, but she has spent goodwill she will need later, and exposed people’s numbers without asking.",
                    best: false,
                  },
                  {
                    id: 'buy-list',
                    text: 'Buy the list of 5,000 numbers and message them all.',
                    outcome: "Almost nobody replies. Many report the messages as spam, which can get her number restricted. She has no idea where those numbers came from or whether those people agreed to anything, and in many countries using personal data like this can break data protection law.",
                    best: false,
                  },
                  {
                    id: 'opt-in',
                    text: 'Post on her status and page inviting people to reply YES to join her updates list, and message past customers one by one to ask if they would like to hear about the new set.',
                    outcome: "Fewer people at first: around eighty say yes. But they are glad to hear from her, many buy, and some forward her message to friends. She now has a list she can use every season without annoying anyone.",
                    best: true,
                  },
                  {
                    id: 'nothing',
                    text: 'Do not message anyone, in case it annoys them.',
                    outcome: "Nobody is annoyed, and nobody hears about the set either. Her past customers, who liked her product, would have been happy to know. Respect does not mean silence. It means asking first.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-copy',
            title: 'Draft your post and message',
            blocks: [
              {
                id: 'copy-reflection',
                type: 'reflection',
                prompt: 'Write two pieces of copy for your campaign: (1) a post for your main channel using hook, benefit, proof and action, and (2) a short message for people who have agreed to hear from you. Make sure each asks for one single action.',
                guidance: 'Read each one aloud. Cut every word your customer would not use. Check every claim is true and you can prove it. These go into section five of your Campaign Plan, and you will share one in the discussion.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'copy-clinic',
      type: 'discussion',
      title: 'Discussion: copy clinic',
      minutes: 12,
      required: true,
      payload: {
        prompt:
          "Share one piece of copy you drafted for your campaign: a post, a status or a first message.\n\nAbove it, tell us in one line who the target customer is and what single action you want them to take.\n\nThen reply to at least two classmates. For each, answer:\n\n1. Would the first line stop the target customer? Why or why not?\n2. Is the benefit clear, and is there one believable piece of proof?\n3. Is there exactly one clear next step?\n\nSuggest one specific rewrite, not just “looks good”.",
        guidance: 'Be kind and be useful. Comment on the copy, not the person. If a claim sounds exaggerated or hard to prove, say so gently: that feedback can save someone from losing their customers’ trust.',
        minWords: 60,
      },
    },
    {
      key: 'channels-quiz',
      type: 'quiz',
      title: 'Module quiz: Channels and copy',
      minutes: 8,
      required: true,
      gradeWeight: 8,
      payload: {
        intro:
          "Five questions on channels, copy and permission. You need 70% to pass and you can retake it as many times as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-oep',
            type: 'match',
            prompt: 'Match each example to the type of channel.',
            pairs: [
              { id: 'owned', left: 'A list of customers who replied YES to receive updates', right: 'Owned' },
              { id: 'rented', left: 'Your business page on a social platform', right: 'Rented' },
              { id: 'earned', left: 'A happy client posting photos and tagging you', right: 'Earned' },
              { id: 'paid', left: 'A boosted post with a weekly budget', right: 'Paid' },
            ],
            explanation: 'Use rented and paid channels to be discovered, earn attention through great work, and move your best customers onto channels you own.',
          },
          {
            id: 'q-search',
            type: 'choice',
            prompt: 'What makes search different from scrolling a social feed?',
            multiple: false,
            options: [
              { id: 'a', text: 'Search is only for big companies', correct: false, feedback: 'Small ventures can be found through search too, for example with a free business profile on maps.' },
              { id: 'b', text: 'On search, the person is actively asking a question, so they often already need what you offer', correct: true },
              { id: 'c', text: 'Search results are always paid', correct: false, feedback: 'Search shows both paid and unpaid results. Being genuinely helpful is the durable way to appear in unpaid results.' },
              { id: 'd', text: 'Nobody searches on a phone', correct: false, feedback: 'Plenty of people search on their phones, often for something nearby.' },
            ],
            explanation: 'Search catches intent. Social feeds catch attention. Both are useful, at different stages of the journey.',
          },
          {
            id: 'q-copy-order',
            type: 'order',
            prompt: 'Put the parts of the copy pattern in order.',
            items: [
              { id: 'hook', text: 'Hook: stop the right person' },
              { id: 'benefit', text: 'Benefit: what changes for them' },
              { id: 'proof', text: 'Proof: a reason to believe' },
              { id: 'action', text: 'Action: one clear next step' },
            ],
            explanation: 'Hook, benefit, proof, action. It works for a caption, a flyer, a WhatsApp status or the first lines of an email.',
          },
          {
            id: 'q-cta',
            type: 'choice',
            prompt: 'Which is the strongest call to action for Bisi’s décor packages?',
            multiple: false,
            options: [
              { id: 'a', text: '“Like and share!”', correct: false, feedback: 'Likes do not book dates. Ask for the action that moves people towards buying.' },
              { id: 'b', text: '“Send us your event date on WhatsApp and we will reply today with the packages available.”', correct: true },
              { id: 'c', text: '“We are the best, call us.”', correct: false, feedback: 'An unprovable claim and a vague ask.' },
              { id: 'd', text: '“Visit our page, our website and our office.”', correct: false, feedback: 'Three asks. Choose one.' },
            ],
            explanation: 'One step, easy to take, specific about what happens next.',
          },
          {
            id: 'q-permission',
            type: 'choice',
            prompt: 'Which messaging practices respect customers? Select all that apply.',
            multiple: true,
            options: [
              { id: 'ask', text: 'Asking people before adding them to an updates list', correct: true },
              { id: 'stop', text: 'Making it easy to stop the messages, and honouring it straight away', correct: true },
              { id: 'freq', text: 'Telling people how often you will message, and keeping to it', correct: true },
              { id: 'buy', text: 'Buying a list of numbers to grow faster', correct: false, feedback: 'Those people never agreed to hear from you. It annoys them, risks your number being restricted and may break data protection law.' },
              { id: 'group', text: 'Adding all your contacts to a sales group without asking', correct: false, feedback: 'It exposes people’s numbers to strangers and spends goodwill you will need later.' },
            ],
            explanation: 'Permission marketing: messages that people expect, that feel personal and that matter to them. A small list of people who said yes is worth far more than a big list of people who did not.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Run a small campaign, honestly
// ---------------------------------------------------------------------------

const moduleCampaign: Module = {
  key: 'run-a-campaign',
  title: 'Run a small campaign, honestly',
  summary:
    'Turn your customer, offer, channels and copy into a short campaign with one goal, a small budget and fixed dates. Learn the basics of paid advertising without wasting money, and the ethics that keep customers’ trust: honest claims, respect for their data and no dark patterns.',
  weekNo: 10,
  items: [
    {
      key: 'small-budget-campaign',
      type: 'lesson',
      title: 'A campaign on a small budget',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'campaign-intro',
            title: 'What a campaign is',
            blocks: [
              {
                id: 'campaign-text',
                type: 'text',
                body: "A **campaign** is a focused push with a beginning and an end: one goal, one audience, one offer, a few channels, a set budget and fixed dates. Posting “whenever I have time” is not a campaign. A two-week push to book ten new tutoring students before term starts is.\n\nCampaigns are how you learn. Because they have a goal and an end date, you can see clearly whether they worked.\n\nMany small campaigns include a little paid advertising. Watch the video for the basics of paid social ads. Ignore the specific buttons and settings, which change often. Watch for the principles.",
              },
              {
                id: 'paid-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'ol0v779BlAA',
                title: 'How To Master Paid Social Media Advertising Like A Pro',
                channel: 'HubSpot Marketing',
                durationS: 494,
                caption: "HubSpot on the basics of paid social advertising. Platforms and prices change, so watch for the durable ideas: a clear objective, a defined audience, testing more than one version, and checking results before spending more.",
              },
            ],
          },
          {
            id: 'campaign-brief',
            title: 'The one-page campaign brief',
            blocks: [
              {
                id: 'brief-framework',
                type: 'framework',
                title: 'Campaign brief',
                steps: [
                  { label: 'Goal', detail: 'One result, with a number and a date. “Twenty orders of the harmattan set by 15 December.”' },
                  { label: 'Audience', detail: 'Your target customer, from Module 1.' },
                  { label: 'Offer', detail: 'What exactly you are asking them to buy or do, and why now. A new product, a launch price, a limited number of places.' },
                  { label: 'Channels', detail: 'The one or two channels you chose, and whether each is owned, rented, earned or paid.' },
                  { label: 'Messages', detail: 'Your main post and message, and at least two versions to compare.' },
                  { label: 'Budget', detail: 'Money and time. Set a total cap you can afford to lose completely.' },
                  { label: 'Dates', detail: 'Start, end and the days you will check results.' },
                  { label: 'Measure', detail: 'How you will count results, from first look to sale. More on this in Module 4.' },
                ],
              },
              {
                id: 'budget-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Only spend what you can afford to lose',
                body: "Your first paid campaign is an experiment. Experiments often fail. Set a total budget that would not hurt your business, your rent or your family if it brought back nothing. Never borrow to fund an ad test.",
              },
            ],
          },
          {
            id: 'good-goal',
            title: 'A goal you can measure',
            blocks: [
              {
                id: 'goal-choice',
                type: 'choice',
                prompt: 'Bisi is planning a two-week campaign for her naming-ceremony packages. Which goal is best?',
                multiple: false,
                options: [
                  { id: 'awareness', text: '“Raise awareness of our brand.”', correct: false, feedback: 'Awareness matters, but how would Bisi know if it worked? There is no number and no date.' },
                  { id: 'followers', text: '“Get 1,000 new followers.”', correct: false, feedback: 'Followers are not customers. Bisi could hit this number and book nothing.' },
                  { id: 'bookings', text: '“Six confirmed bookings with a deposit for naming ceremonies in the next two months, by the end of the campaign.”', correct: true, feedback: 'Yes. A real business result, a number and a deadline. Every other decision can serve it.' },
                  { id: 'viral', text: '“Go viral.”', correct: false, feedback: 'Nobody can plan to go viral, and viral attention from the wrong people does not pay the bills.' },
                ],
                explanation:
                  "Choose a goal **as close to the sale as you can**, with a number and a date. Likes, views and followers can be useful signs along the way, but the goal is the thing that would make the campaign worth it.",
              },
            ],
          },
          {
            id: 'ads-basics',
            title: 'Paid ads in plain words',
            blocks: [
              {
                id: 'ads-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Objective', definition: 'What you tell the platform you want: people reached, clicks, messages or sales. Platforms tend to deliver what you ask for, so ask for what you actually want.' },
                  { term: 'Targeting', definition: 'Who sees the ad: places, interests, ages, or people similar to your customers. Narrow enough to be relevant, wide enough to learn.' },
                  { term: 'Budget cap', definition: 'The most you will spend per day or in total. Set it before you start.' },
                  { term: 'Auction', definition: 'Most ad platforms decide who sees which ad through an automated auction. Price matters, but so does how relevant and useful your ad seems to people.' },
                  { term: 'Creative', definition: 'The ad itself: picture or video plus words. Usually the biggest single factor in whether an ad works.' },
                  { term: 'Boosted post', definition: 'Paying to show an existing post to more people. Simple to start, but you usually get fewer choices about objective and audience than with a full ad.' },
                ],
              },
              {
                id: 'ads-reveal',
                type: 'reveal',
                prompt: 'Should a small venture run paid ads before its posts get any reaction without payment? Think, then tap.',
                body: "Usually not. If a post gets no reaction from people who already follow you, paying to show it to strangers rarely fixes it. Ads **amplify** what already works a little. They seldom rescue what does not.\n\nTest your message free first: on your status, in a group, with a few customers. When something gets replies, that is the version worth putting money behind.",
              },
            ],
          },
          {
            id: 'test-order',
            title: 'Running a small paid test',
            blocks: [
              {
                id: 'test-steps',
                type: 'order',
                prompt: 'Put these steps for a small paid ad test in a sensible order.',
                items: [
                  { id: 'goal', text: 'Decide the one result you want and the most you will spend' },
                  { id: 'free', text: 'Test your message free with existing followers and customers' },
                  { id: 'versions', text: 'Make two versions of the ad that differ in one thing only' },
                  { id: 'run', text: 'Run both with a small budget cap for a few days' },
                  { id: 'compare', text: 'Compare the cost per result of each version' },
                  { id: 'shift', text: 'Move the remaining budget to the better version, or stop' },
                ],
                explanation:
                  "Notice that the decision about money comes **first** and the decision to spend more comes **last**, after evidence. Small, capped tests protect you from the most common mistake: spending the whole budget on day one on a version nobody has tested.",
              },
            ],
          },
          {
            id: 'spend-feelings',
            title: 'How you feel about spending',
            blocks: [
              {
                id: 'spend-scale',
                type: 'scale',
                prompt: 'How comfortable do you feel about spending real money on advertising for your venture or cause?',
                minLabel: 'Very uneasy',
                maxLabel: 'Completely comfortable',
                afterword:
                  "Both ends have risks. Very uneasy people sometimes never test anything and so never learn. Very comfortable people sometimes spend before they have a message worth amplifying. A small, capped budget and a clear measure let you learn without gambling. And if you spend nothing at all on ads, that is a valid campaign too: owned and earned channels can carry it.",
              },
            ],
          },
          {
            id: 'your-brief',
            title: 'Draft your campaign brief',
            blocks: [
              {
                id: 'brief-reflection',
                type: 'reflection',
                prompt: 'Draft your campaign brief: goal (with a number and date), audience, offer, channels, messages (and the two versions you will compare), budget in money and time, dates, and how you will count results.',
                guidance: 'Keep it to one page. If you will not use paid ads, say how your owned and earned channels will carry the campaign. This brief is the heart of your Campaign Plan.',
                minWords: 70,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'honest-marketing',
      type: 'lesson',
      title: 'Honest marketing: claims, data and dark patterns',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'trust-intro',
            title: 'Trust is the asset',
            blocks: [
              {
                id: 'trust-text',
                type: 'text',
                body: "Marketing can be done in ways that help people choose well, or in ways that trick them. Tricks sometimes work once. They rarely work twice, and in a small market where everyone knows someone who knows you, a reputation for tricks spreads fast.\n\nOne family of tricks has a name: **dark patterns**. These are designs that push people into choices they would not make if they saw clearly. Watch the short explainer.",
              },
              {
                id: 'dark-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'EMWFZ6HoyMY',
                title: 'The Internet Is Fooling YOU - Dark Patterns Explained',
                channel: 'Techquickie',
                durationS: 270,
                caption: "A quick tour of dark patterns on websites and apps. Watch for the common thread: each one works by hiding information or pressuring people, not by offering them something better.",
              },
            ],
          },
          {
            id: 'dark-patterns',
            title: 'Patterns to refuse',
            blocks: [
              {
                id: 'dark-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Fake urgency', definition: '“Offer ends in 10 minutes!” when it does not, or a countdown that restarts.' },
                  { term: 'Fake scarcity', definition: '“Only 2 left!” when there are plenty.' },
                  { term: 'Hidden costs', definition: 'Delivery fees or extra charges revealed only at the last step, or in the chat after someone has decided.' },
                  { term: 'Bait and switch', definition: 'Advertising one item or price, then saying it is “finished” and pushing something dearer.' },
                  { term: 'Confirmshaming', definition: 'Guilt-tripping people who say no: “No thanks, I don’t care about my children’s skin.”' },
                  { term: 'Hard to leave', definition: 'Easy to join a list or subscription, very hard to stop it.' },
                ],
              },
              {
                id: 'bisi-choice',
                type: 'choice',
                prompt: 'Bisi’s new assistant suggests some tactics for the campaign. Which ones cross the line? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'fake-slots', text: 'Saying “only one December date left” when four are free', correct: true, feedback: 'Yes. Fake scarcity. Clients who later learn the truth will not trust anything else she says.' },
                  { id: 'real-deadline', text: 'Saying “prices go up on 1 January” when they really do', correct: false, feedback: 'A true deadline is useful information. Urgency is only a dark pattern when it is false.' },
                  { id: 'hidden-fee', text: 'Quoting a package price and adding a “set-up fee” only after the deposit is paid', correct: true, feedback: 'Yes. A hidden cost. Show the full price up front.' },
                  { id: 'past-photos', text: 'Posting photos of real past events, with the clients’ permission', correct: false, feedback: 'This is honest proof, and asking permission respects clients.' },
                  { id: 'stock-photos', text: 'Posting another company’s event photos as if they were Bisi’s', correct: true, feedback: 'Yes. It is deceptive, and it may break copyright. Clients will expect what they saw.' },
                ],
                explanation:
                  "The test is simple: **would the customer feel tricked if they knew everything you know?** If yes, do not do it. Real deadlines, real limits and real photos are not just ethical. They are better marketing, because they build the trust that brings people back.",
              },
            ],
          },
          {
            id: 'honest-claims',
            title: 'Claims you can prove',
            blocks: [
              {
                id: 'claims-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Be careful with health, money and results claims',
                body: "Some claims can hurt people if they are wrong. “Cures eczema.” “Guaranteed A in maths.” “Double your money in a month.” Even if one customer had that result, it is not a promise you can make to everyone.\n\nSay what you can prove: what is in the product, what customers have told you (with permission, in their words), what you will do if someone is unhappy. Many countries have consumer-protection and advertising rules about misleading claims, especially for health, food, cosmetics and money. Check the rules where you sell.",
              },
              {
                id: 'claims-scenario',
                type: 'scenario',
                situation:
                  "A customer sends Akosua a long, happy voice note. Her baby’s rash cleared up after a week of using the shea butter. She says: “You should tell everyone it cures eczema!”\n\nAkosua is tempted. Her harmattan campaign starts tomorrow.",
                prompt: 'What should Akosua do?',
                options: [
                  {
                    id: 'cures',
                    text: 'Add “Cures eczema!” to her campaign posts.',
                    outcome: "The posts get attention. Then a parent whose child has severe eczema stops a prescribed treatment and uses only the shea butter. The child gets worse. Akosua made a medical claim she cannot prove, and someone was harmed by trusting it.",
                    best: false,
                  },
                  {
                    id: 'ask-share',
                    text: 'Thank the customer, ask if she may share the story in the customer’s own words without the baby’s photo or name, and avoid any claim that it treats a medical condition.',
                    outcome: "The customer agrees. Akosua posts: “One mum told us her baby’s dry skin felt much softer after a week. Every skin is different; for rashes or eczema, see a health worker.” It is warm, true and still persuasive. Parents trust her more, not less.",
                    best: true,
                  },
                  {
                    id: 'screenshot',
                    text: 'Post a screenshot of the voice note conversation, with the customer’s name and baby photo, without asking.',
                    outcome: "The customer is upset to see her child’s photo and her name on a business page. She asks Akosua to remove it and tells her friends. A happy customer has become an unhappy one.",
                    best: false,
                  },
                  {
                    id: 'ignore',
                    text: 'Ignore the message. Testimonials are always risky.',
                    outcome: "Akosua stays safe but loses honest, powerful proof. Real customer words, shared with permission and without exaggeration, are some of the most trusted marketing there is.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'data-respect',
            title: 'Respecting customers’ data',
            blocks: [
              {
                id: 'data-context',
                type: 'callout',
                tone: 'context',
                title: 'Phone numbers are personal data',
                body: "Many African countries, including Kenya, Nigeria, Ghana, Senegal and South Africa, now have data protection laws. The details differ, but the principles are similar. Collect only what you need. Say why you are collecting it. Use it only for that. Keep it safe. Let people ask you to delete it.\n\nIn practice, for a small venture: ask before adding someone to a list; never share or sell customers’ numbers; do not post screenshots that show people’s names, numbers or faces without permission; and keep your customer list on a phone or account protected by a password.",
              },
              {
                id: 'data-reveal',
                type: 'reveal',
                prompt: 'A competitor offers to swap customer lists with Fatou “so we both grow”. Why is this a bad idea even if both lists are small? Think, then tap.',
                body: "Her customers gave Fatou their numbers to hear from **Fatou**, not from anyone she chooses to pass them to. Sharing them breaks that trust, and in many countries it may break the law.\n\nIf the two brands want to help each other, there is an honest version: each tells its own customers about the other, and anyone interested contacts that brand directly. Permission stays with the customer.",
              },
            ],
          },
          {
            id: 'your-ethics',
            title: 'Your ethics line',
            blocks: [
              {
                id: 'ethics-reflection',
                type: 'reflection',
                prompt: 'Write your campaign’s ethics line: the claims you will make and how you can prove each one, how you will get permission to message people or share their words, how you will keep their data safe, and one tactic you will refuse to use even if it might work.',
                guidance: 'Re-read the copy you drafted in Module 2. Remove or soften any claim you cannot prove. This becomes the ethics section of your Campaign Plan.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'campaign-quiz',
      type: 'quiz',
      title: 'Module quiz: Running a campaign',
      minutes: 7,
      required: true,
      gradeWeight: 7,
      payload: {
        intro:
          "Five questions on campaign goals, small paid tests and honest marketing. You need 75% to pass and you can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'q-goal',
            type: 'choice',
            prompt: 'Which is the best campaign goal for Achieng’s tutoring service?',
            multiple: false,
            options: [
              { id: 'a', text: '“Be more visible online.”', correct: false, feedback: 'No number, no date and no business result. How would she know it worked?' },
              { id: 'b', text: '“Eight new students enrolled and paid for next term by 10 January.”', correct: true },
              { id: 'c', text: '“Post every day.”', correct: false, feedback: 'That is an activity, not a result.' },
              { id: 'd', text: '“Get 500 likes.”', correct: false, feedback: 'Likes may come from people who will never enrol.' },
            ],
            explanation: 'Close to the sale, with a number and a date.',
          },
          {
            id: 'q-amplify',
            type: 'choice',
            prompt: 'Fatou’s post got almost no reaction from her own followers. What is the best next step?',
            multiple: false,
            options: [
              { id: 'a', text: 'Pay to show the same post to many more people', correct: false, feedback: 'Ads amplify what already works a little. They rarely rescue a message that falls flat with people who already like you.' },
              { id: 'b', text: 'Rework the message and test it free again before spending money on it', correct: true },
              { id: 'c', text: 'Delete her account and start again', correct: false, feedback: 'Far too drastic. One weak post is information, not failure.' },
              { id: 'd', text: 'Post the same thing ten more times', correct: false, feedback: 'Repeating a message that did not land teaches her nothing new.' },
            ],
            explanation: 'Test free, then pay to amplify the version that already gets replies.',
          },
          {
            id: 'q-test-order',
            type: 'order',
            prompt: 'Put the steps of a small paid test in order.',
            items: [
              { id: 'cap', text: 'Set the goal and a total budget cap' },
              { id: 'two', text: 'Make two versions that differ in one thing' },
              { id: 'run', text: 'Run both for a few days with a small daily budget' },
              { id: 'compare', text: 'Compare cost per result' },
              { id: 'shift', text: 'Put the rest of the budget behind the better one, or stop' },
            ],
            explanation: 'Decide the limit first, spend more only after evidence.',
          },
          {
            id: 'q-dark',
            type: 'match',
            prompt: 'Match each tactic to the dark pattern it is.',
            pairs: [
              { id: 'urgency', left: 'A countdown timer that restarts every time you reload the page', right: 'Fake urgency' },
              { id: 'scarcity', left: '“Only 2 left!” when the storeroom is full', right: 'Fake scarcity' },
              { id: 'hidden', left: 'A delivery fee mentioned only after payment', right: 'Hidden costs' },
              { id: 'shame', left: '“No thanks, I prefer to fail my exams”', right: 'Confirmshaming' },
            ],
            explanation: 'Each one works by deceiving or pressuring people. The honest versions, real deadlines, real stock levels and full prices up front, are allowed and useful.',
          },
          {
            id: 'q-data',
            type: 'choice',
            prompt: 'Which actions respect customers’ data? Select all that apply.',
            multiple: true,
            options: [
              { id: 'ask', text: 'Asking before adding someone to a broadcast list', correct: true },
              { id: 'lock', text: 'Keeping the customer list on a password-protected phone or account', correct: true },
              { id: 'delete', text: 'Removing someone’s number when they ask you to', correct: true },
              { id: 'swap', text: 'Swapping customer lists with a friendly business', correct: false, feedback: 'Customers gave their numbers to you, not to others. Sharing them breaks trust and may break the law.' },
              { id: 'screens', text: 'Posting screenshots of happy chats that show customers’ names and numbers', correct: false, feedback: 'Ask first, and hide names, numbers and faces unless the customer agrees.' },
            ],
            explanation: 'Collect what you need, say why, use it only for that, keep it safe and let people leave.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 4 · Measure, improve and report
// ---------------------------------------------------------------------------

const reportTemplate = [
  'DIGITAL MARKETING CAMPAIGN PLAN AND RESULTS REPORT',
  '',
  'PART A · THE PLAN',
  '',
  '1. Target customer',
  'Who they are, their situation, the struggle or wish your offer answers, who decides and pays, and where they gather.',
  '',
  '2. Value proposition',
  'For… who want… we offer… that… unlike… because… Then the same idea in one plain sentence.',
  '',
  '3. Customer journey',
  'Notice, Consider, Trust, Buy, Return and recommend: where each happens. The stage where people drop out, and what you did about it.',
  '',
  '4. Channels',
  'The one or two channels you used, why they fit, and whether each is owned, rented, earned or paid.',
  '',
  '5. Messages',
  'Your main post (hook, benefit, proof, action), your message to people who opted in, and the two versions you compared.',
  '',
  '6. Campaign brief',
  'Goal (number and date), offer, budget in money and time, start and end dates, and how you counted results.',
  '',
  '7. Ethics line',
  'The claims you made and how you can prove them, how you got permission, how you kept data safe, and what you refused to do.',
  '',
  'PART B · THE RESULTS',
  '',
  '8. What you actually did',
  'Dates, channels, what you posted and sent, and anything that changed from the plan.',
  '',
  '9. The numbers',
  'People reached: …  Clicks or messages: …  Results (orders, bookings, sign-ups): …',
  'Click rate: …  Conversion rate: …  Money spent: …  Cost per result: …',
  'Profit from the campaign before marketing costs: …  Return on investment: …',
  'Which version did better, and by how much. Say where each number came from.',
  '',
  '10. What worked, what did not, and why',
  'Your honest reading of the numbers and of what customers said.',
  '',
  '11. What you will change next time',
  'Two or three specific changes, and the next small test you will run.',
].join('\n');

const moduleMeasure: Module = {
  key: 'measure-and-improve',
  title: 'Measure, improve and report',
  summary:
    'Count what happened at each stage of your campaign, calculate a few simple numbers (click rate, conversion rate, cost per result and return on investment), and use them to decide what to change. Then bring everything together in your Campaign Plan and Results Report.',
  weekNo: 10,
  items: [
    {
      key: 'measure-what-works',
      type: 'lesson',
      title: 'Measure what works, then improve it',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'measure-intro',
            title: 'Spend only on what works',
            blocks: [
              {
                id: 'measure-text',
                type: 'text',
                body: "The great advantage of digital marketing over a billboard is that you can **count**. You can see how many people saw a post, how many tapped, how many messaged and how many paid. That means you can stop guessing and spend your money and time only on what works.\n\nYou do not need complicated tools. A notebook or a simple spreadsheet, filled in every day of your campaign, is enough. Watch the video for the main ideas, then we will work through real-looking numbers together.",
              },
              {
                id: 'measure-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'eg4I-RU_vKU',
                title: 'Marketing Analytics 101 (A Beginner’s Guide To Marketing Metrics)',
                channel: 'Adam Erhart',
                durationS: 441,
                caption: "The marketing educator Adam Erhart on the basic numbers every marketer should track. Watch for the difference between numbers that feel good, such as likes, and numbers that tell you whether the business is growing.",
              },
            ],
          },
          {
            id: 'the-numbers',
            title: 'Five numbers',
            blocks: [
              {
                id: 'metrics-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Reach', definition: 'How many different people saw your post or ad.' },
                  { term: 'Click rate', definition: 'Clicks (or taps, or messages) divided by reach. Shows whether your hook and picture made the right people curious.' },
                  { term: 'Conversion rate', definition: 'Results (orders, bookings, sign-ups) divided by clicks or messages. Shows whether your offer, price, trust and buying steps work.' },
                  { term: 'Cost per result', definition: 'Money spent divided by the number of results. What one order or booking cost you to win.' },
                  { term: 'Return on investment (ROI)', definition: 'Profit from the campaign, after subtracting what you spent on it, divided by what you spent. Use profit, not sales.' },
                ],
              },
              {
                id: 'akosua-example',
                type: 'example',
                title: 'Akosua’s first week (a fictional case)',
                body: "Akosua spent GH₵200 on a one-week ad for her harmattan set, asking people to message her on WhatsApp. Her own records show:\n\n- Reach: 4,000 people\n- Messages: 160\n- Orders: 16, at GH₵70 each\n- Profit on each order before advertising (after shea, jars and delivery): GH₵25\n\nSo her **click rate** was 160 ÷ 4,000 = 4%. Her **conversion rate** was 16 ÷ 160 = 10%. Her **cost per order** was GH₵200 ÷ 16 = GH₵12.50.",
              },
            ],
          },
          {
            id: 'calculate',
            title: 'Your turn to calculate',
            blocks: [
              {
                id: 'cpr-choice',
                type: 'choice',
                prompt: 'In her second week, Akosua spends GH₵150. She gets 120 messages and 20 orders. What is her cost per order?',
                multiple: false,
                options: [
                  { id: 'a', text: 'GH₵1.25', correct: false, feedback: 'That is the cost per message: 150 ÷ 120. The question asks about orders.' },
                  { id: 'b', text: 'GH₵7.50', correct: true, feedback: 'Yes. GH₵150 ÷ 20 orders = GH₵7.50 per order.' },
                  { id: 'c', text: 'GH₵12.50', correct: false, feedback: 'That was week one. Use the week-two numbers: 150 ÷ 20.' },
                  { id: 'd', text: 'GH₵30', correct: false, feedback: 'Check the division: money spent ÷ number of orders.' },
                ],
                explanation:
                  "Week two cost less per order (GH₵7.50 against GH₵12.50) even though fewer people messaged. Her conversion rate rose from 10% to about 17% (20 ÷ 120). Something changed between messaging and buying. She had started replying faster and offering pay on delivery. That is the kind of insight the numbers give you.",
              },
              {
                id: 'roi-reveal',
                type: 'reveal',
                prompt: 'In week one Akosua sold GH₵1,120 of shea butter (16 × GH₵70) after spending GH₵200. Was her return on investment more than five times her spend? Work it out, then tap.',
                body: "No. That compares **sales** with spend, and sales are not profit. Akosua still had to pay for shea, jars and delivery.\n\nHer profit before advertising was 16 × GH₵25 = GH₵400. Take away the GH₵200 she spent: GH₵200 left. **ROI** = GH₵200 ÷ GH₵200 = **100%**. For every cedi spent, she got it back plus one cedi of profit.\n\nThat is still a good result. But if she had believed the five-times figure, she might have spent far more on ads than the business can carry.",
              },
            ],
          },
          {
            id: 'ab-testing',
            title: 'Change one thing at a time',
            blocks: [
              {
                id: 'ab-text',
                type: 'text',
                body: "To improve, compare two versions that differ in **one** thing: the first line, the picture, the offer, the time you post. If you change everything at once, you cannot tell what made the difference.\n\nThis is called an **A/B test**. Watch the short explainer.",
              },
              {
                id: 'ab-video',
                type: 'video',
                provider: 'youtube',
                videoId: '08GTL6n4oIQ',
                title: 'Explainer: What is A/B Testing?',
                channel: 'Stanford Graduate School of Business',
                durationS: 90,
                caption: "A 90-second explainer from Stanford Graduate School of Business. Watch for why the two groups need to be shown the versions at the same time and under the same conditions.",
              },
              {
                id: 'small-numbers',
                type: 'callout',
                tone: 'caution',
                title: 'Small numbers wobble',
                body: "With a small campaign, a difference of one or two orders can be luck. Treat small differences as hints, not proof. Look for big, repeated differences, and when in doubt run the test again.",
              },
            ],
          },
          {
            id: 'diagnose',
            title: 'Read the numbers, find the fix',
            blocks: [
              {
                id: 'fix-match',
                type: 'match',
                prompt: 'Match what the numbers show to the most likely place to look for a fix.',
                pairs: [
                  { id: 'low-reach', left: 'Very few people saw it', right: 'Channel, timing or budget: you are not reaching enough of the right people' },
                  { id: 'low-click', left: 'Many saw it, very few tapped or messaged', right: 'The hook, picture or audience: it did not make the right people curious' },
                  { id: 'low-convert', left: 'Many messaged, very few bought', right: 'Offer, price, trust or buying steps: something stops interested people' },
                  { id: 'no-return', left: 'Many bought once, nobody came back', right: 'The product or after-sale experience: follow-up, quality or delivery' },
                ],
                explanation:
                  "Each number points at a different stage of the customer journey. This is why you count every stage, not only sales. It tells you **where** to work, so you do not rewrite a good post when the real problem is a slow reply.",
              },
            ],
          },
          {
            id: 'your-tracking',
            title: 'Set up your tracking',
            blocks: [
              {
                id: 'tracking-tip',
                type: 'callout',
                tone: 'tip',
                title: 'Simple ways to know what brought each customer',
                body: "- A code word per post or version: “Reply HARMATTAN” or “Mention FRIDAY10”.\n- Ask every new customer: “How did you hear about us?”, and write the answer down.\n- Use the free statistics most platforms show you for each post or ad.\n- Keep one row per day in a notebook or spreadsheet: reach, taps or messages, results, money spent.",
              },
              {
                id: 'tracking-reflection',
                type: 'reflection',
                prompt: 'How will you count results in your campaign? List the numbers you will record at each stage, where each number will come from, how you will tell your two versions apart, and what result by the end would make you call the campaign a success.',
                guidance: 'Decide your success threshold now, before you see the results. This is the measurement section of your Campaign Plan, and the start of your Results Report.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'measure-quiz',
      type: 'quiz',
      title: 'Module quiz: Measure and improve',
      minutes: 6,
      required: true,
      gradeWeight: 7,
      payload: {
        intro:
          "Five questions on marketing numbers and testing. Two need a quick calculation. You need 80% to pass and you can retake it as many times as you like.",
        passPct: 80,
        maxAttempts: null,
        questions: [
          {
            id: 'q-metrics',
            type: 'match',
            prompt: 'Match each number to what it tells you.',
            pairs: [
              { id: 'reach', left: 'Reach', right: 'How many different people saw it' },
              { id: 'click', left: 'Click rate', right: 'Whether the hook and picture made the right people curious' },
              { id: 'conversion', left: 'Conversion rate', right: 'Whether the offer, trust and buying steps turn interest into results' },
              { id: 'cpr', left: 'Cost per result', right: 'What each order or booking cost you to win' },
            ],
            explanation: 'Each number belongs to a stage of the journey. Together they show you where to work.',
          },
          {
            id: 'q-click-rate',
            type: 'choice',
            prompt: 'Bisi’s post reached 2,000 people and 50 of them messaged her. What was her click rate?',
            multiple: false,
            options: [
              { id: 'a', text: '0.25%', correct: false, feedback: 'Check the division: 50 ÷ 2,000 = 0.025, which is 2.5%.' },
              { id: 'b', text: '2.5%', correct: true },
              { id: 'c', text: '25%', correct: false, feedback: 'Too high by ten times. 50 ÷ 2,000 = 0.025.' },
              { id: 'd', text: '40%', correct: false, feedback: 'That divides the wrong way round. Divide messages by reach.' },
            ],
            explanation: '50 ÷ 2,000 = 0.025, or 2.5%.',
          },
          {
            id: 'q-cpr',
            type: 'choice',
            prompt: 'Bisi spent ₦30,000 on the post and got 3 bookings. What was her cost per booking?',
            multiple: false,
            options: [
              { id: 'a', text: '₦600', correct: false, feedback: 'That is the cost per message: 30,000 ÷ 50. The question asks about bookings.' },
              { id: 'b', text: '₦3,000', correct: false, feedback: 'Check the division: 30,000 ÷ 3.' },
              { id: 'c', text: '₦10,000', correct: true },
              { id: 'd', text: '₦90,000', correct: false, feedback: 'That multiplies instead of dividing.' },
            ],
            explanation: '₦30,000 ÷ 3 bookings = ₦10,000 per booking. Whether that is good depends on how much profit each booking brings.',
          },
          {
            id: 'q-roi-profit',
            type: 'choice',
            prompt: 'Why should return on investment be calculated with profit rather than sales?',
            multiple: false,
            options: [
              { id: 'a', text: 'Because sales figures are usually wrong', correct: false, feedback: 'Sales figures can be accurate. The problem is what they leave out.' },
              { id: 'b', text: 'Because sales include the cost of making and delivering the product, so they make a campaign look better than it really was', correct: true },
              { id: 'c', text: 'Because profit is always larger than sales', correct: false, feedback: 'The opposite: profit is what is left of sales after costs, so it is smaller.' },
              { id: 'd', text: 'Because ad platforms only report profit', correct: false, feedback: 'Platforms do not know your costs. You have to work out profit yourself.' },
            ],
            explanation: 'Using sales can make a losing campaign look like a winner. Profit after costs, minus what you spent on marketing, divided by what you spent, gives the honest answer.',
          },
          {
            id: 'q-ab',
            type: 'choice',
            prompt: 'Achieng wants to know whether a photo of a real lesson works better than a graphic with text. What is the fairest test?',
            multiple: false,
            options: [
              { id: 'a', text: 'Use the photo this month and the graphic next month', correct: false, feedback: 'Too much else changes between months: exams, holidays, budgets.' },
              { id: 'b', text: 'Run both at the same time, to the same audience, with the same words and budget, changing only the picture', correct: true },
              { id: 'c', text: 'Change the picture, the words and the offer together to save time', correct: false, feedback: 'If everything changes, she cannot tell which change made the difference.' },
              { id: 'd', text: 'Ask friends which they prefer', correct: false, feedback: 'Friends are not her customers, and preferences are not behaviour.' },
            ],
            explanation: 'Change one thing, keep everything else the same, run at the same time. And remember: with small numbers, treat small differences as hints, not proof.',
          },
        ],
      },
    },
    {
      key: 'campaign-plan-and-report',
      type: 'assignment',
      title: 'Practical Output: your Campaign Plan and Results Report',
      minutes: 30,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: a **Digital Marketing Campaign Plan and Results Report** for a real, small campaign for your venture, cause or idea.\n\nPart A is the plan you built through the course: your customer, value proposition, journey, channels, messages, campaign brief and ethics line. Part B is what happened when you ran it: the numbers, your honest reading of them and what you will change next time.\n\nRun the campaign for at least five days. It does not need a big budget, or any budget at all: an opt-in message campaign or a series of posts on your own channels is fine. A campaign that missed its goal can still earn top marks if your measurement is honest and your learning is sharp.\n\nIf you do not have a venture yet, market something real and small: a waiting list for an idea, a club event, a fundraiser for a cause, or your own freelance service.\n\nA faculty reviewer will grade your report against the rubric below and give you written feedback. It joins your Dream Lab portfolio.",
        practicalOutput: 'Digital Marketing Campaign Plan and Results Report',
        steps: [
          'Open your journal and gather your reflections from every lesson: customer, value proposition, journey, channels, copy, campaign brief, ethics line and tracking plan.',
          'Fill in Part A of the template. Sharpen each section using what you learnt since you first wrote it, including feedback from the copy clinic.',
          'Set up your tracking before you start: a notebook or spreadsheet with one row per day, and a way to tell your two versions apart.',
          'Run the campaign for at least five days. Record your numbers every day, and write down anything customers say.',
          'Calculate click rate, conversion rate, cost per result and, if you spent money, return on investment using profit, not sales. Show your working.',
          'Fill in Part B honestly. Say where each number came from, and do not round failures into successes.',
          'Remove names, numbers and faces of customers from any screenshots you attach, unless they agreed to be shown.',
          'Submit, then write in your journal the next small test you will run.',
        ],
        rubric: [
          {
            id: 'customer-value',
            criterion: 'Customer and value proposition',
            description: 'Describes a specific target customer by situation and need, identifies who decides and pays, and states a clear, believable value proposition that leads with benefits.',
          },
          {
            id: 'journey-channels',
            criterion: 'Journey and channels',
            description: 'Maps the customer journey, names the stage where people drop out, and chooses one or two channels that fit the customer, the stage and the time available.',
          },
          {
            id: 'messages-brief',
            criterion: 'Messages and campaign brief',
            description: 'Copy follows hook, benefit, proof and action with one clear call to action. The brief has a measurable goal with a date, a defined offer, a budget cap and two versions to compare.',
          },
          {
            id: 'ethics',
            criterion: 'Honesty and respect',
            description: 'Makes only claims that can be proved, messages people only with permission, protects customer data, and avoids dark patterns.',
          },
          {
            id: 'measurement',
            criterion: 'Measurement and results',
            description: 'Reports numbers for each stage with their sources, calculates conversion rate, cost per result and (where money was spent) ROI on profit correctly, and compares the two versions fairly.',
          },
          {
            id: 'learning',
            criterion: 'Learning and next steps',
            description: 'Explains what worked and what did not with reference to the numbers and the journey, and proposes specific, realistic changes and a next test.',
          },
        ],
        template: reportTemplate,
        minWords: 300,
      },
    },
    {
      key: 'final-quiz',
      type: 'quiz',
      title: 'Final course quiz',
      minutes: 13,
      required: true,
      gradeWeight: 30,
      payload: {
        intro:
          "Ten questions across the whole course: customers, value, journeys, channels, copy, campaigns, ethics and measurement. Most follow a new case.\n\nYou need 75% to pass and can retake it as often as you like. Have a calculator or your phone ready for two of the questions.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-target',
            type: 'choice',
            prompt: 'New case: Neema makes handmade leather sandals in Arusha. Which description of her target customer is most useful?',
            multiple: false,
            options: [
              { id: 'a', text: '“Everyone who wears shoes.”', correct: false, feedback: 'Far too wide. She cannot reach or speak to everyone.' },
              { id: 'b', text: '“Women aged 20 to 40.”', correct: false, feedback: 'A demographic with no need or situation attached.' },
              { id: 'c', text: '“Visitors and residents in Arusha who want comfortable, durable sandals made locally, and who buy gifts or souvenirs that mean something.”', correct: true },
              { id: 'd', text: '“People who like fashion.”', correct: false, feedback: 'Vague, and says nothing about why they would choose handmade sandals.' },
            ],
            explanation: 'Describe a situation and a need, not only an age group. That tells Neema where to find them and what to say.',
          },
          {
            id: 'f-benefit',
            type: 'choice',
            prompt: 'Which line from Neema’s page leads with a benefit?',
            multiple: false,
            options: [
              { id: 'a', text: '“Full-grain leather, hand-stitched soles.”', correct: false, feedback: 'Features. Good proof, but what changes for the customer?' },
              { id: 'b', text: '“Walk all day on the city’s streets and still be comfortable at night, in sandals made to last for years.”', correct: true },
              { id: 'c', text: '“Sizes 36 to 46.”', correct: false, feedback: 'Useful information, not a benefit.' },
              { id: 'd', text: '“Established 2021.”', correct: false, feedback: 'A fact about the business, not about the customer’s life.' },
            ],
            explanation: 'Benefits answer “so what?” for the customer. Features are the proof behind them.',
          },
          {
            id: 'f-leak',
            type: 'choice',
            prompt: 'Many people message Neema asking for prices, but few buy. She replies the next day with just a number. Where is her journey leaking?',
            multiple: false,
            options: [
              { id: 'a', text: 'Notice: not enough people know about her', correct: false, feedback: 'People are already noticing her and asking. The problem comes after that.' },
              { id: 'b', text: 'Between Consider and Buy: slow replies and no clear next step', correct: true },
              { id: 'c', text: 'Return and recommend: customers do not come back', correct: false, feedback: 'Most of these people have not bought once yet.' },
              { id: 'd', text: 'Nowhere: this is normal', correct: false, feedback: 'Some drop-off is normal, but a slow, bare reply is a fixable leak.' },
            ],
            explanation: 'Fix the leak before paying to bring in more people: reply quickly, give the full price, sizes and delivery, and offer one easy next step.',
          },
          {
            id: 'f-channels',
            type: 'match',
            prompt: 'Match each of Neema’s channels to the stage of the journey it serves best.',
            pairs: [
              { id: 'video', left: 'Short videos of sandals being made', right: 'Notice' },
              { id: 'maps', left: 'A business profile on maps with reviews', right: 'Consider and trust' },
              { id: 'chat', left: 'WhatsApp chats with clear prices and delivery', right: 'Buy' },
              { id: 'list', left: 'An opt-in list of past customers', right: 'Return and recommend' },
            ],
            explanation: 'Channels work as a team along the journey. Choose the ones that serve the stage you most need to strengthen.',
          },
          {
            id: 'f-copy',
            type: 'choice',
            prompt: 'Which caption follows hook, benefit, proof and action best?',
            multiple: false,
            options: [
              { id: 'a', text: '“New sandals!!! DM for price.”', correct: false, feedback: 'No hook for a particular person, no benefit, no proof, and a vague ask.' },
              { id: 'b', text: '“On your feet all day? These sandals stay comfortable from morning to night. Hand-stitched in our Arusha workshop, and we repair them free for a year. Send your size on WhatsApp to order.”', correct: true },
              { id: 'c', text: '“The best sandals in Tanzania. Follow, like, share and visit us!”', correct: false, feedback: 'An unprovable claim and four different asks.' },
              { id: 'd', text: '“Buy now before they are gone forever!”', correct: false, feedback: 'Pressure with no benefit, no proof and no clear way to buy.' },
            ],
            explanation: 'Hook (on your feet all day?), benefit (comfortable from morning to night), proof (hand-stitched, free repairs) and one action (send your size).',
          },
          {
            id: 'f-ethics',
            type: 'choice',
            prompt: 'Which of these would be dishonest or disrespectful in Neema’s campaign? Select all that apply.',
            multiple: true,
            options: [
              { id: 'fake-stock', text: 'Posting “last three pairs!” every week when she has plenty', correct: true },
              { id: 'buy-list', text: 'Messaging a bought list of phone numbers', correct: true },
              { id: 'hidden', text: 'Adding a delivery charge only after the customer has paid', correct: true },
              { id: 'real-deadline', text: 'Saying the holiday price ends on a date when it really does end', correct: false, feedback: 'A real deadline is honest, useful information.' },
              { id: 'reviews', text: 'Sharing customers’ reviews in their own words, with their permission', correct: false, feedback: 'This is honest proof and respects customers.' },
            ],
            explanation: 'Ask: would the customer feel tricked or exposed if they knew everything I know? Fake scarcity, unconsented messages and hidden costs all fail that test.',
          },
          {
            id: 'f-goal',
            type: 'choice',
            prompt: 'Which is the best goal for Neema’s two-week campaign?',
            multiple: false,
            options: [
              { id: 'a', text: '“Get more followers.”', correct: false, feedback: 'Followers are not sales, and there is no number or date.' },
              { id: 'b', text: '“Sell 15 pairs to new customers by the end of the month.”', correct: true },
              { id: 'c', text: '“Post every day for two weeks.”', correct: false, feedback: 'An activity, not a result.' },
              { id: 'd', text: '“Become well known.”', correct: false, feedback: 'Impossible to measure in two weeks.' },
            ],
            explanation: 'Close to the sale, with a number and a date.',
          },
          {
            id: 'f-conversion',
            type: 'choice',
            prompt: 'Neema’s ad reached 10,000 people. 300 messaged her and 15 bought. What was her conversion rate from message to sale?',
            multiple: false,
            options: [
              { id: 'a', text: '0.15%', correct: false, feedback: 'That divides sales by reach. Conversion rate here is sales divided by messages.' },
              { id: 'b', text: '3%', correct: false, feedback: 'That is her click rate: messages divided by reach.' },
              { id: 'c', text: '5%', correct: true },
              { id: 'd', text: '20%', correct: false, feedback: 'Check the division: 15 ÷ 300.' },
            ],
            explanation: '15 ÷ 300 = 0.05, or 5%. Her click rate was 300 ÷ 10,000 = 3%. Each number points at a different stage of the journey.',
          },
          {
            id: 'f-roi',
            type: 'choice',
            prompt: 'Neema spent TSh 60,000 on the ad. Each of the 15 pairs sold for TSh 40,000 and earned her TSh 10,000 profit before advertising. What was her return on investment?',
            multiple: false,
            options: [
              { id: 'a', text: '900%', correct: false, feedback: 'That uses sales (TSh 600,000), not profit. Sales include the cost of leather, labour and delivery.' },
              { id: 'b', text: '250%', correct: false, feedback: 'That forgets to subtract the ad spend from the profit before dividing.' },
              { id: 'c', text: '150%', correct: true },
              { id: 'd', text: '25%', correct: false, feedback: 'Check: profit is 15 × 10,000 = 150,000. Subtract 60,000, then divide by 60,000.' },
            ],
            explanation: 'Profit before advertising: 15 × TSh 10,000 = TSh 150,000. Minus the TSh 60,000 spent = TSh 90,000. ROI = 90,000 ÷ 60,000 = 150%. Using sales instead of profit would have made the campaign look six times better than it was.',
          },
          {
            id: 'f-improve',
            type: 'order',
            prompt: 'Neema wants to improve her next campaign. Put these steps in a sensible order.',
            items: [
              { id: 'stage', text: 'Look at the numbers for each stage to find the biggest drop' },
              { id: 'idea', text: 'Choose one change aimed at that stage' },
              { id: 'versions', text: 'Make two versions that differ only in that change' },
              { id: 'run', text: 'Run both at the same time with a small budget cap' },
              { id: 'decide', text: 'Compare cost per result, then back the better version or try again' },
            ],
            explanation: 'Measure, find the leak, change one thing, test fairly, then decide. That loop is how small budgets become steadily better campaigns.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const digitalMarketing: CourseAuthoring = {
  slug: 'digital-marketing',
  title: 'Digital Marketing',
  subtitle: 'Reach the right people online, turn attention into customers and measure what works.',
  description:
    "Your customers are on their phones: on WhatsApp, Instagram, TikTok, Facebook and search. Digital marketing is how a small venture reaches them without a big budget, and how it learns, quickly, what actually brings people in.\n\nIn this elective you will define your target customer and value proposition, map the journey from first contact to purchase, and choose the channels that fit. You will practise writing copy that converts, using WhatsApp Business and social media for sales, the basics of search and paid advertising on a small budget, simple email and messaging campaigns, and tracking results so you spend money only on what works. You will also learn the ethics of marketing: honest claims, respect for customer data and no dark patterns.\n\nThis is a two-week, project-based elective. You will run a real, small campaign.\n\nYour Practical Output is a **Digital Marketing Campaign Plan and Results Report**: a plan for a real campaign for your venture or cause, the campaign itself, and a report on its results and what you would change.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 10,
  outcomes: [
    'Define a target customer, value proposition and customer journey.',
    'Choose digital channels that fit your audience and budget.',
    'Write marketing copy and messages that turn attention into action.',
    'Run a small campaign using social media, messaging or paid advertising.',
    'Track results, calculate basic marketing metrics and improve your campaign.',
  ],
  skills: ['Customer targeting', 'Copywriting', 'Social media marketing', 'WhatsApp commerce', 'Paid advertising', 'Marketing analytics'],
  audience: 'Founders, freelancers and changemakers who need customers, supporters or members, and anyone interested in a marketing career.',
  prerequisites: "Builder’s Architecture phase, especially Communication and Personal Branding.",
  practicalOutput: 'Digital Marketing Campaign Plan and Results Report',
  cover: {
    from: '#0A1E3D',
    to: '#4E7FD8',
    symbol: '◎',
    imageUrl: "https://images.unsplash.com/photo-1634313946117-25462979f178?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "A young man looks down at his smartphone, with a laptop showing a grid of videos on the desk behind him.",
    imageCredit: "Photo: Oyemike Princewill / Unsplash",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'XDpwDwcXGoU',
    title: "What is Digital Marketing: Tutorial for Beginners",
    channel: "HubSpot Marketing",
    durationS: 138,
  },
  instructors: [],
  modules: [moduleCustomer, moduleChannels, moduleCampaign, moduleMeasure],
};

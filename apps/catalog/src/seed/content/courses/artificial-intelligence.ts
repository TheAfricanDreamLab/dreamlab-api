import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Artificial Intelligence: one of the three Dream Lab electives (weeks 9–10, 10 credits).
 *
 * Practical, responsible use: what models are, how to instruct them, how to check them, where they
 * cause harm, and how to prototype with them. No product names or capability claims that will date.
 * Recurring cast, all fictional:
 *   Halima    an agricultural extension volunteer in Kano who wants to answer farmers’ questions faster, in Hausa
 *   Achieng   administrator at a small private clinic in Nairobi, buried in appointment messages
 *   Jean-Paul a computer science student in Kigali who builds small tools for local businesses
 *   Tunde     product manager at a Lagos fintech (from Problem Solving), now asked to “add AI” to the app
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · What AI is (week 9)
// ---------------------------------------------------------------------------

const moduleWhat: Module = {
  key: 'what-ai-is',
  title: 'What AI is, and how it learns',
  summary:
    'Cut through the hype. Learn in plain language what today’s AI systems are, how they learn from data, why they can sound confident and still be wrong, and where they tend to fail.',
  weekNo: 9,
  items: [
    {
      key: 'what-ai-is-lesson',
      type: 'lesson',
      title: 'What AI is, and what it is not',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'welcome',
            title: 'Welcome to the AI elective',
            blocks: [
              {
                id: 'welcome-text',
                type: 'text',
                body: "Welcome to the Artificial Intelligence elective.\n\nYou have probably heard two stories about AI. In one, it will solve everything. In the other, it will take every job and cannot be trusted with anything. Both stories are lazy. The truth is more useful: AI is a set of tools that are very good at some tasks, poor at others, and dangerous when used carelessly.\n\nIn the next two weeks you will learn to use these tools **well** and **responsibly**, and you will build an **AI-Assisted Solution Prototype** for the problem you have been working on in the Lab.\n\nStart with this short video. It describes AI without any mathematics.",
              },
              {
                id: 'how-ai-works-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'Ok-xpKjKp2g',
                title: 'How AI Works',
                channel: 'CodeAI',
                durationS: 90,
                caption: 'A ninety-second introduction to how AI systems work. Listen for the idea that AI learns patterns from examples rather than following rules someone wrote by hand.',
              },
              {
                id: 'welcome-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Patterns, not understanding',
                body: "Most AI you will meet today does one thing extremely well: it finds patterns in huge amounts of examples and uses them to make a prediction. Which word comes next. Which photo shows a diseased leaf. Which transaction looks like fraud.\n\nThat is powerful. It is also not the same as understanding, checking or caring whether something is true. Hold on to that idea. It explains most of what AI gets right and most of what it gets wrong.",
              },
            ],
          },
          {
            id: 'ml',
            title: 'Learning from examples',
            blocks: [
              {
                id: 'ml-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'OeU5m6vRyCk',
                title: 'AI: What is Machine Learning?',
                channel: 'CodeAI',
                durationS: 176,
                caption: 'How machine learning works: examples go in, a model learns patterns, and the model makes predictions. Notice how much depends on the examples it is given.',
              },
              {
                id: 'ml-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Artificial intelligence (AI)', definition: 'A broad name for computer systems that do tasks we usually associate with human intelligence, such as recognising images, understanding speech or writing text.' },
                  { term: 'Machine learning', definition: 'A way of building AI by showing a system many examples so it learns patterns, instead of writing every rule by hand.' },
                  { term: 'Training data', definition: 'The examples a model learns from. Its quality, coverage and fairness shape everything the model does.' },
                  { term: 'Model', definition: 'The result of training: a system that takes an input and produces a prediction or output.' },
                  { term: 'Generative AI', definition: 'Models that produce new content, such as text, images or audio, by predicting what is likely to come next.' },
                ],
              },
            ],
          },
          {
            id: 'is-it-ai',
            title: 'Which of these is AI?',
            blocks: [
              {
                id: 'is-it-ai-choice',
                type: 'choice',
                prompt: 'Which of these use machine learning, learning patterns from examples? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'leaf', text: 'A phone app that looks at a photo of a cassava leaf and suggests which disease it might have', correct: true, feedback: 'Yes. It learnt from many labelled photos of healthy and diseased leaves.' },
                  { id: 'calc', text: 'A calculator adding up a market trader’s sales', correct: false, feedback: 'No. A calculator follows fixed rules. It does not learn from examples.' },
                  { id: 'fraud', text: 'A bank system that flags unusual mobile money transfers', correct: true, feedback: 'Yes, often. Many fraud systems learn what normal and suspicious transactions look like.' },
                  { id: 'chat', text: 'A chat assistant that writes a reply to your question', correct: true, feedback: 'Yes. It learnt patterns of language from enormous amounts of text.' },
                  { id: 'timer', text: 'A timer that switches off a borehole pump after an hour', correct: false, feedback: 'No. It follows one simple rule.' },
                ],
                explanation:
                  "The test is not whether something is clever or digital. It is whether the system **learnt its behaviour from examples**. That matters because systems that learn from examples inherit the strengths and the gaps of those examples.",
              },
            ],
          },
          {
            id: 'good-at',
            title: 'Good at, bad at',
            blocks: [
              {
                id: 'good-bad-text',
                type: 'text',
                body: "As a rough guide, today’s AI tools tend to be **good at**: drafting and rewording text, summarising, translating between widely used languages, spotting patterns in large data, sorting and classifying, and generating first ideas.\n\nThey tend to be **weak at**: knowing whether something is true, recent events, exact facts and figures, local knowledge that was rare in their training data, languages with little written material online, and judgement about what is right for a particular person.",
              },
              {
                id: 'good-bad-match',
                type: 'match',
                prompt: 'Halima, an extension volunteer in Kano, is considering four uses of an AI chat assistant. Match each to the most sensible verdict.',
                pairs: [
                  { id: 'draft', left: 'Drafting a friendly reminder about a farmer training day', right: 'Good use: quick to check and low risk' },
                  { id: 'dose', left: 'Telling farmers exactly how much pesticide to mix', right: 'Risky: must be checked against an expert source' },
                  { id: 'summary', left: 'Summarising a long government report on seed subsidies', right: 'Useful, but check key facts in the original' },
                  { id: 'hausa', left: 'Writing advice directly in Hausa for farmers to act on', right: 'Check with a fluent speaker before sharing' },
                ],
                explanation:
                  "A helpful question is: **what happens if the output is wrong, and who would notice?** A clumsy reminder costs nothing. A wrong pesticide dose could harm a farmer’s health and crop. The more serious the consequence, the more checking you need.",
              },
            ],
          },
          {
            id: 'hype',
            title: 'Your starting point',
            blocks: [
              {
                id: 'hype-poll',
                type: 'poll',
                prompt: 'Which statement is closest to how you feel about AI right now?',
                options: [
                  { id: 'excited', text: 'Excited: I want to use it for everything' },
                  { id: 'curious', text: 'Curious but unsure where to start' },
                  { id: 'worried', text: 'Worried about jobs, cheating or misinformation' },
                  { id: 'sceptical', text: 'Sceptical: I think it is overhyped' },
                  { id: 'experienced', text: 'Experienced: I already use it often' },
                ],
                afterword:
                  "Every one of these is reasonable. Excitement helps you experiment, worry helps you notice risks, and scepticism helps you check. The aim of this course is to combine all three into good judgement.",
              },
            ],
          },
          {
            id: 'your-problem',
            title: 'Where could AI help you?',
            blocks: [
              {
                id: 'your-problem-reflection',
                type: 'reflection',
                prompt: 'Recall the problem you have been working on in the Lab. Describe it in two or three sentences. Then list two tasks in that problem where AI might help, and one where you think it should not be used. Why?',
                guidance: 'Think about tasks involving text, language, sorting, summarising or patterns. This starts the problem section of your prototype report.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'how-models-learn',
      type: 'lesson',
      title: 'How models learn, and why they fail',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'chatbots',
            title: 'Inside a chat assistant',
            blocks: [
              {
                id: 'chatbots-text',
                type: 'text',
                body: "The AI chat assistants many people now use are built on **large language models**. They are trained on vast amounts of text to predict what words are likely to come next. Then they are tuned to follow instructions and hold a conversation.\n\nThis video explains the idea simply. As you watch, notice what the model is actually doing when it “answers” you.",
              },
              {
                id: 'llm-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'X-AWdfSFCHQ',
                title: 'How Chatbots and Large Language Models Work',
                channel: 'CodeAI',
                durationS: 441,
                caption: 'How chatbots and large language models produce text. Watch for why a model can write fluent, confident sentences without any built-in way to check whether they are true.',
              },
            ],
          },
          {
            id: 'fluent-wrong',
            title: 'Fluent and wrong',
            blocks: [
              {
                id: 'hallucination-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Hallucination', definition: 'When an AI system produces something that sounds plausible but is false or made up: a fake statistic, a quote nobody said, a book that does not exist.' },
                  { term: 'Training cut-off', definition: 'The point after which a model has seen no information. It may not know about recent events unless it is connected to a search tool.' },
                  { term: 'Probabilistic', definition: 'The same question can produce different answers each time, because the model is choosing likely words, not looking up one stored answer.' },
                ],
              },
              {
                id: 'fluent-reveal',
                type: 'reveal',
                prompt: 'Jean-Paul asks a chat assistant for “three studies on mobile money use in rural Rwanda, with authors and years”. It gives three neat references. Why should he be careful? Think, then tap.',
                body: "Because a language model is very good at producing text that *looks like* a reference: plausible author names, a sensible year, a convincing title. That is exactly the pattern it learnt. But nothing in that process checks that the study exists.\n\nSome of the references may be real. Some may be partly real, with the wrong year or author. Some may be invented entirely. Jean-Paul must look up every one before he uses it. Fluency is not evidence.",
              },
            ],
          },
          {
            id: 'data-bias',
            title: 'You are what you eat',
            blocks: [
              {
                id: 'servers-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/BalticServers_data_center.jpg/1280px-BalticServers_data_center.jpg',
                alt: 'Rows of computer servers stacked on metal shelves in a dark room, lit by strips of bright blue light.',
                caption: 'Large models are trained on rooms full of computers like these, using data mostly gathered from the internet. What is common online shapes what the model knows; what is rare online, it may barely know at all.',
                credit: 'Photo: BalticServers.com / Wikimedia Commons, CC BY-SA 3.0',
              },
              {
                id: 'bias-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'x2mRoFNm22g',
                title: 'AI: Training Data & Bias',
                channel: 'CodeAI',
                durationS: 160,
                caption: 'How training data shapes a model’s predictions, and how biased data leads to biased decisions. Think about whose languages, faces and lives are common or rare in data gathered online.',
              },
            ],
          },
          {
            id: 'failure-modes',
            title: 'Spot the failure',
            blocks: [
              {
                id: 'failure-match',
                type: 'match',
                prompt: 'Match each situation to the failure it shows.',
                pairs: [
                  { id: 'fake-stat', left: 'An assistant gives a precise figure for Kano’s tomato harvest with no source', right: 'Hallucination' },
                  { id: 'old-news', left: 'It describes a fuel price that changed months ago', right: 'Training cut-off' },
                  { id: 'lang', left: 'Its Hausa reply mixes in odd phrases a fluent speaker would never use', right: 'Thin training data for that language' },
                  { id: 'faces', left: 'A photo tool works well on some skin tones and poorly on others', right: 'Unrepresentative training data' },
                ],
                explanation:
                  "These failures are not random bad luck. Each follows from how models are built. Once you know the pattern, you know where to look for problems before they reach the people you serve.",
              },
            ],
          },
          {
            id: 'tunde-scenario',
            title: 'Tunde is told to “add AI”',
            blocks: [
              {
                id: 'tunde-scenario-block',
                type: 'scenario',
                situation:
                  "Tunde’s CEO has read about AI and says: “Our competitors have AI. Add an AI assistant to the savings app this quarter so traders can ask it anything about their money.”\n\nTunde knows many traders use the app in Pidgin and Yoruba, and that wrong financial advice could cost them real savings.",
                prompt: 'What should Tunde do first?',
                options: [
                  {
                    id: 'ship',
                    text: 'Connect a general chat assistant to the app and launch it quickly.',
                    outcome: "Within a week the assistant confidently tells a trader that a withdrawal fee does not exist. It does. Complaints rise and the team spends weeks repairing trust.",
                    best: false,
                  },
                  {
                    id: 'narrow',
                    text: 'Ask what problem traders actually have, then test AI on one narrow, low-risk task, such as explaining the app’s own fees from a checked list, with clear limits and a route to a human.',
                    outcome: "Interviews show traders mostly get stuck on fees and failed deposits. The team tests a narrow assistant that only answers from an approved fee sheet, in plain language, and hands anything else to support staff. It helps, and nobody is misled.",
                    best: true,
                  },
                  {
                    id: 'refuse',
                    text: 'Tell the CEO AI is too dangerous and refuse to work on it.',
                    outcome: "Tunde’s concerns are fair, but refusing outright leaves him out of the decision. Someone else ships something riskier.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'risk-reflection-step',
            title: 'Your risks',
            blocks: [
              {
                id: 'risk-reflection',
                type: 'reflection',
                prompt: 'For the two tasks where AI might help with your problem, what could go wrong? Name one failure from this lesson that could happen in each, and who would be affected if it did.',
                guidance: 'Be concrete: “The model might invent a clinic opening time, and a patient would travel for nothing.” This starts the limitations section of your prototype report.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'what-quiz',
      type: 'quiz',
      title: 'Module quiz: What AI is',
      minutes: 6,
      required: true,
      gradeWeight: 8,
      payload: {
        intro: 'Five questions on how AI systems learn and where they fail. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-ml',
            type: 'choice',
            prompt: 'What makes a system “machine learning” rather than ordinary software?',
            multiple: false,
            options: [
              { id: 'a', text: 'It runs on a powerful computer', correct: false, feedback: 'Plenty of ordinary software runs on powerful computers.' },
              { id: 'b', text: 'It learns patterns from examples instead of following only hand-written rules', correct: true },
              { id: 'c', text: 'It is connected to the internet', correct: false, feedback: 'Being online has nothing to do with learning from examples.' },
              { id: 'd', text: 'It always gives the right answer', correct: false, feedback: 'Machine learning systems make mistakes, often in predictable ways.' },
            ],
            explanation: 'Machine learning means learning from examples. That is why the quality of the examples matters so much.',
          },
          {
            id: 'q-llm',
            type: 'choice',
            prompt: 'At heart, what does a large language model do when it writes a reply?',
            multiple: false,
            options: [
              { id: 'a', text: 'Looks up the correct answer in a database of facts', correct: false, feedback: 'It does not have a database of checked facts. It generates text.' },
              { id: 'b', text: 'Predicts likely next words based on patterns learnt from training text', correct: true },
              { id: 'c', text: 'Asks a human expert in the background', correct: false, feedback: 'No human writes the reply.' },
              { id: 'd', text: 'Understands the world the way a person does', correct: false, feedback: 'Its fluency can feel like understanding, but it works very differently.' },
            ],
            explanation: 'Prediction of likely text explains both its fluency and why it can be confidently wrong.',
          },
          {
            id: 'q-failures',
            type: 'match',
            prompt: 'Match each term to its meaning.',
            pairs: [
              { id: 'hallucination', left: 'Hallucination', right: 'Plausible-sounding output that is false or invented' },
              { id: 'cutoff', left: 'Training cut-off', right: 'The point after which the model saw no new information' },
              { id: 'data', left: 'Training data', right: 'The examples a model learns from' },
              { id: 'generative', left: 'Generative AI', right: 'Models that produce new text, images or audio' },
            ],
            explanation: 'These four ideas explain most of what you will see AI tools get right and wrong.',
          },
          {
            id: 'q-risk',
            type: 'choice',
            prompt: 'Which uses need the most careful checking by a qualified person? Select all that apply.',
            multiple: true,
            options: [
              { id: 'dose', text: 'Medicine or pesticide doses', correct: true },
              { id: 'legal', text: 'Advice on someone’s legal rights', correct: true },
              { id: 'money', text: 'Specific financial fees or interest rates', correct: true },
              { id: 'poster', text: 'Ideas for a colourful poster title', correct: false, feedback: 'Low risk: a weak idea is easy to spot and costs little.' },
            ],
            explanation: 'Ask what happens if it is wrong. Health, law and money mistakes can seriously harm people.',
          },
          {
            id: 'q-language',
            type: 'choice',
            prompt: 'Why might an AI tool perform worse in a language such as Hausa or Kinyarwanda than in English?',
            multiple: false,
            options: [
              { id: 'a', text: 'Those languages are harder to learn', correct: false, feedback: 'No language is inherently harder for a model. The difference is data.' },
              { id: 'b', text: 'There is often much less written text in those languages in its training data', correct: true },
              { id: 'c', text: 'AI is not allowed to use African languages', correct: false, feedback: 'There is no such rule. Many researchers are working to improve African-language AI.' },
              { id: 'd', text: 'It always performs equally well in every language', correct: false, feedback: 'Performance often varies a lot by language.' },
            ],
            explanation: 'Models reflect their data. Languages with less online text are often served less well, so check with fluent speakers.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Using AI well (week 9)
// ---------------------------------------------------------------------------

const moduleUsing: Module = {
  key: 'using-ai-well',
  title: 'Using AI well: instructions and checking',
  summary:
    'Get useful work out of AI tools by giving clear instructions with context, examples and limits, then check every output with the care its consequences deserve.',
  weekNo: 9,
  items: [
    {
      key: 'clear-instructions',
      type: 'lesson',
      title: 'Writing clear instructions',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'garbage',
            title: 'Vague in, vague out',
            blocks: [
              {
                id: 'garbage-text',
                type: 'text',
                body: "An AI assistant only knows what you tell it, plus whatever patterns it learnt in training. It does not know who you are, who your audience is, what you have already tried or what “good” looks like to you.\n\nWriting a good instruction, often called a **prompt**, is less like typing a search and more like briefing a capable new colleague who has never met your customers. The video below shows one simple formula. The tool in the title does not matter; the formula works with any AI assistant.",
              },
              {
                id: 'prompt-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'jC4v5AS4RIM',
                title: 'Master the Perfect ChatGPT Prompt Formula (in just 8 minutes)!',
                channel: 'Jeff Su',
                durationS: 510,
                caption: 'A simple formula for writing prompts. Watch for the building blocks (task, context, examples, role, format and tone) and notice which ones make the biggest difference.',
              },
            ],
          },
          {
            id: 'parts',
            title: 'Six parts of a clear brief',
            blocks: [
              {
                id: 'parts-framework',
                type: 'framework',
                title: 'A clear brief for an AI assistant',
                steps: [
                  { label: 'Task', detail: 'Say exactly what you want done, starting with a verb. Draft, summarise, translate, compare, list.' },
                  { label: 'Context', detail: 'Who it is for, why, and what matters. “For first-time patients at a small Nairobi clinic, many reading on basic phones.”' },
                  { label: 'Source', detail: 'Give it the facts to use, such as your price list or opening hours, and tell it to use only those.' },
                  { label: 'Example', detail: 'Show one example of what good looks like, if you have it.' },
                  { label: 'Format and tone', detail: 'Length, structure and voice. “Under 60 words, warm, plain English, no jargon.”' },
                  { label: 'Limits', detail: 'What it must not do. “Do not give medical advice. If unsure, say ‘please call the clinic’.”' },
                ],
              },
              {
                id: 'parts-example',
                type: 'example',
                title: 'Achieng’s prompt, before and after',
                body: "**Before:** “Write a message about appointments.”\n\n**After:** “Draft a WhatsApp reply for patients asking how to book at our clinic in Nairobi. Use only these facts: open Monday to Saturday, 8 a.m. to 6 p.m.; book by replying with your name and preferred day; consultations cost KSh 1,000. Keep it under 60 words, warm and simple, in English. Do not give medical advice. End with: ‘For emergencies, go to the nearest hospital.’”\n\nThe second version tells the assistant the task, the context, the facts to use, the format, the tone and the limits. The clinic and its prices are fictional.",
              },
            ],
          },
          {
            id: 'best-prompt',
            title: 'Pick the strongest prompt',
            blocks: [
              {
                id: 'best-prompt-choice',
                type: 'choice',
                prompt: 'Halima wants help explaining safe storage of maize to farmers. Which prompt is strongest?',
                multiple: false,
                options: [
                  { id: 'a', text: '“Tell me about maize.”', correct: false, feedback: 'Far too vague. The assistant has to guess the task, audience and format.' },
                  { id: 'b', text: '“Write the best possible guide to maize storage.”', correct: false, feedback: '“Best possible” is not a brief. For whom? How long? Based on what?' },
                  {
                    id: 'c',
                    text: '“Using only the attached extension leaflet, draft five short, plain-language tips on storing maize to prevent mould, for smallholder farmers in Kano with little formal schooling. One sentence each. Do not add facts that are not in the leaflet.”',
                    correct: true,
                    feedback: 'Yes. Task, source, audience, format and a clear limit. Halima can now check each tip against the leaflet.',
                  },
                  { id: 'd', text: '“You are the world’s greatest agricultural scientist. Answer everything about maize.”', correct: false, feedback: 'Giving the assistant a grand role does not give it reliable facts. It still needs a task, a source and limits.' },
                ],
                explanation:
                  "Notice the phrase **“using only the attached leaflet”**. Giving the assistant a trusted source, and telling it to stick to that source, is one of the most effective ways to reduce made-up content. It also makes checking easy.",
              },
            ],
          },
          {
            id: 'iterate',
            title: 'Iterate, do not settle',
            blocks: [
              {
                id: 'iterate-text',
                type: 'text',
                body: "Your first prompt rarely gives your best result. Treat it as a conversation: read the output, say what to change, and try again.\n\nUseful follow-ups: “Shorter, and simpler words.” “Ask me three questions before you answer.” “Give me three different versions.” “What assumptions did you make?” “Which parts are you least sure about?”",
              },
              {
                id: 'iterate-order',
                type: 'order',
                prompt: 'Put Jean-Paul’s workflow for getting a useful product description in a sensible order.',
                items: [
                  { id: 'goal', text: 'Decide what a good result looks like and who it is for' },
                  { id: 'brief', text: 'Write a brief with task, context, facts, format and limits' },
                  { id: 'read', text: 'Read the output carefully' },
                  { id: 'refine', text: 'Ask for specific changes and try again' },
                  { id: 'check', text: 'Check every fact against the source' },
                  { id: 'own', text: 'Edit it into his own words and take responsibility for it' },
                ],
                explanation:
                  "The last step matters most. When you publish or send something an AI helped draft, **it is yours**. Your name, your reputation and your responsibility. The assistant cannot be held accountable; you can.",
              },
            ],
          },
          {
            id: 'privacy-first',
            title: 'What not to paste',
            blocks: [
              {
                id: 'privacy-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Before you paste anything',
                body: "Many AI tools may store what you type, and some use it to improve their systems. Read the tool’s data settings, and by default **do not paste**:\n\n- people’s names, phone numbers, ID numbers or addresses;\n- health, financial or legal details about real people;\n- passwords, keys or private business documents;\n- anything you were told in confidence.\n\nRemove or replace personal details first: “Patient A, aged 30s” instead of a name.",
              },
              {
                id: 'comfort-scale',
                type: 'scale',
                prompt: 'How confident are you right now at writing a prompt that gets a useful result first or second time?',
                minLabel: 'Not at all',
                maxLabel: 'Very confident',
                afterword:
                  "Prompting is a skill that improves fast with deliberate practice. Keep a note of prompts that worked well. Many experienced users keep a small library of their best briefs and reuse them.",
              },
            ],
          },
          {
            id: 'your-prompt',
            title: 'Write your brief',
            blocks: [
              {
                id: 'your-prompt-reflection',
                type: 'reflection',
                prompt: 'Choose one task from your problem where AI might help. Write a full brief for it using the six parts: task, context, source, example, format and tone, limits. Try it with an AI assistant, then improve it twice. Paste your final prompt and describe what changed.',
                guidance: 'Remove any personal details before you try it. Keep your best prompt: it may become part of your prototype.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'checking-output',
      type: 'lesson',
      title: 'Checking what AI gives you',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'verify-intro',
            title: 'Trust, but verify',
            blocks: [
              {
                id: 'verify-text',
                type: 'text',
                body: "Using AI well is half instruction, half inspection. Because models can be fluent and wrong at the same time, **checking is not optional**. It is part of the work.\n\nThis short video from a university library shows practical ways to fact-check AI tools. The same habits will serve you for any information, not only AI.",
              },
              {
                id: 'factcheck-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'imBL73lFwbk',
                title: 'How to Fact-Check ChatGPT and Other AI Tools',
                channel: 'UDC Library',
                durationS: 368,
                caption: 'A librarian’s guide to checking what AI tools tell you. Watch for “lateral reading”: leaving the answer and checking claims against other trusted sources.',
              },
            ],
          },
          {
            id: 'check-framework',
            title: 'A checking routine',
            blocks: [
              {
                id: 'check-steps',
                type: 'framework',
                title: 'Check before you use',
                steps: [
                  { label: 'Stakes', detail: 'Ask what happens if this is wrong, and to whom. Higher stakes mean more checking.' },
                  { label: 'Facts', detail: 'Underline every name, number, date, quote and reference. Check each against a trusted source.' },
                  { label: 'Sources', detail: 'Open any cited source. Does it exist? Does it actually say that?' },
                  { label: 'Fit', detail: 'Is it right for your audience, place and language? Would a local expert agree?' },
                  { label: 'Tests', detail: 'For tools you build, try many realistic inputs, including tricky ones, and record what happens.' },
                  { label: 'Human', detail: 'For health, money, legal or safety content, have a qualified person review it.' },
                ],
              },
            ],
          },
          {
            id: 'spot-problems',
            title: 'Spot the problems',
            blocks: [
              {
                id: 'mpesa-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg/1280px-M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg',
                alt: 'A customer stands at the barred counter of a small, brightly painted shop with M-PESA and Equity Agent signs, while a person inside smiles from behind the counter.',
                caption: 'A mobile money agent in Nairobi. Fees, limits and rules differ by provider and change over time: exactly the kind of detail AI tools often get wrong.',
                credit: 'Photo: Fiona Graham / Wikimedia Commons, CC BY-SA 2.0',
              },
              {
                id: 'spot-example',
                type: 'example',
                title: 'An AI draft for Tunde’s app',
                body: "Tunde asked an assistant to explain withdrawal fees to traders. It replied:\n\n“Great news! Withdrawals are always free for amounts under ₦50,000. According to a 2023 Central Bank study, 87% of traders prefer digital savings. Simply visit any agent and show your BVN to withdraw instantly.”\n\nThe app, the fee rule and the reply are fictional.",
              },
              {
                id: 'spot-choice',
                type: 'choice',
                prompt: 'Which parts of this reply must Tunde check before anything reaches a customer? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'fee', text: 'The claim that withdrawals under ₦50,000 are always free', correct: true, feedback: 'Yes. A specific fee rule must match the company’s actual price list.' },
                  { id: 'stat', text: 'The “2023 Central Bank study” and the 87% figure', correct: true, feedback: 'Yes. A precise statistic with a vague source is a classic sign of invented content. Find it or remove it.' },
                  { id: 'process', text: 'The instruction to show a BVN at any agent to withdraw instantly', correct: true, feedback: 'Yes. A wrong process could send customers to the wrong place or expose personal details.' },
                  { id: 'tone', text: 'The friendly tone of “Great news!”', correct: false, feedback: 'Tone is a matter of taste, not fact. Adjust it if you like, but it is not a risk.' },
                ],
                explanation:
                  "Every **number**, **source** and **instruction** is a claim to check. Notice how confident the draft sounds. Confidence is a feature of the writing style, not a sign of accuracy.",
              },
            ],
          },
          {
            id: 'lateral',
            title: 'Checking a reference',
            blocks: [
              {
                id: 'lateral-scenario',
                type: 'scenario',
                situation:
                  "Jean-Paul is writing a short report for a Kigali cooperative. An assistant tells him that “a 2021 University of Rwanda study found that cooperatives using digital records increased income by 40%”, and gives a title and author.",
                prompt: 'What should Jean-Paul do?',
                options: [
                  {
                    id: 'use',
                    text: 'Use it. It has an author and a title, so it must be real.',
                    outcome: "The cooperative’s chair searches for the study before a funding meeting and cannot find it. Jean-Paul’s credibility, and the report’s, suffer.",
                    best: false,
                  },
                  {
                    id: 'ask-ai',
                    text: 'Ask the same assistant: “Is that study real?”',
                    outcome: "The assistant says yes and adds more detail. But asking the tool that may have invented a claim is not a check. It can confidently repeat the error.",
                    best: false,
                  },
                  {
                    id: 'search',
                    text: 'Search for the study himself in a library database or the university’s website; if he cannot find it, leave the claim out.',
                    outcome: "He finds no such study. He finds a different, real report on digital records with more modest findings, reads it, and cites that instead. His report is weaker in drama and far stronger in trust.",
                    best: true,
                  },
                ],
              },
            ],
          },
          {
            id: 'how-often',
            title: 'Your habits',
            blocks: [
              {
                id: 'habits-poll',
                type: 'poll',
                prompt: 'Be honest. When you have used AI tools before, how often did you check the facts in the output?',
                options: [
                  { id: 'never', text: 'Almost never' },
                  { id: 'sometimes', text: 'Sometimes, when something looked odd' },
                  { id: 'important', text: 'Usually, for anything important' },
                  { id: 'always', text: 'Always' },
                  { id: 'new', text: 'I have hardly used AI tools yet' },
                ],
                afterword:
                  "Most people check less than they think they should. A good rule for the rest of this course: **check every fact that someone could act on**. It gets quicker with practice.",
              },
            ],
          },
          {
            id: 'your-check',
            title: 'Check your own output',
            blocks: [
              {
                id: 'check-reflection',
                type: 'reflection',
                prompt: 'Take the output from the brief you wrote in the last lesson. Apply the checking routine. What did you find that was wrong, missing, invented or unsuitable for your audience? What did you change?',
                guidance: 'If you found nothing, look again at every number, name and instruction, and ask someone from your audience to read it. This starts the testing section of your prototype report.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'ai-experiment-discussion',
      type: 'discussion',
      title: 'Discussion: my best and worst AI result',
      minutes: 12,
      required: true,
      payload: {
        prompt:
          "Share one experiment from this module.\n\n1. The task you gave an AI assistant, and your final prompt (with any personal details removed).\n2. One thing it did well.\n3. One thing it got wrong, invented or handled badly, and how you caught it.\n\nThen reply to at least two classmates. Suggest one improvement to their prompt, or one more check they should make before relying on the output.",
        guidance: 'Never post real people’s personal information, even as an example. Be specific: “Try giving it your price list and telling it to use only that” helps more than “nice prompt”.',
        minWords: 70,
      },
    },
    {
      key: 'using-quiz',
      type: 'quiz',
      title: 'Module quiz: Using AI well',
      minutes: 6,
      required: true,
      gradeWeight: 8,
      payload: {
        intro: 'Six questions on instructions, iteration, privacy and checking. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-brief-parts',
            type: 'choice',
            prompt: 'Which belong in a clear brief for an AI assistant? Select all that apply.',
            multiple: true,
            options: [
              { id: 'task', text: 'The task, starting with a verb', correct: true },
              { id: 'context', text: 'Who it is for and why', correct: true },
              { id: 'limits', text: 'What it must not do', correct: true },
              { id: 'flattery', text: 'Praise for the assistant so it tries harder', correct: false, feedback: 'Flattery is not a substitute for clear task, context, source and limits.' },
            ],
            explanation: 'Task, context, source, example, format and tone, and limits.',
          },
          {
            id: 'q-source',
            type: 'choice',
            prompt: 'What is one of the most effective ways to reduce invented facts in an AI draft?',
            multiple: false,
            options: [
              { id: 'a', text: 'Ask it to be very accurate', correct: false, feedback: 'Asking for accuracy does not give it the facts.' },
              { id: 'b', text: 'Give it a trusted source and tell it to use only that source', correct: true },
              { id: 'c', text: 'Make the prompt as short as possible', correct: false, feedback: 'Short prompts leave more for the model to guess.' },
              { id: 'd', text: 'Ask it the same question until the answer looks right', correct: false, feedback: 'Repeating does not verify anything.' },
            ],
            explanation: 'Grounding the assistant in your own checked material makes both the output and your checking more reliable.',
          },
          {
            id: 'q-paste',
            type: 'choice',
            prompt: 'Achieng wants help summarising a patient complaint. What should she do first?',
            multiple: false,
            options: [
              { id: 'a', text: 'Paste the full complaint, including the patient’s name and diagnosis', correct: false, feedback: 'That shares sensitive health information with a tool that may store it.' },
              { id: 'b', text: 'Remove or replace the name and any health details, then paste only what is needed', correct: true },
              { id: 'c', text: 'Ask the patient to use the AI tool themselves', correct: false, feedback: 'That passes the problem on, without solving the privacy risk.' },
              { id: 'd', text: 'Post it in a group chat for colleagues to summarise', correct: false, feedback: 'That spreads private information further.' },
            ],
            explanation: 'Remove personal details before pasting. Health, money and legal details about real people need special care.',
          },
          {
            id: 'q-check-order',
            type: 'order',
            prompt: 'Put the checking routine in order.',
            items: [
              { id: 'stakes', text: 'Ask what happens if it is wrong' },
              { id: 'facts', text: 'Underline names, numbers, dates and references' },
              { id: 'sources', text: 'Check each against trusted sources' },
              { id: 'fit', text: 'Check it fits your audience, place and language' },
              { id: 'human', text: 'Get expert review for high-stakes content' },
            ],
            explanation: 'Start from the stakes: they tell you how much of the rest you need.',
          },
          {
            id: 'q-verify-self',
            type: 'choice',
            prompt: 'An assistant gives you a statistic. Why is asking the same assistant “Is that true?” not enough?',
            multiple: false,
            options: [
              { id: 'a', text: 'Because it may confidently repeat or elaborate on its own error', correct: true },
              { id: 'b', text: 'Because it is rude to question it', correct: false, feedback: 'It is not rude. It is just not a reliable check.' },
              { id: 'c', text: 'Because it will always say no', correct: false, feedback: 'It may well say yes, which is the problem.' },
              { id: 'd', text: 'Because statistics are never wrong', correct: false, feedback: 'Statistics are often wrong or misused, especially without a source.' },
            ],
            explanation: 'Check against independent, trusted sources. Lateral reading beats asking the same tool twice.',
          },
          {
            id: 'q-responsibility',
            type: 'choice',
            prompt: 'You send a client a report an AI helped you draft, and it contains an error. Who is responsible?',
            multiple: false,
            options: [
              { id: 'a', text: 'The AI tool', correct: false, feedback: 'A tool cannot be accountable to your client.' },
              { id: 'b', text: 'The company that made the tool', correct: false, feedback: 'They did not choose to send it to your client. You did.' },
              { id: 'c', text: 'You', correct: true },
              { id: 'd', text: 'Nobody, because AI makes mistakes', correct: false, feedback: 'Knowing AI makes mistakes is exactly why the responsibility to check is yours.' },
            ],
            explanation: 'If it goes out under your name, it is yours. That is why checking is part of the job.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Responsible AI in African contexts (week 10)
// ---------------------------------------------------------------------------

const moduleResponsible: Module = {
  key: 'responsible-ai',
  title: 'Responsible AI in African contexts',
  summary:
    'Look at where AI is genuinely useful across the continent and where it causes harm: local languages, agriculture, health, finance and work. Learn to assess any AI idea for bias, privacy and data rights.',
  weekNo: 10,
  items: [
    {
      key: 'ai-in-context',
      type: 'lesson',
      title: 'AI in African contexts, and the future of work',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'farms',
            title: 'Built for real needs',
            blocks: [
              {
                id: 'farms-text',
                type: 'text',
                body: "The most useful AI projects rarely start with the technology. They start with a real need, real users and real constraints: basic phones, patchy data, many languages, little money to spare.\n\nWatch this short news report from Kenya. Notice what the builders chose to focus on, and what they did not try to do.",
              },
              {
                id: 'farms-video',
                type: 'video',
                provider: 'youtube',
                videoId: '03ptRLlEHl4',
                title: "Kenya's AI-powered farms: Farmers use technology to tackle challenges",
                channel: 'Al Jazeera English',
                durationS: 183,
                caption: 'A news report on smaller Kenyan companies building practical AI tools for farmers. Watch for how they tailor tools to farmers’ real needs rather than chasing grand promises.',
              },
            ],
          },
          {
            id: 'where-useful',
            title: 'Promising and risky',
            blocks: [
              {
                id: 'farmer-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/DSC7192_%285154975822%29.jpg/1280px-DSC7192_%285154975822%29.jpg',
                alt: 'A smiling person in a patterned headscarf talks on a mobile phone in a green, freshly planted field, while three people work the crops behind them under a cloudy blue sky.',
                caption: 'A farmer on the phone in a field in Kenya. Any AI tool for farmers has to work for people like this: on a phone, outdoors, in their own language, with advice they can trust.',
                credit: 'Photo: Neil Palmer, CIAT / Wikimedia Commons, CC BY-SA 2.0',
              },
              {
                id: 'uses-text',
                type: 'text',
                body: "Across the continent, people are exploring AI for:\n\n- **Languages**: translation, speech recognition and voice services in African languages, often led by African researchers building the datasets that were missing.\n- **Agriculture**: identifying crop diseases from photos, advice by text or voice, and weather-linked planning.\n- **Health**: helping health workers triage, read scans or manage records, always with clinicians in charge.\n- **Finance**: fraud detection, credit decisions and customer support.\n- **Education**: practice questions, feedback and tutoring support.\n\nEach area has real promise, and each carries real risk if the tool is wrong, biased or careless with data.",
              },
            ],
          },
          {
            id: 'risk-match',
            title: 'Match the risk',
            blocks: [
              {
                id: 'risk-match-block',
                type: 'match',
                prompt: 'Match each use of AI to the risk you would check first.',
                pairs: [
                  { id: 'credit', left: 'Deciding who gets a small business loan', right: 'Unfair rejections of groups under-represented in past data' },
                  { id: 'triage', left: 'Suggesting which patients a clinic should see first', right: 'A missed urgent case causing serious harm' },
                  { id: 'voice', left: 'A voice service answering questions in Kinyarwanda', right: 'Misunderstanding accents or dialects' },
                  { id: 'records', left: 'Analysing a school’s records of pupils’ results', right: 'Exposing children’s personal data' },
                ],
                explanation:
                  "Every use has a different main risk. Before you build or adopt any AI tool, name the most serious way it could fail **and who would carry the cost**. Usually it is not the builder.",
              },
            ],
          },
          {
            id: 'jobs',
            title: 'AI and work',
            blocks: [
              {
                id: 'jobs-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'J-sMqnzHwI0',
                title: 'AI won’t steal your job: Andrew Ng interview | The Economist',
                channel: 'The Economist',
                durationS: 427,
                caption: 'An AI researcher’s view of how AI changes work. Listen for the difference between automating whole jobs and automating some tasks within jobs, and form your own view: you do not have to agree.',
              },
              {
                id: 'jobs-reveal',
                type: 'reveal',
                prompt: 'Achieng spends most of her day answering the same appointment questions. If an AI tool handled those, would her job disappear? Think, then tap.',
                body: "Probably not. Some **tasks** would change: fewer repetitive replies. But her **job** also includes judgement, calming anxious patients, spotting urgent cases, coordinating doctors and fixing problems nobody planned for.\n\nThe honest picture is mixed. Some roles will shrink, some will change, and new ones will appear. People who understand both their work and the tools are best placed to shape how that happens, instead of having it happen to them.",
              },
            ],
          },
          {
            id: 'future-scale',
            title: 'How do you feel?',
            blocks: [
              {
                id: 'future-scale-block',
                type: 'scale',
                prompt: 'How prepared do you feel for the ways AI might change the work you want to do?',
                minLabel: 'Not prepared at all',
                maxLabel: 'Very prepared',
                afterword:
                  "Preparation is not about predicting the future. It is about building skills that stay valuable: understanding problems, judging quality, working with people and learning new tools quickly. You are practising all four in this Lab.",
              },
            ],
          },
          {
            id: 'your-context',
            title: 'Your context',
            blocks: [
              {
                id: 'context-reflection',
                type: 'reflection',
                prompt: 'For your problem, who would use an AI-assisted solution, and in what conditions: which language, which device, how much data, how much trust in technology? What is the most serious way it could fail, and who would carry the cost?',
                guidance: 'Be specific about your users. This becomes the users and risks sections of your prototype report.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'bias-privacy-rights',
      type: 'lesson',
      title: 'Bias, privacy and data rights',
      minutes: 16,
      required: true,
      payload: {
        steps: [
          {
            id: 'coded-gaze',
            title: 'When the machine does not see you',
            blocks: [
              {
                id: 'coded-gaze-text',
                type: 'text',
                body: "AI systems learn from data, and data reflects who was counted, photographed, recorded and written about. When some groups are missing or misrepresented, the system works worse for them, sometimes without anyone noticing.\n\nIn this TED talk, computer scientist Joy Buolamwini describes discovering that facial analysis software did not detect her face, and what she did about it.",
              },
              {
                id: 'bias-ted-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'UG_X_7g63rY',
                title: "How I'm fighting bias in algorithms | Joy Buolamwini",
                channel: 'TED',
                durationS: 524,
                caption: 'Joy Buolamwini on what she calls the “coded gaze”. Watch for how bias enters through training data, and why the people building systems need to test them on everyone they will affect.',
              },
            ],
          },
          {
            id: 'bias-sources',
            title: 'Where bias comes from',
            blocks: [
              {
                id: 'bias-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Unrepresentative data', definition: 'Training examples that leave out or under-count some groups, places or languages.' },
                  { term: 'Historical bias', definition: 'Data that faithfully records an unfair past, such as who was given loans, so the model learns to repeat it.' },
                  { term: 'Proxy', definition: 'A feature that stands in for a sensitive one. A neighbourhood or a phone type can quietly stand in for income or ethnicity.' },
                  { term: 'Data rights', definition: 'People’s rights over information about them: to know it is collected, to agree, to see it, correct it and have it deleted. Many African countries have data protection laws setting out such rights.' },
                  { term: 'Consent', definition: 'Clear, informed agreement to collect and use someone’s data for a stated purpose, which they can withdraw.' },
                ],
              },
              {
                id: 'bias-choice',
                type: 'choice',
                prompt: 'Tunde’s team wants to train a model to decide loan limits using the last five years of the company’s lending data. Which are real risks? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'history', text: 'If past decisions were unfair to some groups, the model may learn to repeat them', correct: true, feedback: 'Yes. That is historical bias.' },
                  { id: 'missing', text: 'Traders who never borrowed before are missing from the data, so the model may treat them poorly', correct: true, feedback: 'Yes. Absence from the data is a form of unrepresentative data.' },
                  { id: 'proxy', text: 'Features like neighbourhood or phone model could act as proxies for income or ethnicity', correct: true, feedback: 'Yes. Removing a sensitive field does not remove its proxies.' },
                  { id: 'none', text: 'There is no risk because a computer is neutral', correct: false, feedback: 'A model is only as fair as its data and design. “The computer decided” is not a defence.' },
                ],
                explanation:
                  "Bias is rarely one person’s prejudice written into code. It usually enters quietly through data and design choices. That is why fairness has to be **tested**, not assumed: check results for different groups before and after launch.",
              },
            ],
          },
          {
            id: 'privacy-scenario-step',
            title: 'Achieng’s shortcut',
            blocks: [
              {
                id: 'privacy-scenario',
                type: 'scenario',
                situation:
                  "Achieng finds a free online AI tool that can sort the clinic’s messages by urgency. To test it, she plans to upload last month’s full WhatsApp export: about 2,000 messages with patients’ names, phone numbers and symptoms. The clinic owner says: “Just try it, it’s free.” The numbers are fictional.",
                prompt: 'What should Achieng do?',
                options: [
                  {
                    id: 'upload',
                    text: 'Upload the full export. It is only a test.',
                    outcome: "Patients’ health information is now on a third-party service whose storage and use she does not know. If it leaks or is reused, the clinic may have broken patients’ trust and the law. A test does not make this safe.",
                    best: false,
                  },
                  {
                    id: 'synthetic',
                    text: 'Test with realistic but made-up messages, read the tool’s data terms, and only consider real data with the owner’s approval, patients’ consent where needed, and personal details removed.',
                    outcome: "The made-up messages show the tool misjudges some urgent symptoms, so it is not ready anyway. Achieng has learnt that without risking anyone’s privacy, and she now has a sensible process for any future tool.",
                    best: true,
                  },
                  {
                    id: 'names',
                    text: 'Remove the names but keep phone numbers and symptoms.',
                    outcome: "Phone numbers still identify people, and symptoms are sensitive health data. Partial anonymisation can give a false sense of safety.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'assess',
            title: 'Five questions for any AI idea',
            blocks: [
              {
                id: 'assess-framework',
                type: 'framework',
                title: 'A responsible AI check',
                steps: [
                  { label: 'Purpose', detail: 'What problem does it solve, for whom? Would a simpler, non-AI solution do?' },
                  { label: 'Harm', detail: 'What is the worst realistic failure, and who carries the cost?' },
                  { label: 'Fairness', detail: 'Does it work equally well for different groups, languages and places? How have you tested that?' },
                  { label: 'Data', detail: 'What data does it use? Was it collected with consent? Where is it stored, and who can see it?' },
                  { label: 'Control', detail: 'Can people understand, question and override its decisions? Is there a human to turn to?' },
                ],
              },
              {
                id: 'simpler-callout',
                type: 'callout',
                tone: 'tip',
                title: 'Sometimes the answer is no AI',
                body: "A clear printed price list, a well-organised spreadsheet or a simple form often beats an AI tool. Using AI should be a choice you can justify, not a badge you add because it sounds modern.",
              },
            ],
          },
          {
            id: 'your-assessment',
            title: 'Assess your idea',
            blocks: [
              {
                id: 'assessment-reflection',
                type: 'reflection',
                prompt: 'Apply the five questions (purpose, harm, fairness, data, control) to your AI idea. Answer each in one or two sentences. What will you change in your design because of this check?',
                guidance: 'Honesty scores higher than optimism. This becomes the ethical risks section of your prototype report.',
                minWords: 70,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'ai-risk-discussion',
      type: 'discussion',
      title: 'Discussion: an AI use worth debating',
      minutes: 12,
      required: true,
      payload: {
        prompt:
          "Describe one real or proposed use of AI in your country or community: in a bank, school, hospital, farm, government service, newsroom or app you use.\n\n1. What does it do, and who benefits?\n2. Using the five-question check, what is its biggest risk?\n3. What one safeguard would make you more comfortable with it?\n\nThen reply to at least two classmates. Do you agree with their biggest risk? Is there a group they have not considered?",
        guidance: 'Describe what you know and say where you learnt it. Avoid naming private individuals. Disagree with ideas, not people.',
        minWords: 80,
      },
    },
    {
      key: 'responsible-quiz',
      type: 'quiz',
      title: 'Module quiz: Responsible AI',
      minutes: 6,
      required: true,
      gradeWeight: 7,
      payload: {
        intro: 'Five questions on bias, privacy, data rights and AI in context. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-bias-terms',
            type: 'match',
            prompt: 'Match each term to its meaning.',
            pairs: [
              { id: 'unrep', left: 'Unrepresentative data', right: 'Training data that leaves out or under-counts some groups' },
              { id: 'historical', left: 'Historical bias', right: 'Data that records an unfair past so the model repeats it' },
              { id: 'proxy', left: 'Proxy', right: 'A feature that quietly stands in for a sensitive one' },
              { id: 'consent', left: 'Consent', right: 'Informed agreement to use someone’s data, which they can withdraw' },
            ],
            explanation: 'Knowing how bias enters tells you where to test for it.',
          },
          {
            id: 'q-neutral',
            type: 'choice',
            prompt: 'A manager says: “The model decided, so it can’t be biased.” What is the best reply?',
            multiple: false,
            options: [
              { id: 'a', text: '“True, computers are neutral.”', correct: false, feedback: 'Models learn from human data and human design choices.' },
              { id: 'b', text: '“The model learnt from our past data and choices, so we need to test its results for different groups.”', correct: true },
              { id: 'c', text: '“Bias only matters if someone complains.”', correct: false, feedback: 'Many people affected by bias never know why they were refused.' },
              { id: 'd', text: '“Let’s remove the gender field, then it is fair.”', correct: false, feedback: 'Other fields can act as proxies. Fairness must be tested, not assumed.' },
            ],
            explanation: 'Fairness is tested, not assumed. And people remain responsible for decisions made with AI.',
          },
          {
            id: 'q-privacy',
            type: 'choice',
            prompt: 'You want to test an online AI tool on your organisation’s customer messages. What is the safest first step?',
            multiple: false,
            options: [
              { id: 'a', text: 'Upload real messages, since it is only a test', correct: false, feedback: 'A test still sends real people’s data to a third party.' },
              { id: 'b', text: 'Test with realistic made-up messages and read the tool’s data terms', correct: true },
              { id: 'c', text: 'Remove names but keep phone numbers', correct: false, feedback: 'Phone numbers still identify people.' },
              { id: 'd', text: 'Ask a friend to upload them instead', correct: false, feedback: 'That moves the risk, it does not remove it.' },
            ],
            explanation: 'Made-up test data lets you learn what a tool does without risking anyone’s privacy.',
          },
          {
            id: 'q-five',
            type: 'order',
            prompt: 'Put the responsible AI check in the order taught.',
            items: [
              { id: 'purpose', text: 'Purpose' },
              { id: 'harm', text: 'Harm' },
              { id: 'fairness', text: 'Fairness' },
              { id: 'data', text: 'Data' },
              { id: 'control', text: 'Control' },
            ],
            explanation: 'Start with purpose: if a simpler solution would do, you may not need AI at all.',
          },
          {
            id: 'q-jobs',
            type: 'choice',
            prompt: 'Which statement best reflects how AI tends to affect work?',
            multiple: false,
            options: [
              { id: 'a', text: 'It will replace every job within a few years', correct: false, feedback: 'This overstates what current tools can do.' },
              { id: 'b', text: 'It changes some tasks within many jobs, shrinks some roles and creates others', correct: true },
              { id: 'c', text: 'It will have no effect on work', correct: false, feedback: 'It is already changing some tasks.' },
              { id: 'd', text: 'It only affects people in technology jobs', correct: false, feedback: 'Tasks involving text, sorting and routine decisions exist in many fields.' },
            ],
            explanation: 'Think in tasks, not just jobs. People who understand both their work and the tools can shape the change.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 4 · Build and test a prototype (week 10)
// ---------------------------------------------------------------------------

const prototypeTemplate = [
  'AI-ASSISTED SOLUTION PROTOTYPE',
  '',
  '1. The problem',
  'The problem you are addressing, who has it and why it matters, in three sentences or fewer.',
  '',
  '2. Users and context',
  'Who will use the prototype, on what device, in which language, with how much data and trust in technology.',
  '',
  '3. What the prototype does',
  'The task AI performs and the steps a user goes through. Include your final prompt or a link, screenshots or a diagram of the workflow. Say where a human checks or decides.',
  '',
  '4. Why AI, and why not something simpler',
  'What AI adds here, and the simpler alternatives you considered.',
  '',
  '5. How you tested it',
  'Your test cases (at least ten, including tricky ones), who tested it, what you measured and what you found. A simple results table is ideal.',
  '',
  '6. Limitations',
  'Where it fails or is weak, with examples from your tests. What it must never be used for.',
  '',
  '7. Ethical risks and safeguards',
  'Your answers to the five-question check (purpose, harm, fairness, data, control) and the safeguards you built in.',
  '',
  '8. Next steps',
  'What you would change next, and what you would need to test it with more people.',
].join('\n');

const moduleBuild: Module = {
  key: 'build-and-test',
  title: 'Build and test an AI-assisted prototype',
  summary:
    'Turn your idea into a small, working prototype or detailed workflow, test it with realistic cases and real people, and document honestly what it can and cannot do.',
  weekNo: 10,
  items: [
    {
      key: 'prototype-and-test',
      type: 'lesson',
      title: 'Prototype and test an AI-assisted solution',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'prototype-intro',
            title: 'Build to learn',
            blocks: [
              {
                id: 'prototype-text',
                type: 'text',
                body: "A prototype is not a finished product. It is the quickest, cheapest thing you can build that lets you **learn whether your idea works** for real people.\n\nYou do not need to code. Many useful AI prototypes are a well-tested prompt, a simple form, a shared spreadsheet and a human who checks the output. In this talk, a product designer shows how fast, rough prototypes taught his team more in days than planning did in months.",
              },
              {
                id: 'prototype-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'd5_h1VuwD6g',
                title: 'Rapid prototyping Google Glass - Tom Chi',
                channel: 'TED-Ed',
                durationS: 489,
                caption: 'A designer on building rough prototypes in hours, not months. Ignore the specific gadget; watch for the mindset of building something crude, testing it immediately and learning from what happens.',
              },
            ],
          },
          {
            id: 'prototype-types',
            title: 'Four kinds of AI prototype',
            blocks: [
              {
                id: 'types-framework',
                type: 'framework',
                title: 'Prototypes you can build without code',
                steps: [
                  { label: 'Prompt kit', detail: 'A tested prompt, plus instructions, that anyone on a team can use for one task. Example: drafting appointment replies from the clinic’s fact sheet.' },
                  { label: 'Human-in-the-loop workflow', detail: 'AI drafts, a person checks and sends. Example: a volunteer uses AI to draft answers to farmers’ questions, then a trained adviser approves them.' },
                  { label: 'Form plus AI', detail: 'Users fill in a simple form; the answers go to an AI step; a person reviews the result. Many no-code tools can connect these.' },
                  { label: 'Wizard of Oz', detail: 'Users interact with what looks like an automated service, while a person quietly does or checks the work behind it. You learn what users need before building anything.' },
                ],
              },
              {
                id: 'team-image',
                type: 'image',
                url: 'https://images.unsplash.com/photo-1653566031535-bcf33e1c2893?auto=format&fit=crop&w=1200&q=70',
                alt: 'Three people talk around a white meeting table with laptops and a tablet, one listening with a hand at their chin.',
                caption: 'Most prototypes are built and tested by small teams talking through what they have learnt.',
                credit: 'Photo: UK Black Tech / Unsplash',
              },
              {
                id: 'types-poll',
                type: 'poll',
                prompt: 'Which kind of prototype fits your idea best?',
                options: [
                  { id: 'prompt-kit', text: 'Prompt kit' },
                  { id: 'hitl', text: 'Human-in-the-loop workflow' },
                  { id: 'form', text: 'Form plus AI' },
                  { id: 'wizard', text: 'Wizard of Oz' },
                  { id: 'code', text: 'I will write some code' },
                ],
                afterword:
                  "Human-in-the-loop designs are popular for good reason: they let you get value from AI while a person catches its mistakes. For anything touching health, money or safety, that is the responsible place to start.",
              },
            ],
          },
          {
            id: 'wizard',
            title: 'Test before you build',
            blocks: [
              {
                id: 'wizard-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'uKMYf-UdRio',
                title: 'Wizard of Oz Method in UX',
                channel: 'NNgroup',
                durationS: 199,
                caption: 'How to test an “intelligent” system before it exists, with a person playing the system’s part. Think about how you could test your idea this way this week.',
              },
              {
                id: 'halima-example',
                type: 'example',
                title: 'Halima’s prototype',
                body: "Halima sets up a WhatsApp number for farmers in two villages. Farmers send questions by voice note or text, in Hausa.\n\n1. A volunteer types each question into an AI assistant, using a tested prompt that tells it to answer only from the state extension leaflets she provides.\n2. The volunteer checks the draft against the leaflet and rewrites it in plain Hausa.\n3. For anything about chemicals, doses or animal health, the volunteer forwards the question to a trained extension officer instead.\n4. The reply goes back to the farmer within a day, and every question and answer is logged in a spreadsheet.\n\nAfter two weeks, the log shows which questions come up most, where the AI drafts were wrong, and how long replies took. Everything here is fictional.",
              },
            ],
          },
          {
            id: 'test-cases',
            title: 'Good test cases',
            blocks: [
              {
                id: 'test-text',
                type: 'text',
                body: "Testing an AI prototype means trying it on **many realistic inputs**, including the awkward ones, and recording what happens. Ten to twenty cases is a good start. Decide in advance what counts as a pass.",
              },
              {
                id: 'test-choice',
                type: 'choice',
                prompt: 'Achieng is testing a prompt kit that drafts replies to patient messages. Which test cases should she include? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'normal', text: 'Ordinary booking questions, the kind that arrive every day', correct: true, feedback: 'Yes. The prototype must handle the common case well.' },
                  { id: 'urgent', text: 'A message describing chest pain or heavy bleeding', correct: true, feedback: 'Yes. The most important test: it must never give a routine reply to an emergency.' },
                  { id: 'language', text: 'Messages in Sheng, Kiswahili or with spelling mistakes', correct: true, feedback: 'Yes. Real messages are messy. Test the way people actually write.' },
                  { id: 'unknown', text: 'A question about something not in the fact sheet', correct: true, feedback: 'Yes. Does it admit it does not know, or invent an answer?' },
                  { id: 'easy-only', text: 'Only the cases she expects it to get right, so the results look good', correct: false, feedback: 'Testing only easy cases hides exactly the failures that matter.' },
                ],
                explanation:
                  "Good testing looks for failure on purpose. Include common cases, high-stakes cases, messy real-world language and questions outside the tool’s knowledge. The goal is not a perfect score; it is knowing where the limits are.",
              },
            ],
          },
          {
            id: 'results',
            title: 'Reading the results',
            blocks: [
              {
                id: 'results-scenario',
                type: 'scenario',
                situation:
                  "Jean-Paul tests a prompt kit that helps a Kigali hardware shop answer customer questions. In 20 test cases it gets 18 right. The two failures: it invented a delivery service the shop does not offer, and it gave the wrong price for cement. The shop owner is delighted with “90%” and wants to start tomorrow. The numbers are fictional.",
                prompt: 'What should Jean-Paul recommend?',
                options: [
                  {
                    id: 'launch',
                    text: 'Launch tomorrow. 90% is excellent.',
                    outcome: "Within a week, two customers turn up expecting delivery that does not exist, and one argues about the cement price. The owner loses trust in the tool and in Jean-Paul.",
                    best: false,
                  },
                  {
                    id: 'fix-retest',
                    text: 'Add the price list and services to the prompt as the only source, tell it to say “please ask the shop” when unsure, keep a staff member checking replies, and retest with new cases before launch.',
                    outcome: "On a fresh set of 20 cases, the invented services disappear and prices match the list. A staff member still checks each reply for the first month. The shop launches with confidence and a clear process.",
                    best: true,
                  },
                  {
                    id: 'abandon',
                    text: 'Abandon the idea. Any error means AI cannot be trusted.',
                    outcome: "Jean-Paul throws away a tool that was close to useful. Human staff make errors too; the question is whether the system, with safeguards, is better than what exists now.",
                    best: false,
                  },
                ],
              },
              {
                id: 'results-insight',
                type: 'callout',
                tone: 'insight',
                title: 'Not all errors are equal',
                body: "A 90% score can hide the most serious problems. Look at **what** went wrong, not just how often. One invented price or one missed emergency may matter more than ten clumsy sentences.",
              },
            ],
          },
          {
            id: 'your-prototype',
            title: 'Plan your prototype',
            blocks: [
              {
                id: 'prototype-reflection',
                type: 'reflection',
                prompt: 'Describe your prototype: which kind it is, what the user does step by step, where AI is used and where a human checks or decides. Then list ten test cases, including at least three tricky ones, and say what will count as a pass.',
                guidance: 'Build it this week and run the tests. Keep a simple log of results. This is the core of your Practical Output.',
                minWords: 80,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'build-quiz',
      type: 'quiz',
      title: 'Module quiz: Build and test',
      minutes: 6,
      required: true,
      gradeWeight: 7,
      payload: {
        intro: 'Five questions on prototyping and testing AI-assisted solutions. You need 70% to pass and can retake it as often as you like.',
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-prototype-purpose',
            type: 'choice',
            prompt: 'What is the main purpose of a prototype?',
            multiple: false,
            options: [
              { id: 'a', text: 'To impress funders with a polished product', correct: false, feedback: 'Polish comes later. A prototype is for learning.' },
              { id: 'b', text: 'To learn quickly and cheaply whether an idea works for real people', correct: true },
              { id: 'c', text: 'To prove the idea is right', correct: false, feedback: 'A good prototype is designed to reveal problems, not hide them.' },
              { id: 'd', text: 'To replace the need for user testing', correct: false, feedback: 'A prototype is what you test with users.' },
            ],
            explanation: 'Build to learn. The cheaper the prototype, the sooner you find out what is wrong.',
          },
          {
            id: 'q-types',
            type: 'match',
            prompt: 'Match each prototype type to its description.',
            pairs: [
              { id: 'kit', left: 'Prompt kit', right: 'A tested prompt and instructions a team can reuse for one task' },
              { id: 'hitl', left: 'Human-in-the-loop', right: 'AI drafts, a person checks before anything is sent' },
              { id: 'form', left: 'Form plus AI', right: 'User inputs pass to an AI step, then a person reviews' },
              { id: 'woz', left: 'Wizard of Oz', right: 'A person quietly performs the “automated” part to test the idea' },
            ],
            explanation: 'All four can be built without code, and all four let you learn before investing heavily.',
          },
          {
            id: 'q-test-cases',
            type: 'choice',
            prompt: 'Which test cases matter most for a clinic reply assistant?',
            multiple: false,
            options: [
              { id: 'a', text: 'Messages that describe possible emergencies', correct: true },
              { id: 'b', text: 'Messages with perfect grammar', correct: false, feedback: 'Real messages are rarely perfect. Test messy ones too.' },
              { id: 'c', text: 'Only the most common booking questions', correct: false, feedback: 'Common cases matter, but the highest-stakes cases matter most.' },
              { id: 'd', text: 'Questions the developer already knows it answers well', correct: false, feedback: 'That only confirms what you hoped.' },
            ],
            explanation: 'Test hardest where failure would hurt most.',
          },
          {
            id: 'q-test-order',
            type: 'order',
            prompt: 'Put these testing steps in a sensible order.',
            items: [
              { id: 'pass', text: 'Decide what counts as a pass' },
              { id: 'cases', text: 'Write realistic test cases, including tricky ones' },
              { id: 'run', text: 'Run the prototype on every case' },
              { id: 'log', text: 'Record results and look at what kinds of errors occur' },
              { id: 'fix', text: 'Fix the design and retest with new cases' },
            ],
            explanation: 'Decide the pass mark before you see results, so you cannot move the goalposts.',
          },
          {
            id: 'q-ninety',
            type: 'choice',
            prompt: 'A prototype passes 18 of 20 tests. Which conclusions are sound? Select all that apply.',
            multiple: true,
            options: [
              { id: 'look', text: 'Look closely at the two failures: how serious were they?', correct: true },
              { id: 'new', text: 'After fixing, retest with new cases, not just the same twenty', correct: true },
              { id: 'safeguard', text: 'Keep a human check in place while it is new', correct: true },
              { id: 'ready', text: '90% means it is ready for everyone, unsupervised', correct: false, feedback: 'The score alone says nothing about how serious the failures were.' },
            ],
            explanation: 'Severity matters as much as frequency. Fix, retest with fresh cases and keep safeguards.',
          },
        ],
      },
    },
    {
      key: 'ai-prototype',
      type: 'assignment',
      title: 'Practical Output: your AI-Assisted Solution Prototype',
      minutes: 40,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the elective: an **AI-Assisted Solution Prototype** for the problem you have been developing in the Lab.\n\nSubmit a working prototype or a detailed, tested workflow that applies AI to a real problem, with a short report on how you tested it, its limitations and its ethical risks. It does not need code, and it does not need to be finished. It does need to be real enough that people could try it, and honest about what you found.\n\nYou have drafted most of the report in your journal. Now build, test and bring it together. Your prototype joins your Dream Lab portfolio and can feed directly into the Solution Design and Prototype stages of your Dream Residency.\n\nA faculty reviewer will grade it against the rubric below and give you written feedback.",
        practicalOutput: 'AI-Assisted Solution Prototype',
        steps: [
          'Choose the task from your problem where AI can help most, with risks you can manage.',
          'Choose your prototype type: prompt kit, human-in-the-loop workflow, form plus AI, Wizard of Oz, or code if you can.',
          'Build it. Use made-up or anonymised data only; never paste real people’s personal details into AI tools.',
          'Write at least ten test cases, including at least three tricky or high-stakes ones, and decide what counts as a pass.',
          'Run your tests, and ask at least two people from your intended users to try it. Record what happens.',
          'Apply the five-question responsible AI check and add any safeguards it suggests.',
          'Fill in every section of the template below, attaching your prompt, screenshots or a workflow diagram.',
          'Submit, then note in your journal one thing you would test next with more users.',
        ],
        rubric: [
          {
            id: 'problem-fit',
            criterion: 'Problem and fit',
            description: 'Clearly states a real problem and its users, explains what AI adds, and shows that simpler alternatives were considered.',
          },
          {
            id: 'working-prototype',
            criterion: 'Working prototype',
            description: 'A prototype or detailed workflow that people could actually use, with clear steps, a well-built prompt or process, and a defined point where a human checks or decides.',
          },
          {
            id: 'testing',
            criterion: 'Testing and evidence',
            description: 'At least ten realistic test cases including tricky and high-stakes ones, a pass standard set in advance, feedback from real users, and results reported honestly.',
          },
          {
            id: 'limitations',
            criterion: 'Limitations',
            description: 'Names where the prototype fails or is weak, with examples from testing, and states clearly what it must not be used for.',
          },
          {
            id: 'ethics',
            criterion: 'Ethical risks and safeguards',
            description: 'Applies the five-question check to purpose, harm, fairness, data and control; handles personal data responsibly; and builds in proportionate safeguards.',
          },
        ],
        template: prototypeTemplate,
        minWords: 300,
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
          "Nine questions across the whole elective: what AI is, using it well, responsible AI and prototyping. Several follow a new case.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-idea',
            type: 'choice',
            prompt: 'New case: Kwesi runs a small pharmacy in Kumasi. He wants an AI assistant to answer customers’ WhatsApp questions about medicines. What should he do first?',
            multiple: false,
            options: [
              { id: 'a', text: 'Connect a general chat assistant to his WhatsApp and let it answer everything', correct: false, feedback: 'Medicine questions are high-stakes. An unchecked general assistant could give dangerous advice.' },
              { id: 'b', text: 'Identify which questions customers actually ask, and separate low-risk ones, such as opening hours and stock, from high-risk ones, such as doses', correct: true },
              { id: 'c', text: 'Ban AI from the pharmacy entirely', correct: false, feedback: 'Low-risk tasks might be helped safely. Start by understanding the questions.' },
              { id: 'd', text: 'Ask the AI which questions it can answer', correct: false, feedback: 'The tool cannot judge its own reliability for his customers.' },
            ],
            explanation: 'Start from the problem and the stakes. Low-risk tasks may suit AI; dosing and medical advice must stay with a pharmacist.',
          },
          {
            id: 'f-how',
            type: 'choice',
            prompt: 'Kwesi asks why the assistant sometimes states a medicine price confidently, but wrongly. What is the best explanation?',
            multiple: false,
            options: [
              { id: 'a', text: 'It predicts likely-sounding text and has no built-in way to know his actual prices', correct: true },
              { id: 'b', text: 'It is lying on purpose', correct: false, feedback: 'It has no intent. It generates plausible text.' },
              { id: 'c', text: 'His phone is too old', correct: false, feedback: 'The device is not the cause.' },
              { id: 'd', text: 'Prices are too hard for computers', correct: false, feedback: 'Computers handle prices well when given the right data.' },
            ],
            explanation: 'Fluent is not the same as correct. Give it his price list as the only source, and check.',
          },
          {
            id: 'f-prompt',
            type: 'choice',
            prompt: 'Which instruction is strongest for Kwesi’s low-risk questions?',
            multiple: false,
            options: [
              { id: 'a', text: '“Answer customer questions.”', correct: false, feedback: 'Too vague: no source, format or limits.' },
              { id: 'b', text: '“You are a brilliant pharmacist. Help everyone.”', correct: false, feedback: 'A role does not provide facts or safety limits.' },
              { id: 'c', text: '“Using only the attached opening hours and stock list, draft a short, friendly reply. Never give advice about doses, side effects or which medicine to take; for those, reply: ‘Please speak to our pharmacist.’”', correct: true },
              { id: 'd', text: '“Be accurate and helpful.”', correct: false, feedback: 'Good intentions, but no source and no limits.' },
            ],
            explanation: 'Task, source, format, tone and clear limits. The limit protects customers from the highest-risk failures.',
          },
          {
            id: 'f-check',
            type: 'choice',
            prompt: 'Before using a draft reply, which should Kwesi check? Select all that apply.',
            multiple: true,
            options: [
              { id: 'price', text: 'Any price or stock claim against his own list', correct: true },
              { id: 'hours', text: 'Opening hours', correct: true },
              { id: 'advice', text: 'Whether it slipped in any medical advice', correct: true },
              { id: 'emoji', text: 'Whether it used enough emojis', correct: false, feedback: 'A matter of style, not safety.' },
            ],
            explanation: 'Check every claim someone could act on, and every place it may have crossed a limit.',
          },
          {
            id: 'f-privacy',
            type: 'choice',
            prompt: 'Kwesi wants to test the tool using last month’s real customer chats, which include names and medical conditions. What should he do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Use them; it is only a test', correct: false, feedback: 'Health information about real people needs protection, test or not.' },
              { id: 'b', text: 'Write realistic made-up test messages instead', correct: true },
              { id: 'c', text: 'Remove names but keep conditions and phone numbers', correct: false, feedback: 'Phone numbers identify people, and conditions are sensitive.' },
              { id: 'd', text: 'Ask customers to delete their chats', correct: false, feedback: 'That does not address what he is about to share.' },
            ],
            explanation: 'Made-up test data lets him learn without risking customers’ privacy.',
          },
          {
            id: 'f-bias',
            type: 'match',
            prompt: 'Match each concern in Kwesi’s project to the idea it illustrates.',
            pairs: [
              { id: 'twi', left: 'Replies in Twi are clumsy compared with English', right: 'Thin training data for some languages' },
              { id: 'invent', left: 'It names a medicine he does not stock', right: 'Hallucination' },
              { id: 'records', left: 'Customer chats include health conditions', right: 'Sensitive personal data' },
              { id: 'pharmacist', left: 'All dose questions go to the pharmacist', right: 'Human in the loop' },
            ],
            explanation: 'Each idea from the course shows up in one small, real project.',
          },
          {
            id: 'f-test',
            type: 'order',
            prompt: 'Put Kwesi’s testing plan in order.',
            items: [
              { id: 'pass', text: 'Decide what counts as a pass, including “never gives dose advice”' },
              { id: 'cases', text: 'Write twenty test messages, including tricky and risky ones' },
              { id: 'run', text: 'Run the prompt on every message' },
              { id: 'review', text: 'Review failures by seriousness, not just number' },
              { id: 'retest', text: 'Fix and retest with new messages' },
            ],
            explanation: 'Set the standard first, test hard cases on purpose, judge failures by severity, then retest.',
          },
          {
            id: 'f-results',
            type: 'choice',
            prompt: 'In testing, the assistant answered 19 of 20 messages well, but once suggested a dose. What should Kwesi do?',
            multiple: false,
            options: [
              { id: 'a', text: 'Launch: 95% is excellent', correct: false, feedback: 'One dose suggestion could seriously harm someone.' },
              { id: 'b', text: 'Tighten the limits, keep the pharmacist checking every reply, and retest with new cases including dose questions', correct: true },
              { id: 'c', text: 'Give up on AI completely', correct: false, feedback: 'Low-risk uses may still be valuable with safeguards.' },
              { id: 'd', text: 'Hide the failure from his staff', correct: false, feedback: 'Honest reporting is how the system gets safer.' },
            ],
            explanation: 'Severity matters as much as frequency. Fix, keep a human check, retest.',
          },
          {
            id: 'f-accountable',
            type: 'choice',
            prompt: 'If the assistant gives a customer wrong information, who is accountable?',
            multiple: false,
            options: [
              { id: 'a', text: 'The AI', correct: false, feedback: 'A tool cannot be held accountable.' },
              { id: 'b', text: 'The customer, for trusting it', correct: false, feedback: 'Customers reasonably trust what a pharmacy tells them.' },
              { id: 'c', text: 'Kwesi’s pharmacy, which chose to use it', correct: true },
              { id: 'd', text: 'Nobody', correct: false, feedback: 'Someone is always responsible for what a business tells its customers.' },
            ],
            explanation: 'Using AI does not transfer responsibility. Whoever deploys it answers for it.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const artificialIntelligence: CourseAuthoring = {
  slug: 'artificial-intelligence',
  title: 'Artificial Intelligence',
  subtitle: 'Understand what AI can and cannot do, and use it to build something useful.',
  description:
    "Artificial intelligence is changing how work is done, from customer service and farming advice to software, design and research. Builders who understand it, and its limits, will shape how it is used across the continent.\n\nIn this elective you will learn, without heavy mathematics, how modern AI systems work and where they fail. You will practise using AI tools well: writing clear instructions, checking their output, and combining them with your own judgement. You will explore real uses in African contexts, including local languages, agriculture, health, finance and education, and think hard about bias, privacy, data rights and the jobs AI may change. Then you will build: a small, working prototype that uses AI to address the problem you have been developing in the Lab.\n\nNo coding experience is required, though learners who code will be able to go further.\n\nYour Practical Output is an **AI-Assisted Solution Prototype**: a working prototype or detailed workflow that applies AI to a real problem, with a short report on how you tested it, its limitations and its ethical risks.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 10,
  outcomes: [
    'Explain in plain language how modern AI systems work and where they commonly fail.',
    'Use AI tools effectively with clear instructions and careful checking of their output.',
    'Identify promising and risky uses of AI in African contexts.',
    'Assess AI solutions for bias, privacy and data-rights concerns.',
    'Build and test a simple AI-assisted prototype for a real problem.',
  ],
  skills: ['AI literacy', 'Prompting', 'Prototyping', 'Responsible AI', 'Workflow automation', 'Critical evaluation'],
  audience: 'Learners curious about technology who want to use AI to solve problems, whatever their background.',
  prerequisites: "Builder’s Architecture phase. A smartphone or computer with internet access; no coding required.",
  practicalOutput: 'AI-Assisted Solution Prototype',
  cover: {
    from: '#0A0F1E',
    to: '#3CB795',
    symbol: '⬡',
    imageUrl: "https://images.unsplash.com/photo-1694175271713-a6e2cc378980?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "A young man in a hoodie leans against a wall typing on a laptop held in one hand, a bag in a bright African print over his shoulder.",
    imageCredit: "Photo: Seth Ebenezer Tetteh / Unsplash",
  },
  trailer: {
    provider: 'youtube',
    videoId: '0yCJMt9Mx9c',
    title: "How does artificial intelligence learn? - Briana Brownell",
    channel: "TED-Ed",
    durationS: 297,
  },
  instructors: [],
  modules: [moduleWhat, moduleUsing, moduleResponsible, moduleBuild],
};

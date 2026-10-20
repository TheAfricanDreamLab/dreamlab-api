import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Critical Thinking: Life Architecture, weeks 1–2, 5 credits. Practical Output: Argument Audit.
 *
 * Spine: Claim → Reasons → Evidence → Assumptions → Your conclusion. Recurring cast, all fictional:
 *   Ngozi   a mass communication student in Enugu who runs a campus fact-check page
 *   Baraka  secretary of a youth savings group in Dar es Salaam, offered a “guaranteed” scheme
 *   Zanele  a junior analyst at an impact investment fund in Johannesburg, reviewing pitches
 *   Kwame   a university student in Kumasi whose family WhatsApp group is busy with rumours
 * Every number in a case is part of that fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · Arguments: claims, reasons and evidence
// ---------------------------------------------------------------------------

const moduleArguments: Module = {
  key: 'arguments',
  title: 'Arguments: claims, reasons and evidence',
  summary:
    'Learn what critical thinking is and is not, take any argument apart into its claim, reasons, evidence and hidden assumptions, and spot the fallacies and persuasion tricks that make weak arguments sound strong.',
  weekNo: 1,
  items: [
    {
      key: 'why-think-critically',
      type: 'lesson',
      title: 'Why critical thinking, and why now',
      minutes: 13,
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
                body: "Welcome to Critical Thinking.\n\nEvery day you are handed claims. A voice note says a common drink cures malaria. A pastor, a politician or an influencer tells you what is “really” going on. A friend swears a new investment doubles your money in a month. Some of these claims are true. Many are not. A few are dangerous.\n\nCritical thinking is the habit of asking **“How do we know?”** before you believe, share or act. It is not about being clever or negative. It is about holding each belief in proportion to the evidence for it.\n\nStart with this short report from BBC News Africa. It shows how fast false claims travelled during the Covid-19 pandemic, and what they cost.",
              },
              {
                id: 'welcome-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'yDowVv6zVTo',
                title: 'Coronavirus in Africa: Debunking fake news and myths around Covid-19 - BBC Africa',
                channel: 'BBC News Africa',
                durationS: 147,
                caption: 'Watch for how each myth is built: a confident claim, a reason that sounds sensible, and almost no evidence. Notice also who is sharing them. Mostly ordinary, well-meaning people.',
              },
            ],
          },
          {
            id: 'starting-point',
            title: 'Where you are starting from',
            blocks: [
              {
                id: 'forward-scale',
                type: 'scale',
                prompt: 'Be honest. Before you forward a surprising message, how often do you check whether it is true?',
                minLabel: 'Almost never',
                maxLabel: 'Every time',
                afterword:
                  "Most people check far less than they think they do, especially when a message comes from someone they trust or confirms what they already believe. That is not a moral failure. It is how human minds work. This course gives you quick habits that fit into real life.",
              },
            ],
          },
          {
            id: 'meet-ngozi',
            title: 'Meet Ngozi',
            blocks: [
              {
                id: 'ngozi-story',
                type: 'callout',
                tone: 'story',
                title: 'Ngozi, student fact-checker, Enugu',
                body: "Ngozi is in her second year of mass communication in Enugu. She runs a small campus page that checks the rumours students share.\n\nOne Monday a voice note spreads across every hostel group. A calm, serious voice says the university will double fees next semester and that “a friend in the bursary” has seen the letter. By noon, students are planning a protest.\n\nNgozi’s friends ask her to post about it. “Everybody is saying it,” one tells her. “It must be true.”",
              },
              {
                id: 'ngozi-reveal',
                type: 'reveal',
                prompt: 'Before you tap: is “everybody is saying it” a good reason to believe the claim?',
                body: "No. Many people repeating a claim tells you it is **popular**, not that it is **true**. Often they all heard the same single voice note.\n\nNgozi asks a better question: *where did this start, and what is the evidence?* A “friend in the bursary” nobody can name is not evidence. A letter nobody has seen is not evidence. The claim might still be true. But right now nobody knows, and a protest built on a rumour could hurt the students it is meant to help.",
              },
            ],
          },
          {
            id: 'what-it-is',
            title: 'What critical thinking is, and is not',
            blocks: [
              {
                id: 'ct-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Claim', definition: 'A statement someone wants you to accept as true. “Fees will double.” “This scheme pays 30% a month.”' },
                  { term: 'Evidence', definition: 'What we can check that makes a claim more or less likely to be true: documents, data, direct observation, reliable reports.' },
                  { term: 'Critical thinking', definition: 'Judging claims by their reasons and evidence, and holding beliefs in proportion to that evidence.' },
                  { term: 'Healthy scepticism', definition: 'Asking “how do we know?” and waiting for good evidence, while staying ready to be convinced.' },
                  { term: 'Cynicism', definition: 'Refusing to believe anything, or assuming everyone is lying. It feels clever, but it is as lazy as believing everything.' },
                ],
              },
              {
                id: 'ct-choice',
                type: 'choice',
                prompt: 'Kwame’s uncle posts in the family WhatsApp group that a new bank “is a scam, everybody knows it.” Which response shows critical thinking?',
                multiple: false,
                options: [
                  { id: 'believe', text: 'Warn his mother to close her account immediately.', correct: false, feedback: 'That acts on a claim with no evidence yet. If the claim is false, she loses a useful account for nothing.' },
                  { id: 'dismiss', text: 'Reply that his uncle always talks nonsense.', correct: false, feedback: 'That judges the person, not the claim. Even people who are often wrong are sometimes right.' },
                  { id: 'ask', text: 'Ask what the uncle has seen, and check whether the bank is licensed by the central bank.', correct: true, feedback: 'Yes. He asks for evidence and goes to a source that can actually settle the question.' },
                  { id: 'ignore', text: 'Ignore it. Nothing online can be trusted.', correct: false, feedback: 'That is cynicism. Some information online is reliable, and his mother’s money may be at stake.' },
                ],
                explanation:
                  "Critical thinking sits between believing everything and doubting everything. You ask for the evidence, you look for a source that can really settle the question, and you leave the person’s character out of it.",
              },
            ],
          },
          {
            id: 'your-claims',
            title: 'Where your claims come from',
            blocks: [
              {
                id: 'claims-poll',
                type: 'poll',
                prompt: 'Where do you meet the most claims that you are not sure are true?',
                options: [
                  { id: 'whatsapp', text: 'WhatsApp and Telegram groups' },
                  { id: 'social', text: 'TikTok, Instagram, X or Facebook' },
                  { id: 'people', text: 'Friends, family and people around me' },
                  { id: 'leaders', text: 'Religious, political or community leaders' },
                  { id: 'work', text: 'Work, business or investment pitches' },
                  { id: 'news', text: 'Radio, TV and news sites' },
                ],
                afterword:
                  "Every one of these channels carries both good and bad information. The habits in this course work the same way wherever a claim reaches you.",
              },
              {
                id: 'baobab-proverb',
                type: 'quote',
                text: 'Wisdom is like a baobab tree; no one individual can embrace it.',
                attribution: 'African proverb',
              },
            ],
          },
          {
            id: 'pick-claim',
            title: 'Pick your claim',
            blocks: [
              {
                id: 'pick-claim-text',
                type: 'text',
                body: "Your Practical Output for this course is an **Argument Audit**: a written evaluation of a real, contested claim from your community or industry.\n\nChoose your claim early, so every lesson adds a piece. Good claims are:\n\n- contested: reasonable people disagree, or many people believe it without checking;\n- real: it affects decisions people around you are making;\n- checkable: some evidence exists, even if it is hard to find.\n\nExamples: “Our state’s new youth loan scheme is reaching young people.” “Skin-lightening creams are safe if you buy the expensive ones.” “Remote work makes people lazy.” “This crypto group can double your savings.”",
              },
              {
                id: 'pick-claim-reflection',
                type: 'reflection',
                prompt: 'Write down a contested claim you have met recently that you would like to audit. Where did you meet it, who believes it, and why does it matter whether it is true?',
                guidance: 'Pick something you genuinely do not know the answer to yet. You will come back to it in every lesson.',
                minWords: 30,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'anatomy-of-an-argument',
      type: 'lesson',
      title: 'The anatomy of an argument',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'parts',
            title: 'What an argument is made of',
            blocks: [
              {
                id: 'parts-text',
                type: 'text',
                body: "In everyday speech an argument is a quarrel. In critical thinking an **argument** is something calmer: a claim supported by reasons.\n\nOnce you can see the parts of an argument, you can test each part separately. That is far easier than deciding, all at once, whether you “agree”.",
              },
              {
                id: 'parts-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'rCnb7vapl5o',
                title: 'PHILOSOPHY - Epistemology: Argument and Evidence [HD]',
                channel: 'Wireless Philosophy',
                durationS: 384,
                caption: 'A short philosophy lesson on how evidence supports a belief. Watch for the difference between having a belief and having good reasons for it.',
              },
              {
                id: 'parts-framework',
                type: 'framework',
                title: 'Four parts of every argument',
                steps: [
                  { label: 'Claim', detail: 'What you are being asked to believe or do. Often comes last: “…so you should join today.”' },
                  { label: 'Reasons', detail: 'Why the speaker says the claim is true. Look for “because”, “since”, “after all”.' },
                  { label: 'Evidence', detail: 'What backs up each reason: data, documents, examples, expert findings. Can you check it?' },
                  { label: 'Assumptions', detail: 'What must also be true for the reasons to support the claim, but is never said out loud.' },
                ],
              },
            ],
          },
          {
            id: 'herbal-sign',
            title: 'Claims on every wall',
            blocks: [
              {
                id: 'makola-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Makola_Market_Entrance%2C_Accra%2C_Ghana.JPG/1280px-Makola_Market_Entrance%2C_Accra%2C_Ghana.JPG',
                alt: 'Traders and shoppers crowd the street in front of a yellow building with a large sign reading Welcome to Makola Market. A shop sign below reads Choice Herbal Center, we cure all kinds of diseases.',
                caption: 'The entrance to Makola Market in Accra, Ghana. Look closely at the shop sign under the bank.',
                credit: 'Photo: Benggriff / Wikimedia Commons, CC BY-SA 3.0',
              },
              {
                id: 'sign-reveal',
                type: 'reveal',
                prompt: 'One shop sign says “We cure all kinds of diseases.” Which of the four parts is there, and which are missing?',
                body: "Only the **claim** is there. There are no reasons, no evidence and the assumptions are enormous: that one shop can cure every disease, from malaria to cancer.\n\nThat does not prove the shop sells nothing useful. Some herbal remedies do help with some conditions. But the sign gives you nothing to judge, and a claim that covers *everything* should make you more careful, not less.\n\nAdvertising often works like this. It hands you a confident claim and lets your hopes supply the reasons.",
              },
            ],
          },
          {
            id: 'baraka-pitch',
            title: 'Take Baraka’s pitch apart',
            blocks: [
              {
                id: 'baraka-example',
                type: 'example',
                title: 'The pitch Baraka heard',
                body: "Baraka is secretary of a youth savings group in Dar es Salaam. At a wedding, a well-dressed man pitches him a scheme:\n\n“You should move your group’s savings into our scheme. It pays 30% every month. My cousin joined in January and has already bought a motorbike. We have thousands of members, and a famous musician posted about us last week.”",
              },
              {
                id: 'pitch-match',
                type: 'match',
                prompt: 'Match each part of the pitch to its role in the argument.',
                pairs: [
                  { id: 'claim', left: '“You should move your group’s savings into our scheme.”', right: 'Claim' },
                  { id: 'reason', left: '“It pays 30% every month.”', right: 'Main reason' },
                  { id: 'anecdote', left: '“My cousin bought a motorbike.”', right: 'Evidence (a single story)' },
                  { id: 'popularity', left: '“Thousands of members, and a famous musician posted about us.”', right: 'Evidence (popularity and celebrity)' },
                  { id: 'assumption', left: 'The scheme will still exist and pay out next year.', right: 'Unstated assumption' },
                ],
                explanation:
                  "Laid out like this, the pitch looks thin. The main reason, 30% a month, is itself a claim with no evidence. The evidence offered is one story and a crowd. And everything rests on an assumption nobody said out loud: that the money will still be there when the group wants it back.",
              },
            ],
          },
          {
            id: 'assumptions',
            title: 'Hunting hidden assumptions',
            blocks: [
              {
                id: 'assumptions-text',
                type: 'text',
                body: "Assumptions are the most powerful part of an argument because they are invisible. To find them, ask: **“For this reason to support this claim, what else must be true?”**\n\nTake: “Our town should build a bigger market, because traders are complaining about space.” Hidden underneath: that space is the main problem, that a bigger market would fix it, that traders could afford stalls in it, and that money spent there would not be better spent elsewhere.",
              },
              {
                id: 'assumptions-choice',
                type: 'choice',
                prompt: 'Zanele reads a startup pitch: “Every young Kenyan has a smartphone, so our app will reach millions of young people.” Which hidden assumptions does it rely on? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'phones', text: 'That nearly every young person has a smartphone', correct: true, feedback: 'Yes. Stated as fact, but it needs evidence. Ownership varies a lot by age, place and income.' },
                  { id: 'data', text: 'That they can afford the mobile data to use the app', correct: true, feedback: 'Yes. Owning a phone and having data are different things.' },
                  { id: 'want', text: 'That young people want what the app offers', correct: true, feedback: 'Yes. Reach is not the same as demand.' },
                  { id: 'kenya', text: 'That Kenya is a country in East Africa', correct: false, feedback: 'True, but not an assumption the argument depends on. It does not affect whether the claim holds.' },
                ],
                explanation:
                  "One short sentence can hide several assumptions. Each one is a place where the argument could fail. In your Argument Audit, listing the assumptions is often where the real insight comes from.",
              },
            ],
          },
          {
            id: 'map-order',
            title: 'Map any argument',
            blocks: [
              {
                id: 'map-order-block',
                type: 'order',
                prompt: 'Put these steps for mapping an argument into a sensible order.',
                items: [
                  { id: 'claim', text: 'Find the claim: what am I being asked to believe or do?' },
                  { id: 'reasons', text: 'List the reasons given for it' },
                  { id: 'evidence', text: 'Note the evidence behind each reason, and whether I can check it' },
                  { id: 'assumptions', text: 'Ask what else must be true, and write down the hidden assumptions' },
                  { id: 'weakest', text: 'Mark the weakest link: the reason, evidence or assumption most likely to fail' },
                ],
                explanation:
                  "Start with the claim, because everything else only makes sense in relation to it. End with the weakest link, because that is where you should spend your checking time.",
              },
            ],
          },
          {
            id: 'map-yours',
            title: 'Map your claim',
            blocks: [
              {
                id: 'map-yours-reflection',
                type: 'reflection',
                prompt: 'Map the claim you chose for your Argument Audit. Write the claim, the two or three main reasons people give for it, the evidence they offer, and at least two hidden assumptions.',
                guidance: 'Write the argument as its strongest supporters would put it, even if you disagree. You are describing it, not judging it yet.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'fallacies',
      type: 'lesson',
      title: 'Fallacies: when weak arguments sound strong',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'what-fallacy',
            title: 'What a fallacy is',
            blocks: [
              {
                id: 'fallacy-text',
                type: 'text',
                body: "A **fallacy** is a pattern of reasoning that feels convincing but does not actually support the claim. Fallacies are everywhere: in debates, adverts, sermons, comment sections and family arguments. Most people use them without meaning to.\n\nLearning their names is useful, but the real skill is noticing the *move*: the moment an argument stops being about the evidence. Start with one of the most common, the straw man.",
              },
              {
                id: 'strawman-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'hfil34ayaEU',
                title: 'CRITICAL THINKING - Fallacies: Straw Man Fallacy [HD]',
                channel: 'Wireless Philosophy',
                durationS: 358,
                caption: 'Watch for the moment the speaker swaps the real argument for a weaker version that is easier to knock down. Then think of the last time you saw this in a heated online debate.',
              },
            ],
          },
          {
            id: 'common-fallacies',
            title: 'Eight to know by name',
            blocks: [
              {
                id: 'fallacy-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Straw man', definition: 'Attacking a distorted, weaker version of someone’s argument instead of what they actually said.' },
                  { term: 'Ad hominem', definition: 'Attacking the person instead of their argument. “Why listen to her? She’s not even married.”' },
                  { term: 'Appeal to popularity', definition: 'Treating a claim as true because many people believe it. “Everybody is joining.”' },
                  { term: 'Misplaced authority', definition: 'Trusting someone on a topic outside their expertise. A footballer on vaccines. A pastor on interest rates.' },
                  { term: 'False dilemma', definition: 'Offering only two options when there are more. “Either you support this project or you hate development.”' },
                  { term: 'Post hoc', definition: 'Assuming that because B came after A, A caused B. “I wore my lucky shirt and passed.”' },
                  { term: 'Hasty generalisation', definition: 'Drawing a big conclusion from a few cases. “Two Lagos landlords cheated me, so all Lagos landlords are cheats.”' },
                  { term: 'Slippery slope', definition: 'Claiming one step will inevitably lead to disaster, without showing why each step must follow.' },
                ],
              },
            ],
          },
          {
            id: 'spot-match',
            title: 'Name the move',
            blocks: [
              {
                id: 'fallacy-match',
                type: 'match',
                prompt: 'Match each statement to the fallacy it uses.',
                pairs: [
                  { id: 'adhom', left: '“Don’t listen to Ngozi’s fact-check. She’s from a rival department.”', right: 'Ad hominem' },
                  { id: 'popular', left: '“Thousands have joined the scheme. It can’t be fake.”', right: 'Appeal to popularity' },
                  { id: 'dilemma', left: '“Either we protest today or the fees will double.”', right: 'False dilemma' },
                  { id: 'posthoc', left: '“Sales rose after we changed our logo, so the logo did it.”', right: 'Post hoc' },
                  { id: 'slope', left: '“If we let students reschedule one exam, soon nobody will ever sit exams.”', right: 'Slippery slope' },
                ],
                explanation:
                  "Notice that none of these statements is necessarily *false*. Maybe the logo did help. The problem is that the reason given does not show it. A fallacy is a broken link between reason and claim, not proof the claim is wrong.",
              },
            ],
          },
          {
            id: 'ngozi-debate',
            title: 'Ngozi in the debate',
            blocks: [
              {
                id: 'debate-scenario',
                type: 'scenario',
                situation:
                  "Ngozi posts that she cannot find any evidence the fees will double. The student union president replies in front of hundreds of students:\n\n“So Ngozi wants us to sit quietly and accept whatever the university does to us. Typical of people who have rich parents paying their fees.”",
                prompt: 'How should Ngozi respond?',
                options: [
                  {
                    id: 'attack-back',
                    text: 'Reply that the president is only protesting to raise his profile before elections.',
                    outcome: "Now both sides are attacking people, not claims. The thread explodes. Nobody remembers the actual question, which was whether the fee letter exists.",
                    best: false,
                  },
                  {
                    id: 'name-it',
                    text: 'Point out calmly that she never said students should accept anything, restate what she actually said, and ask for the letter.',
                    outcome: "Ngozi names the straw man without insulting anyone: “I didn’t say we should stay quiet. I said I can’t find evidence of the letter. If anyone has it, please share it and I’ll post it.” Several students ask the union to share the letter. It never appears. A week later the university confirms fees are unchanged.",
                    best: true,
                  },
                  {
                    id: 'delete',
                    text: 'Delete her post to avoid trouble.',
                    outcome: "The thread calms down, but the rumour keeps spreading unchallenged, and students lose a day of classes to a protest about a letter that does not exist.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'not-fallacy',
            title: 'Not every appeal is a fallacy',
            blocks: [
              {
                id: 'not-fallacy-choice',
                type: 'choice',
                prompt: 'Which of these is a reasonable argument, not a fallacy?',
                multiple: false,
                options: [
                  { id: 'actor', text: '“A Nollywood star says this supplement cures diabetes, so it must work.”', correct: false, feedback: 'Misplaced authority. Acting skill tells us nothing about medicine.' },
                  { id: 'doctor', text: '“The country’s medicines regulator and several independent studies say this drug is safe at the prescribed dose, so it is probably safe.”', correct: true, feedback: 'Yes. Relying on genuine experts, speaking within their field and agreeing with each other, is good reasoning, not a fallacy.' },
                  { id: 'crowd', text: '“My whole street uses this remedy, so it works.”', correct: false, feedback: 'Appeal to popularity. Many people using something does not show it works.' },
                  { id: 'luck', text: '“I took the remedy and my headache went away, so the remedy cured it.”', correct: false, feedback: 'Post hoc. Most headaches go away on their own.' },
                ],
                explanation:
                  "Appeals to authority are fine when the authority is genuinely expert in the topic, independent and broadly agreed with by other experts. The fallacy is *misplaced* authority. Notice also the word “probably”. Good arguments are honest about their confidence.",
              },
            ],
          },
          {
            id: 'fallacy-wrap',
            title: 'Use it well',
            blocks: [
              {
                id: 'fallacy-caution',
                type: 'callout',
                tone: 'caution',
                title: 'Do not use fallacy names as weapons',
                body: "Shouting “ad hominem!” wins nobody over. And spotting a fallacy does not prove the claim false. That mistake even has a name: the *fallacy fallacy*.\n\nThe point of knowing fallacies is to ask a better question: “Setting that aside, what is the actual evidence?”",
              },
              {
                id: 'fallacy-scale',
                type: 'scale',
                prompt: 'How often do you think you use fallacies yourself when you argue with friends or family?',
                minLabel: 'Hardly ever',
                maxLabel: 'All the time',
                afterword:
                  "Almost everyone uses them, especially when they care about winning. The first fallacies worth catching are your own.",
              },
            ],
          },
        ],
      },
    },
    {
      key: 'too-good-to-be-true',
      type: 'lesson',
      title: 'Persuasion tricks and too-good-to-be-true offers',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'tricks-intro',
            title: 'When persuasion becomes a trap',
            blocks: [
              {
                id: 'tricks-text',
                type: 'text',
                body: "Some arguments are not mistakes. They are designed. Fraudulent schemes, fake products and manipulative campaigns use the same handful of tricks again and again, because they work on everyone, including clever people.\n\nThis lesson uses one common example, the pyramid scheme, to show how the tricks fit together. Watch how the promise, the pressure and the maths combine.",
              },
              {
                id: 'pyramid-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'SBGfHk91Vrk',
                title: 'How to spot a pyramid scheme - Stacie Bosley',
                channel: 'TED-Ed',
                durationS: 302,
                caption: 'Watch for the red flags the lesson names: pressure to act fast, promises of easy income, and paying to join. Then ask where the money paid to early members actually comes from.',
              },
            ],
          },
          {
            id: 'baraka-scheme',
            title: 'Baraka’s offer',
            blocks: [
              {
                id: 'mpesa-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg/1280px-M-PESA_mobile_money_and_Equity_agent%2C_Nairobi%2C_Kenya.jpg',
                alt: 'A person stands at the barred counter of a small shop painted with M-PESA and Equity Agent signs, talking to the smiling agent inside.',
                caption: 'A mobile money agent in Nairobi, Kenya. Mobile money is safe and useful. Schemes simply use it to collect money fast. Baraka is a fictional character.',
                credit: 'Photo: Fiona Graham / Wikimedia Commons, CC BY-SA 2.0',
              },
              {
                id: 'scheme-story',
                type: 'callout',
                tone: 'story',
                title: 'The “Mavuno Circle”',
                body: "The man from the wedding adds Baraka to a WhatsApp group called Mavuno Circle. It is full of screenshots of mobile money payments and photos of new phones and motorbikes.\n\nThe rules: deposit at least 200,000 shillings, receive 30% every month, and earn a bonus for every two new members you bring. The offer for “founding members” closes on Friday. Members who ask too many questions are removed for “negative energy”.\n\nBaraka’s savings group has 2.4 million shillings saved for school fees. Some members want to put it all in.",
              },
            ],
          },
          {
            id: 'red-flags',
            title: 'The red flags',
            blocks: [
              {
                id: 'flags-framework',
                type: 'framework',
                title: 'Six red flags of a too-good-to-be-true offer',
                steps: [
                  { label: 'Guaranteed high returns', detail: 'Real investments carry risk. A promise of high, steady, guaranteed returns is the biggest warning sign of all.' },
                  { label: 'Pressure to act now', detail: 'Deadlines, “limited places” and “founding member” offers stop you from checking.' },
                  { label: 'Pay to recruit', detail: 'Income depends on bringing in new people rather than on selling something real.' },
                  { label: 'Social proof', detail: 'Screenshots, crowds, testimonials and celebrities replace evidence of how the money is made.' },
                  { label: 'Vague engine', detail: 'Nobody can explain simply where the returns come from: “forex”, “crypto trading”, “a secret system”.' },
                  { label: 'Punishing questions', detail: 'Doubters are mocked, removed or called negative. Honest businesses welcome questions.' },
                ],
              },
              {
                id: 'flags-choice',
                type: 'choice',
                prompt: 'Which red flags are present in the Mavuno Circle offer? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'returns', text: 'Guaranteed high returns', correct: true, feedback: 'Yes. 30% a month, every month, with no risk mentioned.' },
                  { id: 'pressure', text: 'Pressure to act now', correct: true, feedback: 'Yes. The founding-member offer “closes on Friday”.' },
                  { id: 'recruit', text: 'Pay to recruit', correct: true, feedback: 'Yes. A bonus for every two new members.' },
                  { id: 'proof', text: 'Social proof instead of evidence', correct: true, feedback: 'Yes. Screenshots and motorbikes, but no explanation of where the money comes from.' },
                  { id: 'questions', text: 'Punishing questions', correct: true, feedback: 'Yes. Questioners are removed for “negative energy”.' },
                  { id: 'licence', text: 'A licence from the capital markets regulator', correct: false, feedback: 'Nobody has mentioned a licence. A genuine licence would be a point in the scheme’s favour, and Baraka can check it.' },
                ],
                explanation:
                  "Five of the six flags in one offer. Any one flag is a reason to slow down. Several together is a reason to stop. The missing piece, a regulator’s licence, is also something Baraka can check for himself in minutes.",
              },
            ],
          },
          {
            id: 'maths',
            title: 'Follow the maths',
            blocks: [
              {
                id: 'pyramid-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Pyramid_scheme_diagram.svg/1280px-Pyramid_scheme_diagram.svg.png',
                alt: 'A diagram of a pyramid with thirteen levels. The number of participants grows from 6 at the top to over 13 billion at the bottom, labelled more than the world population.',
                caption: 'If every member must recruit six more, the thirteenth level needs more people than live on Earth.',
                credit: 'Diagram: US Securities and Exchange Commission, vector by Mysid / Wikimedia Commons, public domain',
              },
              {
                id: 'maths-reveal',
                type: 'reveal',
                prompt: 'If returns are paid from new members’ deposits, what must happen for the scheme to keep paying? And who loses when it stops?',
                body: "It must keep recruiting faster and faster, for ever. That is impossible. Within a few levels it runs out of people.\n\nWhen recruitment slows, the payments stop. The few people at the top, and some early joiners, keep what they took. **Most members, usually the ones who joined last, lose their money.** Often they recruited their own friends and family, so the loss breaks relationships too.\n\nThis is why the screenshots are real. Early members really are paid. With other people’s money.",
              },
            ],
          },
          {
            id: 'baraka-decides',
            title: 'The group meeting',
            blocks: [
              {
                id: 'meeting-scenario',
                type: 'scenario',
                situation:
                  "At Saturday’s meeting, half the savings group is excited. Their friend Rehema has already joined and shows a payment of 60,000 shillings on her phone. “See? It’s real,” she says. Everyone turns to Baraka, the secretary.",
                prompt: 'What should Baraka do?',
                options: [
                  {
                    id: 'go-all-in',
                    text: 'Agree to move all the savings. Rehema’s payment proves it works.',
                    outcome: "Two months later the WhatsApp group goes silent and the number stops answering. The school-fees fund is gone. One payment proved only that the scheme paid one person, once.",
                    best: false,
                  },
                  {
                    id: 'small-bet',
                    text: 'Suggest putting in a small amount first, “just to test it”.',
                    outcome: "The small amount pays out once, as schemes often do early on. The test seems to succeed, and the group puts in more. A small test cannot reveal a scheme that is designed to pay early joiners.",
                    best: false,
                  },
                  {
                    id: 'check-first',
                    text: 'Ask three questions: where do the returns come from, is the scheme licensed, and can members withdraw their full deposit at any time? Offer to check the regulator’s list before any decision.',
                    outcome: "Nobody in the WhatsApp group can explain where the returns come from. The scheme is not on the regulator’s list. Baraka shares what he found, without mocking anyone. The group keeps its savings. Rehema withdraws what she can.",
                    best: true,
                  },
                  {
                    id: 'mock',
                    text: 'Tell the group they are foolish to even consider it.',
                    outcome: "The excited members feel insulted and stop listening. Three of them join privately with their own money.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'tricks-reflect',
            title: 'Persuasion in your claim',
            blocks: [
              {
                id: 'tricks-reflection',
                type: 'reflection',
                prompt: 'Look at the claim you are auditing. Which persuasion tricks or fallacies, if any, do its supporters or its critics use? Give one specific example.',
                guidance: 'Check both sides. Critics of a claim use fallacies too.',
                minWords: 30,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'arguments-quiz',
      type: 'quiz',
      title: 'Module quiz: Arguments',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on claims, reasons, evidence, assumptions, fallacies and red flags. You need 70% to pass and you can retake it as many times as you like. Read every explanation.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-parts',
            type: 'match',
            prompt: 'A trader says: “Buy your phone from me, because I give a one-year warranty. Here is the warranty card.” Match each part.',
            pairs: [
              { id: 'claim', left: '“Buy your phone from me.”', right: 'Claim' },
              { id: 'reason', left: '“I give a one-year warranty.”', right: 'Reason' },
              { id: 'evidence', left: 'The warranty card', right: 'Evidence' },
              { id: 'assumption', left: 'The trader will still be in business if the phone breaks', right: 'Unstated assumption' },
            ],
            explanation: 'A warranty is only worth something if the person giving it will honour it. That hidden assumption is the weakest link, and the one worth checking.',
          },
          {
            id: 'q-scepticism',
            type: 'choice',
            prompt: 'What is the difference between healthy scepticism and cynicism?',
            multiple: false,
            options: [
              { id: 'a', text: 'Sceptics doubt everything; cynics believe everything', correct: false, feedback: 'Neither is right. Doubting everything is closer to cynicism.' },
              { id: 'b', text: 'Sceptics ask for evidence and stay open to being convinced; cynics refuse to believe whatever the evidence', correct: true },
              { id: 'c', text: 'There is no real difference', correct: false, feedback: 'There is. One follows the evidence; the other ignores it.' },
              { id: 'd', text: 'Cynics are better at critical thinking because they are harder to fool', correct: false, feedback: 'Cynics can be fooled too: they wrongly reject true claims.' },
            ],
            explanation: 'Critical thinking means proportioning belief to evidence. Cynicism is as lazy as gullibility, just pointed the other way.',
          },
          {
            id: 'q-fallacy',
            type: 'choice',
            prompt: '“You can’t trust his budget analysis. He failed maths in secondary school.” Which fallacy is this?',
            multiple: false,
            options: [
              { id: 'a', text: 'Ad hominem', correct: true },
              { id: 'b', text: 'Straw man', correct: false, feedback: 'A straw man distorts the argument. This ignores the argument and attacks the person.' },
              { id: 'c', text: 'False dilemma', correct: false, feedback: 'No choice between two options is being forced here.' },
              { id: 'd', text: 'Post hoc', correct: false, feedback: 'Post hoc is about cause and timing.' },
            ],
            explanation: 'Whether the analysis is right depends on the analysis. Check the numbers, not his school report.',
          },
          {
            id: 'q-flags',
            type: 'choice',
            prompt: 'Which of these are red flags for a too-good-to-be-true offer? Select all that apply.',
            multiple: true,
            options: [
              { id: 'guarantee', text: 'Guaranteed high monthly returns', correct: true },
              { id: 'deadline', text: '“Offer closes tonight”', correct: true },
              { id: 'recruit', text: 'Bonuses for recruiting new members', correct: true },
              { id: 'licence', text: 'A licence you can verify on the regulator’s website', correct: false, feedback: 'A verifiable licence is a good sign, though not a guarantee.' },
              { id: 'questions', text: 'Questions are treated as disloyalty', correct: true },
            ],
            explanation: 'Real opportunities can survive questions and a few days of checking. Schemes cannot.',
          },
          {
            id: 'q-steps',
            type: 'order',
            prompt: 'Put the steps for mapping an argument in order.',
            items: [
              { id: 'claim', text: 'Find the claim' },
              { id: 'reasons', text: 'List the reasons' },
              { id: 'evidence', text: 'Check the evidence for each reason' },
              { id: 'assumptions', text: 'Uncover the hidden assumptions' },
              { id: 'weakest', text: 'Mark the weakest link' },
            ],
            explanation: 'Claim, reasons, evidence, assumptions, weakest link. Then spend your checking time on the weakest link.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Evidence: sources, numbers and viral content
// ---------------------------------------------------------------------------

const moduleEvidence: Module = {
  key: 'evidence',
  title: 'Evidence: sources, numbers and viral content',
  summary:
    'Judge where a claim comes from before you believe or share it, trace viral content to its origin, and ask the questions that expose misleading statistics, charts and headlines.',
  weekNo: 2,
  items: [
    {
      key: 'judging-sources',
      type: 'lesson',
      title: 'Judging sources and viral content',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-we-fall',
            title: 'Why we fall for it',
            blocks: [
              {
                id: 'why-fall-text',
                type: 'text',
                body: "False information does not spread because people are stupid. It spreads because it is built to fit how all of us think: it is emotional, it confirms what we already fear or hope, and it arrives from people we trust.\n\nThat means the defence is not intelligence. It is habit: a few quick moves you make every time, before you believe or forward.",
              },
              {
                id: 'misinfo-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'hz6GULbowAk',
                title: 'Why people fall for misinformation - Joseph Isaac',
                channel: 'TED-Ed',
                durationS: 316,
                caption: 'Watch for the mental shortcuts that make false claims feel true, such as hearing something many times. Which of them have caught you before?',
              },
            ],
          },
          {
            id: 'sift',
            title: 'Four moves before you share',
            blocks: [
              {
                id: 'sift-framework',
                type: 'framework',
                title: 'SIFT: four moves for any claim online',
                steps: [
                  { label: 'Stop', detail: 'Notice your reaction. Strong emotion, especially anger or fear, is your signal to slow down.' },
                  { label: 'Investigate the source', detail: 'Who is behind this? Leave the page and search for the person or outlet. What do others say about them?' },
                  { label: 'Find better coverage', detail: 'Search the claim itself. Do reliable outlets or fact-checkers report it? If something big is true, more than one source will have it.' },
                  { label: 'Trace to the original', detail: 'Follow quotes, screenshots and statistics back to where they first appeared. Is the context the same?' },
                ],
              },
              {
                id: 'sift-context',
                type: 'callout',
                tone: 'context',
                title: 'Where SIFT comes from',
                body: "SIFT was developed by the digital literacy researcher Mike Caulfield. Its key move, leaving a page to see what others say about it, is called **lateral reading**. Professional fact-checkers do this. Most of us do the opposite: we stay on the page and judge it by how professional it looks.\n\nAcross Africa, independent fact-checking organisations such as Africa Check publish checks of viral claims. They are a good first place to look.",
              },
            ],
          },
          {
            id: 'kwame-voice-note',
            title: 'Kwame’s family group',
            blocks: [
              {
                id: 'kwame-example',
                type: 'example',
                title: 'The screenshot',
                body: "Kwame’s aunt posts a screenshot in the family WhatsApp group. It looks like a news article: “Ghana Health Service warns: drinking cold water after meals causes cancer.” The logo looks official. Three relatives forward it to other groups within minutes.\n\nKwame wants to check it before replying.",
              },
              {
                id: 'kwame-order',
                type: 'order',
                prompt: 'Put Kwame’s checking steps in the SIFT order.',
                items: [
                  { id: 'stop', text: 'Notice he feels alarmed, and decide not to forward or reply yet' },
                  { id: 'source', text: 'Search for the website named on the screenshot to see if it exists and what it is' },
                  { id: 'coverage', text: 'Search the claim to see whether reliable outlets or fact-checkers have reported it' },
                  { id: 'original', text: 'Look for the warning on the Ghana Health Service’s own website and social media pages' },
                ],
                explanation:
                  "In this fictional case, Kwame finds no such warning on the Health Service’s own pages, the website on the screenshot does not exist, and no reliable outlet has reported it. He replies kindly in the group with the link: “I checked this one, it isn’t from the Health Service.” Notice the tone. Embarrassing his aunt in front of the family would make her less likely to listen next time.",
              },
            ],
          },
          {
            id: 'best-source',
            title: 'The best source for the job',
            blocks: [
              {
                id: 'source-choice',
                type: 'choice',
                prompt: 'Ngozi wants to know whether her university really plans to double fees. Which source would best settle the question?',
                multiple: false,
                options: [
                  { id: 'voice-note', text: 'The original voice note, listened to again carefully', correct: false, feedback: 'Listening again cannot tell her whether the speaker is right. She needs evidence from outside the voice note.' },
                  { id: 'union', text: 'The student union president, who is organising the protest', correct: false, feedback: 'He may know something, but he also has a stake in the claim being true. Ask him for his evidence rather than his opinion.' },
                  { id: 'official', text: 'An official statement from the university registry or bursary, checked on its own website or notice board', correct: true, feedback: 'Yes. The organisation that would set the fees is the source closest to the facts. Check it through its own channels, not a forwarded screenshot.' },
                  { id: 'poll', text: 'A poll of students asking whether they believe the rumour', correct: false, feedback: 'That measures belief, not truth.' },
                ],
                explanation:
                  "The best source is usually the one **closest to the facts with the least reason to mislead**, checked through its own channels. Official sources can be wrong or spin too, so for big questions look for a second independent source as well.",
              },
            ],
          },
          {
            id: 'family-poll',
            title: 'When family shares false news',
            blocks: [
              {
                id: 'family-poll-block',
                type: 'poll',
                prompt: 'An older relative shares something you are sure is false in a family group. What do you usually do?',
                options: [
                  { id: 'ignore', text: 'Ignore it. It is not worth the trouble.' },
                  { id: 'private', text: 'Message them privately with a source' },
                  { id: 'public', text: 'Reply in the group with a correction' },
                  { id: 'joke', text: 'Make a joke about it' },
                  { id: 'unsure', text: 'I am usually not sure enough to say anything' },
                ],
                afterword:
                  "There is no perfect answer. In many families, respect for elders makes public correction feel rude. A private message with a source, or a gentle “I checked this one” in the group, often works better than arguing. The goal is to protect people from harm, not to win.",
              },
            ],
          },
          {
            id: 'trace-yours',
            title: 'Trace your claim',
            blocks: [
              {
                id: 'trace-reflection',
                type: 'reflection',
                prompt: 'Apply SIFT to the claim you are auditing. Where did it originally come from? Who is behind the main sources, and what do others say about them? What does the best available source say?',
                guidance: 'List at least three sources and rate each one: close to the facts or far away, independent or with a stake in the answer.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'numbers-that-mislead',
      type: 'lesson',
      title: 'Numbers, charts and headlines that mislead',
      minutes: 14,
      required: true,
      payload: {
        steps: [
          {
            id: 'numbers-intro',
            title: 'Why numbers feel true',
            blocks: [
              {
                id: 'numbers-text',
                type: 'text',
                body: "A number makes a claim feel scientific. “73% of customers prefer us” sounds stronger than “customers like us”. But numbers can mislead as easily as words, and usually more quietly.\n\nYou do not need advanced maths to protect yourself. You need a short list of questions to ask every time.",
              },
              {
                id: 'stats-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'sxYrzzy3cq8',
                title: 'How statistics can be misleading - Mark Liddell',
                channel: 'TED-Ed',
                durationS: 259,
                caption: 'Watch for how the same data can support opposite conclusions depending on how it is grouped. The lesson: always ask what is hiding inside an average.',
              },
            ],
          },
          {
            id: 'graph',
            title: 'Same numbers, different story',
            blocks: [
              {
                id: 'graph-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Misusestatistics_0001_%28cropped%29.png',
                alt: 'Two bar charts side by side, both showing A at 40 and B at 50. On the left the vertical axis starts at 36, so B looks several times taller than A. On the right the axis starts at 0, and the bars look much closer in height.',
                caption: 'The same two numbers, 40 and 50, drawn twice.',
                credit: 'Chart: Joxemai / Wikimedia Commons, CC BY-SA 3.0',
              },
              {
                id: 'graph-reveal',
                type: 'reveal',
                prompt: 'Both charts show 40 and 50. Why does B look so much bigger on the left?',
                body: "Look at where the vertical axis starts. On the left it starts at 36, not 0, so the tiny difference fills the whole chart. On the right it starts at 0, and you can see B is a quarter bigger than A, not several times bigger.\n\nCutting the axis is not always dishonest. Sometimes small changes matter. But always **read the axis before you read the bars**.",
              },
            ],
          },
          {
            id: 'number-terms',
            title: 'Five ideas that protect you',
            blocks: [
              {
                id: 'number-key-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Sample', definition: 'Who was actually counted or asked. Ten friends on WhatsApp are not “Nigerians”. Ask how many, and how they were chosen.' },
                  { term: 'Base rate', definition: 'How common something is in the first place. “Cases doubled” matters less if it went from 2 to 4.' },
                  { term: 'Relative vs absolute', definition: '“Risk up 50%” may mean from 2 in 1,000 to 3 in 1,000. Always ask: 50% of what?' },
                  { term: 'Correlation vs causation', definition: 'Two things rising together does not mean one causes the other. A third factor may drive both.' },
                  { term: 'Average', definition: 'The mean can be pulled up by a few extreme values. One billionaire in a village makes the “average” villager rich.' },
                ],
              },
            ],
          },
          {
            id: 'zanele-pitch',
            title: 'Zanele reads a pitch deck',
            blocks: [
              {
                id: 'zanele-story',
                type: 'callout',
                tone: 'story',
                title: 'Zanele, junior analyst, Johannesburg',
                body: "Zanele works at an impact investment fund. A start-up selling solar lamps to schools sends a pitch deck. Slide 4, in huge letters: **“Revenue up 400% this year!”** Slide 7: “Schools using our lamps saw exam pass rates rise.”\n\nIn the appendix, Zanele finds the detail. Last year the start-up had one customer. This year it has five.",
              },
              {
                id: 'zanele-choice',
                type: 'choice',
                prompt: 'What is the most important thing Zanele should conclude about “Revenue up 400%”?',
                multiple: false,
                options: [
                  { id: 'fake', text: 'The number is a lie.', correct: false, feedback: 'Going from one customer to five may well be a 400% rise. The number can be accurate and still mislead.' },
                  { id: 'base', text: 'The number is accurate but tells her little, because the starting point was tiny.', correct: true, feedback: 'Yes. Large percentage changes from small bases are common, and easy to make look impressive.' },
                  { id: 'great', text: 'This is an outstanding company and the fund should invest quickly.', correct: false, feedback: 'Five customers is an early signal, not proof of a business. She needs more evidence.' },
                  { id: 'ignore', text: 'Percentages should never be used in pitches.', correct: false, feedback: 'Percentages are fine. They just need the base alongside them.' },
                ],
                explanation:
                  "Always ask **“from what, to what?”** A start-up going from one customer to five has made real progress, and Zanele should say so. But she should report it as “five customers”, not “400% growth”.",
              },
            ],
          },
          {
            id: 'question-match',
            title: 'The right question',
            blocks: [
              {
                id: 'question-match-block',
                type: 'match',
                prompt: 'Match each claim to the first question you should ask about it.',
                pairs: [
                  { id: 'causal', left: '“Schools using our lamps saw pass rates rise.”', right: 'What else changed at those schools at the same time?' },
                  { id: 'survey', left: '“9 out of 10 users love our app.”', right: 'Which users were asked, and how many?' },
                  { id: 'risk', left: '“This food doubles your risk of a rare illness.”', right: 'Doubles it from what to what?' },
                  { id: 'average', left: '“The average income in our estate is very high.”', right: 'Is a small number of very rich households pulling the average up?' },
                ],
                explanation:
                  "Each claim might be true. But each one hides a gap that the right question exposes. Over time these questions become automatic, and you start to notice what numbers leave out.",
              },
            ],
          },
          {
            id: 'survey-check',
            title: 'Check a survey',
            blocks: [
              {
                id: 'survey-choice',
                type: 'choice',
                prompt: 'A headline says: “Survey: 80% of young Africans would rather start a business than get a job.” Which questions should you ask before you believe or share it? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'who', text: 'Who was surveyed, how many, and in which countries?', correct: true, feedback: 'Yes. An online poll of a startup newsletter’s readers is not “young Africans”.' },
                  { id: 'question', text: 'What exact question were people asked?', correct: true, feedback: 'Yes. “Would you like to own a business one day?” is very different from “Would you turn down a job offer?”' },
                  { id: 'funder', text: 'Who paid for the survey?', correct: true, feedback: 'Yes. A funder with an interest in the answer is not proof of bias, but it is worth knowing.' },
                  { id: 'agree', text: 'Do I agree with the result?', correct: false, feedback: 'Your agreement tells you nothing about whether the survey is sound. If anything, check harder when you agree.' },
                ],
                explanation:
                  "Who, how many, what exact question, and who paid. Four questions that take a few minutes, and they catch most misleading surveys.",
              },
            ],
          },
        ],
      },
    },
    {
      key: 'viral-claim-discussion',
      type: 'discussion',
      title: 'Discussion: a viral claim, checked',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Find a claim that has gone viral in your WhatsApp groups, social media feed or community in the last few months. Use SIFT to check it.\n\nIn your post, share:\n\n1. The claim, and where you met it.\n2. What you found when you investigated the source and traced it to the original.\n3. Your verdict: true, false, misleading or not yet known, and how confident you are.\n4. How you would respond if someone you respect shared it.\n\nThen reply to at least two classmates. Did they check the best available source? Is there a question about the numbers they could still ask?",
        guidance: 'Do not repost harmful content in full. Describe it instead. Be kind about the people who shared it: most were trying to help someone.',
        minWords: 80,
      },
    },
    {
      key: 'evidence-quiz',
      type: 'quiz',
      title: 'Module quiz: Evidence',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on sources, viral content and numbers. You need 70% to pass and you can retake it as many times as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-sift',
            type: 'order',
            prompt: 'Put the four SIFT moves in order.',
            items: [
              { id: 'stop', text: 'Stop' },
              { id: 'investigate', text: 'Investigate the source' },
              { id: 'find', text: 'Find better coverage' },
              { id: 'trace', text: 'Trace to the original' },
            ],
            explanation: 'Stop, Investigate the source, Find better coverage, Trace to the original. The first move is the most important: noticing your own reaction before you share.',
          },
          {
            id: 'q-lateral',
            type: 'choice',
            prompt: 'What is lateral reading?',
            multiple: false,
            options: [
              { id: 'a', text: 'Reading an article carefully from top to bottom', correct: false, feedback: 'That is vertical reading. It tells you what a page says about itself, not whether to trust it.' },
              { id: 'b', text: 'Leaving a page to see what other sources say about it and its claims', correct: true },
              { id: 'c', text: 'Reading only the headline and the last paragraph', correct: false, feedback: 'That is skimming, and it misses context.' },
              { id: 'd', text: 'Reading the comments under a post', correct: false, feedback: 'Comments can help, but they are not reliable sources in themselves.' },
            ],
            explanation: 'Professional fact-checkers open new tabs and search for the source and the claim, instead of judging a page by its look.',
          },
          {
            id: 'q-base',
            type: 'choice',
            prompt: 'A news site reports: “Cases of a rare disease in our county have tripled.” What is the most useful question to ask first?',
            multiple: false,
            options: [
              { id: 'a', text: 'Tripled from how many to how many?', correct: true },
              { id: 'b', text: 'Which reporter wrote the story?', correct: false, feedback: 'Worth knowing, but the numbers matter more here.' },
              { id: 'c', text: 'Is the disease contagious?', correct: false, feedback: 'Important, but first find out how big the change actually is.' },
              { id: 'd', text: 'How many people shared the story?', correct: false, feedback: 'Popularity says nothing about accuracy.' },
            ],
            explanation: 'From 1 case to 3 is very different from 1,000 to 3,000. Without the base, a percentage or a multiple tells you little.',
          },
          {
            id: 'q-match-numbers',
            type: 'match',
            prompt: 'Match each term to its example.',
            pairs: [
              { id: 'corr', left: 'Correlation, not causation', right: 'Ice-cream sales and drownings rise together, because both rise in hot weather' },
              { id: 'sample', left: 'Weak sample', right: 'A poll of 20 people in one church presented as “what Kenyans think”' },
              { id: 'relative', left: 'Relative risk', right: '“Risk up 50%” when it went from 2 to 3 in 1,000' },
              { id: 'axis', left: 'Misleading chart', right: 'A bar chart whose axis starts at 36 instead of 0' },
            ],
            explanation: 'Four of the most common ways numbers mislead. Each has a simple question that exposes it.',
          },
          {
            id: 'q-sources',
            type: 'choice',
            prompt: 'Which of these make a source more trustworthy for a particular claim? Select all that apply.',
            multiple: true,
            options: [
              { id: 'close', text: 'It is close to the facts, such as the organisation that made the decision', correct: true },
              { id: 'independent', text: 'Other independent sources report the same thing', correct: true },
              { id: 'track', text: 'It has a record of correcting its mistakes publicly', correct: true },
              { id: 'design', text: 'Its website looks professional', correct: false, feedback: 'Anyone can build a professional-looking site in an afternoon.' },
              { id: 'shares', text: 'It has been shared thousands of times', correct: false, feedback: 'Popularity is not reliability.' },
            ],
            explanation: 'Closeness to the facts, independent confirmation and a record of honesty. Looks and popularity tell you almost nothing.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Your own mind, and your Argument Audit
// ---------------------------------------------------------------------------

const auditTemplate = [
  'ARGUMENT AUDIT',
  '',
  '1. The claim',
  'State the claim in one sentence, exactly as its supporters would put it. Where did you meet it, and why does it matter?',
  '',
  '2. The argument mapped',
  'Reasons given for the claim, the evidence offered for each, and the hidden assumptions underneath.',
  '',
  '3. Sources checked',
  'At least three sources. For each: who is behind it, how close it is to the facts, and whether it has a stake in the answer.',
  '',
  '4. The evidence tested',
  'What holds up and what does not. Any numbers or charts examined, and the questions you asked of them.',
  '',
  '5. Fallacies and persuasion tricks',
  'Any used by supporters or critics of the claim, with examples.',
  '',
  '6. The strongest counter-argument',
  'The best case against your conclusion, stated fairly.',
  '',
  '7. Your biases',
  'What you believed before you started, and what you did to check yourself.',
  '',
  '8. Your conclusion',
  'Your verdict (true, mostly true, misleading, false or not yet known), how confident you are, and what new evidence would change your mind.',
].join('\n');

const moduleOwnMind: Module = {
  key: 'own-mind',
  title: 'Your own mind, and your Argument Audit',
  summary:
    'Turn critical thinking on yourself: notice the biases that bend your judgement, practise habits that counter them, then build a clear, fair, well-evidenced argument of your own in your Argument Audit.',
  weekNo: 2,
  items: [
    {
      key: 'your-biases',
      type: 'lesson',
      title: 'The biases in your own thinking',
      minutes: 18,
      required: true,
      payload: {
        steps: [
          {
            id: 'soldier-scout',
            title: 'Soldier or scout?',
            blocks: [
              {
                id: 'soldier-text',
                type: 'text',
                body: "So far you have judged other people’s arguments. Now the harder part: your own.\n\nEvery human mind takes shortcuts. They help us decide quickly, but they also bend what we notice and what we believe. Knowing about bias does not make you immune. Often it just makes you better at spotting it in others.\n\nIn this talk, Julia Galef describes two mindsets. As you watch, ask honestly which one you bring to arguments you care about.",
              },
              {
                id: 'galef-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'w4RLfVxTGH4',
                title: "Why you think you're right -- even if you're wrong | Julia Galef",
                channel: 'TED',
                durationS: 698,
                caption: 'Galef contrasts the “soldier” who defends beliefs with the “scout” who wants to see what is really there. Watch for what she says scouts feel when they discover they were wrong.',
              },
            ],
          },
          {
            id: 'bias-terms',
            title: 'Six biases to watch',
            blocks: [
              {
                id: 'bias-key-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Confirmation bias', definition: 'Noticing, seeking and remembering evidence that supports what you already believe, and skipping the rest.' },
                  { term: 'Motivated reasoning', definition: 'Reasoning towards the conclusion you want, then believing you reasoned your way there fairly.' },
                  { term: 'In-group bias', definition: 'Trusting claims from your own tribe, faith, party, school or club more than the same claim from outsiders.' },
                  { term: 'Availability bias', definition: 'Judging how common something is by how easily examples come to mind. Dramatic stories feel more frequent than they are.' },
                  { term: 'Anchoring', definition: 'Being pulled towards the first number you hear, even when it is irrelevant. Very common in bargaining.' },
                  { term: 'Overconfidence', definition: 'Being more sure than your evidence justifies, especially in areas where you know a little.' },
                ],
              },
            ],
          },
          {
            id: 'zanele-bias',
            title: 'Zanele and the founder',
            blocks: [
              {
                id: 'zanele-scenario',
                type: 'scenario',
                situation:
                  "Zanele meets the founder of the solar-lamp start-up. He went to her university, grew up near her home town and is brilliant company. She leaves the meeting excited and certain this is a great investment.\n\nHer manager asks for her recommendation by Friday.",
                prompt: 'What should Zanele do?',
                options: [
                  {
                    id: 'trust-gut',
                    text: 'Recommend investing. Her instinct for people is good, and the founder is clearly talented.',
                    outcome: "Her manager asks for evidence of demand from schools. Zanele has none beyond the five customers. Her recommendation looks like enthusiasm rather than analysis, and the fund asks someone else to review it.",
                    best: false,
                  },
                  {
                    id: 'name-bias',
                    text: 'Write down that she likes the founder and shares his background, then deliberately look for the strongest reasons not to invest before deciding.',
                    outcome: "Zanele finds two real risks: schools pay late, and a larger competitor is entering the market. She also confirms that the five schools are happy and have ordered more. Her recommendation, a small investment with conditions, is sharper and more trusted because she shows her doubts.",
                    best: true,
                  },
                  {
                    id: 'reject',
                    text: 'Recommend against investing, to prove she is not biased.',
                    outcome: "Overcorrecting is still bias. She rejects a possibly good opportunity for a reason that has nothing to do with the evidence.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'bias-match',
            title: 'Name the bias',
            blocks: [
              {
                id: 'bias-match-block',
                type: 'match',
                prompt: 'Match each situation to the bias at work.',
                pairs: [
                  { id: 'confirm', left: 'Baraka’s friend only reads the scheme’s success stories and scrolls past the warnings.', right: 'Confirmation bias' },
                  { id: 'ingroup', left: 'Kwame’s aunt trusts a rumour because it came from her church group.', right: 'In-group bias' },
                  { id: 'avail', left: 'After one plane crash in the news, Ngozi’s cousin thinks flying is more dangerous than road travel.', right: 'Availability bias' },
                  { id: 'anchor', left: 'A trader opens at 50,000 for a phone worth 20,000, and the buyer feels 35,000 is a bargain.', right: 'Anchoring' },
                ],
                explanation:
                  "Each bias is a shortcut that usually saves time and occasionally costs a lot. The defence is not to stop using shortcuts, but to slow down when the stakes are high.",
              },
            ],
          },
          {
            id: 'change-mind',
            title: 'Changing your mind',
            blocks: [
              {
                id: 'change-scale',
                type: 'scale',
                prompt: 'When someone shows you good evidence that you were wrong about something you care about, how easily do you change your mind?',
                minLabel: 'Very hard for me',
                maxLabel: 'Quite easily',
                afterword:
                  "Changing your mind gracefully is a skill, and a sign of strength, not weakness. Galef’s scouts feel curiosity, even pleasure, when they find they were wrong. You can practise that feeling.",
              },
              {
                id: 'debias-framework',
                type: 'framework',
                title: 'Four habits that counter bias',
                steps: [
                  { label: 'Consider the opposite', detail: 'Ask: “What would I expect to see if I were wrong?” Then go and look for it.' },
                  { label: 'Swap the source', detail: 'Ask: “Would I believe this if it came from a group I distrust?” If not, your trust is doing the work, not the evidence.' },
                  { label: 'Say your confidence', detail: 'Put a rough number on it: 60% sure, 90% sure. It forces honesty and makes updating easier.' },
                  { label: 'Ask a fair critic', detail: 'Show your reasoning to someone who disagrees with you and respects you. Listen for the point that stings.' },
                ],
              },
            ],
          },
          {
            id: 'bias-reflect',
            title: 'Check yourself',
            blocks: [
              {
                id: 'bias-reflection',
                type: 'reflection',
                prompt: 'For the claim you are auditing: what did you believe before you started, and why? Which bias is most likely to be bending your judgement? What evidence would change your mind?',
                guidance: 'Be specific and honest. This becomes the “Your biases” section of your Argument Audit.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'your-own-argument',
      type: 'lesson',
      title: 'Building an argument of your own',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'persuade-honestly',
            title: 'Persuading honestly',
            blocks: [
              {
                id: 'persuade-text',
                type: 'text',
                body: "Critical thinking is not only defence. Builders have to persuade: investors, customers, communities, governments. The question is whether you persuade with evidence or with tricks.\n\nOver two thousand years ago, Aristotle described three ways to persuade: through your credibility, through emotion, and through reasoning. All three are legitimate. They become manipulation when they replace the truth instead of serving it.",
              },
              {
                id: 'aristotle-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'O2dEuMFR8kw',
                title: 'What Aristotle and Joshua Bell can teach us about persuasion - Conor Neill',
                channel: 'TED-Ed',
                durationS: 280,
                caption: 'Watch for ethos, pathos and logos. Then ask which of the three your own arguments lean on most, and which they neglect.',
              },
            ],
          },
          {
            id: 'strong-argument',
            title: 'The shape of a strong argument',
            blocks: [
              {
                id: 'strong-framework',
                type: 'framework',
                title: 'Five parts of a strong written argument',
                steps: [
                  { label: 'Clear claim', detail: 'One sentence a stranger could understand. Not vague, not hedged into nothing.' },
                  { label: 'Reasons with evidence', detail: 'Two or three reasons, each backed by evidence the reader can check.' },
                  { label: 'Honest assumptions', detail: 'Say what your argument depends on, so readers can judge it.' },
                  { label: 'Strongest objection', detail: 'State the best case against you, fairly, and answer it. Or admit where it lands.' },
                  { label: 'Calibrated conclusion', detail: 'Say how confident you are, and what would change your mind.' },
                ],
              },
              {
                id: 'steelman-example',
                type: 'example',
                title: 'Straw man versus steel man',
                body: "**Straw man:** “People who support the new market levy just want to squeeze poor traders.”\n\n**Steel man:** “Supporters of the levy argue that the market’s drains and toilets are failing, that the council has no other funding for repairs, and that traders lose more from flooding than they would pay in the levy.”\n\nA steel man is the strongest, fairest version of the view you disagree with. If your argument can beat the steel man, it is strong. If it can only beat the straw man, it is not.",
              },
            ],
          },
          {
            id: 'calibrated',
            title: 'Say how sure you are',
            blocks: [
              {
                id: 'calibrated-choice',
                type: 'choice',
                prompt: 'Ngozi has investigated a rumour that a popular campus food vendor uses expired ingredients. She found one student’s complaint, a clean recent health inspection and no other reports. Which conclusion is best?',
                multiple: false,
                options: [
                  { id: 'false', text: '“The rumour is completely false and the vendor is perfectly safe.”', correct: false, feedback: 'Too strong. One inspection cannot prove there has never been a problem.' },
                  { id: 'calibrated', text: '“I found no evidence to support the rumour beyond one complaint, and a recent inspection was clean. It is probably untrue, but I will update this post if new evidence appears.”', correct: true, feedback: 'Yes. Clear verdict, honest confidence, and open to new evidence.' },
                  { id: 'unknown', text: '“Nobody can ever really know anything, so decide for yourself.”', correct: false, feedback: 'That abandons the reader. Ngozi has evidence and should say what it suggests.' },
                  { id: 'true', text: '“Where there is smoke there is fire. Avoid the vendor.”', correct: false, feedback: 'A proverb is not evidence, and this could damage an innocent business.' },
                ],
                explanation:
                  "A calibrated conclusion matches its confidence to the evidence. It is clear enough to act on and honest enough to be trusted. Words like “probably”, “the evidence suggests” and “I would change my view if…” are signs of strength, not weakness.",
              },
            ],
          },
          {
            id: 'audit-order',
            title: 'Build your audit',
            blocks: [
              {
                id: 'audit-order-block',
                type: 'order',
                prompt: 'Put the sections of an Argument Audit into a sensible order.',
                items: [
                  { id: 'claim', text: 'State the claim fairly' },
                  { id: 'map', text: 'Map its reasons, evidence and assumptions' },
                  { id: 'sources', text: 'Check the sources' },
                  { id: 'test', text: 'Test the evidence and spot any fallacies' },
                  { id: 'counter', text: 'State the strongest counter-argument' },
                  { id: 'conclude', text: 'Give your calibrated conclusion' },
                ],
                explanation:
                  "Describe before you judge. You state and map the claim as its supporters would, then test it, then face the best objection to your view, and only then conclude.",
              },
            ],
          },
          {
            id: 'good-habits',
            title: 'Habits of a fair thinker',
            blocks: [
              {
                id: 'habits-choice',
                type: 'choice',
                prompt: 'Which of these make your own argument more trustworthy? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'cite', text: 'Showing where each piece of evidence came from', correct: true, feedback: 'Yes. Readers can check it for themselves.' },
                  { id: 'steel', text: 'Stating the opposing view in a way its supporters would accept', correct: true, feedback: 'Yes. That is a steel man.' },
                  { id: 'confidence', text: 'Saying how confident you are and what would change your mind', correct: true, feedback: 'Yes. It shows you are following the evidence, not defending a position.' },
                  { id: 'emotion', text: 'Using only emotional stories, because they persuade best', correct: false, feedback: 'Stories help people care, but on their own they are anecdotes. Pair them with evidence.' },
                  { id: 'hide', text: 'Leaving out evidence that does not fit', correct: false, feedback: 'That is cherry-picking. When readers find out, and they often do, they stop trusting everything else you said.' },
                ],
                explanation:
                  "The most persuasive arguments over time are the most honest ones. People trust a builder who shows their working and admits uncertainty.",
              },
            ],
          },
          {
            id: 'draft-conclusion',
            title: 'Draft your conclusion',
            blocks: [
              {
                id: 'conclusion-reflection',
                type: 'reflection',
                prompt: 'Draft the final two sections of your Argument Audit. First, state the strongest counter-argument to your view as fairly as you can. Then give your conclusion: your verdict, how confident you are, and what evidence would change your mind.',
                guidance: 'If you cannot state the other side in a way its supporters would accept, go back and read their best sources again.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'own-mind-quiz',
      type: 'quiz',
      title: 'Module quiz: Your own mind',
      minutes: 6,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Four questions on bias, calibration and building fair arguments. You need 75% to pass and you can retake it as many times as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'q-bias-match',
            type: 'match',
            prompt: 'Match each bias to its description.',
            pairs: [
              { id: 'confirm', left: 'Confirmation bias', right: 'Seeking and remembering evidence that supports what you already believe' },
              { id: 'avail', left: 'Availability bias', right: 'Judging how common something is by how easily examples come to mind' },
              { id: 'anchor', left: 'Anchoring', right: 'Being pulled towards the first number you hear' },
              { id: 'ingroup', left: 'In-group bias', right: 'Trusting a claim more because it comes from your own group' },
            ],
            explanation: 'Each one is a useful shortcut most of the time. Knowing their names helps you notice when the stakes are high enough to slow down.',
          },
          {
            id: 'q-scout',
            type: 'choice',
            prompt: 'In Julia Galef’s terms, what is a “scout mindset”?',
            multiple: false,
            options: [
              { id: 'a', text: 'Defending your side’s beliefs against attack', correct: false, feedback: 'That is the soldier mindset.' },
              { id: 'b', text: 'Wanting to see things as they really are, even when it is unwelcome', correct: true },
              { id: 'c', text: 'Refusing to hold any opinions at all', correct: false, feedback: 'Scouts do form views. They just hold them in proportion to the evidence.' },
              { id: 'd', text: 'Always agreeing with experts', correct: false, feedback: 'Scouts weigh experts carefully, but they are motivated by accuracy, not deference.' },
            ],
            explanation: 'The scout’s goal is an accurate map. Discovering they were wrong is useful news, not a defeat.',
          },
          {
            id: 'q-calibrated',
            type: 'choice',
            prompt: 'Which conclusion is best calibrated, given mixed evidence?',
            multiple: false,
            options: [
              { id: 'a', text: '“This is definitely true. Anyone who disagrees is lying.”', correct: false, feedback: 'Overconfident, and it attacks people instead of weighing evidence.' },
              { id: 'b', text: '“The evidence leans towards this being true, but two good studies disagree. I am about 65% sure.”', correct: true },
              { id: 'c', text: '“Since the evidence is mixed, every view is equally valid.”', correct: false, feedback: 'Mixed evidence rarely means a perfect tie. Say which way it leans.' },
              { id: 'd', text: '“I will not say anything until the evidence is perfect.”', correct: false, feedback: 'Evidence is never perfect. Builders must decide under uncertainty.' },
            ],
            explanation: 'Calibration means your confidence matches your evidence: clear enough to act on, honest about doubt.',
          },
          {
            id: 'q-strong',
            type: 'choice',
            prompt: 'Which of these belong in a strong argument of your own? Select all that apply.',
            multiple: true,
            options: [
              { id: 'claim', text: 'A clear claim', correct: true },
              { id: 'evidence', text: 'Reasons backed by evidence the reader can check', correct: true },
              { id: 'objection', text: 'The strongest objection, stated fairly', correct: true },
              { id: 'confidence', text: 'How confident you are and what would change your mind', correct: true },
              { id: 'insult', text: 'A reminder that people who disagree are foolish', correct: false, feedback: 'That is an ad hominem, and it closes minds rather than changing them.' },
            ],
            explanation: 'Claim, evidence, honest assumptions, the strongest objection and a calibrated conclusion.',
          },
        ],
      },
    },
    {
      key: 'argument-audit',
      type: 'assignment',
      title: 'Practical Output: your Argument Audit',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: an **Argument Audit** of a real, contested claim from your community or industry.\n\nYour audit should show that you can take an argument apart fairly, trace its evidence to the source, test its logic and numbers, notice your own biases, and reach a conclusion you can defend, with confidence that matches the evidence.\n\nYou have drafted most of it in your journal. Now bring it together and sharpen it. Your audit joins your Dream Lab portfolio and forms part of your Life Architecture Blueprint.\n\nA faculty reviewer will grade it against the rubric below.",
        practicalOutput: 'Argument Audit',
        steps: [
          'Choose the claim you worked on through the course. If you have found a better one, switch now.',
          'Gather your journal reflections: your chosen claim, argument map, persuasion tricks, source trace, bias check and draft conclusion.',
          'Check at least three sources, including the one closest to the facts. Record who is behind each one.',
          'Test any numbers, charts or surveys with the questions from the Evidence module.',
          'Write the strongest counter-argument to your conclusion, and answer it honestly.',
          'Fill in every section of the template below. Aim for clear and short rather than long.',
          'Read your conclusion again. Does your confidence match your evidence? Adjust it if not.',
          'Submit, and share your conclusion with one person who believes the claim. Note in your journal how the conversation went.',
        ],
        rubric: [
          { id: 'claim-map', criterion: 'Claim fairly stated and mapped', description: 'States the claim as its supporters would, and maps its reasons, evidence and at least two hidden assumptions accurately.' },
          { id: 'sources', criterion: 'Sources traced and judged', description: 'Checks at least three sources including the one closest to the facts, traces key claims to their origin, and judges each source’s reliability and interests.' },
          { id: 'evidence-logic', criterion: 'Evidence and logic tested', description: 'Tests the evidence, including any numbers, and identifies fallacies or persuasion tricks on any side with specific examples.' },
          { id: 'counter', criterion: 'Strongest counter-argument', description: 'States the best opposing case fairly, in a form its supporters would recognise, and responds to it honestly.' },
          { id: 'self-awareness', criterion: 'Bias awareness', description: 'Names the author’s own prior view and likely biases, and shows what was done to check them.' },
          { id: 'conclusion', criterion: 'Calibrated conclusion', description: 'Gives a clear verdict with a stated level of confidence that matches the evidence, and names what would change the author’s mind.' },
        ],
        template: auditTemplate,
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
          "Nine questions across the whole course: arguments, fallacies, persuasion, sources, numbers and bias. Most follow a new case.\n\nYou need 75% to pass and you can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-claim',
            type: 'match',
            prompt: 'New case: Efua, a nursing student in Cape Coast, sees a post: “Our herbal tea flushes out malaria in three days. Trusted by thousands of families. Even Dr Mensah, a famous radio presenter, drinks it.” Match each part of the post.',
            pairs: [
              { id: 'claim', left: '“Our herbal tea flushes out malaria in three days.”', right: 'Claim' },
              { id: 'popular', left: '“Trusted by thousands of families.”', right: 'Appeal to popularity' },
              { id: 'authority', left: '“Even Dr Mensah, a famous radio presenter, drinks it.”', right: 'Misplaced authority' },
              { id: 'assumption', left: 'That a person’s symptoms clearing means the parasite is gone', right: 'Hidden assumption' },
            ],
            explanation: 'The post offers a claim, a crowd and a celebrity, but no evidence. And its hidden assumption is dangerous: malaria symptoms can ease while the infection continues.',
          },
          {
            id: 'f-case-response',
            type: 'choice',
            prompt: 'What should Efua do before sharing her view on the tea?',
            multiple: false,
            options: [
              { id: 'a', text: 'Search for whether health authorities or reliable fact-checkers have assessed the claim', correct: true },
              { id: 'b', text: 'Try the tea herself to see if it works', correct: false, feedback: 'One person’s experience cannot test a malaria cure, and delaying proper treatment is dangerous.' },
              { id: 'c', text: 'Count how many likes the post has', correct: false, feedback: 'Popularity is not evidence.' },
              { id: 'd', text: 'Ask the seller whether it works', correct: false, feedback: 'The seller has a strong interest in the answer.' },
            ],
            explanation: 'Find better coverage from sources close to the facts and without a stake in the sale. For a health claim, that means health authorities and published research.',
          },
          {
            id: 'f-fallacy',
            type: 'choice',
            prompt: 'In a debate about the tea, someone says: “So you think our grandmothers’ medicine is all rubbish?” Efua had only said there was no evidence for this tea curing malaria. Which fallacy is this?',
            multiple: false,
            options: [
              { id: 'a', text: 'Straw man', correct: true },
              { id: 'b', text: 'Post hoc', correct: false, feedback: 'Post hoc is about assuming cause from timing.' },
              { id: 'c', text: 'Anchoring', correct: false, feedback: 'Anchoring is a bias about first numbers, not a fallacy in argument.' },
              { id: 'd', text: 'Base rate', correct: false, feedback: 'A base rate is a statistical idea, not a fallacy.' },
            ],
            explanation: 'Her narrow claim about one tea has been replaced by a much broader one she never made. Restating what she actually said is the fair response.',
          },
          {
            id: 'f-numbers',
            type: 'choice',
            prompt: 'The seller then posts: “Customers who drank our tea were 50% less likely to be admitted to hospital!” Which questions expose whether this means anything? Select all that apply.',
            multiple: true,
            options: [
              { id: 'base', text: '50% less from what, to what?', correct: true },
              { id: 'who', text: 'Who was compared with whom, and how were they chosen?', correct: true },
              { id: 'other', text: 'Did the tea drinkers also get proper treatment, or differ in other ways?', correct: true },
              { id: 'font', text: 'Is the number written in a large font?', correct: false, feedback: 'Presentation tells you nothing about whether the comparison is fair.' },
            ],
            explanation: 'Base rate, sample and other causes. People who buy health products may differ in income, age or access to clinics. Without a fair comparison, the number shows correlation at most.',
          },
          {
            id: 'f-scheme',
            type: 'choice',
            prompt: 'A friend invites you to a scheme: “Pay 50,000 to join, earn 20,000 for every two people you bring in, and it’s guaranteed.” What is it most likely to be?',
            multiple: false,
            options: [
              { id: 'a', text: 'A pyramid scheme', correct: true },
              { id: 'b', text: 'A normal savings group', correct: false, feedback: 'Savings groups do not pay members for recruiting others.' },
              { id: 'c', text: 'A licensed investment fund', correct: false, feedback: 'Licensed funds do not guarantee returns or pay recruiting bonuses.' },
              { id: 'd', text: 'A business loan', correct: false, feedback: 'Nothing is being lent or repaid.' },
            ],
            explanation: 'Paying to join plus earning from recruitment plus a guarantee: the classic pattern. Returns come from newer members, so most members eventually lose.',
          },
          {
            id: 'f-bias',
            type: 'match',
            prompt: 'Match each bias to the habit that best counters it.',
            pairs: [
              { id: 'confirm', left: 'Confirmation bias', right: 'Ask what you would expect to see if you were wrong, then look for it' },
              { id: 'ingroup', left: 'In-group bias', right: 'Ask whether you would believe it from a group you distrust' },
              { id: 'over', left: 'Overconfidence', right: 'Put a rough number on how sure you are' },
              { id: 'motivated', left: 'Motivated reasoning', right: 'Show your reasoning to a fair critic who disagrees' },
            ],
            explanation: 'You cannot switch biases off. You can build habits that catch them when the stakes are high.',
          },
          {
            id: 'f-steel',
            type: 'choice',
            prompt: 'What is a steel man?',
            multiple: false,
            options: [
              { id: 'a', text: 'The strongest, fairest version of a view you disagree with', correct: true },
              { id: 'b', text: 'An argument that cannot be defeated', correct: false, feedback: 'Any argument can be challenged. A steel man is about fairness to the other side.' },
              { id: 'c', text: 'A personal attack dressed up as logic', correct: false, feedback: 'That is closer to an ad hominem.' },
              { id: 'd', text: 'A confident speaker who never admits doubt', correct: false, feedback: 'That is overconfidence, not a steel man.' },
            ],
            explanation: 'If your conclusion survives the strongest version of the other side, you can hold it with more confidence.',
          },
          {
            id: 'f-audit-order',
            type: 'order',
            prompt: 'Put the stages of an Argument Audit in order.',
            items: [
              { id: 'state', text: 'State and map the claim' },
              { id: 'sources', text: 'Trace and judge the sources' },
              { id: 'test', text: 'Test the evidence and logic' },
              { id: 'counter', text: 'Face the strongest counter-argument' },
              { id: 'conclude', text: 'Reach a calibrated conclusion' },
            ],
            explanation: 'Describe, check, test, challenge yourself, then conclude. Judging too early is how good thinkers go wrong.',
          },
          {
            id: 'f-conclusion',
            type: 'choice',
            prompt: 'Efua’s research finds no reliable evidence that the tea treats malaria, and health authorities warn against using herbal products instead of tested treatment. Which conclusion is best calibrated?',
            multiple: false,
            options: [
              { id: 'a', text: '“There is no reliable evidence this tea treats malaria, and relying on it could delay real treatment. Anyone with malaria symptoms should get tested and treated at a clinic.”', correct: true },
              { id: 'b', text: '“All herbal medicine is fake.”', correct: false, feedback: 'Far broader than her evidence, and unfair to remedies that have been properly studied.' },
              { id: 'c', text: '“Who knows? It might work for some people.”', correct: false, feedback: 'Too weak. She has clear evidence and a real risk to warn about.' },
              { id: 'd', text: '“The seller is a criminal.”', correct: false, feedback: 'That goes beyond her evidence about the claim and attacks a person.' },
            ],
            explanation: 'Clear, proportionate, focused on the claim and on what people should do. That is what an Argument Audit should end with.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const criticalThinking: CourseAuthoring = {
  slug: 'critical-thinking',
  title: 'Critical Thinking',
  subtitle: "Weigh claims, spot weak arguments and make up your own mind, especially when everyone around you already has.",
  description:
    "Every day you are handed claims: a viral voice note, a politician’s promise, an investor’s pitch, a friend’s sure-fire business idea. Critical thinking is the habit of asking “how do we know?” before you believe, share or act.\n\nIn this course you will learn to break an argument into its claim, reasons and evidence; to recognise the common fallacies that make weak arguments sound strong; to judge sources, statistics and headlines; and to notice the biases in your own thinking. You will practise on the kind of material that fills African WhatsApp groups, newsrooms and boardrooms, from health rumours to “guaranteed” investment schemes.\n\nCritical thinking is not cynicism. The goal is not to doubt everything, but to hold beliefs in proportion to the evidence and to change your mind gracefully when the evidence changes.\n\nYour Practical Output is an **Argument Audit**: a written evaluation of a real, contested claim from your community or industry, tracing its evidence, testing its logic and stating your own reasoned conclusion.",
  provider: 'The African Dream Lab',
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 5,
  outcomes: [
    'Break any argument into its claim, reasons, evidence and hidden assumptions.',
    'Recognise common fallacies and persuasion tricks in speech, media and marketing.',
    'Judge the reliability of sources, statistics and viral content before you share them.',
    'Notice your own biases and use simple habits to counter them.',
    'Build and present a clear, well-evidenced argument of your own.',
  ],
  skills: ['Argument analysis', 'Logical reasoning', 'Source evaluation', 'Media literacy', 'Bias awareness', 'Reasoned writing'],
  audience: 'Young builders and changemakers, roughly 18 to 30, who want to think more clearly, resist misinformation and make sound judgements about people, ideas and opportunities.',
  prerequisites: 'None. Taken alongside Problem Solving in the first weeks of the Lab.',
  practicalOutput: 'Argument Audit',
  cover: {
    from: '#0A0F1E',
    to: '#2B4C7E',
    symbol: '◇',
    imageUrl: "https://images.unsplash.com/photo-1622295023876-0cdf583c41f6?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "A young man smiles as he reads a book at a desk, beside an open laptop and a desk lamp.",
    imageCredit: "Photo: Emmanuel Ikwuegbu / Unsplash",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'dItUGF8GdTw',
    title: "5 tips to improve your critical thinking - Samantha Agoos",
    channel: "TED-Ed",
    durationS: 270,
  },
  instructors: [
    {
      name: 'The African Dream Lab Faculty',
      title: 'Life Architecture faculty',
      bio: 'The Life Architecture faculty of The African Dream Lab brings together educators, journalists, founders and practitioners from across the continent. They teach the habits of mind every builder needs, including how to weigh evidence and think for yourself. The Lab is run by the African Dream Network and grew out of the TADIS conference.',
    },
  ],
  modules: [moduleArguments, moduleEvidence, moduleOwnMind],
};

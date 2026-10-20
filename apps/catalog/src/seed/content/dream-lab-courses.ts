import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * The other twelve courses of The African Dream Lab, published as "coming soon" outlines: no
 * `modules`, so each course page shows its description and outcomes but nobody can enrol yet.
 * Life Architecture (5 credits each), Builder’s Architecture (4 credits each) and the three
 * electives (10 credits each; learners take exactly one).
 */

const provider = 'The African Dream Lab';

// ---------- Life Architecture (weeks 1–4) ----------

const criticalThinking: CourseAuthoring = {
  slug: 'critical-thinking',
  title: 'Critical Thinking',
  subtitle: "Weigh claims, spot weak arguments and make up your own mind, especially when everyone around you already has.",
  description:
    "Every day you are handed claims: a viral voice note, a politician’s promise, an investor’s pitch, a friend’s sure-fire business idea. Critical thinking is the habit of asking “how do we know?” before you believe, share or act.\n\nIn this course you will learn to break an argument into its claim, reasons and evidence; to recognise the common fallacies that make weak arguments sound strong; to judge sources, statistics and headlines; and to notice the biases in your own thinking. You will practise on the kind of material that fills African WhatsApp groups, newsrooms and boardrooms, from health rumours to “guaranteed” investment schemes.\n\nCritical thinking is not cynicism. The goal is not to doubt everything, but to hold beliefs in proportion to the evidence and to change your mind gracefully when the evidence changes.\n\nYour Practical Output is an **Argument Audit**: a written evaluation of a real, contested claim from your community or industry, tracing its evidence, testing its logic and stating your own reasoned conclusion.",
  provider,
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
  instructors: [],
};

const emotionalIntelligence: CourseAuthoring = {
  slug: 'emotional-intelligence',
  title: 'Emotional Intelligence',
  subtitle: 'Understand your emotions, read other people well and stay steady when the pressure rises.',
  description:
    "Talent gets you in the room. Emotional intelligence decides what happens once you are there. How you handle rejection, conflict, stress and other people’s feelings shapes your relationships, your leadership and your ventures.\n\nThis course covers the core of emotional intelligence: self-awareness, self-management, empathy and relationship skills. You will learn to name what you feel with more precision, to notice your triggers, to pause before you react, to listen so people feel heard, and to give and receive hard feedback without damage. You will also look honestly at the pressures many young Africans carry: family expectations, financial strain, uncertainty about the future, and the weight of being “the one who made it”.\n\nThe course is practical and private where it needs to be. Your reflections stay in your journal, and you choose what to share.\n\nYour Practical Output is an **Emotional Intelligence Growth Plan**: a personal map of your strengths, triggers and patterns, with three specific habits you will practise for the rest of the Lab and how you will track them.",
  provider,
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
  instructors: [],
};

const characterAndEthics: CourseAuthoring = {
  slug: 'character-and-ethics',
  title: 'Character Formation and Ethics',
  subtitle: 'Decide who you will be before the hard choices arrive, and build the integrity people can rely on.',
  description:
    "Every builder is tested. A bribe that would speed up a permit. A partner who cuts corners. A chance to take credit for someone else’s work. A shortcut nobody would ever notice. What you do in those moments depends on decisions you made long before.\n\nIn this course you will examine your own values and where they come from, including the wisdom of your family, faith and culture. You will learn practical frameworks for ethical decisions, work through realistic dilemmas from African business, public service and community life, and study how integrity, accountability and trust are built and lost. We take seriously ideas such as *ubuntu*, the conviction that a person is a person through other people, and ask what they demand of a builder today.\n\nThis is not a course about rules. It is about character: the steady, chosen pattern of how you treat people and handle power.\n\nYour Practical Output is a **Personal Values Charter**: a one-page statement of your core values, the lines you will not cross, how you will handle the dilemmas most likely in your path, and who will hold you accountable.",
  provider,
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
  instructors: [],
};

const systemsThinking: CourseAuthoring = {
  slug: 'systems-thinking',
  title: 'Systems Thinking and Formulation',
  subtitle: 'See the whole system behind a problem, find the leverage points and formulate a plan that lasts.',
  description:
    "Some problems refuse to stay solved. Traffic returns after the new road opens. Prices rise again after the subsidy. A project works until the funder leaves. These are signs of a system at work: many parts, connected by feedback, producing results nobody chose.\n\nThis course teaches you to see systems. You will learn to map the actors, flows and feedback loops behind a problem; to recognise common patterns such as vicious circles, delays and “fixes that fail”; and to find leverage points where small changes have big effects. You will then learn formulation: turning that understanding into a clear, staged plan with goals, assumptions and indicators.\n\nYou will practise on systems you know well: a city market, a transport network, a school, a farming value chain, a family economy. The course builds directly on Problem Solving and closes the Life Architecture phase.\n\nYour Practical Output is a **System Map and Leverage Brief**: a map of the system around your chosen problem, the key loops and leverage points you have identified, and a formulated plan of action. Together with your other Life Architecture outputs, it completes your Life Architecture Blueprint.",
  provider,
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
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg/1280px-Aerial_view_of_a_busy_tomato_market_in_Lagos_Nigeria.jpg",
    imageAlt: "An aerial view of a large open-air market where hundreds of baskets and crates of red tomatoes are spread across the ground among crowds of traders.",
    imageCredit: "Photo: Ayorinde Ogundele / Wikimedia Commons, CC BY-SA 4.0",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'A_BtS008J0k',
    title: "In A World of Systems",
    channel: "Donella Meadows",
    durationS: 563,
  },
  instructors: [],
};

// ---------- Builder’s Architecture (weeks 5–8) ----------

const communication: CourseAuthoring = {
  slug: 'communication',
  title: 'Communication',
  subtitle: 'Speak, write and present so people understand, remember and act.',
  description:
    "Great ideas die every day because nobody could explain them. Whether you are pitching to an investor, briefing a team, persuading a community meeting or writing to a government office, how you communicate decides whether anything happens next.\n\nThis course covers the communication every builder needs: structuring a message so the point comes first, telling stories that make people care, writing clear emails, proposals and posts, presenting with confidence in person and on a call, and listening so that conversations go both ways. You will practise adapting the same message for elders, peers, funders and officials, and in more than one language where that helps.\n\nYou will record yourself, receive structured peer feedback and improve through repetition. Many learners say this is the course that changes them most visibly.\n\nYour Practical Output is a **Signature Talk**: a recorded five-minute talk about your dream or problem, refined through two rounds of feedback, together with a one-page written summary.",
  provider,
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
    imageUrl: "https://images.unsplash.com/photo-1581548708095-7158f2e63857?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "A close-up of a microphone on a stand against a soft, blurred background.",
    imageCredit: "Photo: Robinson Recalde / Unsplash",
  },
  trailer: {
    provider: 'youtube',
    videoId: 'eIho2S0ZahI',
    title: "How to Speak So That People Want to Listen | Julian Treasure | TED",
    channel: "TED",
    durationS: 598,
  },
  instructors: [],
};

const negotiation: CourseAuthoring = {
  slug: 'negotiation',
  title: 'Negotiation',
  subtitle: 'Prepare well, understand the other side and reach agreements that last.',
  description:
    "You negotiate more than you think: with suppliers and customers, landlords and employers, partners, family and officials. Most people do it without a plan, and either give too much away or damage the relationship trying not to.\n\nIn this course you will learn to prepare for a negotiation properly: knowing your goals, your walk-away point and your alternatives; understanding the other side’s interests, not just their position; and creating options that make both sides better off. You will practise anchoring, making and asking for concessions, handling pressure tactics and hard bargainers, and negotiating respectfully across differences of age, status and culture, from market haggling to contract talks.\n\nRole plays with classmates, drawn from realistic African business and community situations, let you practise safely before it counts.\n\nYour Practical Output is a **Negotiation Plan and Debrief**: a written plan for a real negotiation in your life or venture, followed by an honest debrief of what happened and what you learnt.",
  provider,
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 4,
  outcomes: [
    'Prepare for any negotiation with clear goals, a walk-away point and strong alternatives.',
    'Uncover the interests behind positions and create options that benefit both sides.',
    'Use and respond to anchors, concessions and common pressure tactics.',
    'Negotiate respectfully across differences of age, status and culture.',
    'Plan, conduct and honestly debrief a real negotiation.',
  ],
  skills: ['Negotiation planning', 'Interest-based bargaining', 'Persuasion', 'Conflict resolution', 'Deal structuring', 'Relationship management'],
  audience: 'Founders, freelancers, employees and community leaders who want to get fairer deals without damaging relationships.',
  prerequisites: 'Communication recommended.',
  practicalOutput: 'Negotiation Plan and Debrief',
  cover: {
    from: '#2A1A3D',
    to: '#7B5EA7',
    symbol: '◐',
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Makola_Market_Entrance%2C_Accra%2C_Ghana.JPG/1280px-Makola_Market_Entrance%2C_Accra%2C_Ghana.JPG",
    imageAlt: "Traders and shoppers crowd the street in front of a yellow building with a large sign reading Welcome to Makola Market.",
    imageCredit: "Photo: Benggriff / Wikimedia Commons, CC BY-SA 3.0",
  },
  trailer: {
    provider: 'youtube',
    videoId: '4HzZXoOPObg',
    title: "What the Best Negotiators Do Differently",
    channel: "Harvard Business Review",
    durationS: 69,
  },
  instructors: [],
};

const financialIntelligence: CourseAuthoring = {
  slug: 'financial-intelligence',
  title: 'Financial Intelligence',
  subtitle: 'Understand money well enough to run your life and your venture with confidence.',
  description:
    "Many good ventures fail not because the idea was wrong, but because the money ran out, was mixed with family money, or was never really understood. Financial intelligence is the ability to read, plan and decide with numbers.\n\nThis course covers personal and venture finance in plain language. You will learn to budget and track cash flow, to separate personal and business money, to understand costs, pricing, margins and break-even, and to read a simple income statement and cash-flow forecast. You will explore saving and borrowing options common across the continent, from savings groups and mobile money to microfinance and bank loans, and learn to spot scams and “guaranteed returns” before they cost you.\n\nEvery exercise uses simple tools: a notebook or a basic spreadsheet on your phone.\n\nYour Practical Output is a **Personal and Venture Financial Plan**: a twelve-month personal budget and a simple financial model for your venture or project, including pricing, costs, break-even and cash-flow forecast.",
  provider,
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
  instructors: [],
};

const personalBranding: CourseAuthoring = {
  slug: 'personal-branding',
  title: 'Personal Branding',
  subtitle: 'Be known for what you stand for and what you can do, online and in the room.',
  description:
    "Whether you like it or not, people already have an impression of you: from your profile, your posts, the way you show up and what others say when you are not there. Personal branding is the work of shaping that impression honestly so that the right opportunities find you.\n\nIn this course you will define your positioning: what you want to be known for, for whom, and why you are credible. You will build a consistent presence across the platforms that matter for your path, write a bio and profile that work, create content that shows your thinking, and build a network through generosity rather than self-promotion. You will also learn to protect your reputation and think carefully about privacy, safety and what you share.\n\nThe course builds on your Values Charter and Signature Talk, so your brand rests on who you actually are.\n\nYour Practical Output is a **Personal Brand Kit**: a positioning statement, a professional bio in short and long versions, an updated profile, three pieces of content, and a ninety-day plan for building your presence.",
  provider,
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
};

const collaboration: CourseAuthoring = {
  slug: 'collaboration',
  title: 'Collaboration',
  subtitle: 'Build teams that trust each other, share the work and finish what they start.',
  description:
    "No dream worth having is built alone. Yet many teams fall apart over unclear roles, unspoken expectations, uneven effort and conflict nobody addresses. Collaboration is a skill, and it can be learnt.\n\nIn this course you will learn how strong teams form and what makes them trusted and effective. You will practise agreeing roles and decisions, running meetings that produce action, working across distance and time zones with simple tools, handling conflict early and fairly, and partnering with organisations, communities and funders. You will work in a real Lab team throughout, so every lesson is tested on people you depend on.\n\nThis course closes the Builder’s Architecture phase and prepares your team for the Dream Residency.\n\nYour Practical Output is a **Team Charter**: a working agreement for your Lab or venture team covering purpose, roles, decision rules, communication norms, conflict process and accountability, with a short reflection on how your team used it.",
  provider,
  level: 'beginner',
  language: 'en',
  visibility: 'public',
  creditHours: 4,
  outcomes: [
    'Explain what makes teams trusted and effective, and diagnose what is holding a team back.',
    'Agree clear roles, decision rules and communication norms with a team.',
    'Run meetings and remote collaboration that produce clear actions.',
    'Handle conflict early, fairly and constructively.',
    'Build productive partnerships with organisations and communities.',
  ],
  skills: ['Teamwork', 'Facilitation', 'Conflict management', 'Remote collaboration', 'Partnership building', 'Accountability'],
  audience: 'Every Lab learner, especially those who will lead or join a team in the Dream Residency.',
  prerequisites: 'Emotional Intelligence and Communication recommended.',
  practicalOutput: 'Team Charter',
  cover: {
    from: '#0F2E1A',
    to: '#4FA86A',
    symbol: '✦',
    imageUrl: "https://images.unsplash.com/photo-1653566031535-bcf33e1c2893?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "Three colleagues talk around a meeting table with laptops and a tablet, one listening thoughtfully with a hand to the chin.",
    imageCredit: "Photo: UK Black Tech / Unsplash",
  },
  trailer: {
    provider: 'youtube',
    videoId: '3boKz0Exros',
    title: "How to turn a group of strangers into a team | Amy Edmondson",
    channel: "TED",
    durationS: 787,
  },
  instructors: [],
};

// ---------- Electives (weeks 9–10; choose one) ----------

const contentCreation: CourseAuthoring = {
  slug: 'content-creation',
  title: 'Content Creation',
  subtitle: 'Create content people want to watch, read and share, with the phone in your pocket.',
  description:
    "African creators are telling the continent’s stories to the world, and building audiences, businesses and movements while they do it. You do not need expensive equipment to begin. You need a point of view, a clear audience and a repeatable process.\n\nIn this elective you will find your niche and voice, learn the basics of storytelling for short video, audio and written formats, and practise shooting, recording and editing on a phone. You will plan content around the platforms your audience actually uses, publish consistently, read your analytics to see what works, and learn the fundamentals of copyright, consent and earning from your work. Throughout, you will build content for your own dream, venture or cause.\n\nThis is a two-week, project-based elective. Expect to create and publish every few days.\n\nYour Practical Output is a **Content Portfolio and 30-Day Calendar**: at least six published pieces across two formats, a performance review of what worked, and a planned calendar for the next thirty days.",
  provider,
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
};

const artificialIntelligence: CourseAuthoring = {
  slug: 'artificial-intelligence',
  title: 'Artificial Intelligence',
  subtitle: 'Understand what AI can and cannot do, and use it to build something useful.',
  description:
    "Artificial intelligence is changing how work is done, from customer service and farming advice to software, design and research. Builders who understand it, and its limits, will shape how it is used across the continent.\n\nIn this elective you will learn, without heavy mathematics, how modern AI systems work and where they fail. You will practise using AI tools well: writing clear instructions, checking their output, and combining them with your own judgement. You will explore real uses in African contexts, including local languages, agriculture, health, finance and education, and think hard about bias, privacy, data rights and the jobs AI may change. Then you will build: a small, working prototype that uses AI to address the problem you have been developing in the Lab.\n\nNo coding experience is required, though learners who code will be able to go further.\n\nYour Practical Output is an **AI-Assisted Solution Prototype**: a working prototype or detailed workflow that applies AI to a real problem, with a short report on how you tested it, its limitations and its ethical risks.",
  provider,
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
};

const digitalMarketing: CourseAuthoring = {
  slug: 'digital-marketing',
  title: 'Digital Marketing',
  subtitle: 'Reach the right people online, turn attention into customers and measure what works.',
  description:
    "Your customers are on their phones: on WhatsApp, Instagram, TikTok, Facebook and search. Digital marketing is how a small venture reaches them without a big budget, and how it learns, quickly, what actually brings people in.\n\nIn this elective you will define your target customer and value proposition, map the journey from first contact to purchase, and choose the channels that fit. You will practise writing copy that converts, using WhatsApp Business and social media for sales, the basics of search and paid advertising on a small budget, simple email and messaging campaigns, and tracking results so you spend money only on what works. You will also learn the ethics of marketing: honest claims, respect for customer data and no dark patterns.\n\nThis is a two-week, project-based elective. You will run a real, small campaign.\n\nYour Practical Output is a **Digital Marketing Campaign Plan and Results Report**: a plan for a real campaign for your venture or cause, the campaign itself, and a report on its results and what you would change.",
  provider,
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
};

export const dreamLabCourseOutlines: CourseAuthoring[] = [
  criticalThinking,
  emotionalIntelligence,
  characterAndEthics,
  systemsThinking,
  communication,
  negotiation,
  financialIntelligence,
  personalBranding,
  collaboration,
  contentCreation,
  artificialIntelligence,
  digitalMarketing,
];

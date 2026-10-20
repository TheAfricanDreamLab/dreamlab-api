import type { CourseAuthoring } from '@dreamlab/contracts';

/*
 * Collaboration: the closing course of Builder’s Architecture at The African Dream Lab (week 8, 4 credits).
 *
 * Learners work in a real Lab team throughout. The recurring cast is one fictional Lab team,
 * “Team Baobab”, preparing a Dream Residency pilot that helps market traders cut stock losses:
 *   Kwame    student in Kumasi, Ghana (GMT); energetic, well connected with traders
 *   Chidi    software developer in Lagos, Nigeria (WAT); quiet, holds a demanding day job
 *   Wanjiru  operations lead in Nairobi, Kenya (EAT); organised and direct
 *   Uwase    community organiser in Kigali, Rwanda (CAT); reflective, a careful listener
 * Kwame, Wanjiru and Uwase also appear in Problem Solving. Every number in a case is part of that
 * fictional case, never a real statistic.
 */

type Module = NonNullable<CourseAuthoring['modules']>[number];

// ---------------------------------------------------------------------------
// Module 1 · How strong teams work
// ---------------------------------------------------------------------------

const moduleTeams: Module = {
  key: 'strong-teams',
  title: 'How strong teams work',
  summary:
    'Learn what makes teams trusted and effective, how teams develop over time, and how to agree clear roles, decision rules and norms before trouble starts.',
  weekNo: 8,
  items: [
    {
      key: 'what-makes-teams-work',
      type: 'lesson',
      title: 'What makes teams work',
      minutes: 19,
      required: true,
      payload: {
        steps: [
          {
            id: 'no-dream-alone',
            title: 'No dream is built alone',
            blocks: [
              {
                id: 'no-dream-text',
                type: 'text',
                body: "Welcome to Collaboration, the last course of Builder’s Architecture.\n\nNext week you begin the Dream Residency. For four weeks you will build something real, and you will build it with other people: teammates, mentors, users, partners. Many promising teams fall apart not because the idea was weak, but because of unclear roles, unspoken expectations, uneven effort and conflict nobody addressed.\n\nCollaboration is a skill. It can be learnt, practised and improved. Start with this short talk about a simple team exercise that reveals a lot about how groups work.",
              },
              {
                id: 'no-dream-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'H0_yKBitO8M',
                title: 'Build a tower, build a team | Tom Wujec',
                channel: 'TED',
                durationS: 443,
                caption: "Tom Wujec on the marshmallow challenge: teams build the tallest tower they can from spaghetti, tape, string and a marshmallow. Watch for which groups do well and which do badly, and why. Then think about how your own teams usually start a task.",
              },
            ],
          },
          {
            id: 'team-history',
            title: 'Your team history',
            blocks: [
              {
                id: 'team-history-scale',
                type: 'scale',
                prompt: 'Think about the group projects and teams you have been part of. How well did they usually work?',
                minLabel: 'Mostly painful',
                maxLabel: 'Mostly brilliant',
                afterword:
                  "Most people have had more painful team experiences than brilliant ones, often because nobody taught them how teams work. The good news: the habits that make the difference are simple and learnable.",
              },
            ],
          },
          {
            id: 'meet-baobab',
            title: 'Meet Team Baobab',
            blocks: [
              {
                id: 'baobab-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/WIKIMEDIA_HACKATHON_GHANA_MEETUP_-_GROUP_PHOTO_-_DAY_2.jpg',
                alt: 'Eight people pose together in a small room, most of them seated on a black sofa, smiling and making a hand sign towards the camera.',
                caption: 'Participants at a Wikimedia hackathon meetup in Ghana. Team Baobab is a fictional team; teams like this form at meetups, hubs and programmes across the continent.',
                credit: 'Photo: Joris Darlington Quarshie / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'baobab-story',
                type: 'callout',
                tone: 'story',
                title: 'Team Baobab',
                body: "Four Lab learners in four countries have formed a team for the Dream Residency. They want to pilot a simple tool that helps market traders track and cut their stock losses.\n\n- **Kwame**, a student in Kumasi, knows dozens of traders at Kejetia Market.\n- **Chidi**, a developer in Lagos, can build the tool, but he has a demanding day job.\n- **Wanjiru**, an operations lead in Nairobi, loves plans and deadlines.\n- **Uwase**, a community organiser in Kigali, is a careful listener and rarely speaks first.\n\nThey are excited. They have not yet discussed who does what, how they will decide, or what happens if someone falls behind.",
              },
              {
                id: 'baobab-reveal',
                type: 'reveal',
                prompt: 'Before you read on: predict two things that are likely to go wrong for Team Baobab in the next month.',
                body: "Some likely trouble:\n\n- **Kwame and Wanjiru dominate**, while Uwase’s best ideas go unsaid.\n- **Chidi misses deadlines** because of his day job, and nobody knows whether to wait for him.\n- **Decisions stall** because nobody agreed how decisions get made.\n- **Messages pile up** across four time zones and four WhatsApp groups.\n\nNone of this means they are a bad team. It means they are a normal one. This course is about preventing these problems, and handling them early when they appear.",
              },
            ],
          },
          {
            id: 'stages',
            title: 'How teams develop',
            blocks: [
              {
                id: 'stages-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Forming', definition: 'The polite start. People are excited, cautious and unsure of their roles.' },
                  { term: 'Storming', definition: 'Differences surface: about goals, effort, style and power. Uncomfortable but normal.' },
                  { term: 'Norming', definition: 'The team agrees how it works: roles, rules and habits. Trust grows.' },
                  { term: 'Performing', definition: 'The team gets real work done smoothly and handles problems without drama.' },
                  { term: 'Psychological safety', definition: 'A shared belief that it is safe to speak up, ask questions, admit mistakes and disagree without being embarrassed or punished. Researched by Amy Edmondson at Harvard Business School.' },
                ],
              },
              {
                id: 'stages-order',
                type: 'order',
                prompt: 'Psychologist Bruce Tuckman described stages that many teams pass through. Put them in order.',
                items: [
                  { id: 'forming', text: 'Forming' },
                  { id: 'storming', text: 'Storming' },
                  { id: 'norming', text: 'Norming' },
                  { id: 'performing', text: 'Performing' },
                ],
                explanation:
                  "Storming is not a sign that your team is failing. It is a sign that real differences are surfacing. Teams that agree their norms early, the way you will in your Team Charter, tend to storm less painfully and reach performing sooner.",
              },
            ],
          },
          {
            id: 'safety',
            title: 'Safe to speak up',
            blocks: [
              {
                id: 'safety-text',
                type: 'text',
                body: "When Google studied what made some of its teams more effective than others, in a project called Aristotle, psychological safety stood out as the most important factor. Not the cleverest members, not the most experience: whether people felt safe to take risks in front of each other.\n\nIn this short talk, Adam Grant argues that the stars who make teams succeed are not always the ones who get the attention.",
              },
              {
                id: 'safety-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'hPgY45xsGsU',
                title: 'The best teams have this secret weapon | Adam Grant',
                channel: 'TED',
                durationS: 230,
                caption: "Organisational psychologist Adam Grant on what the real stars of successful teams have in common. Listen for the trait he names, and think about who plays that role in your teams.",
              },
              {
                id: 'safety-choice',
                type: 'choice',
                prompt: 'Which behaviours build psychological safety in Team Baobab? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'invite', text: 'Wanjiru asks, “Uwase, what are we missing?” before decisions', correct: true, feedback: 'Yes. Inviting quieter voices on purpose tells everyone their view is wanted.' },
                  { id: 'admit', text: 'Kwame says, “I got the trader numbers wrong last week. Here’s the correction.”', correct: true, feedback: 'Yes. When people admit mistakes openly, others feel safe to do the same.' },
                  { id: 'thank', text: 'The team thanks Chidi for raising a risk, even though it delays the plan', correct: true, feedback: 'Yes. Rewarding bad news is how you keep hearing it.' },
                  { id: 'mock', text: 'Teammates laugh when someone asks a “basic” question', correct: false, feedback: 'This teaches everyone to stay quiet. The next question nobody asks may be the important one.' },
                ],
                explanation:
                  "Psychological safety is not about being nice or avoiding disagreement. It is about making it safe to bring problems, questions and different views into the open, where the team can use them.",
              },
            ],
          },
          {
            id: 'best-worst',
            title: 'Your best and worst team',
            blocks: [
              {
                id: 'best-worst-reflection',
                type: 'reflection',
                prompt: 'Describe the best team you have been part of and the worst. For each, what made the difference: roles, trust, communication, leadership, effort or something else? What does that tell you your Lab team needs?',
                guidance: 'Describe behaviours, not personalities. These lessons will shape your Team Charter.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'roles-decisions-norms',
      type: 'lesson',
      title: 'Roles, decisions and norms',
      minutes: 17,
      required: true,
      payload: {
        steps: [
          {
            id: 'clear-roles',
            title: 'Who does what?',
            blocks: [
              {
                id: 'clear-roles-text',
                type: 'text',
                body: "The most common reason teams fall out is not personality. It is **unclear roles**: two people doing the same task, nobody doing another, and everyone assuming someone else was responsible.\n\nA simple tool helps: the **RACI** chart. For each task you name who is Responsible, Accountable, Consulted and Informed. This short video explains it with examples.",
              },
              {
                id: 'clear-roles-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'xc5NbJ8VgTI',
                title: 'RACI Matrix Basics Explained with Examples | TeamGantt',
                channel: 'TeamGantt',
                durationS: 308,
                caption: "The basics of a RACI chart, with examples. Part of the video shows a particular project tool; you can make the same chart in a notebook, a shared spreadsheet or a WhatsApp message.",
              },
            ],
          },
          {
            id: 'baobab-raci',
            title: 'Team Baobab’s first RACI',
            blocks: [
              {
                id: 'whiteboard-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Nairobi_iHub.jpg/1280px-Nairobi_iHub.jpg',
                alt: 'An empty meeting room with a whiteboard covered in diagrams, sticky notes on the wall, a projector on a cushioned stool and a laptop on a desk.',
                caption: 'A meeting room at iHub, a technology hub in Nairobi, Kenya, with the traces of a planning session on the walls.',
                credit: 'Photo: Appleslerp / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'raci-example',
                type: 'example',
                title: 'Task: interview 20 traders in Kumasi and Nairobi',
                body: "- **Responsible** (does the work): Kwame in Kumasi, Wanjiru in Nairobi\n- **Accountable** (owns the result, signs it off): Uwase\n- **Consulted** (asked for input before): Chidi, on what the tool needs to learn\n- **Informed** (kept up to date): the Lab mentor\n\nOne rule makes RACI work: **exactly one Accountable person per task.** Two people “jointly accountable” often means nobody is.",
              },
            ],
          },
          {
            id: 'raci-match',
            title: 'The four letters',
            blocks: [
              {
                id: 'raci-match-block',
                type: 'match',
                prompt: 'Match each RACI role to what it means.',
                pairs: [
                  { id: 'r', left: 'Responsible', right: 'Does the work' },
                  { id: 'a', left: 'Accountable', right: 'Owns the outcome and makes the final call on the task' },
                  { id: 'c', left: 'Consulted', right: 'Gives input before or during the work' },
                  { id: 'i', left: 'Informed', right: 'Is kept updated on progress and results' },
                ],
                explanation:
                  "Being Consulted and being Informed are very different. Consulting someone means their view can change the work. Informing them means telling them what happened. Confusing the two is a common source of hurt feelings.",
              },
            ],
          },
          {
            id: 'decide',
            title: 'How will we decide?',
            blocks: [
              {
                id: 'decide-framework',
                type: 'framework',
                title: 'Five decision rules',
                steps: [
                  { label: 'One person decides', detail: 'Fast. Good for small or urgent decisions within someone’s role.' },
                  { label: 'Consult, then decide', detail: 'One person decides after hearing from others. Balances speed and input.' },
                  { label: 'Majority vote', detail: 'Quick and clear, but the minority may feel unheard.' },
                  { label: 'Consent', detail: 'Go ahead unless someone has a serious, reasoned objection. Good for moving forward together.' },
                  { label: 'Consensus', detail: 'Everyone actively agrees. Strong buy-in, but slow. Save it for the biggest decisions.' },
                ],
              },
              {
                id: 'decide-scenario',
                type: 'scenario',
                situation:
                  "Team Baobab must choose within 48 hours whether their pilot will be a simple SMS service or a smartphone app. The Lab needs their answer for mentor matching. Chidi has a strong technical view. Kwame and Wanjiru disagree. Uwase has not said anything yet.",
                prompt: 'Which way of deciding fits best?',
                options: [
                  {
                    id: 'vote',
                    text: 'Vote now in the WhatsApp group, and go with the majority.',
                    outcome: "It is two against one with one abstention. The decision is made, but Uwase’s concerns about traders without smartphones never get heard. Three weeks later they surface as a real problem.",
                    best: false,
                  },
                  {
                    id: 'consult',
                    text: 'Agree that Chidi, as the technical lead, decides after a 30-minute call where everyone, starting with Uwase, gives their view.',
                    outcome: "On the call Uwase points out that many traders she has spoken to use basic phones. Chidi changes his mind and proposes SMS first. The team decides in time, and everyone was heard.",
                    best: true,
                  },
                  {
                    id: 'consensus',
                    text: 'Keep discussing until everyone fully agrees.',
                    outcome: "The discussion runs for four days. They miss the Lab deadline and are matched with a mentor late. Consensus is valuable, but not when time is short.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'norms',
            title: 'Norms: how we work together',
            blocks: [
              {
                id: 'norms-text',
                type: 'text',
                body: "**Norms** are the team’s agreed habits: how fast we reply, how we disagree, what “done” means, what we do when we cannot meet a deadline.\n\nEvery team has norms. In most teams they are unspoken, and each person assumes their own. Writing them down early turns hidden assumptions into shared agreements.",
              },
              {
                id: 'norms-choice',
                type: 'choice',
                prompt: 'Which is the most useful norm for Team Baobab to write down?',
                multiple: false,
                options: [
                  { id: 'respect', text: '“We will respect each other.”', correct: false, feedback: 'Everyone agrees, and it changes nothing. What does respect look like in practice?' },
                  { id: 'hard', text: '“Everyone will work hard.”', correct: false, feedback: 'Too vague to act on. Hard by whose standard?' },
                  {
                    id: 'deadline',
                    text: '“If you cannot meet a deadline, tell the team at least 24 hours before, with a new date.”',
                    correct: true,
                    feedback: 'Yes. Specific, checkable, and it protects both the person struggling and the rest of the team.',
                  },
                  { id: 'fun', text: '“We will have fun.”', correct: false, feedback: 'A nice hope, but not something anyone can act on.' },
                ],
                explanation:
                  "Good norms describe **behaviour you could observe**. A useful test: could a new team member read the norm and know exactly what to do? If not, make it more specific.",
              },
            ],
          },
          {
            id: 'norm-poll',
            title: 'What does your team need?',
            blocks: [
              {
                id: 'norm-need-poll',
                type: 'poll',
                prompt: 'Which norm does your own Lab team most need to agree first?',
                options: [
                  { id: 'response', text: 'How quickly we reply to messages' },
                  { id: 'deadlines', text: 'What to do when a deadline will be missed' },
                  { id: 'meetings', text: 'When we meet and how meetings run' },
                  { id: 'disagree', text: 'How we disagree and resolve conflict' },
                  { id: 'decisions', text: 'How we make decisions' },
                ],
                afterword:
                  "Whatever you chose, raise it with your team this week, before it becomes a problem. Norms are easiest to agree when nobody is upset yet.",
              },
            ],
          },
          {
            id: 'draft-roles',
            title: 'Draft your roles and rules',
            blocks: [
              {
                id: 'roles-reflection',
                type: 'reflection',
                prompt: 'With your Lab team in mind, draft: each member’s main role; a RACI for your team’s most important task this month; the decision rule you will use for small, medium and big decisions; and three specific norms.',
                guidance: 'Draft it alone first, then compare with your teammates. This becomes the core of your Team Charter.',
                minWords: 60,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'strong-teams-quiz',
      type: 'quiz',
      title: 'Module quiz: how strong teams work',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on team development, psychological safety, roles, decisions and norms. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-psych-safety',
            type: 'choice',
            prompt: 'What is psychological safety in a team?',
            multiple: false,
            options: [
              { id: 'a', text: 'Everyone being nice and avoiding disagreement', correct: false, feedback: 'Safe teams disagree openly. They just do it without fear.' },
              { id: 'b', text: 'A shared belief that it is safe to speak up, ask questions, admit mistakes and disagree', correct: true },
              { id: 'c', text: 'Guaranteed job security for every member', correct: false, feedback: 'It is about interpersonal risk, not contracts.' },
              { id: 'd', text: 'Having a strong leader who makes all decisions', correct: false, feedback: 'A strong leader can build safety or destroy it.' },
            ],
            explanation: 'Psychological safety lets problems and ideas surface early, where the team can use them.',
          },
          {
            id: 'q-tuckman',
            type: 'order',
            prompt: 'Put Tuckman’s team stages in order.',
            items: [
              { id: 'forming', text: 'Forming' },
              { id: 'storming', text: 'Storming' },
              { id: 'norming', text: 'Norming' },
              { id: 'performing', text: 'Performing' },
            ],
            explanation: 'Storming is normal. Agreeing norms early helps teams move through it faster.',
          },
          {
            id: 'q-raci',
            type: 'match',
            prompt: 'A team is producing a pitch deck. Match each person to their RACI role.',
            pairs: [
              { id: 'r', left: 'Esi designs the slides', right: 'Responsible' },
              { id: 'a', left: 'Musa signs off the final deck', right: 'Accountable' },
              { id: 'c', left: 'The mentor reviews a draft and suggests changes', right: 'Consulted' },
              { id: 'i', left: 'The Lab coordinator receives the final version', right: 'Informed' },
            ],
            explanation: 'One person does the work, one owns the result, some give input, others are kept in the loop.',
          },
          {
            id: 'q-one-a',
            type: 'choice',
            prompt: 'Why should each task have exactly one Accountable person?',
            multiple: false,
            options: [
              { id: 'a', text: 'So that one person can do all the work', correct: false, feedback: 'Accountable is not the same as Responsible. Others may do the work.' },
              { id: 'b', text: 'Because when two people share accountability, each can assume the other has it', correct: true },
              { id: 'c', text: 'Because RACI charts only have room for one name', correct: false, feedback: 'The reason is human, not technical.' },
              { id: 'd', text: 'So that the team has a person to blame', correct: false, feedback: 'Accountability is about ownership, not blame.' },
            ],
            explanation: 'Clear ownership prevents tasks from falling between people.',
          },
          {
            id: 'q-decision-rule',
            type: 'choice',
            prompt: 'A team must make a technical decision within a day, and one member has the most relevant expertise. Which decision rule fits best?',
            multiple: false,
            options: [
              { id: 'a', text: 'Consensus', correct: false, feedback: 'Too slow for a one-day deadline.' },
              { id: 'b', text: 'Consult, then the expert decides', correct: true },
              { id: 'c', text: 'Toss a coin', correct: false, feedback: 'It ignores everyone’s knowledge.' },
              { id: 'd', text: 'Majority vote without discussion', correct: false, feedback: 'Fast, but it may override the person who understands the problem best without hearing anyone’s reasons.' },
            ],
            explanation: 'Match the decision rule to the stakes and the time available. Consult-then-decide balances speed, expertise and voice.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 2 · Working together: meetings, distance and conflict
// ---------------------------------------------------------------------------

const moduleWorking: Module = {
  key: 'working-together',
  title: 'Working together: meetings, distance and conflict',
  summary:
    'Run meetings that end in clear actions, collaborate across distance and time zones with simple tools, and handle conflict early, fairly and constructively.',
  weekNo: 8,
  items: [
    {
      key: 'meetings-action',
      type: 'lesson',
      title: 'Meetings that produce action',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'bad-meetings',
            title: 'The trouble with meetings',
            blocks: [
              {
                id: 'bad-meetings-text',
                type: 'text',
                body: "Meetings are where teams make decisions, solve problems and stay connected. They are also where a lot of time quietly dies.\n\nA good meeting has a clear purpose, the right people, and ends with everyone knowing **who will do what by when**. A bad one is a long conversation that everyone forgets by evening.\n\nThis short, funny talk offers one simple habit to reclaim your time.",
              },
              {
                id: 'bad-meetings-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'F6Qo8IDsVNg',
                title: 'David Grady: How to save the world (or at least yourself) from bad meetings',
                channel: 'TED',
                durationS: 405,
                caption: "David Grady on why we accept bad meeting invitations and what to do instead. Listen for the question he suggests asking before you say yes to any meeting.",
              },
            ],
          },
          {
            id: 'meeting-shape',
            title: 'Before, during, after',
            blocks: [
              {
                id: 'meeting-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/AWMD_prep_to_hackathon_meetup_8.jpg/1280px-AWMD_prep_to_hackathon_meetup_8.jpg',
                alt: 'Seen from behind, rows of people sit at desks with open laptops facing a projected screen at the front of a classroom.',
                caption: 'Participants at a developers’ meetup at Lagos State University, Nigeria. A shared screen and a shared agenda keep a room focused.',
                credit: 'Photo: Oluphisayo / Wikimedia Commons, CC BY-SA 4.0',
              },
              {
                id: 'meeting-framework',
                type: 'framework',
                title: 'A meeting that works',
                steps: [
                  { label: 'Before: purpose', detail: 'Write one sentence: what must be true by the end of this meeting? If you cannot, you may not need a meeting.' },
                  { label: 'Before: agenda', detail: 'Share a short agenda and any reading in advance, so time is spent deciding, not catching up.' },
                  { label: 'During: roles', detail: 'A facilitator keeps it on track, a note-taker records decisions and actions, a timekeeper watches the clock.' },
                  { label: 'During: every voice', detail: 'Hear from everyone on important points, quieter members first.' },
                  { label: 'After: actions', detail: 'Within a day, share decisions and actions: who, what, by when.' },
                ],
              },
            ],
          },
          {
            id: 'meeting-order',
            title: 'Run a 30-minute meeting',
            blocks: [
              {
                id: 'meeting-run-order',
                type: 'order',
                prompt: 'Team Baobab has a 30-minute weekly call. Put its parts in a sensible order.',
                items: [
                  { id: 'purpose', text: 'Facilitator restates the purpose and agenda' },
                  { id: 'actions-review', text: 'Quick check on last week’s actions' },
                  { id: 'main', text: 'Discuss and decide the main item' },
                  { id: 'new-actions', text: 'Agree new actions: who, what, by when' },
                  { id: 'close', text: 'One-word check-out from each person on how the meeting went' },
                ],
                explanation:
                  "Reviewing last week’s actions keeps everyone accountable without anyone having to chase. Ending with actions, then a quick check-out, means the meeting finishes with clarity and with a sense of how people are feeling.",
              },
            ],
          },
          {
            id: 'action-items',
            title: 'Write a real action',
            blocks: [
              {
                id: 'action-example',
                type: 'example',
                title: 'Vague and clear',
                body: "**Vague:** “Follow up with traders.”\n\n**Clear:** “Kwame will visit five tomato traders at Kejetia and record their stock losses for one week, and will share the results in the team folder by Friday 6 p.m. Ghana time.”\n\nA clear action has an **owner**, a **specific task** and a **deadline**. Without all three, it usually does not happen.",
              },
              {
                id: 'action-choice',
                type: 'choice',
                prompt: 'Which is the clearest action item?',
                multiple: false,
                options: [
                  { id: 'a', text: '“Someone should look into SMS costs.”', correct: false, feedback: 'No owner and no deadline. “Someone” means nobody.' },
                  { id: 'b', text: '“Chidi: SMS costs.”', correct: false, feedback: 'An owner, but no clear task or deadline.' },
                  {
                    id: 'c',
                    text: '“Chidi will compare prices from two SMS providers and post a one-paragraph summary in the team folder by Wednesday 8 p.m. Lagos time.”',
                    correct: true,
                    feedback: 'Yes. Owner, specific task, deadline, and even the time zone.',
                  },
                  { id: 'd', text: '“We will finalise the SMS plan soon.”', correct: false, feedback: 'No owner, no task detail, and “soon” is not a date.' },
                ],
                explanation:
                  "In a team spread across time zones, naming the time zone in a deadline avoids a surprising amount of confusion.",
              },
            ],
          },
          {
            id: 'quiet-voices',
            title: 'The quiet voice',
            blocks: [
              {
                id: 'quiet-scenario',
                type: 'scenario',
                situation:
                  "On the weekly call, Kwame talks for most of the first fifteen minutes. Wanjiru challenges him; they go back and forth. Chidi has his camera off and says nothing. Uwase starts to speak twice and is talked over both times. Uwase is facilitating this week.",
                prompt: 'What should Uwase do as facilitator?',
                options: [
                  {
                    id: 'wait',
                    text: 'Let the debate run. Kwame and Wanjiru clearly care.',
                    outcome: "The meeting overruns. A decision is made between two people. Chidi, who will build whatever they decide, did not speak, and later raises a technical problem that sends the team back a week.",
                    best: false,
                  },
                  {
                    id: 'round',
                    text: 'Pause the debate and do a quick round: “Let’s hear from everyone in one minute each. Chidi, then me, then Wanjiru, then Kwame.”',
                    outcome: "Chidi raises the technical problem straight away. Uwase shares a point from her trader conversations. The debate between Kwame and Wanjiru shrinks once everything is on the table, and the team decides with all the information.",
                    best: true,
                  },
                  {
                    id: 'private',
                    text: 'Say nothing in the meeting, but message Kwame privately afterwards to complain.',
                    outcome: "Kwame feels criticised behind his back and the meeting pattern continues. Feedback about the meeting belongs, kindly, in the meeting or in an agreed review.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'your-meetings',
            title: 'Your team’s meetings',
            blocks: [
              {
                id: 'meetings-reflection',
                type: 'reflection',
                prompt: 'Describe how your Lab team will run its meetings: how often, how long, which roles rotate, how you will hear every voice, and where decisions and actions will be recorded.',
                guidance: 'Remember the Lab’s own sessions on Tuesday and Thursday evenings and Saturday mornings. Plan team meetings that fit around them. This goes into your Team Charter.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'remote-collaboration',
      type: 'lesson',
      title: 'Collaborating across distance',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'distance',
            title: 'Teams without a shared room',
            blocks: [
              {
                id: 'distance-text',
                type: 'text',
                body: "Team Baobab works across four countries and four time zones. Many of your teams will too: across cities, campuses or the continent.\n\nDistance removes the small signals we rely on in person: a tone of voice, a nod, a quick question over a desk. Messages are read in the wrong mood, silence is mistaken for disagreement, and urgent things get buried under chat.\n\nThis short explainer from Harvard Business Review, made when many teams suddenly went remote, explains what changes and how to adapt.",
              },
              {
                id: 'distance-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'vradYqcXfGQ',
                title: 'How to Collaborate Effectively If Your Team Is Remote (The Explainer)',
                channel: 'Harvard Business Review',
                durationS: 145,
                caption: "Harvard Business Review on what we lose when we collaborate through screens, and how to make up for it. Listen for what happens to tone and timing in text messages.",
              },
            ],
          },
          {
            id: 'remote-words',
            title: 'The vocabulary of remote work',
            blocks: [
              {
                id: 'remote-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Synchronous', definition: 'Working at the same time: calls, live meetings, real-time chat.' },
                  { term: 'Asynchronous', definition: 'Working at different times: messages, shared documents, voice notes, recorded updates.' },
                  { term: 'Overlap hours', definition: 'The hours when everyone is reasonably available at once. Protect them for things that truly need live discussion.' },
                  { term: 'Single source of truth', definition: 'One agreed place, such as a shared folder or document, where decisions, plans and the latest versions live.' },
                  { term: 'Response-time norm', definition: 'An agreed expectation for how quickly people reply, for example within 24 hours on weekdays.' },
                ],
              },
            ],
          },
          {
            id: 'time-zones',
            title: 'Four time zones',
            blocks: [
              {
                id: 'time-zones-text',
                type: 'text',
                body: "Team Baobab’s cities:\n\n- Kumasi: GMT (UTC+0)\n- Lagos: West Africa Time (UTC+1)\n- Kigali: Central Africa Time (UTC+2)\n- Nairobi: East Africa Time (UTC+3)\n\nThe Lab’s virtual sessions run from 9:00 to 10:30 p.m. West Africa Time. That is 8:00 p.m. in Kumasi and 11:00 p.m. in Nairobi.",
              },
              {
                id: 'time-zones-choice',
                type: 'choice',
                prompt: 'Wanjiru suggests a team call at 8 p.m. Nairobi time. What time is that for Kwame in Kumasi?',
                multiple: false,
                options: [
                  { id: 'a', text: '11 p.m.', correct: false, feedback: 'Kumasi is behind Nairobi, not ahead.' },
                  { id: 'b', text: '7 p.m.', correct: false, feedback: 'That is Kigali, one hour behind Nairobi. Kumasi is three hours behind.' },
                  { id: 'c', text: '5 p.m.', correct: true, feedback: 'Yes. Kumasi (UTC+0) is three hours behind Nairobi (UTC+3).' },
                  { id: 'd', text: '8 p.m.', correct: false, feedback: 'Only if they were in the same time zone.' },
                ],
                explanation:
                  "5 p.m. in Kumasi might clash with Kwame’s lectures, while 8 p.m. is comfortable in Nairobi. Spread across zones, someone is always early or late. Rotate the inconvenient slot so the same person does not always pay the price.",
              },
            ],
          },
          {
            id: 'channels',
            title: 'Right message, right channel',
            blocks: [
              {
                id: 'channels-match',
                type: 'match',
                prompt: 'Match each kind of message to the channel that usually fits it best.',
                pairs: [
                  { id: 'blocker', left: 'Chidi is blocked and the pilot launch is tomorrow', right: 'A phone or video call' },
                  { id: 'decision', left: 'The team’s final choice of SMS provider and why', right: 'The shared decision log in the team folder' },
                  { id: 'update', left: 'Kwame’s weekly progress update', right: 'A short written or voice-note update in the team chat' },
                  { id: 'draft', left: 'Feedback on the draft interview questions', right: 'Comments in the shared document' },
                ],
                explanation:
                  "When everything goes into one busy WhatsApp group, urgent things drown and decisions vanish up the scroll. Agree which channel is for what. Then a decision is always findable, and an urgent call always means urgent.",
              },
            ],
          },
          {
            id: 'realities',
            title: 'Working with real constraints',
            blocks: [
              {
                id: 'realities-context',
                type: 'callout',
                tone: 'context',
                title: 'Data, power and phones',
                body: "Remote work across the continent comes with practical limits: data costs, power cuts, shared devices, patchy networks and long commutes.\n\nGood team norms respect them. Prefer voice notes and documents over long video calls when bandwidth is tight. Share agendas early so people can prepare offline. Agree what happens if someone drops off a call. And never judge commitment by whose camera is on.",
              },
              {
                id: 'tools-poll',
                type: 'poll',
                prompt: 'Where does your Lab team mostly communicate right now?',
                options: [
                  { id: 'whatsapp', text: 'A WhatsApp or Telegram group' },
                  { id: 'calls', text: 'Video calls' },
                  { id: 'docs', text: 'Shared documents and folders' },
                  { id: 'email', text: 'Email' },
                  { id: 'mixed', text: 'A mix, with no clear rules yet' },
                ],
                afterword:
                  "Most teams start with one chat group and no rules. That works for a week. Agreeing what each channel is for is one of the cheapest improvements you can make.",
              },
            ],
          },
          {
            id: 'your-comms',
            title: 'Your communication norms',
            blocks: [
              {
                id: 'comms-reflection',
                type: 'reflection',
                prompt: 'Write your team’s communication norms: which channel is for what, your single source of truth, response-time expectations, your overlap hours, and how you will handle data or power problems.',
                guidance: 'Be specific enough that a new teammate could follow them on day one. This becomes the communication section of your Team Charter.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'conflict-early',
      type: 'lesson',
      title: 'Handling conflict early and fairly',
      minutes: 15,
      required: true,
      payload: {
        steps: [
          {
            id: 'conflict-normal',
            title: 'Conflict is normal',
            blocks: [
              {
                id: 'conflict-text',
                type: 'text',
                body: "Every team that does real work has conflict. The question is not whether it happens but **when** you deal with it and **how**.\n\nConflict handled early is usually small: a misunderstanding, a mismatched expectation. Conflict left to fester grows into resentment, gossip and people quietly leaving.\n\nIn this short lesson, Amy Gallo, an expert on workplace conflict, explains what happens in our heads when we are in conflict, and how to stay in control.",
              },
              {
                id: 'conflict-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'KmuUH6p37HM',
                title: 'Conflict makes smart people irrational. Here’s how to stay in control | Amy Gallo',
                channel: 'Leadership Lessons | Big Think+',
                durationS: 264,
                caption: "Amy Gallo on how emotions hijack our thinking during conflict, and the stories we tell ourselves about the other person. Listen for how self-awareness helps you respond rather than react.",
              },
            ],
          },
          {
            id: 'conflict-types',
            title: 'Three kinds of conflict',
            blocks: [
              {
                id: 'conflict-terms',
                type: 'key_terms',
                terms: [
                  { term: 'Task conflict', definition: 'Disagreement about the work itself: which idea, which approach. Often healthy when handled respectfully.' },
                  { term: 'Process conflict', definition: 'Disagreement about how work gets done: who does what, deadlines, effort. Very common in student and volunteer teams.' },
                  { term: 'Relationship conflict', definition: 'Personal friction: feeling disrespected, disliked or ignored. The most damaging if left alone.' },
                ],
              },
              {
                id: 'conflict-reveal',
                type: 'reveal',
                prompt: 'Why might a task conflict turn into a relationship conflict if nobody addresses it? Think, then tap.',
                body: "When a disagreement about the work is not resolved, people start explaining it with stories about each other: “She always has to win.” “He doesn’t care about this project.” The original question about the work gets lost, and what remains is personal.\n\nThat is why early, specific conversations matter. They keep the conflict about the work, where it can be solved.",
              },
            ],
          },
          {
            id: 'sbi',
            title: 'A simple way to raise a concern',
            blocks: [
              {
                id: 'sbi-framework',
                type: 'framework',
                title: 'Situation, Behaviour, Impact (SBI)',
                steps: [
                  { label: 'Situation', detail: 'Name the specific time and place. “In Tuesday’s call…”' },
                  { label: 'Behaviour', detail: 'Describe what the person did, as a camera would see it. No labels like “lazy” or “rude”.' },
                  { label: 'Impact', detail: 'Explain the effect on you, the team or the work.' },
                  { label: 'Then listen', detail: 'Ask for their view and work out next steps together. There is almost always context you did not know.' },
                ],
              },
              {
                id: 'sbi-example',
                type: 'example',
                title: 'Wanjiru to Chidi',
                body: "**Instead of:** “You’re never reliable. We can’t count on you.”\n\n**SBI:** “On Monday and again on Thursday (situation), the prototype update we agreed didn’t arrive and there was no message (behaviour). I had to postpone two trader interviews, and I started to worry the pilot would slip (impact). What’s going on for you?”\n\nThe SBI model was developed at the Center for Creative Leadership. Its power is that it describes facts and effects, which are hard to argue with, instead of judging character.",
              },
            ],
          },
          {
            id: 'chidi-scenario',
            title: 'The missed deadlines',
            blocks: [
              {
                id: 'missed-deadlines',
                type: 'scenario',
                situation:
                  "Chidi has missed two agreed deadlines in a row. Wanjiru is frustrated and has started messaging Kwame privately: “Chidi isn’t pulling his weight.” Kwame agrees. Nobody has spoken to Chidi. The pilot launch is in ten days.",
                prompt: 'What is the best next step?',
                options: [
                  {
                    id: 'gossip',
                    text: 'Wanjiru and Kwame quietly reassign Chidi’s tasks between themselves.',
                    outcome: "They burn out trying to do Chidi’s work as well as their own. Chidi notices his tasks disappearing, feels pushed out and disengages completely. The team loses its only developer.",
                    best: false,
                  },
                  {
                    id: 'sbi-call',
                    text: 'Wanjiru asks Chidi for a short private call and uses SBI, then listens.',
                    outcome: "Chidi explains that his employer has a product launch this fortnight and he is working late every night. He was embarrassed to say so. Together they move one task to Kwame, simplify another, and agree that Chidi will flag problems 24 hours ahead. The team keeps its developer and its trust.",
                    best: true,
                  },
                  {
                    id: 'group-call-out',
                    text: 'Kwame raises it in the team WhatsApp group: “We need to talk about people missing deadlines.”',
                    outcome: "Everyone knows who he means. Chidi feels publicly shamed and replies defensively. Uwase, who had no idea there was a problem, is caught in the middle.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'hidden-conflict',
            title: 'Spot hidden conflict',
            blocks: [
              {
                id: 'hidden-choice',
                type: 'choice',
                prompt: 'Which of these can be signs of conflict nobody has named yet? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'side', text: 'Private side conversations about a teammate', correct: true, feedback: 'Yes. Talking about someone instead of to them is the clearest early sign.' },
                  { id: 'silence', text: 'A usually active member going quiet in meetings and chats', correct: true, feedback: 'Yes. Withdrawal often means someone feels unheard or unhappy.' },
                  { id: 'sarcasm', text: 'Sarcastic replies or a cold tone in messages', correct: true, feedback: 'Yes. Tone often leaks feelings that words do not say.' },
                  { id: 'debate', text: 'An open, respectful debate about two design options', correct: false, feedback: 'This is healthy task conflict happening in the open. It is a good sign.' },
                ],
                explanation:
                  "Open disagreement is not the danger. Silence and side-channels are. Your Team Charter should say how anyone can raise a concern safely, so that problems surface while they are still small.",
              },
            ],
          },
          {
            id: 'conflict-process',
            title: 'Your conflict process',
            blocks: [
              {
                id: 'louse-proverb',
                type: 'quote',
                text: 'Kidole kimoja hakivunji chawa. (One finger cannot crush a louse.)',
                attribution: 'Swahili proverb',
              },
              {
                id: 'conflict-reflection',
                type: 'reflection',
                prompt: 'Write your team’s conflict process: how anyone raises a concern, who they talk to first, when the team discusses it together, and when you would ask your Lab mentor for help. Then describe, honestly, how you usually react in conflict and one habit you will practise.',
                guidance: 'Use SBI in your process. Agree the steps with your team while everyone is calm. This becomes the conflict section of your Team Charter.',
                minWords: 50,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'team-stories-discussion',
      type: 'discussion',
      title: 'Discussion: what made or broke a team you were in',
      minutes: 15,
      required: true,
      payload: {
        prompt:
          "Think of a team you have been part of: in school, church or mosque, sport, a job, a volunteer group or a business.\n\nIn your post, answer:\n\n1. What was the team trying to do, and how did it go?\n2. Name one moment that **made** the team stronger, or one that **broke** it. What exactly happened?\n3. Which idea from this course (roles, decision rules, norms, meetings, communication channels, SBI, psychological safety) would have helped most, and how?\n\nThen reply to at least two classmates. Suggest a specific norm or practice that could have changed their story.",
        guidance: 'Describe behaviour, not personalities, and do not name real people. Everyone has been part of a team that struggled; honesty here helps all of us.',
        minWords: 80,
      },
    },
    {
      key: 'working-together-quiz',
      type: 'quiz',
      title: 'Module quiz: working together',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on meetings, remote collaboration and conflict. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-action-item',
            type: 'choice',
            prompt: 'What three parts does a clear action item need? Select all that apply.',
            multiple: true,
            options: [
              { id: 'owner', text: 'An owner', correct: true },
              { id: 'task', text: 'A specific task', correct: true },
              { id: 'deadline', text: 'A deadline', correct: true },
              { id: 'approval', text: 'Approval from every team member', correct: false, feedback: 'Actions agreed in a meeting do not each need everyone’s separate approval.' },
            ],
            explanation: 'Who, what, by when. In a team across time zones, add the time zone to the deadline.',
          },
          {
            id: 'q-time-zone',
            type: 'choice',
            prompt: 'A call is set for 7 p.m. in Lagos (UTC+1). What time is it in Nairobi (UTC+3)?',
            multiple: false,
            options: [
              { id: 'a', text: '5 p.m.', correct: false, feedback: 'Nairobi is ahead of Lagos, not behind.' },
              { id: 'b', text: '8 p.m.', correct: false, feedback: 'That is Kigali (UTC+2).' },
              { id: 'c', text: '9 p.m.', correct: true },
              { id: 'd', text: '10 p.m.', correct: false, feedback: 'Nairobi is two hours ahead of Lagos, not three.' },
            ],
            explanation: 'UTC+3 is two hours ahead of UTC+1, so 7 p.m. in Lagos is 9 p.m. in Nairobi.',
          },
          {
            id: 'q-channels',
            type: 'match',
            prompt: 'Match each need to the channel that usually fits it.',
            pairs: [
              { id: 'urgent', left: 'An urgent blocker before tomorrow’s launch', right: 'A phone or video call' },
              { id: 'record', left: 'A decision the team will need to find later', right: 'A shared decision log' },
              { id: 'comments', left: 'Detailed feedback on a draft', right: 'Comments in the shared document' },
            ],
            explanation: 'Agree what each channel is for, so urgent means urgent and decisions are always findable.',
          },
          {
            id: 'q-sbi',
            type: 'order',
            prompt: 'Put the parts of the SBI approach in order.',
            items: [
              { id: 's', text: 'Situation' },
              { id: 'b', text: 'Behaviour' },
              { id: 'i', text: 'Impact' },
              { id: 'listen', text: 'Then listen and agree next steps' },
            ],
            explanation: 'Facts, then effects, then the other person’s view. It keeps the conversation about behaviour, not character.',
          },
          {
            id: 'q-conflict-type',
            type: 'choice',
            prompt: 'Two teammates disagree about whether to launch with SMS or an app, and argue openly and respectfully. What kind of conflict is this?',
            multiple: false,
            options: [
              { id: 'a', text: 'Relationship conflict', correct: false, feedback: 'It is about the work, not about each other.' },
              { id: 'b', text: 'Task conflict, often healthy', correct: true },
              { id: 'c', text: 'Process conflict', correct: false, feedback: 'Process conflict is about how work gets done: roles, deadlines, effort.' },
              { id: 'd', text: 'Not conflict at all', correct: false, feedback: 'It is conflict, and handled well, it is useful.' },
            ],
            explanation: 'Open task conflict improves decisions. The danger is when it goes unresolved and turns personal.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Module 3 · Partnerships and accountability
// ---------------------------------------------------------------------------

const teamCharterTemplate = [
  'TEAM CHARTER',
  '',
  'Team name and members',
  'Names, locations and time zones.',
  '',
  '1. Purpose',
  'What we are building together, for whom, and what success looks like by the end of the Dream Residency.',
  '',
  '2. Roles',
  'Each member’s main role, and a RACI for our two or three most important tasks.',
  '',
  '3. Decision rules',
  'How we make small, medium and big decisions, and who decides when we are stuck.',
  '',
  '4. Communication norms',
  'Which channel is for what, our single source of truth, response times, overlap hours, and what we do about data or power problems.',
  '',
  '5. Meetings',
  'How often, how long, rotating roles, how we hear every voice, and where decisions and actions are recorded.',
  '',
  '6. Conflict process',
  'How anyone raises a concern (using SBI), the steps we follow, and when we ask our mentor for help.',
  '',
  '7. Accountability',
  'How we track commitments, our weekly check-in, what happens when someone falls behind, and when we review this charter.',
  '',
  '8. Partners',
  'Key partners or communities we work with, what each side brings and expects, and how we will keep the relationship healthy.',
  '',
  '9. Signatures and date',
  'Every member’s name and the date agreed.',
  '',
  '10. Reflection: how our team used the charter',
  'After at least one week of working with it: what worked, what we changed, and what we learnt about ourselves as teammates.',
].join('\n');

const moduleBeyond: Module = {
  key: 'beyond-the-team',
  title: 'Partnerships and accountability',
  summary:
    'Build productive partnerships with organisations, communities and funders, keep your team accountable without blame, and bring it all together in your Team Charter.',
  weekNo: 8,
  items: [
    {
      key: 'partnerships',
      type: 'lesson',
      title: 'Partnering with organisations and communities',
      minutes: 13,
      required: true,
      payload: {
        steps: [
          {
            id: 'bigger-team',
            title: 'Your team is bigger than your team',
            blocks: [
              {
                id: 'bigger-team-text',
                type: 'text',
                body: "Very few dreams are built by one team alone. Team Baobab needs traders willing to test their tool, a market association that trusts them, perhaps a mobile network for SMS, and a funder or two.\n\nWorking with partners uses the same skills as working within a team, with one difference: **partners have their own goals, pressures and ways of working**. A partnership works when both sides gain and both sides know what to expect.\n\nThis short animation explains one way that many organisations work together on big social problems.",
              },
              {
                id: 'bigger-team-video',
                type: 'video',
                provider: 'youtube',
                videoId: 'pzmMk63ihNM',
                title: 'Tackling Complex Social Problems through Collective Impact',
                channel: 'Collective Impact Forum',
                durationS: 122,
                caption: "A short animation on collective impact, an approach where many organisations work towards a shared goal. Watch for what makes it different from organisations simply working side by side.",
              },
            ],
          },
          {
            id: 'community-entry',
            title: 'Enter with respect',
            blocks: [
              {
                id: 'community-image',
                type: 'image',
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Webster_and_Singo_bring_the_group_back_to_the_village_meeting_space_in_high_spirits._They_are_energizing_the_village_into_taking_action_to_stop_defecating_in_the_bush_by_building_toilets._%2817741535608%29.jpg/1280px-thumbnail.jpg',
                alt: 'A cheerful group of adults walks and dances together along a dirt path under trees, several smiling broadly and one giving two thumbs up.',
                caption: 'Villagers in Malawi return to their meeting space in high spirits during a campaign to build toilets. Lasting change is built with communities, not delivered to them.',
                credit: 'Photo: WSSCC / Katherine Anderson, via SuSanA Secretariat / Wikimedia Commons, CC BY 2.0',
              },
              {
                id: 'community-context',
                type: 'callout',
                tone: 'context',
                title: 'Communities are partners, not audiences',
                body: "When you work with a community, a market or an association, you are entering a place with its own leaders, history and rules. Greet the right people first: the association chair, the market queen, the assembly member, the chief or the religious leader, as fits the place. Explain what you are doing and what you are not.\n\nBe honest about what you can deliver. Communities across the continent have seen many projects arrive with promises and leave without results. Trust is earned by doing what you said, and by coming back to share what you learnt.",
              },
            ],
          },
          {
            id: 'partner-basics',
            title: 'What every partnership needs',
            blocks: [
              {
                id: 'partner-framework',
                type: 'framework',
                title: 'Partnership basics',
                steps: [
                  { label: 'Shared goal', detail: 'Something both sides want, stated plainly.' },
                  { label: 'Mutual value', detail: 'What each side gives and gets. If one side only gives, the partnership will not last.' },
                  { label: 'Clear roles', detail: 'Who does what, who decides what, and who speaks for the partnership.' },
                  { label: 'Agreed communication', detail: 'How often you update each other, through whom, and how problems are raised.' },
                  { label: 'A way to end well', detail: 'How either side can step back without damage, and what happens to data, money and credit.' },
                ],
              },
              {
                id: 'partner-match',
                type: 'match',
                prompt: 'Match each of Team Baobab’s partners to what they most likely want from the partnership.',
                pairs: [
                  { id: 'association', left: 'A traders’ association at Kejetia Market', right: 'Real benefit for its members, and respect for its role' },
                  { id: 'funder', left: 'A small foundation offering a seed grant', right: 'Evidence its money made a difference, reported honestly' },
                  { id: 'university', left: 'A university lecturer offering students as volunteers', right: 'Real-world learning for students and perhaps research data, used ethically' },
                  { id: 'traders', left: 'Individual traders testing the tool', right: 'Something that saves them time or money, without extra burden' },
                ],
                explanation:
                  "Before you ask a partner for anything, ask: **what do they need, and how does working with us help them get it?** Partnerships built on mutual value survive setbacks. Partnerships built on favours rarely do.",
              },
            ],
          },
          {
            id: 'chair-scenario',
            title: 'A difficult request',
            blocks: [
              {
                id: 'chair-request',
                type: 'scenario',
                situation:
                  "The chair of the traders’ association has been supportive. Now he asks Team Baobab to give the pilot only to traders in his own section of the market, and to list him as a co-founder in their Lab presentation. Kwame, who introduced the team to him, feels awkward saying no.",
                prompt: 'How should the team respond?',
                options: [
                  {
                    id: 'agree',
                    text: 'Agree to everything. Without the chair, they have no access to the market.',
                    outcome: "The pilot runs only among his allies. Other traders see it as favouritism and refuse to join later. The team’s evidence is weaker, and listing him as co-founder misrepresents who did the work.",
                    best: false,
                  },
                  {
                    id: 'negotiate',
                    text: 'Thank him, explain why the pilot needs traders from across the market, and offer clear, honest credit: “in partnership with the association, with thanks to the chair”.',
                    outcome: "The chair is disappointed at first, but he values the public credit and the explanation. He agrees to include his section alongside others. The team keeps its integrity and the partnership.",
                    best: true,
                  },
                  {
                    id: 'bypass',
                    text: 'Quietly go around him and recruit traders directly.',
                    outcome: "The chair hears about it within days. He tells members not to work with “those students”. The pilot stalls.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'mou',
            title: 'Put it in writing',
            blocks: [
              {
                id: 'mou-choice',
                type: 'choice',
                prompt: 'Team Baobab and the association agree to write a short memorandum of understanding (MoU). What should it include? Select all that apply.',
                multiple: true,
                options: [
                  { id: 'goal', text: 'The shared goal of the pilot', correct: true, feedback: 'Yes. It anchors every later conversation.' },
                  { id: 'roles', text: 'What each side will do, and by when', correct: true, feedback: 'Yes. Clear roles prevent “I thought you were doing that”.' },
                  { id: 'data', text: 'How traders’ information will be collected, protected and used', correct: true, feedback: 'Yes. Data about people’s livelihoods must be handled with consent and care.' },
                  { id: 'credit', text: 'How the partnership will be credited publicly', correct: true, feedback: 'Yes. Credit disputes damage many good partnerships.' },
                  { id: 'promise', text: 'A promise that every trader will double their profits', correct: false, feedback: 'Never promise results you cannot control. It sets up disappointment and damages trust.' },
                ],
                explanation:
                  "An MoU does not have to be long or legal-sounding. One clear page, read and agreed by both sides, prevents most partnership disputes. Revisit it when something important changes.",
              },
            ],
          },
          {
            id: 'your-partner',
            title: 'Your key partner',
            blocks: [
              {
                id: 'partner-reflection',
                type: 'reflection',
                prompt: 'Name one organisation or community your team will need to partner with in the Dream Residency. What do they need, what can your team offer them, and what would you put in a one-page agreement?',
                guidance: 'Think about who must be greeted or consulted first, and how you will share credit. This goes into the partners section of your Team Charter.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'accountability-charter',
      type: 'lesson',
      title: 'Accountability and your Team Charter',
      minutes: 12,
      required: true,
      payload: {
        steps: [
          {
            id: 'why-charter',
            title: 'Why a charter?',
            blocks: [
              {
                id: 'why-charter-text',
                type: 'text',
                body: "A **Team Charter** is a short written agreement about how your team will work: its purpose, roles, decision rules, communication norms, conflict process and how you hold each other accountable.\n\nWriting it forces the conversations most teams avoid until it is too late. Agreeing it while everyone is calm means that when trouble comes, you have something fair to point to that is not about anyone’s personality.\n\nIn this short clip, a professor at MIT describes how team charters help student engineering teams.",
              },
              {
                id: 'why-charter-video',
                type: 'video',
                provider: 'youtube',
                videoId: '7IqUQUic5cI',
                title: 'Team Charters',
                channel: 'MIT OpenCourseWare',
                durationS: 89,
                caption: "Professor Olivier de Weck of MIT on how team charters help student teams form an identity and shared goals for a satellite design competition. Notice that even highly skilled teams write one.",
              },
            ],
          },
          {
            id: 'rhythm',
            title: 'An accountability rhythm',
            blocks: [
              {
                id: 'rhythm-framework',
                type: 'framework',
                title: 'Accountability without blame',
                steps: [
                  { label: 'Visible commitments', detail: 'Every action has an owner and a deadline, recorded where everyone can see it.' },
                  { label: 'Weekly check-in', detail: 'Ten minutes: what I did, what I will do, what is blocking me.' },
                  { label: 'Early warning', detail: 'Anyone who will miss a commitment says so in advance, with a new date or a request for help.' },
                  { label: 'Retrospective', detail: 'Every two weeks: what went well, what did not, what we will change.' },
                  { label: 'Charter review', detail: 'Revisit the charter after the first two weeks and whenever something big changes.' },
                ],
              },
              {
                id: 'rhythm-reveal',
                type: 'reveal',
                prompt: 'Accountability often sounds like blame. What is the difference? Think, then tap.',
                body: "**Blame** asks: whose fault is this? It looks backwards and makes people hide problems.\n\n**Accountability** asks: what did we commit to, what happened, and what will we do now? It looks forwards and makes it safe to bring problems early.\n\nA team with strong accountability and psychological safety is not one where nobody fails. It is one where failures surface quickly and get fixed together.",
              },
            ],
          },
          {
            id: 'retro-order',
            title: 'Run a retrospective',
            blocks: [
              {
                id: 'retro-steps',
                type: 'order',
                prompt: 'Put the steps of a short team retrospective in order.',
                items: [
                  { id: 'frame', text: 'Remind everyone the aim is to improve, not to blame' },
                  { id: 'well', text: 'Each person shares what went well' },
                  { id: 'not-well', text: 'Each person shares what did not go well' },
                  { id: 'choose', text: 'Choose one or two changes to try' },
                  { id: 'record', text: 'Record the changes and update the charter if needed' },
                ],
                explanation:
                  "Starting with what went well is not just politeness. It shows what to protect, and makes it easier to be honest about what did not work. Choosing only one or two changes keeps them realistic.",
              },
            ],
          },
          {
            id: 'kwame-scenario',
            title: 'When someone falls behind',
            blocks: [
              {
                id: 'kwame-behind',
                type: 'scenario',
                situation:
                  "Two weeks into the residency, Team Baobab’s commitments log shows Kwame has completed one of his four actions. His exams have started. The charter says: “If you will miss a commitment, tell the team 24 hours ahead with a new date.” Kwame did not.",
                prompt: 'As this week’s facilitator, what should Uwase do?',
                options: [
                  {
                    id: 'ignore',
                    text: 'Let it go. Everyone knows exams are hard.',
                    outcome: "Kwame is relieved, but Wanjiru and Chidi quietly resent it. The charter starts to feel optional, and other commitments begin to slip too.",
                    best: false,
                  },
                  {
                    id: 'charter',
                    text: 'Raise it calmly in the check-in, referring to the charter rather than to Kwame’s character, and ask what he needs.',
                    outcome: "Kwame admits he was embarrassed. The team moves two of his actions to after his exams and agrees he will send short voice-note updates. Everyone sees that the charter applies fairly, and that it is there to help, not to punish.",
                    best: true,
                  },
                  {
                    id: 'remove',
                    text: 'Propose removing Kwame from the team.',
                    outcome: "It is far out of proportion to one difficult fortnight. The team loses its link to the traders at Kejetia, and everyone learns that admitting difficulty is dangerous.",
                    best: false,
                  },
                ],
              },
            ],
          },
          {
            id: 'ready',
            title: 'How ready is your team?',
            blocks: [
              {
                id: 'ready-scale',
                type: 'scale',
                prompt: 'How ready is your Lab team to work well together through four weeks of the Dream Residency?',
                minLabel: 'Not ready at all',
                maxLabel: 'Fully ready',
                afterword:
                  "Wherever you are, the charter is your next step. Teams that start lower but talk honestly often overtake teams that start confident and never discuss how they work.",
              },
              {
                id: 'ubuntu-quote',
                type: 'quote',
                text: 'Umuntu ngumuntu ngabantu. (A person is a person through other people.)',
                attribution: 'Nguni proverb, often linked to the idea of Ubuntu',
              },
            ],
          },
          {
            id: 'charter-draft',
            title: 'Draft your accountability section',
            blocks: [
              {
                id: 'charter-reflection',
                type: 'reflection',
                prompt: 'Draft the accountability section of your Team Charter: where commitments are recorded, your weekly check-in, your early-warning rule, how often you will hold a retrospective, and when you will review the charter.',
                guidance: 'Then bring all your drafts from this course to your team. Agree the charter together; it only works if everyone helped write it.',
                minWords: 40,
              },
            ],
          },
        ],
      },
    },
    {
      key: 'beyond-the-team-quiz',
      type: 'quiz',
      title: 'Module quiz: partnerships and accountability',
      minutes: 8,
      required: true,
      gradeWeight: 10,
      payload: {
        intro:
          "Five questions on partnerships, accountability and team charters. You need 70% to pass and can retake it as often as you like.",
        passPct: 70,
        maxAttempts: null,
        questions: [
          {
            id: 'q-mutual-value',
            type: 'choice',
            prompt: 'What is the most important question to ask before approaching a partner?',
            multiple: false,
            options: [
              { id: 'a', text: '“How much can we get from them?”', correct: false, feedback: 'Partnerships built only on what you take do not last.' },
              { id: 'b', text: '“What do they need, and how does working with us help them get it?”', correct: true },
              { id: 'c', text: '“How quickly can we sign an agreement?”', correct: false, feedback: 'Speed matters less than mutual understanding.' },
              { id: 'd', text: '“Who is the most famous partner we could get?”', correct: false, feedback: 'Fame does not make a partner a good fit.' },
            ],
            explanation: 'Mutual value is what keeps a partnership alive through setbacks.',
          },
          {
            id: 'q-partnership-order',
            type: 'order',
            prompt: 'Put these partnership basics in the order taught.',
            items: [
              { id: 'goal', text: 'Shared goal' },
              { id: 'value', text: 'Mutual value' },
              { id: 'roles', text: 'Clear roles' },
              { id: 'comms', text: 'Agreed communication' },
              { id: 'end', text: 'A way to end well' },
            ],
            explanation: 'Start from what you both want, make sure both sides gain, then agree who does what, how you talk and how you would part well.',
          },
          {
            id: 'q-mou',
            type: 'choice',
            prompt: 'Which belong in a simple partnership agreement? Select all that apply.',
            multiple: true,
            options: [
              { id: 'goal', text: 'The shared goal', correct: true },
              { id: 'roles', text: 'Each side’s responsibilities and timelines', correct: true },
              { id: 'data', text: 'How information about people will be collected and protected', correct: true },
              { id: 'guarantee', text: 'Guaranteed results for the community', correct: false, feedback: 'Never promise what you cannot control.' },
            ],
            explanation: 'One clear page covering goal, roles, data, credit and communication prevents most disputes.',
          },
          {
            id: 'q-accountability',
            type: 'match',
            prompt: 'Match each accountability practice to its purpose.',
            pairs: [
              { id: 'log', left: 'Commitments log', right: 'Makes who promised what visible to everyone' },
              { id: 'checkin', left: 'Weekly check-in', right: 'Surfaces progress and blockers regularly' },
              { id: 'warning', left: 'Early-warning rule', right: 'Lets the team adjust before a deadline is missed' },
              { id: 'retro', left: 'Retrospective', right: 'Helps the team learn and improve how it works' },
            ],
            explanation: 'Together these make accountability routine and fair, rather than personal and occasional.',
          },
          {
            id: 'q-blame',
            type: 'choice',
            prompt: 'What is the key difference between accountability and blame?',
            multiple: false,
            options: [
              { id: 'a', text: 'Accountability is softer and lets people off', correct: false, feedback: 'Accountability can be firm. It is about commitments, not softness.' },
              { id: 'b', text: 'Accountability looks forward to what happens next; blame looks back for someone at fault', correct: true },
              { id: 'c', text: 'Blame is for leaders, accountability is for members', correct: false, feedback: 'Neither depends on rank.' },
              { id: 'd', text: 'There is no real difference', correct: false, feedback: 'The difference shapes whether people bring problems early or hide them.' },
            ],
            explanation: 'Blame makes people hide problems; accountability makes it safe to raise them early and fix them together.',
          },
        ],
      },
    },
    {
      key: 'team-charter',
      type: 'assignment',
      title: 'Practical Output: your Team Charter',
      minutes: 45,
      required: true,
      gradeWeight: 40,
      payload: {
        brief:
          "This is the Practical Output of the course: a **Team Charter** for your Lab or venture team.\n\nYour charter is a working agreement covering purpose, roles, decision rules, communication norms, meetings, conflict process, accountability and key partners. Write it **with** your team: each member should have contributed and agreed to it.\n\nThen use it. After at least one week of working with your charter, add a short reflection on how your team used it: what worked, what you changed and what you learnt.\n\nEach team member submits the shared charter plus their own reflection. A faculty reviewer will grade it against the rubric below. Your charter goes with your team into the Dream Residency, and your mentor will ask to see it.",
        practicalOutput: 'Team Charter',
        steps: [
          'Gather your drafts from this course: roles and RACI, decision rules, norms, meeting plan, communication norms, conflict process, partners and accountability.',
          'Meet as a team. Compare drafts and agree each section together, starting with your purpose.',
          'Make every norm specific enough that a new teammate would know exactly what to do.',
          'Check that each important task has exactly one Accountable person, and that your time zones and constraints are reflected.',
          'Fill in every section of the template. Every member signs with their name and the date.',
          'Use the charter for at least one week: run your meetings, check-ins and channels as agreed.',
          'Hold a short retrospective and update the charter if needed.',
          'Write your own reflection on how the team used the charter, then submit.',
        ],
        rubric: [
          {
            id: 'purpose-roles',
            criterion: 'Purpose and roles',
            description: 'A clear shared purpose with a picture of success, every member’s role defined, and a RACI with exactly one Accountable person per key task.',
          },
          {
            id: 'decisions-norms',
            criterion: 'Decision rules and norms',
            description: 'Decision rules matched to the size and urgency of decisions, and norms specific enough to observe and act on.',
          },
          {
            id: 'communication',
            criterion: 'Meetings and communication',
            description: 'A realistic meeting rhythm with roles and recorded actions, and communication norms that fit the team’s time zones, tools and constraints.',
          },
          {
            id: 'conflict',
            criterion: 'Conflict process',
            description: 'A fair, step-by-step process for raising and resolving concerns early, using SBI, with a clear point for involving the mentor.',
          },
          {
            id: 'accountability-partners',
            criterion: 'Accountability and partners',
            description: 'A visible system for commitments, check-ins, early warnings and retrospectives, plus a thoughtful approach to at least one key partner.',
          },
          {
            id: 'reflection',
            criterion: 'Reflection on use',
            description: 'An honest reflection on at least one week of using the charter, showing what worked, what changed and what the writer learnt about their own collaboration.',
          },
        ],
        template: teamCharterTemplate,
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
          "Ten questions across the whole course: how teams work, roles and decisions, meetings, remote collaboration, conflict, partnerships and accountability. Most follow a new fictional team.\n\nYou need 75% to pass and can retake it as often as you like.",
        passPct: 75,
        maxAttempts: null,
        questions: [
          {
            id: 'f-case-start',
            type: 'choice',
            prompt: 'New case: five Lab learners in Accra, Abuja and Kampala form Team Kente to build a tutoring service. In their first call, everyone is polite and excited, and nobody disagrees. Which stage are they in?',
            multiple: false,
            options: [
              { id: 'a', text: 'Forming', correct: true },
              { id: 'b', text: 'Storming', correct: false, feedback: 'Storming comes when differences surface. They are not there yet.' },
              { id: 'c', text: 'Norming', correct: false, feedback: 'They have not agreed any norms yet.' },
              { id: 'd', text: 'Performing', correct: false, feedback: 'They have not done any work together yet.' },
            ],
            explanation: 'Polite, excited and unsure: forming. The best time to agree a charter is now, before storming begins.',
          },
          {
            id: 'f-case-norm',
            type: 'choice',
            prompt: 'Which norm should Team Kente write into its charter?',
            multiple: false,
            options: [
              { id: 'a', text: '“Be committed.”', correct: false, feedback: 'Too vague to act on.' },
              { id: 'b', text: '“Reply to team messages within 24 hours on weekdays; use a call for anything urgent.”', correct: true },
              { id: 'c', text: '“Be positive at all times.”', correct: false, feedback: 'Unrealistic, and it can discourage people from raising problems.' },
              { id: 'd', text: '“Do your best.”', correct: false, feedback: 'Everyone agrees, and it changes nothing.' },
            ],
            explanation: 'A good norm describes observable behaviour. Anyone could check whether it was followed.',
          },
          {
            id: 'f-case-raci',
            type: 'match',
            prompt: 'Team Kente is recruiting its first ten tutors. Match each person to their RACI role.',
            pairs: [
              { id: 'r', left: 'Akosua contacts and interviews candidates', right: 'Responsible' },
              { id: 'a', left: 'Emeka makes the final choice of tutors', right: 'Accountable' },
              { id: 'c', left: 'Their mentor reviews the interview questions first', right: 'Consulted' },
              { id: 'i', left: 'The rest of the team receives the final list', right: 'Informed' },
            ],
            explanation: 'One person owns the outcome. Others do the work, give input or are kept informed.',
          },
          {
            id: 'f-case-decision',
            type: 'choice',
            prompt: 'Team Kente must choose its name and logo, a low-stakes decision with no deadline pressure, but one everyone will live with. Which decision rule fits best?',
            multiple: false,
            options: [
              { id: 'a', text: 'One person decides alone', correct: false, feedback: 'Fast, but a name everyone carries deserves wider input.' },
              { id: 'b', text: 'Consent: go ahead with a proposal unless someone has a serious objection', correct: true },
              { id: 'c', text: 'Full consensus after unlimited discussion', correct: false, feedback: 'It could drag on for weeks over a name.' },
              { id: 'd', text: 'Let the mentor decide', correct: false, feedback: 'It is the team’s identity, not the mentor’s.' },
            ],
            explanation: 'Consent moves forward while giving everyone a real voice. Save full consensus for the biggest, hardest-to-reverse decisions.',
          },
          {
            id: 'f-case-time',
            type: 'choice',
            prompt: 'Team Kente’s weekly call is at 7 p.m. in Accra (UTC+0). What time is it in Kampala (UTC+3)?',
            multiple: false,
            options: [
              { id: 'a', text: '4 p.m.', correct: false, feedback: 'Kampala is ahead of Accra, not behind.' },
              { id: 'b', text: '8 p.m.', correct: false, feedback: 'That would be UTC+1, Abuja’s time zone.' },
              { id: 'c', text: '10 p.m.', correct: true },
              { id: 'd', text: '7 p.m.', correct: false, feedback: 'Only if they shared a time zone.' },
            ],
            explanation: '10 p.m. is late for the Kampala members every week. Rotating the slot shares the inconvenience fairly.',
          },
          {
            id: 'f-case-meeting',
            type: 'order',
            prompt: 'Put the parts of Team Kente’s weekly call in a good order.',
            items: [
              { id: 'purpose', text: 'Restate the purpose and agenda' },
              { id: 'review', text: 'Review last week’s actions' },
              { id: 'decide', text: 'Discuss and decide the main item' },
              { id: 'actions', text: 'Agree new actions: who, what, by when' },
            ],
            explanation: 'Purpose, accountability, decision, actions. Then share the notes within a day.',
          },
          {
            id: 'f-case-conflict',
            type: 'choice',
            prompt: 'Akosua feels Emeka keeps dismissing her ideas in calls. Which opening uses SBI well?',
            multiple: false,
            options: [
              { id: 'a', text: '“You’re so arrogant. You never listen to anyone.”', correct: false, feedback: 'This labels character and invites defensiveness.' },
              { id: 'b', text: '“In Monday’s call, when I suggested evening sessions, you said ‘that won’t work’ and moved on. I felt shut out, and I stopped sharing ideas. Can we talk about it?”', correct: true },
              { id: 'c', text: 'Saying nothing and complaining to another teammate', correct: false, feedback: 'Side conversations grow conflict instead of solving it.' },
              { id: 'd', text: '“Some people in this team need to learn manners.”', correct: false, feedback: 'Vague, public and passive-aggressive.' },
            ],
            explanation: 'Situation, behaviour, impact, then an invitation to talk. It is specific, fair and hard to argue with.',
          },
          {
            id: 'f-case-hidden',
            type: 'choice',
            prompt: 'Which signs suggest Team Kente has conflict nobody has named? Select all that apply.',
            multiple: true,
            options: [
              { id: 'side', text: 'Two members message privately about a third', correct: true },
              { id: 'quiet', text: 'A usually active member stops speaking in calls', correct: true },
              { id: 'debate', text: 'An open debate about pricing in a team call', correct: false, feedback: 'Open, respectful task conflict is healthy.' },
              { id: 'cold', text: 'Short, cold replies in the team chat', correct: true },
            ],
            explanation: 'Silence, side-channels and tone are early warnings. Open debate is not.',
          },
          {
            id: 'f-case-partner',
            type: 'choice',
            prompt: 'A school head offers Team Kente classrooms on Saturdays if the team gives free lessons to ten of the school’s pupils. What is the best next step?',
            multiple: false,
            options: [
              { id: 'a', text: 'Accept immediately before the offer disappears', correct: false, feedback: 'Accepting without clarity often leads to disputes later.' },
              { id: 'b', text: 'Agree a one-page MoU covering the shared goal, what each side provides, safeguarding for pupils, and how the partnership is credited', correct: true },
              { id: 'c', text: 'Decline; partnerships are too complicated', correct: false, feedback: 'This could be a strong partnership with mutual value.' },
              { id: 'd', text: 'Promise the school that every pupil’s grades will rise', correct: false, feedback: 'Never promise results you cannot control.' },
            ],
            explanation: 'There is mutual value here. A short written agreement, including safeguarding because children are involved, protects everyone.',
          },
          {
            id: 'f-case-accountability',
            type: 'choice',
            prompt: 'Emeka has missed two commitments without warning, against the charter. What should the team do first?',
            multiple: false,
            options: [
              { id: 'a', text: 'Remove him from the team', correct: false, feedback: 'Far out of proportion as a first step.' },
              { id: 'b', text: 'Raise it calmly in the check-in, refer to the agreed charter rule, and ask what he needs', correct: true },
              { id: 'c', text: 'Ignore it to avoid awkwardness', correct: false, feedback: 'The charter then becomes optional for everyone.' },
              { id: 'd', text: 'Complain about him to the mentor without telling him', correct: false, feedback: 'Go to the person first. Involve the mentor if the team process does not resolve it.' },
            ],
            explanation: 'Accountability without blame: refer to the agreement, not the person’s character, and look for what will help the work move forward.',
          },
        ],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// The course
// ---------------------------------------------------------------------------

export const collaboration: CourseAuthoring = {
  slug: 'collaboration',
  title: 'Collaboration',
  subtitle: 'Build teams that trust each other, share the work and finish what they start.',
  description:
    "No dream worth having is built alone. Yet many teams fall apart over unclear roles, unspoken expectations, uneven effort and conflict nobody addresses. Collaboration is a skill, and it can be learnt.\n\nIn this course you will learn how strong teams form and what makes them trusted and effective. You will practise agreeing roles and decisions, running meetings that produce action, working across distance and time zones with simple tools, handling conflict early and fairly, and partnering with organisations, communities and funders. You will work in a real Lab team throughout, so every lesson is tested on people you depend on.\n\nThis course closes the Builder’s Architecture phase and prepares your team for the Dream Residency.\n\nYour Practical Output is a **Team Charter**: a working agreement for your Lab or venture team covering purpose, roles, decision rules, communication norms, conflict process and accountability, with a short reflection on how your team used it.",
  provider: 'The African Dream Lab',
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
  modules: [moduleTeams, moduleWorking, moduleBeyond],
};

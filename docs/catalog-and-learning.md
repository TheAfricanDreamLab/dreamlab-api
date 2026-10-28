# Catalog and learning: guide for authors and platform admins

How courses are structured, how a learner works through them, and how platform admins put courses on the platform. Services: `catalog` (content) and `learning` (learner records). Contracts: `@dreamlab/contracts` 0.7.0 (`content`, `catalog`, `learning`, `platform`).

## How a course is built

A course has **modules**; a module has **items**. Item types:

| Type | What the learner does | Completes when |
|---|---|---|
| `lesson` | Works through short **steps**, one at a time. Each step mixes teaching blocks with questions to answer | Every question in the lesson is answered (graded ones right, or the answer revealed) |
| `quiz` | Answers every question, then submits. Pass mark and attempt limit per quiz | Passed |
| `assignment` | Writes a submission against a brief and a rubric; can resubmit (every version is kept) | Submitted (faculty grade it later) |
| `discussion` | Posts an answer to a prompt; sees classmates' posts after posting, and can reply | Posted |

Teaching blocks: `text`, `callout` (insight, tip, caution, story, context), `quote`, `example`, `key_terms`, `reveal` (think first, then tap), `framework` (labelled steps).

Question blocks, checked by the server so answers never reach a browser:

| Block | Right answer? | Learner sees |
|---|---|---|
| `choice` (one or several) | Yes | Feedback on their pick; the explanation and answer once right, or after two wrong tries |
| `order` | Yes | How many are in place; the right order once earned |
| `match` | Yes | How many pairs are right; the answer once earned |
| `poll` | No | How everyone else voted |
| `scale` (1–5) | No | How everyone else rated themselves |
| `reflection` | No | Saved to their journal (minimum word count) |
| `scenario` | No (one may be marked best) | What happens next for the option they chose |

## Versions

Every change to a course's content publishes a **new version**. Learners stay on the version they enrolled in, so a revision never changes a course under someone halfway through it. Course details (title, description, cover) update in place.

## Writing in the browser

Authors open **Authoring**, edit a draft (details, outline, JSON), upload a cover photo, a trailer or
lesson videos and images (stored in the platform's file storage and served from `/media/...`), and
**Preview** the draft as learners will see it before sending it for review. Reviewers publish it or
ask for changes; both sides are notified (in the app, and by email unless they turned it off).

Who may write: the **Course author** role for the whole organisation (any course, and new ones), or
for **one course** (People → add role → *for <course>*): that author sees and edits that course only.

## Staging and production

- **Staging** loads test content on start (`CATALOG_SEED=dream-lab-test`): The African Dream Lab programme, the full Problem Solving course, and the other twelve courses as "coming soon" outlines. Re-deploying never duplicates it; changed content becomes a new version.
- **Production** starts empty. Platform admins provision the real courses there by import.

## Importing a course (platform admin)

1. Write the course as JSON in the `CourseAuthoring` shape (`@dreamlab/contracts`, `src/content.ts`). The test course is a full example: `apps/catalog/src/seed/content/problem-solving.ts`.
2. Sign in as a platform admin, open **Platform admin → Catalog**, choose **Import**, pick the file.
3. The catalog validates it, creates or updates the course, and publishes a new version when the content changed. The result shows the version number.
4. Import programmes the same way (`ProgramAuthoring`); their courses must already exist. Or edit a
   programme in the browser: **Catalog → Programmes → Edit** (or **New programme**) loads it as its
   file, and saving imports it again. New cohorts follow the saved programme; scheduled ones keep theirs.
5. Use **Listed** to hide or show a course in the catalog (enrolled learners keep access) and **Featured** to show it first.

API equivalents: `POST /v1/catalog/admin/courses/import`, `GET` / `POST /v1/catalog/admin/programs/...`, `PATCH /v1/catalog/admin/courses/:courseId`.

## Privacy

- A learner's enrolments, progress, answers and submissions are visible to that learner only (row-level security per learner). Submissions and grades are append-only.
- Discussion posts are visible to learners of the same course in the same context: an organisation's learners see each other; people learning on their own see other people learning on their own. Only display names are shared.
- Files attached to an assignment are private: only the learner and the people who may grade that work
  can open them, each time through a link that works for a few minutes.
- Notifications are per person (row-level security); emails carry the notification's text and a link
  into the app, nothing else.
- Poll and scale results are counts only.
- Platform statistics are counts; no learner's records leave the learning service.

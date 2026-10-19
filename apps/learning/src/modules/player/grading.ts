import {
  BLOCK_MAX_TRIES,
  BlockAuthoring,
  BlockResponse,
  BlockResult,
  InteractiveBlockAuthoring,
  isInteractiveBlock,
  ItemAuthoring,
} from '@dreamlab/contracts';
import { badRequest } from '@lib/common';

/*
 * Checking learners' answers. Pure functions over authored content: the answers stay on the
 * server, and the client only ever sees the verdict, the feedback, and (once earned) the solution.
 */

export const wordCount = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

const solutionOf = (block: InteractiveBlockAuthoring): BlockResult['solution'] => {
  switch (block.type) {
    case 'choice':
      return { optionIds: block.options.filter((o) => o.correct).map((o) => o.id) };
    case 'order':
      return { itemIds: block.items.map((i) => i.id) };
    case 'match':
      return { matches: Object.fromEntries(block.pairs.map((p) => [p.id, p.id])) };
    default:
      return null;
  }
};

const blank = (blockId: string, attempts: number): BlockResult => ({
  blockId,
  correct: null,
  feedback: null,
  explanation: null,
  solution: null,
  outcome: null,
  distribution: null,
  afterword: null,
  attempts,
  canRetry: false,
});

/**
 * Check one answer. `previousAttempts` counts earlier tries on this block; after BLOCK_MAX_TRIES
 * wrong tries (or a right one) the explanation and solution are revealed.
 */
export function checkBlock(block: InteractiveBlockAuthoring, response: BlockResponse, previousAttempts: number): BlockResult {
  if (response.type !== block.type) throw badRequest('response_mismatch', `This question expects a ${block.type} answer.`);
  const attempts = previousAttempts + 1;
  const result = blank(block.id, attempts);
  const graded = (correct: boolean, feedback: string | null, explanation: string): BlockResult => {
    const reveal = correct || attempts >= BLOCK_MAX_TRIES;
    return { ...result, correct, feedback, explanation: reveal ? explanation : null, solution: reveal ? solutionOf(block) : null, canRetry: !reveal };
  };

  switch (block.type) {
    case 'choice': {
      const r = response as Extract<BlockResponse, { type: 'choice' }>;
      const chosen = new Set(r.optionIds);
      const unknown = r.optionIds.find((id) => !block.options.some((o) => o.id === id));
      if (unknown) throw badRequest('unknown_option', 'That option is not part of this question.');
      if (!block.multiple && chosen.size !== 1) throw badRequest('one_option', 'Pick one option.');
      const correct = block.options.every((o) => o.correct === chosen.has(o.id));
      const wrongPick = block.options.find((o) => chosen.has(o.id) && !o.correct);
      const missed = block.options.find((o) => !chosen.has(o.id) && o.correct);
      const picked = block.options.find((o) => chosen.has(o.id) && o.correct);
      const feedback = correct
        ? (picked?.feedback ?? null)
        : (wrongPick?.feedback ?? (missed ? 'Close. There is at least one more right answer.' : null));
      return graded(correct, feedback, block.explanation);
    }
    case 'order': {
      const r = response as Extract<BlockResponse, { type: 'order' }>;
      const expected = block.items.map((i) => i.id);
      if (r.itemIds.length !== expected.length || new Set(r.itemIds).size !== expected.length || r.itemIds.some((id) => !expected.includes(id))) {
        throw badRequest('order_incomplete', 'Place every item once.');
      }
      const correct = r.itemIds.every((id, i) => id === expected[i]);
      const rightPlaces = r.itemIds.filter((id, i) => id === expected[i]).length;
      return graded(correct, correct ? null : `${rightPlaces} of ${expected.length} are in the right place.`, block.explanation);
    }
    case 'match': {
      const r = response as Extract<BlockResponse, { type: 'match' }>;
      const ids = block.pairs.map((p) => p.id);
      if (ids.some((id) => !r.matches[id]) || Object.values(r.matches).some((v) => !ids.includes(v))) {
        throw badRequest('match_incomplete', 'Match every item.');
      }
      const right = ids.filter((id) => r.matches[id] === id).length;
      const correct = right === ids.length;
      return graded(correct, correct ? null : `${right} of ${ids.length} pairs are right.`, block.explanation);
    }
    case 'poll': {
      const r = response as Extract<BlockResponse, { type: 'poll' }>;
      if (!block.options.some((o) => o.id === r.optionId)) throw badRequest('unknown_option', 'That option is not part of this poll.');
      return { ...result, afterword: block.afterword ?? null };
    }
    case 'scale':
      return { ...result, afterword: block.afterword ?? null };
    case 'reflection': {
      const r = response as Extract<BlockResponse, { type: 'reflection' }>;
      if (wordCount(r.text) < block.minWords) {
        throw badRequest('reflection_too_short', `Write at least ${block.minWords} words. A few honest sentences are enough.`);
      }
      return { ...result, feedback: 'Saved to your journal.' };
    }
    case 'scenario': {
      const r = response as Extract<BlockResponse, { type: 'scenario' }>;
      const option = block.options.find((o) => o.id === r.optionId);
      if (!option) throw badRequest('unknown_option', 'That option is not part of this scenario.');
      return { ...result, outcome: { text: option.outcome, best: option.best } };
    }
  }
}

/** Every interactive block of a lesson, with the step it sits in. */
export function interactiveBlocks(item: ItemAuthoring): InteractiveBlockAuthoring[] {
  if (item.type !== 'lesson') return [];
  return item.payload.steps.flatMap((s) => s.blocks.filter((b: BlockAuthoring) => isInteractiveBlock(b)) as InteractiveBlockAuthoring[]);
}

export function findBlock(item: ItemAuthoring, blockId: string): InteractiveBlockAuthoring {
  const block = interactiveBlocks(item).find((b) => b.id === blockId);
  if (!block) throw badRequest('unknown_block', 'That question is not part of this lesson.');
  return block;
}

/** A lesson block is settled when answered; graded blocks need a right answer or the revealed solution. */
export const isSettled = (result: BlockResult | undefined): boolean =>
  !!result && (result.correct === null || result.correct || result.solution !== null);

export interface QuizGrade {
  scorePct: number;
  passed: boolean;
  results: BlockResult[];
}

/**
 * Grade a quiz attempt. Wrong answers get their feedback straight away; the explanations and
 * solutions are shown once the learner passes or has no attempts left.
 */
export function gradeQuiz(item: Extract<ItemAuthoring, { type: 'quiz' }>, answers: Record<string, BlockResponse>, attemptsLeftAfter: number | null): QuizGrade {
  const missing = item.payload.questions.find((q) => !answers[q.id]);
  if (missing) throw badRequest('quiz_incomplete', 'Answer every question before submitting.');
  const results = item.payload.questions.map((q) => checkBlock(q, answers[q.id]!, BLOCK_MAX_TRIES));
  const right = results.filter((r) => r.correct).length;
  const scorePct = Math.round((right / item.payload.questions.length) * 100);
  const passed = scorePct >= item.payload.passPct;
  const reveal = passed || attemptsLeftAfter === 0;
  return {
    scorePct,
    passed,
    results: results.map((r) => ({ ...r, canRetry: false, explanation: reveal ? r.explanation : null, solution: reveal ? r.solution : null })),
  };
}

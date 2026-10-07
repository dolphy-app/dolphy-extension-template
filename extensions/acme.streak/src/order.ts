import type { HookRequest, HookResponse } from '@dolphy-app/extension-sdk';

/**
 * Reviews first, the most forgotten of them first; everything else follows in
 * the order the engine chose. `memory[i]` and `reasons[i]` belong to
 * `exerciseIds[i]`.
 */
export const reviewsFirst = ({
  exerciseIds,
  reasons,
  memory,
}: HookRequest<'practice.batch'>): HookResponse<'practice.batch'> => {
  const items = exerciseIds.map((id, index) => ({
    id,
    reason: reasons[index] ?? 'new',
    // no attempts yet: nothing to forget, so it goes after the forgotten ones
    retrievability: memory[index]?.retrievability ?? 1,
  }));
  const reviews = items
    .filter(({ reason }) => reason === 'review')
    .sort((a, b) => a.retrievability - b.retrievability);
  const others = items.filter(({ reason }) => reason !== 'review');
  const ordered = [...reviews, ...others];
  return {
    exerciseIds: ordered.map(({ id }) => id),
    reasons: ordered.map(({ reason }) => reason),
  };
};

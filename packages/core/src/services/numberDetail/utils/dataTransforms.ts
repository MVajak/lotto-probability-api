import type {LottoDraw} from '@lotto/database';

import type {DrawTimelineEntry} from '../../../models';

/**
 * Build binary appearance sequence (1 = appeared, 0 = not appeared).
 * Used for streak calculations and statistical analyses.
 *
 * @param allDraws - All draws in chronological order
 * @param drawsWithNumber - Draws where the number appeared
 * @returns Binary array representing appearance in each draw
 */
export function buildAppearanceSequence(
  allDraws: LottoDraw[],
  drawsWithNumber: LottoDraw[],
): number[] {
  // Create a set of draw IDs where the number appeared for O(1) lookup
  const appearedDrawIds = new Set(drawsWithNumber.map(draw => draw.id));

  // Build binary sequence
  return allDraws.map(draw => (appearedDrawIds.has(draw.id) ? 1 : 0));
}

/**
 * Build timeline of all draws showing when number appeared.
 * Used for visualizing draw history in the UI.
 *
 * @param allDraws - All draws in chronological order
 * @param drawsWithNumber - Draws where the number appeared
 * @returns Timeline entries sorted by date (ascending)
 */
export function buildTimeline(
  allDraws: LottoDraw[],
  drawsWithNumber: LottoDraw[],
): DrawTimelineEntry[] {
  // Create a set of draw IDs where the number appeared for O(1) lookup
  const appearedDrawIds = new Set(drawsWithNumber.map(draw => draw.id));

  // Build timeline entries
  return allDraws.map(draw => ({
    drawDate: draw.drawDate,
    drawLabel: draw.drawLabel,
    appeared: appearedDrawIds.has(draw.id),
  }));
}

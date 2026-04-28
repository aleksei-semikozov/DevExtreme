/**
 * @timezone Africa/Cairo
 */

import {
  describe, expect, it,
} from '@jest/globals';

import { getMinutesCellIntervals } from './get_minutes_cell_intervals';

describe('getMinutesCellIntervals on midnight DST — fractional startDayHour', () => {
  it('T1327394: should skip the local 00:30 phantom cell on Cairo midnight DST when startDayHour=0.5', () => {
    const cells = getMinutesCellIntervals({
      intervals: [{
        min: Date.UTC(2026, 3, 24),
        max: Date.UTC(2026, 3, 25),
      }],
      startDayHour: 0.5,
      endDayHour: 24,
      durationMinutes: 60,
      skippedDays: [],
    });

    expect(cells.find((c) => c.min === Date.UTC(2026, 3, 24, 0, 30))).toBeUndefined();
    expect(cells[0]).toMatchObject({
      min: Date.UTC(2026, 3, 24, 1),
      max: Date.UTC(2026, 3, 24, 2),
    });
  });
});

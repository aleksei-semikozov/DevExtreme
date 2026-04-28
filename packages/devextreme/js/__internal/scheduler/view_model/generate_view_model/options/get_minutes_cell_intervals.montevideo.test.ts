/**
 * @timezone America/Montevideo
 */

import {
  describe, expect, it,
} from '@jest/globals';

import { getMinutesCellIntervals } from './get_minutes_cell_intervals';

describe('getMinutesCellIntervals on midnight DST — non-1h jump', () => {
  it('T1327394: should skip the local 01:00 phantom cell on Montevideo 1.5h midnight DST', () => {
    const cells = getMinutesCellIntervals({
      intervals: [{
        min: Date.UTC(1974, 0, 13),
        max: Date.UTC(1974, 0, 14),
      }],
      startDayHour: 0,
      endDayHour: 24,
      durationMinutes: 60,
      skippedDays: [],
    });

    expect(cells.find((c) => c.min === Date.UTC(1974, 0, 13, 1))).toBeUndefined();
    expect(cells[0]).toMatchObject({
      min: Date.UTC(1974, 0, 13, 1, 30),
      max: Date.UTC(1974, 0, 13, 2, 30),
    });
  });
});

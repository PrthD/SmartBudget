import { describe, expect, it } from 'vitest';
import {
  addMonths,
  civilToInstant,
  dayOfWeek,
  instantToCivil,
  isValidCivilDate,
} from '../../src/lib/civilDate.js';
import {
  isOccurrence,
  nextOccurrence,
  occurrencesInRange,
} from '../../src/lib/recurrence.js';
import { periodRange, shiftPeriod } from '../../src/lib/periods.js';
import { decodeKeys, encodeKeys } from '../../src/lib/mapKeys.js';

describe('civil dates', () => {
  it('validates real calendar dates only', () => {
    expect(isValidCivilDate('2024-02-29')).toBe(true);
    expect(isValidCivilDate('2025-02-29')).toBe(false);
    expect(isValidCivilDate('2025-13-01')).toBe(false);
    expect(isValidCivilDate('2025-1-01')).toBe(false);
  });

  it('clamps month arithmetic to the end of shorter months', () => {
    expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2025-01-31', 2)).toBe('2025-03-31');
    expect(addMonths('2025-12-15', 1)).toBe('2026-01-15');
    expect(addMonths('2025-03-31', -1)).toBe('2025-02-28');
  });

  it('knows the day of week', () => {
    expect(dayOfWeek('1970-01-01')).toBe(4); // Thursday
    expect(dayOfWeek('2025-10-05')).toBe(0); // Sunday
  });

  it('round-trips through stored instants across DST', () => {
    for (const date of [
      '2025-03-09',
      '2025-03-10',
      '2025-11-02',
      '2025-07-01',
    ]) {
      const instant = civilToInstant(date, 'America/Edmonton');
      expect(instantToCivil(instant, 'America/Edmonton')).toBe(date);
    }
    // v1 stored midnight Edmonton as UTC; it must read back as the same day.
    expect(
      instantToCivil(new Date('2025-01-15T07:00:00.000Z'), 'America/Edmonton')
    ).toBe('2025-01-15');
    expect(civilToInstant('2025-07-01', 'Asia/Kolkata').toISOString()).toBe(
      '2025-06-30T18:30:00.000Z'
    );
  });
});

describe('recurrence', () => {
  it('does not drift month-end dates (v1 bug: Jan 31 → Feb 28 → Mar 28)', () => {
    const schedule = { anchor: '2025-01-31', frequency: 'monthly' };
    expect(occurrencesInRange(schedule, '2025-01-01', '2025-05-31')).toEqual([
      '2025-01-31',
      '2025-02-28',
      '2025-03-31',
      '2025-04-30',
      '2025-05-31',
    ]);
  });

  it('expands weekly and biweekly schedules inside a window only', () => {
    const weekly = { anchor: '2025-01-01', frequency: 'weekly' };
    expect(occurrencesInRange(weekly, '2025-01-10', '2025-01-31')).toEqual([
      '2025-01-15',
      '2025-01-22',
      '2025-01-29',
    ]);
    const biweekly = { anchor: '2025-01-03', frequency: 'biweekly' };
    expect(occurrencesInRange(biweekly, '2025-01-01', '2025-02-28')).toEqual([
      '2025-01-03',
      '2025-01-17',
      '2025-01-31',
      '2025-02-14',
      '2025-02-28',
    ]);
  });

  it('handles leap-day yearly schedules', () => {
    const schedule = { anchor: '2024-02-29', frequency: 'yearly' };
    expect(occurrencesInRange(schedule, '2024-01-01', '2028-12-31')).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29',
    ]);
  });

  it('excludes skipped dates and one-offs outside the window', () => {
    const schedule = {
      anchor: '2025-01-05',
      frequency: 'monthly',
      skipped: new Set(['2025-02-05']),
    };
    expect(occurrencesInRange(schedule, '2025-01-01', '2025-03-31')).toEqual([
      '2025-01-05',
      '2025-03-05',
    ]);
    expect(
      occurrencesInRange(
        { anchor: '2025-01-05', frequency: 'once' },
        '2025-02-01',
        '2025-02-28'
      )
    ).toEqual([]);
  });

  it('finds the next occurrence after today, honouring skips', () => {
    const schedule = {
      anchor: '2025-01-15',
      frequency: 'monthly',
      skipped: new Set(['2025-06-15']),
    };
    expect(nextOccurrence(schedule, '2025-05-20')).toBe('2025-07-15');
    expect(nextOccurrence(schedule, '2025-01-14')).toBe('2025-01-15');
    expect(
      nextOccurrence({ anchor: '2025-01-15', frequency: 'once' }, '2025-01-01')
    ).toBeNull();
  });

  it('identifies valid occurrence dates', () => {
    const schedule = { anchor: '2025-01-31', frequency: 'monthly' };
    expect(isOccurrence(schedule, '2025-02-28')).toBe(true);
    expect(isOccurrence(schedule, '2025-02-27')).toBe(false);
    expect(isOccurrence(schedule, '2024-12-31')).toBe(false);
  });
});

describe('periods', () => {
  it('builds weekly (Sunday-start), monthly and yearly ranges', () => {
    expect(periodRange('weekly', '2025-10-08')).toEqual({
      start: '2025-10-05',
      end: '2025-10-11',
    });
    expect(periodRange('monthly', '2024-02-10')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    });
    expect(periodRange('yearly', '2025-06-01')).toEqual({
      start: '2025-01-01',
      end: '2025-12-31',
    });
  });

  it('makes biweekly periods exactly 14 days and stable (v1 bug: 15 days)', () => {
    const a = periodRange('biweekly', '2025-10-06');
    const b = periodRange('biweekly', a.end);
    expect(a).toEqual(b);
    const days = (new Date(a.end) - new Date(a.start)) / 86_400_000 + 1;
    expect(days).toBe(14);
    expect(shiftPeriod('biweekly', a.start, 1).start > a.end).toBe(true);
  });

  it('shifts to adjacent periods', () => {
    expect(shiftPeriod('monthly', '2025-03-31', -1)).toEqual({
      start: '2025-02-01',
      end: '2025-02-28',
    });
    expect(shiftPeriod('weekly', '2025-10-08', 1)).toEqual({
      start: '2025-10-12',
      end: '2025-10-18',
    });
  });
});

describe('map keys', () => {
  it('escapes characters MongoDB maps reject and restores them', () => {
    const original = { 'Dr. visits': 50, $pecial: 10, Plain: 5 };
    const encoded = encodeKeys(original);
    expect(
      Object.keys(encoded).some((k) => k.includes('.') || k.startsWith('$'))
    ).toBe(false);
    expect(encoded.Plain).toBe(5);
    expect(decodeKeys(new Map(Object.entries(encoded)))).toEqual(original);
  });
});

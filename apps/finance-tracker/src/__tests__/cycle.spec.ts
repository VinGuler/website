import { describe, it, expect } from 'vitest';
import {
  calculateCycleDays,
  calculateBalanceCards,
  buildCycleLabel,
} from '../server/services/cycle';

describe('calculateCycleDays', () => {
  it('returns null for empty items', () => {
    expect(calculateCycleDays([])).toEqual({ cycleStartDay: null, cycleEndDay: null });
  });

  it('income on 10, payment on 20 → { 10, 21 }', () => {
    const items = [
      { type: 'INCOME', dayOfMonth: 10 },
      { type: 'RENT', dayOfMonth: 20 },
    ];
    expect(calculateCycleDays(items)).toEqual({ cycleStartDay: 10, cycleEndDay: 21 });
  });

  it('income on 25, payment on 15 → { 25, 16 } (wraps)', () => {
    const items = [
      { type: 'INCOME', dayOfMonth: 25 },
      { type: 'CREDIT_CARD', dayOfMonth: 15 },
    ];
    expect(calculateCycleDays(items)).toEqual({ cycleStartDay: 25, cycleEndDay: 16 });
  });

  it('income on 1, payment on 31 → { 1, 1 } (wraps past 31)', () => {
    const items = [
      { type: 'INCOME', dayOfMonth: 1 },
      { type: 'LOAN_PAYMENT', dayOfMonth: 31 },
    ];
    expect(calculateCycleDays(items)).toEqual({ cycleStartDay: 1, cycleEndDay: 1 });
  });

  it('income only → { day, day }', () => {
    const items = [{ type: 'INCOME', dayOfMonth: 15 }];
    expect(calculateCycleDays(items)).toEqual({ cycleStartDay: 15, cycleEndDay: 15 });
  });

  it('multiple incomes picks earliest', () => {
    const items = [
      { type: 'INCOME', dayOfMonth: 12 },
      { type: 'INCOME', dayOfMonth: 10 },
      { type: 'RENT', dayOfMonth: 20 },
    ];
    expect(calculateCycleDays(items)).toEqual({ cycleStartDay: 10, cycleEndDay: 21 });
  });

  it('payments only picks earliest payment as start', () => {
    const items = [
      { type: 'RENT', dayOfMonth: 5 },
      { type: 'CREDIT_CARD', dayOfMonth: 15 },
    ];
    expect(calculateCycleDays(items)).toEqual({ cycleStartDay: 5, cycleEndDay: 16 });
  });
});

describe('calculateBalanceCards', () => {
  it('all unpaid: expected = balance + incomes - payments', () => {
    const items = [
      { type: 'INCOME', amount: 5000, isPaid: false },
      { type: 'RENT', amount: 2000, isPaid: false },
      { type: 'CREDIT_CARD', amount: 1000, isPaid: false },
    ];
    const result = calculateBalanceCards(100, items);

    expect(result.currentBalance).toBe(100);
    expect(result.expectedBalance).toBe(100 + 5000 - 2000 - 1000);
    expect(result.deficitExcess).toBe(5000 - 2000 - 1000);
  });

  it('some paid: expected uses only unpaid', () => {
    const items = [
      { type: 'INCOME', amount: 5000, isPaid: true },
      { type: 'RENT', amount: 2000, isPaid: false },
      { type: 'CREDIT_CARD', amount: 1000, isPaid: false },
    ];
    const result = calculateBalanceCards(5100, items);

    // Income is paid so not in upcoming; balance already reflects it
    expect(result.expectedBalance).toBe(5100 + 0 - 2000 - 1000);
  });

  it('deficitExcess uses all items regardless of isPaid', () => {
    const items = [
      { type: 'INCOME', amount: 3000, isPaid: true },
      { type: 'RENT', amount: 4000, isPaid: true },
    ];
    const result = calculateBalanceCards(0, items);

    expect(result.deficitExcess).toBe(3000 - 4000);
  });

  it('handles empty items', () => {
    const result = calculateBalanceCards(1000, []);
    expect(result.currentBalance).toBe(1000);
    expect(result.expectedBalance).toBe(1000);
    expect(result.deficitExcess).toBe(0);
  });
});

describe('buildCycleLabel', () => {
  it('same month: "Mar 5 - Mar 20"', () => {
    const ref = new Date(2026, 2, 10); // March
    expect(buildCycleLabel(5, 20, ref)).toBe('Mar 5 - Mar 20');
  });

  it('wrapping: "Jan 25 - Feb 16"', () => {
    const ref = new Date(2026, 0, 28); // January
    expect(buildCycleLabel(25, 16, ref)).toBe('Jan 25 - Feb 16');
  });

  it('December wrapping to January', () => {
    const ref = new Date(2026, 11, 28); // December
    expect(buildCycleLabel(25, 16, ref)).toBe('Dec 25 - Jan 16');
  });

  it('same day start and end', () => {
    const ref = new Date(2026, 5, 15); // June
    expect(buildCycleLabel(15, 15, ref)).toBe('Jun 15 - Jul 15');
  });
});

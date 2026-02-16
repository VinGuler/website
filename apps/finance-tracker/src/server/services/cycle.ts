import { PrismaClient } from '@workspace/database';
import type { BalanceCards } from '../types.js';

interface CycleDays {
  cycleStartDay: number | null;
  cycleEndDay: number | null;
}

/**
 * Calculates the cycle start and end days from a list of items.
 * Cycle starts on earliest income day (or earliest payment if no income).
 * Cycle ends the day after the last payment day.
 */
export function calculateCycleDays(items: Array<{ type: string; dayOfMonth: number }>): CycleDays {
  if (items.length === 0) return { cycleStartDay: null, cycleEndDay: null };

  const incomes = items.filter((i) => i.type === 'INCOME');
  const payments = items.filter((i) => i.type !== 'INCOME');

  if (incomes.length === 0 && payments.length === 0) {
    return { cycleStartDay: null, cycleEndDay: null };
  }

  // Cycle starts on earliest income day; if no income, earliest payment day
  const startDay =
    incomes.length > 0
      ? Math.min(...incomes.map((i) => i.dayOfMonth))
      : Math.min(...payments.map((i) => i.dayOfMonth));

  if (payments.length === 0) {
    // Only income: cycle is just the income day
    return { cycleStartDay: startDay, cycleEndDay: startDay };
  }

  const lastPaymentDay = Math.max(...payments.map((i) => i.dayOfMonth));
  // Day after last payment; wraps 31 -> 1
  const endDay = lastPaymentDay >= 31 ? 1 : lastPaymentDay + 1;

  return { cycleStartDay: startDay, cycleEndDay: endDay };
}

/**
 * Calculates the three balance card values:
 * - currentBalance: the raw workspace balance
 * - expectedBalance: balance + unpaid incomes - unpaid payments
 * - deficitExcess: total incomes - total payments (regardless of isPaid)
 */
export function calculateBalanceCards(
  balance: number,
  items: Array<{ type: string; amount: number; isPaid: boolean }>
): BalanceCards {
  const incomes = items.filter((i) => i.type === 'INCOME');
  const payments = items.filter((i) => i.type !== 'INCOME');

  const unpaidIncomeSum = incomes
    .filter((i) => !i.isPaid)
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const unpaidPaymentSum = payments
    .filter((i) => !i.isPaid)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalIncomeSum = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaymentSum = payments.reduce((sum, i) => sum + Number(i.amount), 0);

  return {
    currentBalance: balance,
    expectedBalance: balance + unpaidIncomeSum - unpaidPaymentSum,
    deficitExcess: totalIncomeSum - totalPaymentSum,
  };
}

/**
 * Builds a human-readable cycle label like "Jan 25 - Feb 16".
 * If endDay > startDay, both dates are in the same month.
 * If endDay <= startDay, the cycle wraps into the next month.
 */
export function buildWorkspaceCycleLabel(
  startDay: number,
  endDay: number,
  referenceDate: Date = new Date()
): string {
  let month = referenceDate.getMonth() + 1;
  const currentDay = referenceDate.getDate();

  // If we're past the cycle end day, move to next month
  // For same-month cycles (endDay > startDay): check if currentDay > endDay
  // For wrapped cycles (endDay <= startDay): only increment if currentDay is in the gap (< startDay AND > endDay)
  const cycleWraps = endDay <= startDay;
  const shouldIncrementMonth = cycleWraps
    ? currentDay > endDay && currentDay < startDay
    : currentDay > endDay;

  if (shouldIncrementMonth) {
    month = (month % 12) + 1;
  }

  if (endDay > startDay) {
    // Same month: "Mar 5 - Mar 20"
    return `${month}-${startDay}_${month}-${endDay}`;
  } else {
    // Wraps: "Jan 25 - Feb 16"
    const nextMonth = (month + 1) % 12;
    return `${month}-${startDay}_${nextMonth}-${endDay}`;
  }
}

export function buildCycleLabel(date: Date = new Date()): string {
  const cycleLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  return cycleLabel;
}

/**
 * Archives the current cycle if all items are paid and we're past the cycle end date.
 * Uses SELECT FOR UPDATE to prevent concurrent archive operations on shared workspaces.
 * Returns true if a cycle was archived, false otherwise.
 */
export async function archiveCycleIfNeeded(
  prisma: PrismaClient,
  workspaceId: number
): Promise<boolean> {
  return await prisma.$transaction(async (tx) => {
    // Lock the workspace row for concurrent access (shared workspaces)
    const [workspace] = await tx.$queryRaw<any[]>`
      SELECT * FROM workspaces WHERE id = ${workspaceId} FOR UPDATE
    `;

    if (!workspace || !workspace.cycle_start_day) return false;

    const items = await tx.item.findMany({ where: { workspaceId } });
    if (items.length === 0) return false;

    // Check if all items are paid (cycle complete)
    const allPaid = items.every((item) => item.isPaid);
    if (!allPaid) return false;

    // Check if we're past the cycle end date
    const today = new Date();
    const currentDay = today.getDate();
    const cycleEndDay = workspace.cycle_end_day;

    // Determine if cycle has ended:
    // If cycle wraps (endDay <= startDay), ended when past endDay in the next month
    // If same month (endDay > startDay), ended when currentDay >= endDay
    const cycleWraps = cycleEndDay <= workspace.cycle_start_day;
    const pastEnd = cycleWraps
      ? currentDay >= cycleEndDay && currentDay < workspace.cycle_start_day
      : currentDay >= cycleEndDay;

    if (!pastEnd) return false;

    // Archive the completed cycle
    const cycleLabel = buildCycleLabel(today);

    await tx.completedCycle.create({
      data: {
        workspaceId,
        cycleLabel,
        finalBalance: workspace.balance,
        itemsSnapshot: items.map((item) => ({
          id: item.id,
          type: item.type,
          label: item.label,
          amount: Number(item.amount),
          dayOfMonth: item.dayOfMonth,
          isPaid: item.isPaid,
        })),
      },
    });

    // Reset all items for the new cycle
    await tx.item.updateMany({
      where: { workspaceId },
      data: { isPaid: false },
    });

    // Balance is NOT reset -- it represents real bank balance

    return true;
  });
}

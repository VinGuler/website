export function formatAmount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 *
 * @param cycleLabelRaw Come in this format: MM-DD_MM-DD, where the first MM-DD is the cycle start and the second MM-DD is the cycle end. Example: "03-05_03-20" for a cycle from March 5 to March 20.
 * @returns A human-friendly translatable label like "Mar 5 - Mar 20" or "Jan 25 - Feb 16
 */
export function buildCycleLabel(cycleLabelRaw: string, locale: string): string {
  const [startRaw, endRaw] = cycleLabelRaw.split('_');
  const [startMonth, startDay] = startRaw!.split('-').map(Number);
  const [endMonth, endDay] = endRaw!.split('-').map(Number);

  const startDate = new Date(2000, startMonth! - 1, startDay); // Year doesn't matter
  const endDate = new Date(2000, endMonth! - 1, endDay);

  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const startLabel = startDate.toLocaleDateString(locale, options);
  const endLabel = endDate.toLocaleDateString(locale, options);

  return `${startLabel} - ${endLabel}`;
}

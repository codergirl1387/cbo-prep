import { differenceInDays, format } from 'date-fns';

export const EXAM_DATE = new Date(process.env.EXAM_DATE || '2026-04-09');

export function daysUntilExam(): number {
  return Math.max(0, differenceInDays(EXAM_DATE, new Date()));
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function examDateFormatted(): string {
  return format(EXAM_DATE, 'MMMM d, yyyy');
}

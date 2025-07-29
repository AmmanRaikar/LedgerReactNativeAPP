import { differenceInDays, parseISO } from 'date-fns';
import { LedgerEntry, LedgerEntryComputed } from './types';

/**
 * Returns interest rate based on amount.
 * If amount > 30000 → 1.75%
 * Else → 2%
 */
export function getInterestRate(amount: number): number {
  return amount > 30000 ? 1.75 : 2;
}

/**
 * Interest applicable amount:
 * - If > 365 days old → compound interest for 1 year
 * - Else → principal only
 */
export function getInterestApplicableAmount(entryDate: string, amount: number): number {
  const days = differenceInDays(new Date(), parseISO(entryDate));
  if (days >= 365) {
    const interestRate = getInterestRate(amount);
    return amount + (amount * interestRate * 12) / 100;
  }
  return amount;
}

/**
 * Interest today:
 * - If < 30 days → simple interest
 * - Else → proportionally calculated monthly interest
 */
export function getInterestToday(entryDate: string, amount: number): number {
  const days = differenceInDays(new Date(), parseISO(entryDate));
  const rate = getInterestRate(amount);
  const applicableAmount = getInterestApplicableAmount(entryDate, amount);

  if (days < 30) {
    return (applicableAmount * rate) / 100;
  }

  const proportionalDays = days % 365;
  return (applicableAmount * rate * proportionalDays) / 3000;
}

/**
 * Returns computed object with interest and totals
 */
export function computeLedgerEntry(entry: LedgerEntry & { id: string }): LedgerEntryComputed {
  const interestRate = getInterestRate(entry.amount);
  const interestApplicableAmount = getInterestApplicableAmount(entry.date, entry.amount);
  const interestToday = getInterestToday(entry.date, entry.amount);
  const totalPayable = interestApplicableAmount + interestToday;

  return {
    ...entry,
    interestRate,
    interestApplicableAmount,
    interestToday,
    totalPayable,
  };
}


export function calculateInterestFields(entry: LedgerEntry): {
  interestRate: number;
  interestApplicableAmount: number;
  interestToday: number;
  totalPayable: number;
} {
  const amount = entry.amount;
  const date = new Date(entry.date);
  const today = new Date();

  const daysPassed = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  const interestRate = amount > 30000 ? 1.75 : 2;
  const interestApplicableAmount = daysPassed >= 365
    ? amount + amount * interestRate * 12 / 100
    : amount;

  const interestToday = daysPassed < 30
    ? interestApplicableAmount * interestRate / 100
    : interestApplicableAmount * interestRate * (daysPassed % 365) / 3000;

  const totalPayable = interestApplicableAmount + interestToday;

  return {
    interestRate,
    interestApplicableAmount,
    interestToday,
    totalPayable,
  };
}

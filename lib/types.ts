export interface LedgerEntry {
  serialNumber: string;
  displayDate: string; // input like "28-07-2025"
  date: string;        // ISO format "2025-07-28" → used for calculations
  weight: string;
  amount: number;
}



// Used when displaying in the UI with Firestore ID
export interface LedgerEntryWithId extends LedgerEntry {
  id: string;

    // These are calculated fields (not stored in Firestore)
  interestRate?: number;
  interestApplicableAmount?: number;
  interestToday?: number;
  totalPayable?: number;
}

// Optional: Used when calculating values for display
export interface LedgerEntryComputed extends LedgerEntryWithId {
  interestRate: number;
  interestApplicableAmount: number;
  interestToday: number;
  totalPayable: number;
}

// firebase/ledgerService.ts
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { LedgerEntry } from '../lib/types';

const ledgerCollection = collection(db, 'ledgerEntries');

// Add a new entry
export const addLedgerEntry = async (entry: LedgerEntry) => {
  await addDoc(ledgerCollection, entry);
};

// Get all entries
export const getAllLedgerEntries = async (): Promise<(LedgerEntry & { id: string })[]> => {
  const snapshot = await getDocs(ledgerCollection);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (LedgerEntry & { id: string })[];
};

// Delete an entry
export const deleteLedgerEntry = async (id: string) => {
  await deleteDoc(doc(db, 'ledgerEntries', id));
};

// Update an entry
export const updateLedgerEntry = async (id: string, updatedData: Partial<LedgerEntry>) => {
  await updateDoc(doc(db, 'ledgerEntries', id), updatedData);
};


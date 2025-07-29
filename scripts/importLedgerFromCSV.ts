// scripts/importLedgerFromCSV.ts

import * as fs from 'fs';
import * as path from 'path';
import { parse as parseCSV } from 'csv-parse/sync';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { parse, format } from 'date-fns';
import 'dotenv/config';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY!,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.FIREBASE_PROJECT_ID!,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.FIREBASE_APP_ID!,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const importLedger = async () => {
  const csvPath = path.resolve(__dirname, '../data/ledger.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');

  const records = parseCSV(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const batch = records.map(async (record: any) => {
    try {
      const parsedDate = parse(record.displayDate, 'dd-MM-yyyy', new Date());
      const isoDate = format(parsedDate, 'yyyy-MM-dd');

      const entry = {
        serialNumber: record.serialNumber,
        displayDate: record.displayDate,
        date: isoDate,
        weight: record.weight,
        amount: parseFloat(record.amount),
      };

      await addDoc(collection(db, 'ledgerEntries'), entry);
      console.log(`Added: ${record.serialNumber}`);
    } catch (err) {
      console.error(`Error for ${record.serialNumber}:`, err);
    }
  });

  await Promise.all(batch);
  console.log('✅ Import complete!');
};

importLedger();

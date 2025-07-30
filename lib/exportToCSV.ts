import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { LedgerEntryWithId } from "./types";
import { calculateInterestFields } from "./ledger";

export async function exportLedgerToCSV(entries: LedgerEntryWithId[]) {
  const enriched = entries.map((entry) => ({
    ...entry,
    ...calculateInterestFields(entry),
  }));

  const headers = [
    "Serial Number",
    "Display Date",
    "ISO Date",
    "Weight",
    "Amount",
    "Interest Rate",
    "Applicable Amount",
    "Interest Today",
    "Total Payable",
  ];

  const rows = enriched.map((e) => [
    e.serialNumber,
    e.displayDate,
    e.date,
    e.weight,
    e.amount,
    e.interestRate ?? "",
    e.interestApplicableAmount?.toFixed(2) ?? "",
    e.interestToday?.toFixed(2) ?? "",
    e.totalPayable?.toFixed(2) ?? "",
  ]);

  const csvString =
    headers.join(",") + "\n" + rows.map((row) => row.join(",")).join("\n");

  const fileUri = FileSystem.documentDirectory + "ledger_export.csv";
  await FileSystem.writeAsStringAsync(fileUri, csvString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/csv",
    dialogTitle: "Export Ledger CSV",
    UTI: "public.comma-separated-values-text",
  });
}

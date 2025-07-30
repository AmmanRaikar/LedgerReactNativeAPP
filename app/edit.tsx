import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { updateLedgerEntry } from "../config/ledgerService";
import { LedgerEntryWithId } from "../lib/types";

// Converts DD-MM-YYYY to ISO format YYYY-MM-DD
function convertToISO(displayDate: string): string | null {
  const match = displayDate.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [_, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

export default function EditPage() {
  const { entry } = useLocalSearchParams<{ entry: string }>();
  const router = useRouter();

  const parsedEntry = JSON.parse(entry || "{}") as LedgerEntryWithId;

  const [serialNumber, setSerialNumber] = useState(parsedEntry.serialNumber);
  const [displayDate, setDisplayDate] = useState(
    parsedEntry.displayDate || parsedEntry.date
  );
  const [weight, setWeight] = useState(parsedEntry.weight);
  const [amount, setAmount] = useState(parsedEntry.amount.toString());

  const handleUpdate = async () => {
    // Input validation
    if (!serialNumber.trim() || !weight.trim()) {
      return Alert.alert("Validation Error", "Serial number and weight are required.");
    }

    const isoDate = convertToISO(displayDate.trim());
    if (!isoDate) {
      return Alert.alert(
        "Invalid Date Format",
        "Please enter the date in DD-MM-YYYY format."
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Alert.alert("Invalid Amount", "Please enter a valid numeric amount.");
    }

    try {
      await updateLedgerEntry(parsedEntry.id, {
        serialNumber: serialNumber.trim(),
        displayDate: displayDate.trim(),
        date: isoDate,
        weight: weight.trim(),
        amount: parsedAmount,
      });

      Alert.alert("Success", "Entry updated successfully.");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update the entry.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Entry</Text>

      <TextInput
        style={styles.input}
        value={serialNumber}
        onChangeText={setSerialNumber}
        placeholder="Serial Number"
      />
      <TextInput
        style={styles.input}
        value={displayDate}
        onChangeText={setDisplayDate}
        placeholder="Date (DD-MM-YYYY)"
      />
      <TextInput
        style={styles.input}
        value={weight}
        onChangeText={setWeight}
        placeholder="Weight"
      />
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="Amount"
      />

      <Button title="Update Entry" onPress={handleUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    gap: 10,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
});

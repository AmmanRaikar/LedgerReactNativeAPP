import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useState, useLayoutEffect } from "react";
import { updateLedgerEntry } from "../config/ledgerService";
import { LedgerEntryWithId } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";

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
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const parsedEntry = JSON.parse(entry || "{}") as LedgerEntryWithId;

  const [serialNumber, setSerialNumber] = useState(parsedEntry.serialNumber);
  const [displayDate, setDisplayDate] = useState(
    parsedEntry.displayDate || parsedEntry.date
  );
  const [weight, setWeight] = useState(parsedEntry.weight);
  const [amount, setAmount] = useState(parsedEntry.amount.toString());

  const handleUpdate = async () => {
    if (!serialNumber.trim() || !weight.trim()) {
      return Alert.alert(
        "Validation Error",
        "Serial number and weight are required."
      );
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
      return Alert.alert(
        "Invalid Amount",
        "Please enter a valid numeric amount."
      );
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
      {/* Floating Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.title}>Edit Ledger Entry</Text>

        <TextInput
          style={styles.input}
          placeholder="Serial Number"
          placeholderTextColor="#aaa"
          value={serialNumber}
          onChangeText={setSerialNumber}
        />

        <TextInput
          style={styles.input}
          placeholder="Date (DD-MM-YYYY)"
          placeholderTextColor="#aaa"
          value={displayDate}
          onChangeText={setDisplayDate}
        />

        <TextInput
          style={styles.input}
          placeholder="Weight"
          placeholderTextColor="#aaa"
          value={weight}
          onChangeText={setWeight}
        />

        <TextInput
          style={styles.input}
          placeholder="Amount"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity style={styles.glassButton} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update Entry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    width: "90%",
    maxWidth: 320,
    paddingVertical: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    marginBottom: 14,
    width: "100%",
  },
  glassButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    marginTop: 12,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 10,
    borderRadius: 30,
    zIndex: 10,
  },
});

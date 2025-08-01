import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useState, useLayoutEffect } from "react";
import { useRouter, useNavigation } from "expo-router";
import { addLedgerEntry } from "../config/ledgerService";
import { parse, format, isValid } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

export default function AddEntryScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  const [serialNumber, setSerialNumber] = useState("");
  const [displayDate, setDisplayDate] = useState(""); // DD-MM-YYYY
  const [weight, setWeight] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async () => {
    if (!serialNumber || !displayDate || !weight || !amount) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return;
    }

    const parsedDate = parse(displayDate.trim(), "dd-MM-yyyy", new Date());
    if (!isValid(parsedDate)) {
      Alert.alert("Invalid Date", "Use format DD-MM-YYYY.");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Amount", "Must be a positive number.");
      return;
    }

    try {
      const isoDate = format(parsedDate, "yyyy-MM-dd");
      await addLedgerEntry({
        serialNumber: serialNumber.trim(),
        displayDate: displayDate.trim(),
        date: isoDate,
        weight: weight.trim(),
        amount: numericAmount,
      });

      Alert.alert("Success", "Entry added!");
      setSerialNumber("");
      setDisplayDate("");
      setWeight("");
      setAmount("");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to add entry.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.title}>Add Ledger Entry</Text>

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

        <TouchableOpacity style={styles.glassButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
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

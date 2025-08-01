import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState, useLayoutEffect } from "react";
import { getAllLedgerEntries } from "../config/ledgerService";
import { calculateInterestFields } from "../lib/ledger";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";

export default function AnalyticsPage() {
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [monthlyPayableIncrease, setMonthlyPayableIncrease] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const entries = await getAllLedgerEntries();
      const enriched = entries.map((entry) => ({
        ...entry,
        ...calculateInterestFields(entry),
      }));

      setTotalEntries(enriched.length);

      const totalPayable = enriched.reduce(
        (acc, entry) => acc + (entry.totalPayable || 0),
        0
      );

      const totalInterest = enriched.reduce(
        (acc, entry) => acc + (entry.interestToday || 0),
        0
      );

      const monthlyIncrease = enriched.reduce((acc, entry) => {
        if (!entry.interestRate || !entry.interestApplicableAmount) return acc;
        const monthlyTotalIncrease =
          (entry.interestRate / 100) * entry.interestApplicableAmount;
        return acc + monthlyTotalIncrease;
      }, 0);

      setTotalPayable(totalPayable);
      setTotalInterest(totalInterest);
      setMonthlyPayableIncrease(monthlyIncrease);
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      {/* Floating Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>📊 Analytics</Text>

        <View style={styles.card}>
          <Text style={styles.stat}>
            📌 Total Entries: <Text style={styles.value}>{totalEntries}</Text>
          </Text>
          <Text style={styles.stat}>
            💰 Total Payable:{" "}
            <Text style={styles.value}>
              ₹
              {totalPayable.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </Text>
          <Text style={styles.stat}>
            🏦 Daily Interest:{" "}
            <Text style={styles.value}>
              ₹
              {totalInterest.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </Text>
          <Text style={styles.stat}>
            📈 Monthly Growth:{" "}
            <Text style={styles.value}>
              ₹
              {monthlyPayableIncrease.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </Text>
        </View>
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
  content: {
    width: "90%",
    maxWidth: 360,
    alignItems: "center",
    paddingVertical: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
  },
  stat: {
    fontSize: 16,
    color: "#ddd",
    marginVertical: 10,
  },
  value: {
    fontWeight: "bold",
    color: "white",
    fontSize: 16,
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

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Switch,
} from "react-native";
import { useEffect, useState } from "react";
import { getAllLedgerEntries } from "../config/ledgerService";
import { calculateInterestFields } from "../lib/ledger";
import { Feather } from "@expo/vector-icons";

export default function AnalyticsPage() {
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [monthlyPayableIncrease, setMonthlyPayableIncrease] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const systemTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(true); // Default dark

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
        const monthlyTotalIncrease = (entry.interestRate / 100) * entry.interestApplicableAmount;
        return acc + monthlyTotalIncrease;
      }, 0);

      setTotalPayable(totalPayable);
      setTotalInterest(totalInterest);
      setMonthlyPayableIncrease(monthlyIncrease);
    };

    fetchData();
  }, []);

  const styles = getStyles(isDarkMode);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.toggleRow}>
        <Feather
          name={isDarkMode ? "moon" : "sun"}
          size={20}
          color={isDarkMode ? "#ccc" : "#333"}
        />
        <Switch
          value={isDarkMode}
          onValueChange={() => setIsDarkMode((prev) => !prev)}
          trackColor={{ false: "#ccc", true: "#666" }}
          thumbColor={isDarkMode ? "#fff" : "#333"}
        />
      </View>
      <Text style={styles.title}>📊 Analytics</Text>
      <View style={styles.card}>
        <Text style={styles.stat}>📌 Total Entries: <Text style={styles.value}>{totalEntries}</Text></Text>
        <Text style={styles.stat}>💰 Total Amount Payable: <Text style={styles.value}>₹{totalPayable.toFixed(2)}</Text></Text>
        <Text style={styles.stat}>🏦 Total Interest (Daily): <Text style={styles.value}>₹{totalInterest.toFixed(2)}</Text></Text>
        <Text style={styles.stat}>📈 Monthly Payable Growth: <Text style={styles.value}>₹{monthlyPayableIncrease.toFixed(2)}</Text></Text>
      </View>
    </ScrollView>
  );
}

function getStyles(isDarkMode: boolean) {
  return StyleSheet.create({
    container: {
      padding: 24,
      backgroundColor: isDarkMode ? "#121212" : "#f9f9f9",
      flexGrow: 1,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 20,
      color: isDarkMode ? "#fff" : "#333",
      textAlign: "center",
    },
    card: {
      backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
      borderRadius: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    stat: {
      fontSize: 16,
      marginVertical: 8,
      color: isDarkMode ? "#ccc" : "#555",
    },
    value: {
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#000",
    },
    toggleRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
    },
  });
}

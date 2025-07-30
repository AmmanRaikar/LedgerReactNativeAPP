import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  ScrollView,
  Button,
  useWindowDimensions,
} from "react-native";
import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useNavigation, useRouter, useFocusEffect } from "expo-router";
import {
  getAllLedgerEntries,
  deleteLedgerEntry,
} from "../config/ledgerService";
import { calculateInterestFields } from "../lib/ledger";
import { LedgerEntryWithId } from "../lib/types";
import { exportLedgerToCSV } from "../lib/exportToCSV";
import { Feather } from "@expo/vector-icons";

export default function ViewPage() {
  const [entries, setEntries] = useState<LedgerEntryWithId[]>([]);
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scale, setScale] = useState(1);
  const navigation = useNavigation();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const styles = getStyles(isDarkMode, scale);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 10, marginRight: 10, alignItems: "center" }}>
          <TouchableOpacity onPress={() => setIsDarkMode((prev) => !prev)}>
            <Feather
              name={isDarkMode ? "moon" : "sun"}
              size={20}
              color={isDarkMode ? "#ccc" : "#333"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                await exportLedgerToCSV(entries);
              } catch (err: any) {
                Alert.alert("Export Failed", err.message || "Unknown error");
              }
            }}
          >
            <Feather name="download" size={20} color={isDarkMode ? "#ccc" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode(mode === "edit" ? "view" : "edit")}> 
            <Feather name="edit" size={20} color={isDarkMode ? "#ccc" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode(mode === "delete" ? "view" : "delete")}> 
            <Feather name="trash" size={20} color="red" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, mode, entries, isDarkMode]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    Alert.alert("Confirm", "Are you sure you want to delete selected entries?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await Promise.all(Array.from(selectedIds).map(deleteLedgerEntry));
          setSelectedIds(new Set());
          fetchEntries();
        },
      },
    ]);
  };

  const sortEntries = (data: LedgerEntryWithId[]) => {
    const extractSortKey = (val: string): [string, number] => {
      const match = val.match(/^([A-Za-z]*)(\d+)$/);
      return match ? [match[1] || "", parseInt(match[2], 10)] : [val, 0];
    };

    return data.sort((a, b) => {
      const [prefixA, numA] = extractSortKey(a.serialNumber);
      const [prefixB, numB] = extractSortKey(b.serialNumber);
      if (prefixA === prefixB) return numA - numB;
      return prefixA.localeCompare(prefixB);
    });
  };

  const fetchEntries = async () => {
    const data = await getAllLedgerEntries();
    const withInterest = data.map((entry) => ({
      ...entry,
      ...calculateInterestFields(entry),
    }));
    setEntries(sortEntries(withInterest));
  };

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [])
  );

  const renderItem = ({ item }: { item: LedgerEntryWithId }) => (
    <View style={styles.row}>
      {mode === "delete" && (
        <TouchableOpacity
          onPress={() => toggleSelection(item.id)}
          style={[styles.cell, styles.selectCell]}
        >
          <Text style={styles.text}>{selectedIds.has(item.id) ? "✓" : ""}</Text>
        </TouchableOpacity>
      )}
      {mode === "edit" && (
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/edit", params: { entry: JSON.stringify(item) } })
          }
        >
          <Text style={[styles.actionCell, { color: "blue" }]}>Edit</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.cell, { flex: 0.5 }]}>{item.serialNumber}</Text>
      <Text style={styles.cell}>{item.displayDate}</Text>
      <Text style={styles.cell}>{item.weight}</Text>
      <Text style={styles.cell}>{item.amount}</Text>
      <Text style={styles.cell}>{(item.interestToday ?? 0).toFixed(2)}</Text>
      <Text style={styles.cell}>{(item.totalPayable ?? 0).toFixed(2)}</Text>
    </View>
  );

  const totals = entries.reduce(
    (acc, cur) => {
      acc.interestToday += cur.interestToday || 0;
      acc.totalPayable += cur.totalPayable || 0;
      return acc;
    },
    { interestToday: 0, totalPayable: 0 }
  );

  return (
    <ScrollView style={{ flex: 1 }} horizontal>
      <ScrollView contentContainerStyle={{ minWidth: screenWidth }}>
        <View style={[styles.table, { transform: [{ scale }] }]}>
          <View style={[styles.row, styles.header]}>
            {mode === "delete" && <Text style={styles.headerCell}>Select</Text>}
            {mode === "edit" && <Text style={styles.headerCell}>Action</Text>}
            <Text style={[styles.headerCell, { flex: 0.5 }]}>SL. NO.</Text>
            <Text style={styles.headerCell}>Date</Text>
            <Text style={styles.headerCell}>Weight</Text>
            <Text style={styles.headerCell}>Amount</Text>
            <Text style={styles.headerCell}>Interest</Text>
            <Text style={styles.headerCell}>Total</Text>
          </View>
          <FlatList scrollEnabled={false} data={entries} renderItem={renderItem} keyExtractor={(item) => item.id} />
          <View style={[styles.row, styles.footer]}>
            <Text style={[styles.cell, { fontWeight: "bold" }]}>Total: {entries.length} {entries.length === 1 ? "item" : "items"}</Text>
            {[...Array(mode === "delete" ? 3 : mode === "edit" ? 3 : 2)].map((_, i) => (
              <Text key={i} style={styles.cell}></Text>
            ))}
            <Text style={styles.cell}>{totals.interestToday.toFixed(2)}</Text>
            <Text style={styles.cell}>{totals.totalPayable.toFixed(2)}</Text>
          </View>
          {mode === "delete" && selectedIds.size > 0 && (
            <Button
              title={`Delete ${selectedIds.size} Selected`}
              color="red"
              onPress={handleBulkDelete}
            />
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function getStyles(isDarkMode: boolean, scale: number) {
  const baseFontSize = 10 * scale;
  return StyleSheet.create({
    table: {
      flex: 1,
      padding: 10,
      backgroundColor: isDarkMode ? "#1a1a1a" : "#f9f9f9",
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
      elevation: 8,
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#ccc",
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.05)",
    },
    header: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0",
    },
    footer: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0",
    },
    cell: {
      flex: 1,
      paddingHorizontal: 6,
      fontSize: baseFontSize,
      textAlign: "center",
      color: isDarkMode ? "#fff" : "#000",
    },
    text: {
      color: isDarkMode ? "#fff" : "#000",
    },
    headerCell: {
      flex: 1,
      paddingHorizontal: 6,
      fontWeight: "bold",
      fontSize: baseFontSize,
      textAlign: "center",
      color: isDarkMode ? "#fff" : "#000",
    },
    actionCell: {
      flex: 1,
      textAlign: "center",
      fontSize: baseFontSize,
      paddingHorizontal: 5,
    },
    selectCell: {
      flex: 1,
      textAlign: "center",
      fontSize: baseFontSize,
    },
  });
}

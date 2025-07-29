import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useNavigation, useRouter, useFocusEffect } from "expo-router";
import {
  getAllLedgerEntries,
  deleteLedgerEntry,
} from "../config/ledgerService";
import { calculateInterestFields } from "../lib/ledger";
import { LedgerEntryWithId } from "../lib/types";

export default function ViewPage() {
  const [entries, setEntries] = useState<LedgerEntryWithId[]>([]);
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", gap: 10, marginRight: 10 }}>
          <Button
            title={mode === "edit" ? "Cancel" : "Edit"}
            onPress={() => setMode(mode === "edit" ? "view" : "edit")}
          />
          <Button
            title={mode === "delete" ? "Cancel" : "Delete"}
            onPress={() => setMode(mode === "delete" ? "view" : "delete")}
            color="red"
          />
        </View>
      ),
    });
  }, [navigation, mode]);

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
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete selected entries?",
      [
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
      ]
    );
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
          <Text>{selectedIds.has(item.id) ? "✓" : ""}</Text>
        </TouchableOpacity>
      )}
      {mode === "edit" && (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/edit",
              params: { entry: JSON.stringify(item) },
            })
          }
        >
          <Text style={[styles.actionCell, { color: "blue" }]}>Edit</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.cell}>{item.serialNumber}</Text>
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
    <ScrollView horizontal>
      <View style={styles.table}>
        <View style={[styles.row, styles.header]}>
          {mode === "delete" && <Text style={styles.headerCell}>Select</Text>}
          {mode === "edit" && <Text style={styles.headerCell}>Action</Text>}
          <Text style={styles.headerCell}>SL. NO.</Text>
          <Text style={styles.headerCell}>Date</Text>
          <Text style={styles.headerCell}>Weight</Text>
          <Text style={styles.headerCell}>Amount</Text>
          <Text style={styles.headerCell}>Interest</Text>
          <Text style={styles.headerCell}>Total</Text>
        </View>
        <FlatList
          data={entries}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
        <View style={[styles.row, styles.footer]}>
          <Text style={[styles.cell, { fontWeight: "bold" }]}>
            Total: {entries.length} {entries.length === 1 ? "item" : "items"}
          </Text>
          {[...Array(mode === "delete" ? 3 : mode === "edit" ? 3 : 2)].map(
            (_, i) => (
              <Text key={i} style={styles.cell}></Text>
            )
          )}
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
  );
}

const styles = StyleSheet.create({
  table: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
    minWidth: 800,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    alignItems: "center",
  },
  header: {
    backgroundColor: "#f0f0f0",
  },
  footer: {
    backgroundColor: "#e0e0e0",
  },
  cell: {
    minWidth: 80,
    paddingHorizontal: 5,
    fontSize: 12,
    textAlign: "center",
  },
  headerCell: {
    minWidth: 80,
    paddingHorizontal: 5,
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  actionCell: {
    minWidth: 60,
    textAlign: "center",
    fontSize: 12,
    paddingHorizontal: 5,
  },
  selectCell: {
    minWidth: 60,
    textAlign: "center",
    fontSize: 12,
  },
});

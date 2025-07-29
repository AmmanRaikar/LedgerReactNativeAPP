import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { getAllLedgerEntries } from "../config/ledgerService";
import { calculateInterestFields } from "../lib/ledger";
import { LedgerEntryWithId } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";

export default function Page() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<LedgerEntryWithId[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const parseSerialInput = (input: string): string[] => {
    const parts = input.split(",").map((part) => part.trim());
    const result: string[] = [];

    for (const part of parts) {
      const rangeMatch = part.match(/^([A-Za-z]*)(\d+)-([A-Za-z]*)(\d+)$/);
      if (rangeMatch) {
        const prefixStart = rangeMatch[1];
        const start = parseInt(rangeMatch[2], 10);
        const prefixEnd = rangeMatch[3];
        const end = parseInt(rangeMatch[4], 10);

        if (prefixStart === prefixEnd) {
          for (let i = start; i <= end; i++) {
            result.push(`${prefixStart}${i}`);
          }
        }
      } else {
        result.push(part);
      }
    }

    return result;
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

  const handleSearch = async () => {
    Keyboard.dismiss();
    const allEntries = await getAllLedgerEntries();
    const searchList = parseSerialInput(searchQuery);
    const matched = allEntries
      .filter((entry) => searchList.includes(entry.serialNumber))
      .map((entry) => ({
        ...entry,
        ...calculateInterestFields(entry),
      }));

    setResults(sortEntries(matched));
    setModalVisible(true);
  };

  const totals = results.reduce(
    (acc, cur) => {
      acc.interestToday += cur.interestToday || 0;
      acc.totalPayable += cur.totalPayable || 0;
      return acc;
    },
    { interestToday: 0, totalPayable: 0 }
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search serials (e.g. 1,3-5,NS1)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Button title="Add Entry" onPress={() => router.push("/add")} />
        <Button title="View Page" onPress={() => router.push("/view")} />

        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
          transparent
        >
          <View style={styles.modalBackdrop}>
            <ScrollView horizontal style={styles.scrollModalCard}>
              <View style={styles.modalCard}>
                <Text style={styles.resultTitle}>
                  Results ({results.length} items):
                </Text>
                <FlatList
                  data={results}
                  keyExtractor={(item) => item.id}
                  ListHeaderComponent={() => (
                    <View style={[styles.row, styles.header]}>
                      <Text style={styles.headerCell}>SL. NO.</Text>
                      <Text style={styles.headerCell}>Date</Text>
                      <Text style={styles.headerCell}>Weight</Text>
                      <Text style={styles.headerCell}>Amount</Text>
                      <Text style={styles.headerCell}>Interest</Text>
                      <Text style={styles.headerCell}>Total</Text>
                    </View>
                  )}
                  ListFooterComponent={() => (
                    <View style={[styles.row, styles.footer]}>
                      <Text style={styles.cell}>Total</Text>
                      <Text style={styles.cell}></Text>
                      <Text style={styles.cell}></Text>
                      <Text style={styles.cell}></Text>
                      <Text style={styles.cell}>
                        {totals.interestToday.toFixed(2)}
                      </Text>
                      <Text style={styles.cell}>
                        {totals.totalPayable.toFixed(2)}
                      </Text>
                    </View>
                  )}
                  renderItem={({ item }) => (
                    <View style={styles.row}>
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: "/edit",
                            params: { entry: JSON.stringify(item) },
                          })
                        }
                      >
                        <Text style={[styles.cell, { color: "blue" }]}> 
                          {item.serialNumber}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.cell}>{item.displayDate}</Text>
                      <Text style={styles.cell}>{item.weight}</Text>
                      <Text style={styles.cell}>{item.amount}</Text>
                      <Text style={styles.cell}>
                        {(item.interestToday ?? 0).toFixed(2)}
                      </Text>
                      <Text style={styles.cell}>
                        {(item.totalPayable ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  )}
                />
                <Pressable onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Text style={{ color: "white" }}>Close</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollModalCard: {
    maxHeight: "80%",
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    minWidth: 600,
  },
  resultTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  header: {
    backgroundColor: "#eee",
  },
  footer: {
    backgroundColor: "#f8f8f8",
  },
  cell: {
    minWidth: 80,
    fontSize: 14,
    textAlign: "center",
  },
  headerCell: {
    minWidth: 80,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  closeBtn: {
    marginTop: 12,
    backgroundColor: "#007AFF",
    padding: 10,
    alignItems: "center",
    borderRadius: 4,
  },
});

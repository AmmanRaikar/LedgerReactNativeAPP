import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Modal,
  Pressable,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useState, useEffect, useLayoutEffect } from "react";
import { getAllLedgerEntries } from "../config/ledgerService";
import { calculateInterestFields } from "../lib/ledger";
import { LedgerEntryWithId } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";
import AnimatedBackground from "../components/AnimatedBackground";

export default function Page() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<LedgerEntryWithId[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

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
      <AnimatedBackground />
      <View style={styles.content}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Search serials (e.g. 1,3-5,NS1)"
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/add")}
          style={styles.glassButton}
        >
          <Text style={styles.buttonText}>Add Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/view")}
          style={styles.glassButton}
        >
          <Text style={styles.buttonText}>View Page</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/analytics")}
          style={styles.glassButton}
        >
          <Text style={styles.buttonText}>Analytics Page</Text>
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
          transparent
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.resultTitle}>
                Results ({results.length} items):
              </Text>

              {/* Shared horizontal scroll container */}
              <ScrollView horizontal contentOffset={{ x: 0, y: 0 }}>
                <View>
                  {/* Header Row */}
                  <View style={[styles.row, styles.header]}>
                    <Text style={styles.headerCell}>SL. NO.</Text>
                    <Text style={styles.headerCell}>Date</Text>
                    <Text style={styles.headerCell}>Weight</Text>
                    <Text style={styles.headerCell}>Amount</Text>
                    <Text style={styles.headerCell}>Interest</Text>
                    <Text style={styles.headerCell}>Total</Text>
                  </View>

                  {/* Vertical scroll for data rows */}
                  <ScrollView style={{ maxHeight: 250 }}>
                    {results.map((item) => (
                      <View style={styles.row} key={item.id}>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/edit",
                              params: { entry: JSON.stringify(item) },
                            })
                          }
                        >
                          <Text style={[styles.cell, { color: "#6faaff" }]}>
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
                    ))}
                  </ScrollView>

                  {/* Footer Row */}
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
                </View>
              </ScrollView>

              {/* Fixed Close Button */}
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={{ color: "white" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center", // center vertically
    alignItems: "center",
    width: "90%",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#2c2c2c",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
  },
  glassButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50, // more rounded
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    marginVertical: 12, // more vertical spacing
    width: "100%",
    maxWidth: 300, // limit width
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    // backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10, // ensures padding from left/right edges
  },

  scrollArea: {
    height: 300, // or dynamically calculate based on screen height
  },

  fixedHeaderFooter: {
    overflow: "hidden", // ensure consistent layout
  },
  scrollModalCard: {
    maxHeight: "80%",
  },
  modalContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    maxWidth: "90%",
    maxHeight: "80%",
    width: "90%",
  },

  verticalScroll: {
    flexGrow: 0,
    maxHeight: "75%", // ensures content scrolls if overflow
  },

  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16, // add spacing from screen edges
  },

  tableContainer: {
    flex: 1,
  },

  resultTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    color: "#fff",
  },

  header: {
    backgroundColor: "#2c2c2c",
  },

  modalCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    maxWidth: "100%", // allow flexible width but padded
    maxHeight: "85%",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#444",
    paddingVertical: 10,
  },

  cell: {
    minWidth: 80,
    fontSize: 16,
    textAlign: "center",
    color: "#ddd",
  },

  headerCell: {
    minWidth: 80,
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
  },

  footer: {
    backgroundColor: "#2c2c2c",
    borderTopWidth: 1,
    borderTopColor: "#444",
  },

  closeBtn: {
    marginTop: 12,
    backgroundColor: "#333",
    padding: 10,
    alignItems: "center",
    borderRadius: 10,
  },
});

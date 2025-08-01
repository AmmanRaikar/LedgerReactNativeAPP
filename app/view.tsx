import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  getAllLedgerEntries,
  deleteLedgerEntry,
} from "../config/ledgerService";
import { calculateInterestFields } from "../lib/ledger";
import { LedgerEntryWithId } from "../lib/types";
import { exportLedgerToCSV } from "../lib/exportToCSV";
import * as Haptics from "expo-haptics";

export default function ViewPage() {
  const navigation = useNavigation();
  const router = useRouter();

  const [entries, setEntries] = useState<LedgerEntryWithId[]>([]);
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [])
  );

  const fetchEntries = async () => {
    const data = await getAllLedgerEntries();
    const withInterest = data.map((entry) => ({
      ...entry,
      ...calculateInterestFields(entry),
    }));
    setEntries(sortEntries(withInterest));
  };

  const sortEntries = (data: LedgerEntryWithId[]) => {
    const extractSortKey = (val: string): [string, number] => {
      const match = val.match(/^([A-Za-z]*)(\d+)$/);
      return match ? [match[1] || "", parseInt(match[2], 10)] : [val, 0];
    };
    return data.sort((a, b) => {
      const [prefixA, numA] = extractSortKey(a.serialNumber);
      const [prefixB, numB] = extractSortKey(b.serialNumber);
      return prefixA === prefixB ? numA - numB : prefixA.localeCompare(prefixB);
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    Alert.alert("Confirm Delete", `Delete ${selectedIds.size} entries?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.selectionAsync(); // 🔔 subtle haptic feedback
          await Promise.all(Array.from(selectedIds).map(deleteLedgerEntry));
          setSelectedIds(new Set());
          fetchEntries();
        },
      },
    ]);
  };

  const totals = entries.reduce(
    (acc, cur) => {
      acc.interestToday += cur.interestToday || 0;
      acc.totalPayable += cur.totalPayable || 0;
      return acc;
    },
    { interestToday: 0, totalPayable: 0 }
  );

  const { width } = useWindowDimensions();
  const baseFont = Math.max(12, Math.min(16, width / 25)); // Dynamic base font

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 30,
      paddingHorizontal: 12,
      paddingBottom: 24,
    },
    navRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    navButton: {
      backgroundColor: "rgba(255,255,255,0.1)",
      padding: 10,
      borderRadius: 30,
      marginHorizontal: 5,
    },
    navButtonActive: {
      backgroundColor: "#444", // Darker when active
    },
    rightButtons: {
      flexDirection: "row",
      gap: 10,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomColor: "#444",
      borderBottomWidth: 0.5,
      minHeight: baseFont * 2.8,
      paddingVertical: baseFont * 0.25,
    },

    header: {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },

    footer: {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      paddingVertical: baseFont * 0.3,
      flexDirection: "row",
      alignItems: "center",
    },

    footerCellWrapper: {
      minWidth: 100,
      justifyContent: "center",
      alignItems: "flex-start",
      paddingHorizontal: 4,
    },

    footerValue: {
      fontSize: baseFont,
      color: "white",
      fontWeight: "bold",
    },

    footerLabel: {
      fontSize: baseFont * 0.7,
      color: "#aaa",
      marginTop: 2,
      alignItems: "flex-end",
    },

    headerCell: {
      fontWeight: "bold",
      color: "white",
      fontSize: baseFont,
      minWidth: 100,
      textAlign: "center",
      paddingHorizontal: 4,
    },

    cell: {
      color: "white",
      fontSize: baseFont,
      textAlign: "center",
      minWidth: 100,
      paddingVertical: baseFont * 0.3,
      paddingHorizontal: 4,
    },

    card: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.05)",
      padding: 10,
    },

    deleteButton: {
      backgroundColor: "red",
      borderRadius: 10,
      paddingVertical: baseFont * 0.8,
      paddingHorizontal: 24,
      width: "100%",
    },

    deleteButtonText: {
      color: "white",
      textAlign: "center",
      fontSize: baseFont + 2,
      fontWeight: "bold",
    },

    checkboxCell: {
      width: 30,
      alignItems: "center",
    },
    checkbox: {
      width: 18,
      height: 18,
      borderWidth: 1,
      borderColor: "#888",
      borderRadius: 3,
    },
    checkboxSelected: {
      backgroundColor: "skyblue",
    },
    bottomDelete: {
      marginTop: 16,
      width: "100%",
      alignItems: "center",
    },
  });

  return (
    <View style={styles.container}>
      {/* Top floating navbar */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.navButton}
        >
          <Feather name="arrow-left" size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.rightButtons}>
          <TouchableOpacity
            onPress={async () => {
              try {
                await exportLedgerToCSV(entries);
              } catch (err: any) {
                Alert.alert("Export Failed", err.message || "Unknown error");
              }
            }}
            style={styles.navButton}
          >
            <Feather name="download" size={22} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton,
              mode === "edit" && styles.navButtonActive,
            ]}
            onPress={() => setMode(mode === "edit" ? "view" : "edit")}
          >
            <Feather name="edit" size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              mode === "delete" && styles.navButtonActive,
            ]}
            onPress={() => setMode(mode === "delete" ? "view" : "delete")}
          >
            <Feather name="trash" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Glass Card Container */}
      <View style={styles.card}>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={{ flex: 1 }}>
            {/* Header Row */}
            <View style={[styles.row, styles.header]}>
              {mode === "delete" && (
                <Text style={[styles.headerCell, { minWidth: 35 }]}>✓</Text>
              )}
              {mode === "edit" && <Text style={styles.headerCell}>Edit</Text>}
              <Text style={styles.headerCell}>Serial</Text>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Weight</Text>
              <Text style={styles.headerCell}>Amount</Text>
              <Text style={styles.headerCell}>Interest</Text>
              <Text style={styles.headerCell}>Total</Text>
            </View>

            {/* Scrollable data rows that take remaining space */}
            <View style={{ flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator style={{ flex: 1 }}>
                {entries.map((item) => {
                  const isSelected = selectedIds.has(item.id);

                  // DELETE MODE — entire row is clickable
                  if (mode === "delete") {
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          toggleSelection(item.id);
                          Haptics.selectionAsync(); // 🔔 subtle haptic feedback
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.row}>
                          {/* Checkbox */}
                          <View style={styles.checkboxCell}>
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && styles.checkboxSelected,
                              ]}
                            >
                              {isSelected && (
                                <Feather
                                  name="check"
                                  size={baseFont}
                                  color="white"
                                />
                              )}
                            </View>
                          </View>
                          <Text style={styles.cell}>{item.serialNumber}</Text>
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
                      </TouchableOpacity>
                    );
                  }

                  // EDIT MODE or VIEW MODE — row is not clickable except for edit cell
                  return (
                    <View key={item.id} style={styles.row}>
                      {mode === "edit" && (
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/edit",
                              params: { entry: JSON.stringify(item) },
                            })
                          }
                        >
                          <Text style={[styles.cell, { color: "skyblue" }]}>
                            Edit
                          </Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.cell}>{item.serialNumber}</Text>
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
                  );
                })}
              </ScrollView>
            </View>

            {/* Footer */}
            <View style={[styles.row, styles.footer]}>
              <View style={styles.footerCellWrapper}>
                <Text style={styles.footerValue}>
                  Total Entries ({entries.length})
                </Text>
              </View>

              {(mode === "edit" || mode === "delete") && (
                <View style={styles.footerCellWrapper} />
              )}
              <View style={styles.footerCellWrapper} />
              <View style={styles.footerCellWrapper} />
              <View style={styles.footerCellWrapper}>
                <Text style={styles.footerValue}>
                  {totals.interestToday.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text style={styles.footerLabel}>Interest</Text>
              </View>
              <View style={styles.footerCellWrapper}>
                <Text style={styles.footerValue}>
                  {totals.totalPayable.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text style={styles.footerLabel}>Total</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom delete button */}
        {mode === "delete" && selectedIds.size > 0 && (
          <View style={styles.bottomDelete}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync(); // 🔔 subtle haptic feedback
                handleBulkDelete();
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>
                Delete {selectedIds.size} Entr
                {selectedIds.size === 1 ? "y" : "ies"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

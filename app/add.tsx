import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { addLedgerEntry } from '../config/ledgerService';
import { useRouter } from 'expo-router';
import { parse, format } from 'date-fns';

export default function AddEntryScreen() {
  const router = useRouter();

  const [serialNumber, setSerialNumber] = useState('');
  const [displayDate, setDisplayDate] = useState(''); // DD-MM-YYYY
  const [weight, setWeight] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!serialNumber || !displayDate || !weight || !amount) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    try {
      // Parse and format the ISO date
      const parsedDate = parse(displayDate, 'dd-MM-yyyy', new Date());
      const isoDate = format(parsedDate, 'yyyy-MM-dd'); // For Firestore logic

      await addLedgerEntry({
        serialNumber,
        displayDate, // original input for UI
        date: isoDate,     // reliable for sorting/logic
        weight,
        amount: parseFloat(amount),
      });

      Alert.alert('Success', 'Entry added!');
      router.replace('/');
    } catch (err) {
      Alert.alert('Error', 'Failed to add entry. Check date format.');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Ledger Entry</Text>

      <TextInput
        style={styles.input}
        placeholder="Serial Number"
        value={serialNumber}
        onChangeText={setSerialNumber}
      />

      <TextInput
        style={styles.input}
        placeholder="Date (DD-MM-YYYY)"
        value={displayDate}
        onChangeText={setDisplayDate}
      />

      <TextInput
        style={styles.input}
        placeholder="Weight"
        value={weight}
        onChangeText={setWeight}
      />

      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    gap: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
});

import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { addLedgerEntry } from '../config/ledgerService';
import { useRouter } from 'expo-router';
import { parse, format, isValid } from 'date-fns';

export default function AddEntryScreen() {
  const router = useRouter();

  const [serialNumber, setSerialNumber] = useState('');
  const [displayDate, setDisplayDate] = useState(''); // DD-MM-YYYY
  const [weight, setWeight] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    const trimmedSerial = serialNumber.trim();
    const trimmedDate = displayDate.trim();
    const trimmedWeight = weight.trim();
    const trimmedAmount = amount.trim();

    if (!trimmedSerial || !trimmedDate || !trimmedWeight || !trimmedAmount) {
      Alert.alert('Validation Error', 'Please fill all fields.');
      return;
    }

    const parsedDate = parse(trimmedDate, 'dd-MM-yyyy', new Date());
    if (!isValid(parsedDate)) {
      Alert.alert('Invalid Date', 'Please enter a valid date in DD-MM-YYYY format.');
      return;
    }

    const numericAmount = parseFloat(trimmedAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be a positive number.');
      return;
    }

    try {
      const isoDate = format(parsedDate, 'yyyy-MM-dd');

      await addLedgerEntry({
        serialNumber: trimmedSerial,
        displayDate: trimmedDate,
        date: isoDate,
        weight: trimmedWeight,
        amount: numericAmount,
      });

      Alert.alert('Success', 'Entry added!');
      // Instead of navigating away, we reset the form
      setSerialNumber('');
      setDisplayDate('');
      setWeight('');
      setAmount('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add entry.');
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

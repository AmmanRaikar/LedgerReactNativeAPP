import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
} = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

if (!firebaseConfig.apiKey) {
  console.warn("Missing Firebase config values in production.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

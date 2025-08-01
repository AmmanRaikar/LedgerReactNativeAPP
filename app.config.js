import 'dotenv/config';

export default {
  "expo": {
    "name": "LedgerReactNativeAPP",
    "slug": "LedgerReactNativeAPP",
    "version": "1.0.0",
    "scheme": "ledgerreactnativeapp",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#000416"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "edgeToEdgeEnabled": true,
      "package": "com.ammanraikar.LedgerReactNativeAPP"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "407c98ed-aaa0-43f9-abe4-94a2393d1998"
      },
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
    },
    }
}

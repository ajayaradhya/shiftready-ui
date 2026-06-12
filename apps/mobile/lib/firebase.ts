import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(
  process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

if (isFirebaseConfigured) {
  if (getApps().length === 0) {
    _app = initializeApp(firebaseConfig);
    if (Platform.OS === "web") {
      // Web: browser persistence (localStorage). getReactNativePersistence not in web bundle.
      _auth = initializeAuth(_app, { persistence: browserLocalPersistence });
    } else {
      // Native: AsyncStorage persistence. getAuth() doesn't persist.
      // Lazy require so web bundle never touches the RN-only export.
      const {
        getReactNativePersistence,
      } = require("firebase/auth") as typeof import("firebase/auth") & {
        getReactNativePersistence: (
          storage: unknown
        ) => import("firebase/auth").Persistence;
      };
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      _auth = initializeAuth(_app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  } else {
    _app = getApp();
    _auth = getAuth(_app);
  }
}

export const auth = _auth;

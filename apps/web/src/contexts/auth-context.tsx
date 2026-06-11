"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { _setIdToken, setTokenRefresher } from "@myrio/api";

// Register firebase token refresh so apiRequest can retry 401s without
// importing firebase directly in the platform-agnostic api package.
setTokenRefresher(async () => {
  if (auth?.currentUser) return auth.currentUser.getIdToken(true);
  return null;
});

const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? "dev_user";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  idToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
  };
}

function parseFirebaseError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    const messages: Record<string, string> = {
      "auth/email-already-in-use": "An account with this email already exists.",
      "auth/wrong-password": "Incorrect password.",
      "auth/user-not-found": "No account found with this email.",
      "auth/invalid-credential": "Invalid email or password.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/invalid-email": "Invalid email address.",
      "auth/weak-password": "Password must be at least 6 characters.",
      "auth/popup-closed-by-user": "Sign in was cancelled.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    return messages[code] ?? "Authentication failed. Please try again.";
  }
  return "An unexpected error occurred.";
}

const DEV_USER: AuthUser = {
  uid: DEV_USER_ID,
  email: `${DEV_USER_ID}@dev.local`,
  displayName: "Dev User",
  photoURL: null,
  emailVerified: true,
};

const DEV_TOKEN = `dev_${DEV_USER_ID}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: in dev-bypass mode the user and loading state are known
  // synchronously - avoids calling setState inside a useEffect body.
  const [user, setUser] = useState<AuthUser | null>(() =>
    isFirebaseConfigured ? null : DEV_USER
  );
  const [idToken, setIdToken] = useState<string | null>(() =>
    isFirebaseConfigured ? null : DEV_TOKEN
  );
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      _setIdToken(DEV_TOKEN);
      return;
    }

    // onIdTokenChanged fires on sign-in, sign-out, AND automatic token refresh
    // (Firebase tokens expire after 1 hour). This keeps _idToken in api.ts fresh.
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        _setIdToken(token);
        setIdToken(token);
        setUser(toAuthUser(firebaseUser));
      } else {
        _setIdToken(null);
        setIdToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured.");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(parseFirebaseError(err));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw new Error("Firebase is not configured.");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      throw new Error(parseFirebaseError(err));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    }
    _setIdToken(null);
    setIdToken(null);
    setUser(null);
  }, []);

  const register = useCallback(
    async (displayName: string, email: string, password: string) => {
      if (!auth) throw new Error("Firebase is not configured.");
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        await sendEmailVerification(credential.user);
      } catch (err) {
        throw new Error(parseFirebaseError(err));
      }
    },
    []
  );

  const sendVerificationEmail = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("No authenticated user.");
    await sendEmailVerification(auth.currentUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, idToken, loading, signIn, signInWithGoogle, signOut, register, sendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

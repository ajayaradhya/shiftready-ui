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
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { _setIdToken, setTokenRefresher } from "@myrio/api";
import { registerPushToken, unregisterPushToken } from "@/lib/push";

WebBrowser.maybeCompleteAuthSession();

setTokenRefresher(async () => {
  if (auth?.currentUser) return auth.currentUser.getIdToken(true);
  return null;
});

const DEV_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID ?? "dev_user";

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

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        _setIdToken(token);
        setIdToken(token);
        setUser(toAuthUser(firebaseUser));
        registerPushToken().catch(() => {});
      } else {
        _setIdToken(null);
        setIdToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const [_googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      if (id_token && auth) {
        signInWithCredential(auth, GoogleAuthProvider.credential(id_token)).catch(
          (err) => console.error("Google credential sign-in failed:", err)
        );
      }
    }
  }, [googleResponse]);

  const signInWithGoogle = useCallback(async () => {
    if (!promptGoogleAsync) throw new Error("Google Sign-In not available.");
    const result = await promptGoogleAsync();
    if (result.type === "error") {
      throw new Error(result.error?.message ?? "Google Sign-In failed.");
    }
  }, [promptGoogleAsync]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase is not configured.");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(parseFirebaseError(err));
    }
  }, []);

  const signOut = useCallback(async () => {
    await unregisterPushToken().catch(() => {});
    if (isFirebaseConfigured && auth) await firebaseSignOut(auth);
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
    <AuthContext.Provider
      value={{ user, idToken, loading, signIn, signInWithGoogle, signOut, register, sendVerificationEmail }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

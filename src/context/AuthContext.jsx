import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";

const AuthContext = createContext(null);

// Wrap the app with this once, near the top (see App.jsx), so every
// page can read who's logged in and what role they have via useAuth().
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pulls the role + profile fields we store in Firestore, since
  // Firebase Auth only knows about email/password, not our app roles.
  async function loadUserProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  async function register({ name, email, password, role: chosenRole = "customer" }) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      role: chosenRole, // "customer" | "seller" | "admin"
      status: "active", // used for admin soft-delete/suspend
      phone: "",
      address: "",
      createdAt: serverTimestamp(),
    });

    setRole(chosenRole);
    return user;
  }

  async function login(email, password) {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const profile = await loadUserProfile(user.uid);
    setRole(profile?.role ?? "customer");
    return user;
  }

  async function loginWithGoogle() {
    const { user } = await signInWithPopup(auth, googleProvider);
    let profile = await loadUserProfile(user.uid);

    // First time this Google account signs in: create their user doc.
    if (!profile) {
      profile = {
        name: user.displayName ?? "",
        email: user.email,
        role: "customer",
        status: "active",
        phone: "",
        address: "",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", user.uid), profile);
    }

    setRole(profile.role);
    return user;
  }

  function logout() {
    setRole(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await loadUserProfile(user.uid);
        setRole(profile?.role ?? null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { currentUser, role, loading, register, login, loginWithGoogle, logout };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}

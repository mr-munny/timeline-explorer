import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider, SCHOOL_DOMAIN, TEACHER_EMAIL, ALLOW_ALL_DOMAINS } from "../firebase";
import { subscribeToStudentSection } from "../services/database";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userSection, setUserSection] = useState(null);
  const [sectionLoading, setSectionLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email || "";
        if (ALLOW_ALL_DOMAINS || email.endsWith("@" + SCHOOL_DOMAIN)) {
          setUser(firebaseUser);
          setAuthError(null);
        } else {
          signOut(auth);
          setUser(null);
          setAuthError(
            `This tool is only available to @${SCHOOL_DOMAIN} accounts.`
          );
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Subscribe to student's section assignment (skip for teacher)
  useEffect(() => {
    if (!user || user.email === TEACHER_EMAIL) {
      setUserSection(null);
      setSectionLoading(false);
      return;
    }
    setSectionLoading(true);
    const unsub = subscribeToStudentSection(user.uid, (data) => {
      setUserSection(data?.section || null);
      setSectionLoading(false);
    });
    return () => unsub();
  }, [user]);

  const login = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setAuthError("Sign-in failed. Please try again.");
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setAuthError(null);
  };

  const isTeacher = user?.email === TEACHER_EMAIL;

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, logout, isTeacher, userSection, sectionLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

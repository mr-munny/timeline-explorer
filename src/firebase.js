import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBKMGueCBXWQzi57PeimVbApKTZMgQp0Z8",
  authDomain: "timeline-explorer-79df5.firebaseapp.com",
  databaseURL: "https://timeline-explorer-79df5-default-rtdb.firebaseio.com",
  projectId: "timeline-explorer-79df5",
  storageBucket: "timeline-explorer-79df5.firebasestorage.app",
  messagingSenderId: "828900663182",
  appId: "1:828900663182:web:a9bd980da93bba3ae70edf",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export const SCHOOL_DOMAIN = process.env.REACT_APP_SCHOOL_DOMAIN;
export const TEACHER_EMAIL = process.env.REACT_APP_TEACHER_EMAIL;
export const SECTIONS = (process.env.REACT_APP_SECTIONS || "").split(",");
export const ALLOW_ALL_DOMAINS = process.env.REACT_APP_ALLOW_ALL_DOMAINS === "true";
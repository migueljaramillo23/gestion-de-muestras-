import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Tu configuración de Firebase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBmesWWoardKXDeRSaB_S7QJV-bHCHUIuc",
  authDomain: "color-sample-tracker.firebaseapp.com",
  projectId: "color-sample-tracker",
  storageBucket: "color-sample-tracker.firebasestorage.app",
  messagingSenderId: "970745819794",
  appId: "1:970745819794:web:71df55ba9ae624a1026c4b"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

export default app;
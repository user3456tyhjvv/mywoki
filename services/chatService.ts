// services/chatService.ts
// Lightweight Firebase chat helper scaffold. Replace placeholders with your Firebase config and adjust rules.

/* Usage notes:
 - This file is a scaffold and will not work until you add Firebase config values in environment variables
 - Install firebase: `npm install firebase` in the workspace root
 - Set up Firestore rules to restrict reads/writes to team members only
 - See README comments below for integration steps
*/

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

let firebaseApp: FirebaseApp | null = null;
let db: any = null;

export function initFirebase() {
  if (firebaseApp) return { app: firebaseApp, db };

  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  };

  if (!firebaseConfig.apiKey) {
    console.warn('Firebase not configured. Set REACT_APP_FIREBASE_* env vars. Chat will be disabled.');
    return { app: null, db: null };
  }

  firebaseApp = initializeApp(firebaseConfig as any);
  db = getFirestore(firebaseApp);
  return { app: firebaseApp, db };
}

export async function createChatMessage(teamId: string, userId: string, text: string) {
  if (!db) initFirebase();
  if (!db) throw new Error('Firebase not configured');
  const roomCol = collection(db, `team_chats`, teamId, 'messages');
  const doc = await addDoc(roomCol, { userId, text, createdAt: serverTimestamp() });
  return doc.id;
}

export function subscribeToChat(teamId: string, onMessage: (msg: any) => void) {
  if (!db) initFirebase();
  if (!db) {
    console.warn('Firebase not configured, subscribeToChat noop');
    return () => {};
  }
  const q = query(collection(db, `team_chats`, teamId, 'messages'), orderBy('createdAt', 'asc'));
  const unsub = onSnapshot(q, (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === 'added') {
        onMessage({ id: change.doc.id, ...change.doc.data() });
      }
    });
  });
  return unsub;
}

export default {
  initFirebase,
  createChatMessage,
  subscribeToChat
};

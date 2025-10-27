import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// IMPORTANT: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOl-LJWH3QY-mCdgQiZkM5WLTrQyUgtEw",

  authDomain: "supportchat-d7105.firebaseapp.com",

  projectId: "supportchat-d7105",

  storageBucket: "supportchat-d7105.firebasestorage.app",

  messagingSenderId: "314984509",

  appId: "1:314984509:web:c62e351d5e7dbccb18c254",

  measurementId: "G-DKPWZ0H3XX"

};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const storage = firebase.storage();
export default firebase; // Export firebase for FieldValue access

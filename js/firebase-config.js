// ==========================================================================
// TripSync — Firebase Config
// Replace the values below with YOUR Firebase project's config.
// Get these from: Firebase Console → Project Settings → General →
// "Your apps" → Web app → SDK setup and configuration → Config
// ==========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyCvwR-QZ_3wc7r5OLELcpC4SYco6j-eJWg",
  authDomain: "tripsync-82333.firebaseapp.com",
  databaseURL: "https://tripsync-82333-default-rtdb.firebaseio.com",
  projectId: "tripsync-82333",
  storageBucket: "tripsync-82333.firebasestorage.app",
  messagingSenderId: "861184698213",
  appId: "1:861184698213:web:8746fdb71a3bad7d0ce38c"
};

// Initialize Firebase (using the compat SDK loaded via CDN in the HTML files —
// this keeps things simple with no build step / no npm install needed)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
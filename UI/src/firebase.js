import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBpEmlEfL6x4R7us1lS3edOX8KKA0GAajg",
  authDomain: "bazarstuddz.firebaseapp.com",
  projectId: "bazarstuddz",
  storageBucket: "bazarstuddz.firebasestorage.app",
  messagingSenderId: "567077126884",
  appId: "1:567077126884:web:0e459eb16357085fd722f1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
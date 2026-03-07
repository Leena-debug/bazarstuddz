import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com"
};

const app = initializeApp(firebaseConfig);

export default app;
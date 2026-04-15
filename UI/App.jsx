import { ExpoRoot } from 'expo-router';
import { useEffect } from 'react';

export default function App() {
  const ctx = require.context('./app');
  
  return <ExpoRoot context={ctx} />;
}

// app/_layout.js
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { seedDatabase } from '../storage/mockDB';

export default function RootLayout() {
  useEffect(() => {
    seedDatabase();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
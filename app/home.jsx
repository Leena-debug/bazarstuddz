import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React from 'react';
import { useRouter } from 'expo-router';


export default function Home() {
  const router = useRouter();

  return (
     <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => router.push('/')}
                    >
                      <Text style={styles.buttonText2}>Back</Text>
                    </TouchableOpacity>
                    
     </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  background1: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 60,
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    paddingTop: 10,
  },
  buttonText2: {
    color: '#8892ec',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    paddingTop: 10,
  },
});

// ─────────────────────────────────────────────────────────────
// This is a placeholder home screen. Replace with real content.
// For now, it just has a button to go back to login/signup.
// ─────────────────────────────────────────────────────────────
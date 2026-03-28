import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../src/components/CustomInput';

export default function Login(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleContinue = async () => {
    // Validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (!email.endsWith('@univ-alger.dz')) {
      Alert.alert('Error', 'Please use your university email (@univ-alger.dz)')
      return
    }

    try {
      // 🔥 Connect to backend
      const response = await fetch('http://10.0.2.2:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Login success:', data);
        Alert.alert('Success', 'Login successful!');
        router.push('/home');
      } else {
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Cannot connect to server. Make sure backend is running on port 5000');
    }
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("../assets/images/background.png")}
        style={styles.background1}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/App_Logo.png')}
                style={styles.Logo1}
                resizeMode="contain"
              />
            </View>
          
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <CustomInput 
                placeholder="Enter University Email" 
                value={email} 
                setValue={setEmail}     
                icon="mail-outline" 
              />
              <CustomInput 
                placeholder="Enter Password"     
                value={password}  
                setValue={setPassword}  
                icon="lock-closed-outline" 
                secureTextEntry={true} 
              />
              
              <TouchableOpacity 
                style={styles.bottomSignup} 
                onPress={() => router.push('/signup')}
              >
                <Text style={styles.signupText}>
                  Don't have an account?{' '}
                  <Text style={styles.signupLink}>Create one</Text>
                </Text>
              </TouchableOpacity>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.push('/')}
                >
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.button}
                  onPress={handleContinue}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  )
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    gap: 12,
    paddingBottom: 20,
    marginTop: 15,
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  logoContainer: {
    alignItems: 'center',
  },
  Logo1: {
    width: 300,
    height: 200,
    marginBottom: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    paddingTop: 40,
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    paddingTop: 10,
  },
  buttonText: {
    color: '#f8f3cf',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    paddingTop: 10,
  },
  bottomSignup: {
    alignItems: 'center',
  },
  signupText: {
    color: 'rgba(246, 255, 243, 0.97)',
    fontSize: 14,
    marginBottom: 60,
    marginTop: 85,
  },
  signupLink: {
    color: 'white',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
})
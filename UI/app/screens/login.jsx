import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../../src/components/CustomInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidUniversityEmail } from '../../storage/mockDB';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (loading) return;
    setErrorMsg('');
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    if (!trimmedEmail.endsWith('@univ-alger.dz')) {
      setErrorMsg('Please use your university email (@univ-alger.dz)');
      return;
    }
    if (!isValidUniversityEmail(trimmedEmail)) {
      setErrorMsg('This email is not registered in our university system');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('aryna_current_user', JSON.stringify(data.user));
        console.log('Login success:', data.user.email);
        router.push('/screens/home');
      } else {
        setErrorMsg(data.message || 'Login failed');
      }
    } catch (error) {
      setErrorMsg('Network error, check your server connection');
    } finally {
      setLoading(false);
    }
  }

 

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("../../assets/images/background.png")}
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
                source={require('../../assets/images/App_Logo.png')}
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
                autoCapitalize="none"
                autoCorrect={false}
              />
              <CustomInput
                placeholder="Enter Password"
                value={password}
                setValue={setPassword}
                icon="lock-closed-outline"
                secureTextEntry={true}
              />

              {/* error message */}
              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              
              <View style={{ alignItems: 'center', marginVertical: 15 }}>
               <TouchableOpacity onPress={() => router.push('/screens/forgot-password?from=login')}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
               </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.bottomSignup}
                onPress={() => router.push('/screens/signup')}
              >
                <Text style={styles.signupText}>
                  Don't have an account?{' '}
                  <Text style={styles.signupLink}>Create one</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => router.push('/screens')}
                >
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleContinue}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Please wait...' : 'Continue'}
                  </Text>
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
  root: { flex: 1 },
  background1: { flex: 1, width: '100%', height: '100%' },
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
  scrollView: { flex: 1 },
  formContainer: {
    gap: 12,
    paddingBottom: 20,
    marginTop: 15,
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  logoContainer: { alignItems: 'center' },
  Logo1: { width: 300, height: 200 },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 8,
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
    marginTop: -10,
  },
  buttonText: {
    color: '#f8f3cf',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    paddingTop: 10,
  },
  bottomSignup: { alignItems: 'center' },
  signupText: {
    color: 'rgba(246, 255, 243, 0.97)',
    fontSize: 16,
    marginBottom: 60,
    marginTop: 20,
  },
  signupLink: {
    color: '#f8f3cf',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  
  },
  signupText: {
    color: 'rgba(246, 255, 243, 0.97)',
    fontSize: 14,   
    marginBottom: 50,
    marginTop: -10,
    paddingTop: 50,
  },
  forgotPasswordText: {
    height: 40,
    width: 300,
    textAlign: 'center',
    fontSize: 15,
    fontWeight:'bold',
    backgroundColor: '#f8f3cf',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 5,
},
})
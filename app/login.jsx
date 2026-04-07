import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomInput from '../src/components/CustomInput';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidUniversityEmail } from '../storage/mockDB';

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
      const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const user = result.user;

      await AsyncStorage.setItem('current_user', JSON.stringify({
        uid: user.uid,
        email: user.email,
      }));

      console.log('Login success:', user.email);
      router.push('/home');
    } catch (error) {
      console.error('Login error:', error.code);
      if (error.code === 'auth/invalid-credential') {
        setErrorMsg('Wrong email or password');
      } else if (error.code === 'auth/user-not-found') {
        setErrorMsg('No account found with this email');
      } else if (error.code === 'auth/network-request-failed') {
        setErrorMsg('Network error, check your connection');
      } else {
        setErrorMsg('Login failed, try again');
      }
    } finally {
      setLoading(false);
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
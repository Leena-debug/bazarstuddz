import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CustomInput from '../../src/components/CustomInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isValidUniversityEmail } from '../../storage/mockDB';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState('student');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (loading) return;
    setErrorMsg('');
    const trimmedEmail = email.trim();

    if (!fullName || !trimmedEmail || !password || !phone) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName, email: trimmedEmail, password, phoneNumber: phone, userType: selected 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user in storage
        await AsyncStorage.setItem('aryna_current_user', JSON.stringify(data.user));
        router.push('/screens/role-selection');
      } else {
        setErrorMsg(data.message || 'Signup failed');
      }
    } catch (error) {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };


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
              <CustomInput placeholder="Enter Full Name"        value={fullName}        setValue={setFullName}        icon="person-outline" />
             <CustomInput 
              placeholder="Enter University Email"  value={email}  setValue={setEmail}  icon="mail-outline" autoCapitalize="none"  autoCorrect={false}
/>
              <CustomInput placeholder="Enter Password"         value={password}        setValue={setPassword}        icon="lock-closed-outline" secureTextEntry={true} />
              <CustomInput placeholder="Confirm Password"       value={confirmPassword} setValue={setConfirmPassword} icon="lock-closed-outline" secureTextEntry={true} />
              <CustomInput placeholder="Phone Number"           value={phone}           setValue={setPhone}           icon="call-outline" />

              {/* error message */}
              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              <View style={styles.roleContainer}>
                {['student', 'teacher'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={styles.roleRow}
                    onPress={() => setSelected(role)}
                  >
                    <View style={styles.radioOuter}>
                      {selected === role && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.roleText}>
                      {role === 'student' ? 'Student' : 'Teacher'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
             
            </ScrollView>
          
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
    paddingTop: 10,
  },
  scrollView: { flex: 1 },
  formContainer: {
    gap: 12,
    marginTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  logoContainer: { alignItems: 'center' },
  Logo1: { width: 220, height: 180 },
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
    paddingTop: 20,
  },
  button: {
    paddingVertical: 15,
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 30,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: '#f8f3cf',
    paddingTop: 10,
  },
  roleContainer: { marginTop: 60, gap: 12 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  roleText: { color: 'white', fontSize: 15 },
})
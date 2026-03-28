import { View, Text, StyleSheet, ImageBackground, Image, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CustomInput from '../src/components/CustomInput';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState('student');
  const router = useRouter()
  
  const handleContinue = () => {
  if (!fullName || !email || !password || !phone) {
    Alert.alert('Error', 'Please fill in all fields')
    return
  }
  if(fullName || email || password || phone){
     console.warn('Welcome!')
    }
  if (!email.endsWith('@univ-alger.dz')) {
    Alert.alert('Error', 'Please use your university email (@univ-alger.dz)')
    return
  }
  router.push('/home')
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

  {/* inputs scroll when keyboard appears, buttons stay put */}
  <ScrollView
    style={styles.scrollView}
    contentContainerStyle={styles.formContainer}
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
  >
    <CustomInput placeholder="Enter Full Name"    value={fullName}  setValue={setFullName}  icon="person-outline" />
<CustomInput placeholder="Enter University Email" value={email} setValue={setEmail}     icon="mail-outline" />
<CustomInput placeholder="Enter Password"     value={password}  setValue={setPassword}  icon="lock-closed-outline" secureTextEntry={true} />
<CustomInput placeholder="Phone Number"       value={phone}     setValue={setPhone}      icon="call-outline" />
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

  {/* buttons always stay at the bottom */}
  <View style={styles.buttonRow}>
    <TouchableOpacity
      style={styles.button}
      onPress={() => router.push('/')}
    >
      <Text style={styles.buttonText}>Back</Text>
    </TouchableOpacity>
<TouchableOpacity onPress={handleContinue}>
  <Text style={styles.buttonText}>Continue</Text>
</TouchableOpacity>
  </View>

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
    paddingTop: 10,
  },

  scrollView: {
  flex: 1,
},
formContainer: {
  gap: 12,
  paddingBottom: 20,
},

  logoContainer: {
    alignItems: 'center',
  },
  Logo1: {
    width: 220,
    height: 180,
    marginBottom: 0,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 12,
    marginTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 10,
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
},
buttonText: {
  color: "white",
  fontSize: 16,
  fontWeight: 'bold',
  textDecorationLine: 'underline',
  color: '#f8f3cf',
  paddingTop: 10,
},

roleContainer: {
  marginTop: 60,
  gap: 12,
},
roleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
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
roleText: {
  color: 'white',
  fontSize: 15,
},
})
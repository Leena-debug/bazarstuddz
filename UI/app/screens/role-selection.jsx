import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ImageBackground,
  Image, TouchableOpacity, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { getCurrentUser, updateUserRole } from '../../storage/mockDB';

const ROLES = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Browse and buy products from other students',
    icon: '🛒',
  },
  {
    id: 'seller',
    title: 'Seller',
    description: 'List and sell your products to other students',
    icon: '📦',
  },
]

export default function RoleSelectionScreen() {
  const [selected, setSelected] = useState('buyer')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    const loadCurrentRole = async () => {
      const user = await getCurrentUser()
      if (user?.role === 'buyer' || user?.role === 'seller') {
        setSelected(user.role)
      }
    }
    loadCurrentRole()
  }, [])

  const handleContinue = async () => {
    if (loading) return
    setErrorMsg('')
    setLoading(true)

    try {
      // 1. Get the current user to get their ID
      const user = await getCurrentUser();
      if (!user) throw new Error("No user found");

      // 2. Pass the ID to the function so it doesn't fail if session is weak
      await updateUserRole(selected, user.id)
      
      console.log('Role updated to:', selected)
      router.push('/screens/home')
    } catch (error) {
      console.error('Role update error:', error)
      setErrorMsg('Failed to save role, try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../assets/images/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/App_Logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>What are you here for?</Text>
          <Text style={styles.subtitle}>You can change this later in your profile</Text>

          {/* Role cards */}
          <View style={styles.cardsRow}>
            {ROLES.map((role) => {
              const isActive = selected === role.id
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[styles.card, isActive && styles.cardActive]}
                  onPress={() => setSelected(role.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cardIcon}>{role.icon}</Text>
                  <Text style={[styles.cardTitle, isActive && styles.cardTitleActive]}>
                    {role.title}
                  </Text>
                  <Text style={[styles.cardDesc, isActive && styles.cardDescActive]}>
                    {role.description}
                  </Text>

                  {/* Selected indicator dot */}
                  <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                    {isActive && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Error message */}
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : null}

          {/* Continue button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push('/screens/signup')}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.continueBtn, loading && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.continueText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 10,
  },

  // Logo
  logoContainer: { alignItems: 'center' },
  logo: { width: 200, height: 160 },

  // Title
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },

  // Cards row
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(245, 235, 189, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardActive: {
    backgroundColor: 'rgba(247, 234, 208, 0.92)',
    borderColor: '#f8f3cf',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  cardTitleActive: {
    color: '#1a2e35',
  },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  cardDescActive: {
    color: '#444',
  },

  // Radio dot inside card
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  radioOuterActive: {
    borderColor: '#1a2e35',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#1a2e35',
  },

  // Error
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 8,
    marginTop: 16,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  backText: {
    color: '#f8f3cf',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  continueBtn: {
     fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: '#f8f3cf',
    paddingTop: 10,
  
  },
  continueBtnDisabled: {
    opacity: 0.6,
  },
  continueText: {
    color: '#f8f3cf',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
import { View, Text, StyleSheet, ImageBackground, Image, SafeAreaView, PanResponder, Animated, TouchableOpacity } from 'react-native'
import React, { useRef } from 'react'
import { useRouter } from 'expo-router';

const SLIDER_WIDTH = 260;
const THUMB_SIZE = 52;
const MAX_SLIDE = SLIDER_WIDTH - THUMB_SIZE - 8;

export default function Index(){
  const router = useRouter();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.dx, MAX_SLIDE));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= MAX_SLIDE * 0.85) {
           Animated.timing(translateX, {
            toValue: MAX_SLIDE,
            duration: 100,
            useNativeDriver: true,
          }).start(() => router.push('/home'));
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const textOpacity = translateX.interpolate({
    inputRange: [0, MAX_SLIDE * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <ImageBackground
      source={require("../assets/images/background.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.topContent}>
          <Image
            source={require('../assets/images/App_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.sliderTrack}>
            <Animated.Text style={[styles.sliderLabel, { opacity: textOpacity }]}>
              Get Started
            </Animated.Text>
            <Animated.View
              style={[styles.thumb, { transform: [{ translateX }] }]}
              {...panResponder.panHandlers}
            >
              <Text style={styles.thumbArrow}>›</Text>
            </Animated.View>
          </View>
        </View>

        <TouchableOpacity style={styles.bottomLogin} onPress={() => router.push('/login')}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink}>Login</Text>
          </Text>
        </TouchableOpacity>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  safeArea: { flex: 1, paddingHorizontal: 24, paddingBottom: 50, paddingTop: 50 },
  topContent: { alignItems: 'center', marginTop: 10 },
  logo: { width: 300, height: 300, marginTop: -30 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: THUMB_SIZE + 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 50,
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  sliderLabel: { color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center', letterSpacing: 0.8 },
  thumb: {
    position: 'absolute',
    left: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbArrow: { color: '#574606', fontSize: 28, fontWeight: 'bold', marginTop: -6 },
  bottomLogin: { alignItems: 'center' },
  loginText: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 14, marginBottom: 50 },
  loginLink: { color: 'white', fontWeight: 'bold', textDecorationLine: 'underline' },
});
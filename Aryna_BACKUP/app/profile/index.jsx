import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';

// Profile avatar placeholder
const defaultAvatar = { uri: 'https://placehold.co/100x100/3498db/white?text=👤' };

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems = [
    { id: 1, title: 'My Orders', icon: '📦', onPress: () => Alert.alert('My Orders', 'View your order history') },
    { id: 2, title: 'My Listings', icon: '📝', onPress: () => Alert.alert('My Listings', 'Manage your products') },
    { id: 3, title: 'Payment Methods', icon: '💳', onPress: () => Alert.alert('Payment Methods', 'Add or remove payment methods') },
    { id: 4, title: 'Shipping Address', icon: '📍', onPress: () => Alert.alert('Shipping Address', 'Manage your addresses') },
    { id: 5, title: 'Settings', icon: '⚙️', onPress: () => Alert.alert('Settings', 'App preferences') },
    { id: 6, title: 'Help & Support', icon: '❓', onPress: () => Alert.alert('Help & Support', 'Contact us for assistance') },
    { id: 7, title: 'About Us', icon: 'ℹ️', onPress: () => Alert.alert('About Us', 'BazarStudDZ v1.0.0\nUniversity Marketplace Platform') },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with cover image */}
      <View style={styles.header}>
        <View style={styles.coverImage} />
        <View style={styles.avatarContainer}>
          <Image source={defaultAvatar} style={styles.avatar} />
        </View>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>Ahmed Student</Text>
        <Text style={styles.userEmail}>ahmed@univ.dz</Text>
        <Text style={styles.userUniversity}>University of Algiers</Text>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>1500</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={() => router.push('/')}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Version Info */}
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  coverImage: {
    height: 120,
    backgroundColor: '#3498db',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  userInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  userUniversity: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 2,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e9ecef',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 22,
    width: 40,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  menuArrow: {
    fontSize: 20,
    color: '#cbd5e0',
  },
  logoutButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#adb5bd',
    fontSize: 12,
    marginBottom: 30,
  },
});
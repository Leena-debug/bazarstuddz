import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCurrentUser, getSellerStats } from '../../storage/mockDB';

const C = {
  bg: '#E8D5B7',
  card: '#F5ECD8',
  border: '#C4A882',
  brown: '#7A4E2D',
  brownMid: '#A0714F',
  blue: '#2E5F8A',
  white: '#FFFFFF',
  dark: '#2C1A0E',
};

// Stat Card Component
function StatCard({ label, value, size = 'small' }) {
  const isLarge = size === 'large';
  return (
    <View style={[styles.statCard, isLarge && styles.statCardLarge]}>
      <Text style={[styles.statValue, isLarge && styles.statValueLarge]}>{value}</Text>
      <Text style={[styles.statLabel, isLarge && styles.statLabelLarge]}>{label}</Text>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    listings: 0,
    exchanges: 0,
    points: 0,
    favorites: 0,
    rate: '0%'
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getSellerStats(); // Fetches from mockDB
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.root}>
        <ActivityIndicator size="large" color={C.brown} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Dynamic Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <StatCard label="Listings" value={stats.listings.toString()} />
              <StatCard label="Exchanges" value={stats.exchanges.toString()} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.leftColumn}>
                <StatCard label="Points" value={stats.points.toString()} />
                <StatCard label="Favorites" value={stats.favorites.toString()} />
              </View>
              <StatCard label="Success Rate" value={stats.rate} size="large" />
            </View>
          </View>

          {/* Placeholder Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Overview</Text>
            <View style={styles.chartContainer}>
               <Text style={{ color: C.muted }}>Visualization pending data...</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  backArrow: { fontSize: 24, color: C.brown, fontWeight: 'bold' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: C.dark, flex: 1, textAlign: 'center' },
  statsContainer: { gap: 12, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  leftColumn: { flex: 1, gap: 12 },
  statCard: { flex: 1, backgroundColor: C.brownMid, borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  statCardLarge: { flex: 1, minHeight: 120 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: C.white, marginBottom: 4 },
  statValueLarge: { fontSize: 32 },
  statLabel: { fontSize: 12, color: C.white, textAlign: 'center' },
  statLabelLarge: { fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: C.dark, marginBottom: 12 },
  chartContainer: { backgroundColor: C.card, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
});